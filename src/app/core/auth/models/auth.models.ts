// User roles matching backend enum (numeric values)
// Backend: Owner = 1, Coach = 2, Client = 3 (1-indexed)
export enum UserRole {
  Owner = 'Owner',
  Coach = 'Coach',
  Client = 'Client'
}

// Numeric role values for API requests (1-indexed to match backend UserRole enum)
export const UserRoleValues = {
  Owner: 1,
  Coach: 2,
  Client: 3
} as const;

// Login request (matches backend LoginCommand)
export interface LoginRequest {
  phoneNumber: string;
  password: string;
  tenantId: string;
}

// Register request (matches backend RegisterCommand)
// Note: role must be numeric (1=Owner, 2=Coach, 3=Client) to match backend enum
export interface RegisterRequest {
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  tenantId: string;
  role: number;  // 1=Owner, 2=Coach, 3=Client
  fullName: string;
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
  status: number; // 0=Inactive, 1=Active, 2=Suspended
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

// Forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Reset password request
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Auth response from backend (matches AuthResponseDto)
// Note: Backend returns role as string (Owner, Coach, Client) as per OpenAPI
export interface AuthResponse {
  userId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string | number;  // Can be string or number depending on endpoint
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
