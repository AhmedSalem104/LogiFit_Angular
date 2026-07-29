import { AuthResponse } from '../../auth/models/auth.models';

export enum WorkspaceType {
  Gym = 1,
  FreelanceCoach = 2,
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
  editableValues: Record<string, unknown>;
}

export interface SubmitFreelanceWorkspaceApplication {
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
}

export type WorkspaceAuthResponse = AuthResponse;
