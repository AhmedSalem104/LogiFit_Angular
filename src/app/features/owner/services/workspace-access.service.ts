import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type WorkspaceMemberRole = 2 | 4 | 5 | 6 | 7;
export type WorkspaceMemberAccessStatus =
  | 'PendingSetup'
  | 'PasswordChangeRequired'
  | 'Active'
  | 'Suspended'
  | 'Locked'
  | 'Removed';

export interface WorkspaceMember {
  membershipId: string;
  userId: string;
  identityAccountId: string;
  tenantId: string;
  email: string;
  phoneNumber?: string | null;
  fullName?: string | null;
  role: WorkspaceMemberRole | string;
  roleName: string;
  membershipStatus: string;
  accessStatus: WorkspaceMemberAccessStatus;
  mustChangePassword: boolean;
  isActive: boolean;
  updatedAtUtc?: string | null;
}

export interface CreateWorkspaceMemberRequest {
  email: string;
  phoneNumber?: string;
  fullName: string;
  role: WorkspaceMemberRole;
}

export interface OneTimeWorkspaceMemberCredentials {
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}

export interface WorkspaceMemberCreated {
  member: WorkspaceMember;
  newIdentity: boolean;
  oneTimeCredentials?: OneTimeWorkspaceMemberCredentials | null;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceAccessService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/workspace-members`;

  list(params?: { role?: WorkspaceMemberRole; accessStatus?: WorkspaceMemberAccessStatus; searchTerm?: string }): Observable<WorkspaceMember[]> {
    let query = new HttpParams();
    if (params?.role !== undefined) query = query.set('role', params.role);
    if (params?.accessStatus) query = query.set('accessStatus', params.accessStatus);
    if (params?.searchTerm) query = query.set('searchTerm', params.searchTerm);
    return this.http.get<WorkspaceMember[]>(this.api, { params: query });
  }

  create(request: CreateWorkspaceMemberRequest): Observable<WorkspaceMemberCreated> {
    return this.http.post<WorkspaceMemberCreated>(this.api, request);
  }

  suspend(membershipId: string): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.api}/${membershipId}/suspend`, {});
  }

  activate(membershipId: string): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.api}/${membershipId}/activate`, {});
  }

  remove(membershipId: string): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.api}/${membershipId}/remove`, {});
  }

  resetPassword(membershipId: string): Observable<WorkspaceMemberCreated> {
    return this.http.post<WorkspaceMemberCreated>(`${this.api}/${membershipId}/reset-password`, {});
  }
}
