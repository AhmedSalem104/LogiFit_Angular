import { AuthResponse } from '../../auth/models/auth.models';

export enum WorkspaceType {
  Gym = 1,
  FreelanceCoach = 2,
}

export enum BillingCycle {
  Monthly = 1,
  SemiAnnual = 2,
  Annual = 3,
}

export enum ApplicationType {
  GymWorkspaceCreation = 1,
  FreelanceWorkspaceCreation = 2,
  CoachMembership = 3,
  AssistantMembership = 4,
  ClientMembership = 5,
}

export enum ApplicationRequestStatus {
  Draft = 1,
  Submitted = 2,
  UnderReview = 3,
  NeedsMoreInformation = 4,
  Approved = 5,
  Rejected = 6,
  Cancelled = 7,
  Expired = 8,
}

export interface IdentityWorkspace {
  workspaceId: string;
  name: string;
  identifier: string | null;
  workspaceType: WorkspaceType;
  workspaceStatus: number;
  role: string | number;
}

export interface PendingApplication {
  applicationId: string;
  applicationType: ApplicationType;
  status: ApplicationRequestStatus;
  submittedAt: string | null;
  workspaceIdentifier?: string | null;
  workspaceType?: WorkspaceType;
  paymentStatus?: number | null;
  workspaceStatus?: number | null;
  subscriptionStatus?: number | null;
  databaseStatusCode?: 'Unassigned' | 'Provisioning' | 'Ready' | 'Unavailable' | 'Failed' | 'Released' | null;
  provisioningStatus?: number | null;
  userJourneyStage?: 'Submitted' | 'UnderReview' | 'MoreInformation' | 'Preparing' | 'PaymentRejected' | 'Rejected' | 'Ready' | string;
  canAccessDashboard?: boolean;
  requiredAction?: string | null;
  nextStep?: string | null;
  userMessage?: string | null;
  lastUpdatedAtUtc?: string | null;
}

export interface IdentitySignInResponse {
  workspaceSelectionToken: string;
  expiresAt: string;
  activeWorkspaces: IdentityWorkspace[];
  pendingApplications: PendingApplication[];
  requiresWorkspaceSelection: boolean;
}

export interface ApplicationTrackingSession {
  applicationId: string;
  trackingToken: string;
  expiresAt: string;
  status: ApplicationRequestStatus;
}

export interface ApplicationTrackingStatus {
  applicationId: string;
  applicationType: ApplicationType;
  status: ApplicationRequestStatus;
  workspaceIdentifier: string | null;
  informationRequest: string | null;
  requestedFields: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  workspaceType?: WorkspaceType | null;
  paymentStatus?: number | null;
  workspaceStatus?: number | null;
  subscriptionStatus?: number | null;
  databaseStatus?: number | null;
  databaseStatusCode?: 'Unassigned' | 'Provisioning' | 'Ready' | 'Unavailable' | 'Failed' | 'Released' | null;
  provisioningStatus?: number | null;
  userJourneyStage?: 'Submitted' | 'UnderReview' | 'MoreInformation' | 'Preparing' | 'PaymentRejected' | 'Rejected' | 'Ready' | string;
  canAccessDashboard?: boolean;
  requiredAction?: string | null;
  nextStep?: string | null;
  userMessage?: string | null;
  lastUpdatedAtUtc?: string | null;
  provisioningErrorCode?: string | null;
  editableValues: Record<string, unknown>;
}

export interface SubmitFreelanceWorkspaceApplication {
  workspaceType?: WorkspaceType;
  email: string;
  phoneNumber?: string;
  password: string;
  workspaceName: string;
  workspaceIdentifier: string;
  ownerFullName: string;
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  welcomeMessage?: string;
  deliveryMode?: string;
  planId?: string;
  billingCycle?: BillingCycle;
  paymentAmount?: number;
  paymentTransactionNumber?: string;
  paymentDate?: string;
  idempotencyKey?: string;
  proofStorageKey?: string;
  proofOriginalFileName?: string;
  proofContentType?: string;
  proofSizeBytes?: number;
  proofSha256?: string;
}

export interface PublicWorkspacePlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  durationInDays: number;
  features: string[];
  displayOrder: number;
}

export interface SubmitWorkspaceApplication {
  workspaceType: WorkspaceType;
  planId: string;
  email: string;
  phoneNumber?: string;
  password: string;
  workspaceName: string;
  workspaceIdentifier: string;
  ownerFullName: string;
  brandName?: string;
  specialization?: string;
  deliveryMode?: string;
  description?: string;
  bio?: string;
  welcomeMessage?: string;
  billingCycle: BillingCycle;
  paymentTransactionNumber?: string;
  paymentDate?: string;
  idempotencyKey: string;
}

export type WorkspaceAuthResponse = AuthResponse;

export interface WorkspaceInvitePreview {
  inviteId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIdentifier: string | null;
  logoUrl: string | null;
  role: string | number;
  emailMasked: string;
  expiresAt: string;
}

export interface WorkspaceClientJoinPreview {
  workspaceId: string;
  workspaceName: string;
  workspaceIdentifier: string | null;
  logoUrl: string | null;
  expiresAt: string;
  requiresWorkspaceApproval: boolean;
}

export interface ClientJoinResult {
  workspaceId: string;
  membershipStatus: number;
}

