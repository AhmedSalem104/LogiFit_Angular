import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../../services/storage.service';
import {
  LoginRequest,
  RegisterRequest,
  RegisterGymRequest,
  CreateTenantRequest,
  TenantResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserInfo,
  UserRole,
  UserRoleValues,
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

  // Public readonly signals
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly isOwner = computed(() => this.userRole() === UserRole.Owner);
  readonly isCoach = computed(() => this.userRole() === UserRole.Coach);
  readonly isClient = computed(() => this.userRole() === UserRole.Client);
  readonly tenantId = computed(() => this.currentUser()?.tenantId ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    // Load from storage after DI is ready
    this.token.set(this.loadTokenFromStorage());
    this.currentUser.set(this.loadUserFromStorage());

    // Check token expiration on init
    this.checkTokenExpiration();
  }

  /**
   * Login with phone number and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Register new user (requires existing tenant)
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Register new gym with owner (creates tenant first, then registers owner)
   */
  registerGym(data: RegisterGymRequest): Observable<AuthResponse> {
    // Step 1: Create tenant
    const tenantRequest: CreateTenantRequest = {
      name: data.gymName,
      subdomain: this.generateSubdomain(data.gymName)
    };

    return this.http.post<TenantResponse>(`${environment.apiUrl}/tenants`, tenantRequest).pipe(
      switchMap(tenant => {
        // Step 2: Register owner with tenant ID
        // Note: role must be numeric (1=Owner, 2=Coach, 3=Client) as per OpenAPI
        const registerRequest: RegisterRequest = {
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          confirmPassword: data.password,
          tenantId: tenant.id,
          role: UserRoleValues.Owner,  // Send as number (1 = Owner)
          fullName: data.ownerName
        };
        return this.register(registerRequest);
      }),
      catchError(error => this.handleAuthError(error))
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
   * Request password reset
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forget-password`, data);
  }

  /**
   * Reset password with token
   */
  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, data);
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current token
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
   * Get redirect URL based on user role
   */
  getRedirectUrl(): string {
    const role = this.userRole();
    // Default to owner dashboard if authenticated but role unknown
    if (!role && this.isAuthenticated()) {
      return '/owner/dashboard';
    }
    switch (role) {
      case UserRole.Owner:
        return '/owner/dashboard';
      case UserRole.Coach:
        return '/coach/dashboard';
      case UserRole.Client:
        return '/client/my-program';
      default:
        return '/owner/dashboard'; // Default to owner instead of login to prevent loops
    }
  }

  /**
   * Get redirect URL from role (handles both string and number)
   */
  getRedirectUrlForRole(role: string | number): string {
    // Convert numeric role to string if needed
    // Backend enum: Owner = 1, Coach = 2, Client = 3
    // Backend returns role as STRING in login response ("Owner", "Coach", "Client")
    const roleMap: { [key: number]: string } = {
      1: 'Owner',
      2: 'Coach',
      3: 'Client'
    };

    const roleString = typeof role === 'number' ? roleMap[role] : role;

    switch (roleString) {
      case 'Owner':
        return '/owner/dashboard';
      case 'Coach':
        return '/coach/dashboard';
      case 'Client':
        return '/client/my-program';
      default:
        return '/owner/dashboard'; // Default to owner dashboard
    }
  }

  /**
   * Convert role to UserRole enum
   * Backend returns role as STRING ("Owner", "Coach", "Client") in login response
   */
  private mapRoleToEnum(role: string | number): UserRole {
    // Backend enum values: Owner = 1, Coach = 2, Client = 3
    const roleMap: { [key: number]: UserRole } = {
      1: UserRole.Owner,
      2: UserRole.Coach,
      3: UserRole.Client
    };

    if (typeof role === 'number') {
      return roleMap[role] || UserRole.Client;
    }

    // Handle string role (this is what backend actually returns)
    switch (role) {
      case 'Owner': return UserRole.Owner;
      case 'Coach': return UserRole.Coach;
      case 'Client': return UserRole.Client;
      default: return UserRole.Client;
    }
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Store token
    this.storage.setString(environment.tokenKey, response.accessToken);
    this.token.set(response.accessToken);

    // Map role (backend returns role as STRING: "Owner", "Coach", "Client")
    const mappedRole = this.mapRoleToEnum(response.role);

    // Build user info from response
    const userInfo: UserInfo = {
      id: response.userId,
      email: response.email,
      phoneNumber: response.phoneNumber,
      fullName: response.fullName,
      role: mappedRole,
      tenantId: response.tenantId
    };

    // Store user info
    this.storage.setItem(environment.userKey, userInfo);
    this.currentUser.set(userInfo);
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
    this.token.set(null);
    this.currentUser.set(null);
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
   * Check if token is expired
   */
  private checkTokenExpiration(): void {
    const token = this.token();
    if (!token) return;

    try {
      const decoded = this.decodeToken(token);
      const expirationDate = new Date(decoded.exp * 1000);

      if (expirationDate < new Date()) {
        console.log('Token expired, redirecting to login');
        this.logout();
      }
    } catch {
      this.logout();
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
