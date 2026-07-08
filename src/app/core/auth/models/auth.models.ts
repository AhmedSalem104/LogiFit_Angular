// User roles matching backend enum (numeric values)
// Backend: Owner=1, Coach=2, Client=3, Manager=4, Receptionist=5, Accountant=6, Trainer=7
export enum UserRole {
  Owner = 'Owner',
  Coach = 'Coach',
  Client = 'Client',
  Manager = 'Manager',
  Receptionist = 'Receptionist',
  Accountant = 'Accountant',
  Trainer = 'Trainer'
}

// Numeric role values for API requests (matches backend UserRole enum)
export const UserRoleValues = {
  Owner: 1,
  Coach: 2,
  Client: 3,
  Manager: 4,
  Receptionist: 5,
  Accountant: 6,
  Trainer: 7
} as const;

// Roles that use the "owner" (back-office) panel & layout
export const BACK_OFFICE_ROLES: UserRole[] = [
  UserRole.Owner, UserRole.Manager, UserRole.Receptionist, UserRole.Accountant
];
// Roles that use the "coach" panel
export const COACH_ROLES: UserRole[] = [UserRole.Coach, UserRole.Trainer];

// ==================== Permissions (RBAC) ====================
// Backend permission catalog (Tenant scope). The JWT / login response carries permissions[].
export type Permission =
  | 'ManageMembers' | 'ViewMembers' | 'ManageCoaches' | 'ManageAttendance'
  | 'ManageClientSubscriptions' | 'ManagePOS' | 'ManageInventory' | 'ManageEmployees'
  | 'ManageBranches' | 'ManageFinance' | 'ViewReports' | 'ManageReports'
  | 'ManageSettings' | 'ManageTenantBilling';

export const Permissions = {
  ManageMembers: 'ManageMembers',
  ViewMembers: 'ViewMembers',
  ManageCoaches: 'ManageCoaches',
  ManageAttendance: 'ManageAttendance',
  ManageClientSubscriptions: 'ManageClientSubscriptions',
  ManagePOS: 'ManagePOS',
  ManageInventory: 'ManageInventory',
  ManageEmployees: 'ManageEmployees',
  ManageBranches: 'ManageBranches',
  ManageFinance: 'ManageFinance',
  ViewReports: 'ViewReports',
  ManageReports: 'ManageReports',
  ManageSettings: 'ManageSettings',
  ManageTenantBilling: 'ManageTenantBilling'
} as const;

// Login request. The gym is identified by `subdomain` (new backend) and/or
// `tenantId` (current backend) — we send both for forward compatibility.
export interface LoginRequest {
  phoneNumber: string;
  password: string;
  tenantId?: string;
  subdomain?: string;
}

// Register request — backend ALWAYS creates a Client (role is ignored/not selectable).
export interface RegisterRequest {
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  tenantId?: string;
  subdomain?: string;
  fullName: string;
}

// Refresh token request
export interface RefreshRequest {
  refreshToken: string;
}

// Create Tenant request
export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Tenant response
export interface TenantResponse {
  id: string;
  name: string;
  subdomain: string;
  status: number; // TenantStatus: Active=1, Suspended=2, Trial=3, ...
  createdAt: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Register Gym (combines tenant creation + owner registration)
export interface RegisterGymRequest {
  gymName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

// Forgot password request — keyed by phone number + gym (subdomain / tenantId).
export interface ForgotPasswordRequest {
  phoneNumber: string;
  tenantId?: string;
  subdomain?: string;
}

// Forgot password response — returns a reset token (in production sent via SMS/Email).
export interface ForgotPasswordResponse {
  resetToken: string;
}

// Reset password request
export interface ResetPasswordRequest {
  phoneNumber: string;
  resetToken: string;
  newPassword: string;
  tenantId?: string;
  subdomain?: string;
}

// Auth response from backend (matches AuthResponseDto)
// Backend returns role as string (Owner, Coach, ...) plus roles[] and permissions[].
export interface AuthResponse {
  userId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string | number;
  roles?: string[];
  permissions?: Permission[];
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// User info stored locally
export interface UserInfo {
  id: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  roles?: UserRole[];
  tenantId: string;
  fullName?: string;
}

// Decoded JWT token
export interface DecodedToken {
  UserId: string;
  Email: string;
  UserRole: string;
  TenantId: string;
  exp: number;
  iat: number;
}

// User profile
export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  gender?: 'Male' | 'Female';
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}

// Update profile request
export interface UpdateProfileRequest {
  fullName: string;
  gender?: 'Male' | 'Female';
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}
