import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../../services/storage.service';
import { TenantStatusService } from '../../tenant/tenant-status.service';
import {
  LoginRequest,
  RegisterRequest,
  RegisterGymRequest,
  CreateTenantRequest,
  TenantResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  AuthResponse,
  UserInfo,
  UserRole,
  UserRoleValues,
  Permission,
  Permissions,
  WorkspaceCapability,
  capabilitiesForWorkspace,
  BACK_OFFICE_ROLES,
  COACH_ROLES,
  DecodedToken
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // State signals - initialized in constructor after DI
  private currentUser = signal<UserInfo | null>(null);
  private token = signal<string | null>(null);
  private permissionsSig = signal<Permission[]>([]);
  private capabilitiesSig = signal<WorkspaceCapability[]>([]);

  // Public readonly signals
  readonly user = this.currentUser.asReadonly();
  readonly permissions = this.permissionsSig.asReadonly();
  readonly capabilities = this.capabilitiesSig.asReadonly();
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly isOwner = computed(() => this.userRole() === UserRole.Owner);
  readonly isCoach = computed(() => COACH_ROLES.includes(this.userRole() as UserRole));
  readonly isClient = computed(() => this.userRole() === UserRole.Client);
  readonly isBackOffice = computed(() => BACK_OFFICE_ROLES.includes(this.userRole() as UserRole));
  readonly tenantId = computed(() => this.currentUser()?.tenantId ?? null);
  readonly isFreelanceWorkspace = computed(() => this.currentUser()?.workspaceType === 2);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService,
    private tenantStatus: TenantStatusService
  ) {
    // Load from storage after DI is ready
    this.token.set(this.loadTokenFromStorage());
    this.currentUser.set(this.loadUserFromStorage());
    this.permissionsSig.set(this.loadPermissionsFromStorage());
    // Capabilities are derived from the selected workspace type, never from
    // a client-controlled/stale localStorage array.
    this.capabilitiesSig.set(capabilitiesForWorkspace(this.currentUser()?.workspaceType));

    // Check token expiration on init
    this.checkTokenExpiration();
  }

  /**
   * Login with phone number and password (tenantId required)
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Stores the regular tenant JWT returned only after a proven global identity
   * selects an approved workspace. Kept public so the identity-first flow
   * reuses exactly the same session/permissions contract as legacy login.
   */
  completeWorkspaceSelection(response: AuthResponse, workspaceType?: number): void {
    this.handleAuthSuccess(response, workspaceType);
  }

  /**
   * Register new user. Backend ALWAYS creates a Client (role is not selectable).
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Register new gym with owner.
   * NOTE: Tenant provisioning / owner-role assignment now lives on the Platform API.
   * This legacy flow creates the tenant then registers the first user; the backend
   * decides the resulting role. Kept for backward compatibility.
   */
  registerGym(data: RegisterGymRequest): Observable<AuthResponse> {
    const tenantRequest: CreateTenantRequest = {
      name: data.gymName,
      subdomain: this.generateSubdomain(data.gymName)
    };

    return this.http.post<TenantResponse>(`${environment.apiUrl}/tenants`, tenantRequest).pipe(
      switchMap(tenant => {
        const registerRequest: RegisterRequest = {
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          confirmPassword: data.password,
          tenantId: tenant.id,
          fullName: data.ownerName
        };
        return this.register(registerRequest);
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Refresh the access token using the stored refresh token.
   * On success, rotates the stored tokens. Returns the new access token.
   */
  refreshToken(): Observable<string> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      map(response => response.accessToken),
      catchError(error => {
        // Refresh failed → session is dead
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Reconcile a session persisted by an older build. Before workspaceType was
   * returned, the browser could retain an authenticated user without a
   * workspace context. Refreshing once lets the server restore the selected
   * tenant type and capabilities; if it cannot, the session is cleared rather
   * than being treated as a Gym.
   */
  restoreSession(): Observable<boolean> {
    const user = this.currentUser();
    const hasWorkspaceContext = user?.workspaceType === 1 || user?.workspaceType === 2;
    if (!this.token() || !user || hasWorkspaceContext) return of(!!this.token() && !!user);

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => {
        if (response.workspaceType !== 1 && response.workspaceType !== 2) {
          throw new Error('Workspace context is missing from the refreshed session.');
        }
        this.handleAuthSuccess(response);
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * Generate subdomain from gym name
   */
  private generateSubdomain(gymName: string): string {
    return gymName
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 30) + '-' + Date.now().toString(36);
  }

  /**
   * Get all tenants (gyms) for login selection
   */
  getTenants(): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(`${environment.apiUrl}/tenants`);
  }

  /**
   * Request password reset — returns a resetToken (dev) or triggers SMS/Email (prod).
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forget-password`, data);
  }

  /**
   * Reset password with reset token
   */
  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, data);
  }

  /**
   * Change password for the authenticated user (self). 204 on success,
   * 401 if the current password is wrong.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        const user = this.currentUser();
        if (!user) return;
        const updated = { ...user, mustChangePassword: false };
        this.storage.setItem(environment.userKey, updated);
        this.currentUser.set(updated);
      })
    );
  }

  /** Route used for the mandatory first-login password replacement. */
  getPasswordChangeUrlForRole(role: string | number): string {
    const mapped = this.mapRoleToEnum(role);
    if (mapped === UserRole.Owner && this.isFreelanceWorkspace()) return '/coach/profile';
    if (COACH_ROLES.includes(mapped)) return '/coach/profile';
    if (mapped === UserRole.Client) return '/client/profile';
    return '/owner/profile';
  }

  /**
   * Logout current session and clear locally
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Logout from all devices (invalidates all refresh tokens server-side)
   */
  logoutAll(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout-all`, {}).pipe(
      tap(() => this.logout()),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('logout-all failed'));
      })
    );
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    return this.token();
  }

  /**
   * Get current user info
   */
  getUser(): UserInfo | null {
    return this.currentUser();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole | UserRole[]): boolean {
    const currentRole = this.userRole();
    if (!currentRole) return false;

    if (Array.isArray(role)) {
      return role.includes(currentRole);
    }
    return currentRole === role;
  }

  // ==================== Permissions (RBAC) ====================

  /** Returns true if the user has the given permission. */
  hasPermission(permission: Permission): boolean {
    // Owner is the existing full-access tenant role. Keep the UI guard in
    // sync with the sidebar and backend RBAC even when an older session was
    // created before permissions[] was persisted in local storage.
    return this.isOwner() || this.permissionsSig().includes(permission);
  }

  /** Returns true if the user has at least one of the given permissions. */
  hasAnyPermission(...permissions: Permission[]): boolean {
    if (!permissions.length) return true;
    if (this.isOwner()) return true;
    const owned = this.permissionsSig();
    return permissions.some(p => owned.includes(p));
  }

  /** Returns true if the user has all of the given permissions. */
  hasAllPermissions(...permissions: Permission[]): boolean {
    if (this.isOwner()) return true;
    const owned = this.permissionsSig();
    return permissions.every(p => owned.includes(p));
  }

  /** Returns true only when the selected workspace exposes the capability. */
  hasCapability(capability: WorkspaceCapability): boolean {
    return this.capabilitiesSig().includes(capability);
  }

  /**
   * Update user's name in local state and storage
   */
  updateUserName(fullName: string): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, fullName };
      this.storage.setItem(environment.userKey, updatedUser);
      this.currentUser.set(updatedUser);
    }
  }

  /**
   * Get redirect URL based on current user role
   */
  getRedirectUrl(): string {
    const role = this.userRole();
    if (!role && this.isAuthenticated()) {
      return '/owner/dashboard';
    }
    return this.panelHomeForRole(role);
  }

  /**
   * Get redirect URL from a role value (handles both string and number)
   */
  getRedirectUrlForRole(role: string | number): string {
    const mapped = this.mapRoleToEnum(role);
    return this.panelHomeForRole(mapped);
  }

  /** Resolve the landing route for a role (panel is shared across role families). */
  private panelHomeForRole(role: UserRole | null): string {
    if (role === UserRole.Owner && this.isFreelanceWorkspace()) return '/coach/dashboard';
    if (role && COACH_ROLES.includes(role)) return '/coach/dashboard';
    if (role === UserRole.Client) return '/client/dashboard';
    if (role && BACK_OFFICE_ROLES.includes(role) && role !== UserRole.Owner && !this.hasPermission(Permissions.ViewReports)) {
      if (this.hasPermission(Permissions.ViewMembers)) return '/owner/clients';
      if (this.hasPermission(Permissions.ManageAttendance)) return '/owner/attendance';
      return '/owner/profile';
    }
    // Owner / Manager / Receptionist / Accountant → back-office
    return '/owner/dashboard';
  }

  /**
   * Convert role to UserRole enum (accepts backend string or numeric value)
   */
  private mapRoleToEnum(role: string | number): UserRole {
    const roleMap: { [key: number]: UserRole } = {
      1: UserRole.Owner,
      2: UserRole.Coach,
      3: UserRole.Client,
      4: UserRole.Manager,
      5: UserRole.Receptionist,
      6: UserRole.Accountant,
      7: UserRole.Trainer,
      10: UserRole.Owner,
      11: UserRole.Coach,
      12: UserRole.Coach
    };

    if (typeof role === 'number') {
      return roleMap[role] || UserRole.Client;
    }

    switch (role) {
      case 'Owner': return UserRole.Owner;
      case 'Coach': return UserRole.Coach;
      case 'Client': return UserRole.Client;
      case 'Manager': return UserRole.Manager;
      case 'Receptionist': return UserRole.Receptionist;
      case 'Accountant': return UserRole.Accountant;
      case 'Trainer': return UserRole.Trainer;
      case 'FreelanceOwner': return UserRole.Owner;
      case 'FreelanceCoach': return UserRole.Coach;
      case 'FreelanceAssistant': return UserRole.Coach;
      default: return UserRole.Client;
    }
  }

  /**
   * Handle successful authentication (login / register / refresh)
   */
  private handleAuthSuccess(response: AuthResponse, workspaceType?: number): void {
    // Store tokens
    this.storage.setString(environment.tokenKey, response.accessToken);
    this.token.set(response.accessToken);
    // Store permissions
    const permissions = response.permissions ?? [];
    const selectedWorkspaceType = response.workspaceType ?? workspaceType;
    // The server remains authoritative for API authorization. The browser
    // derives its navigation surface from the selected type so an old or
    // tampered capability array cannot expose Gym links in a freelance UI.
    const capabilities = capabilitiesForWorkspace(selectedWorkspaceType);
    this.storage.setItem(environment.permissionsKey, permissions);
    this.permissionsSig.set(permissions);
    this.capabilitiesSig.set(capabilities);

    // Map primary role + roles[]
    const mappedRole = this.mapRoleToEnum(response.role);
    const mappedRoles = (response.roles ?? []).map(r => this.mapRoleToEnum(r));

    const userInfo: UserInfo = {
      id: response.userId,
      email: response.email,
      phoneNumber: response.phoneNumber,
      fullName: response.fullName,
      role: mappedRole,
      roles: mappedRoles.length ? mappedRoles : [mappedRole],
      tenantId: response.tenantId,
      mustChangePassword: response.mustChangePassword === true,
      workspaceType: selectedWorkspaceType,
      capabilities
    };

    this.storage.setItem(environment.userKey, userInfo);
    this.storage.setString(environment.tenantIdKey, response.tenantId);
    this.currentUser.set(userInfo);

    // Fresh, successful auth to a reachable gym → drop any prior tenant gate.
    this.tenantStatus.clear();
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(error: any): Observable<never> {
    return throwError(() => error);
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    this.storage.removeItem(environment.tokenKey);
    this.storage.removeItem(environment.userKey);
    this.storage.removeItem(environment.permissionsKey);
    this.token.set(null);
    this.currentUser.set(null);
    this.permissionsSig.set([]);
    this.capabilitiesSig.set([]);
    this.tenantStatus.clear();
  }

  /**
   * Load token from storage
   */
  private loadTokenFromStorage(): string | null {
    return this.storage.getString(environment.tokenKey);
  }

  /**
   * Load user from storage
   */
  private loadUserFromStorage(): UserInfo | null {
    return this.storage.getItem<UserInfo>(environment.userKey);
  }

  /**
   * Load permissions from storage
   */
  private loadPermissionsFromStorage(): Permission[] {
    return this.storage.getItem<Permission[]>(environment.permissionsKey) ?? [];
  }

  /**
   * Check if access token is expired. With refresh tokens, an expired access token
   * is no longer fatal — the interceptor will refresh it. Only logout when there is
   * no refresh token to fall back on.
   */
  private checkTokenExpiration(): void {
    const token = this.token();
    if (!token) return;

    try {
      const decoded = this.decodeToken(token);
      const expirationDate = new Date(decoded.exp * 1000);

      if (expirationDate < new Date()) {
        this.refreshToken().subscribe({ error: () => this.logout() });
      }
    } catch {
      this.refreshToken().subscribe({ error: () => this.logout() });
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): DecodedToken {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  }
}
