import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApplicationTrackingSession,
  ApplicationTrackingStatus,
  IdentitySignInResponse,
  SubmitFreelanceWorkspaceApplication,
  WorkspaceAuthResponse,
  WorkspaceInvitePreview,
  WorkspaceClientJoinPreview,
  ClientJoinResult,
} from '../models/freelance.models';

/** Public identity and application calls. No tenant JWT is attached to these endpoints. */
@Injectable({ providedIn: 'root' })
export class FreelanceOnboardingService {
  private readonly http = inject(HttpClient);
  private readonly identityBase = `${environment.apiUrl}/identity`;
  private readonly applicationsBase = `${environment.apiUrl}/workspace-applications`;
  private readonly trackingKey = 'logicfit_application_tracking_token';

  identityLogin(email: string, password: string): Observable<IdentitySignInResponse> {
    return this.http.post<IdentitySignInResponse>(`${this.identityBase}/login`, { email, password });
  }

  registerIdentity(fullName: string, email: string, password: string, phoneNumber?: string): Observable<void> {
    return this.http.post<void>(`${this.identityBase}/register`, { fullName, email, password, phoneNumber });
  }

  verifyIdentityEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.identityBase}/verify-email`, { token });
  }

  requestIdentityPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.identityBase}/password-reset`, { email });
  }

  resetIdentityPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.identityBase}/password-reset/confirm`, { token, newPassword });
  }

  previewWorkspaceInvite(token: string): Observable<WorkspaceInvitePreview> {
    return this.http.post<WorkspaceInvitePreview>(`${environment.apiUrl}/workspace-invites/preview`, { token });
  }

  acceptWorkspaceInvite(token: string, workspaceSelectionToken: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/workspace-invites/accept`, { token, workspaceSelectionToken });
  }

  previewClientJoin(code: string): Observable<WorkspaceClientJoinPreview> {
    return this.http.post<WorkspaceClientJoinPreview>(`${environment.apiUrl}/workspace/client-join-codes/preview`, { code });
  }

  joinWorkspaceAsClient(code: string, workspaceSelectionToken: string): Observable<ClientJoinResult> {
    return this.http.post<ClientJoinResult>(`${environment.apiUrl}/workspace/client-join-codes/join`, { code, workspaceSelectionToken });
  }

  selectWorkspace(workspaceSelectionToken: string, workspaceId: string): Observable<WorkspaceAuthResponse> {
    return this.http.post<WorkspaceAuthResponse>(`${this.identityBase}/select-workspace`, {
      workspaceSelectionToken,
      workspaceId,
    });
  }

  reissueTrackingSessions(workspaceSelectionToken: string): Observable<ApplicationTrackingSession[]> {
    return this.http.post<ApplicationTrackingSession[]>(`${this.identityBase}/application-tracking-sessions`, {
      workspaceSelectionToken,
    }).pipe(tap(sessions => {
      if (sessions.length) this.saveTrackingToken(sessions[0].trackingToken);
    }));
  }

  submitFreelanceWorkspace(data: SubmitFreelanceWorkspaceApplication): Observable<ApplicationTrackingSession> {
    return this.http.post<ApplicationTrackingSession>(`${this.applicationsBase}/freelance`, data).pipe(
      tap(session => this.saveTrackingToken(session.trackingToken))
    );
  }

  getTrackingStatus(token = this.getTrackingToken()): Observable<ApplicationTrackingStatus> {
    return this.http.get<ApplicationTrackingStatus>(`${this.applicationsBase}/tracking`, {
      headers: this.trackingHeaders(token),
    });
  }

  updateRequestedFields(fields: Record<string, unknown>, token = this.getTrackingToken()): Observable<ApplicationTrackingStatus> {
    return this.http.patch<ApplicationTrackingStatus>(`${this.applicationsBase}/tracking/fields`, fields, {
      headers: this.trackingHeaders(token),
    });
  }

  resubmit(token = this.getTrackingToken()): Observable<ApplicationTrackingStatus> {
    return this.http.post<ApplicationTrackingStatus>(`${this.applicationsBase}/tracking/resubmit`, {}, {
      headers: this.trackingHeaders(token),
    });
  }

  getTrackingToken(): string | null {
    return sessionStorage.getItem(this.trackingKey);
  }

  saveTrackingToken(token: string): void {
    sessionStorage.setItem(this.trackingKey, token);
  }

  clearTrackingToken(): void {
    sessionStorage.removeItem(this.trackingKey);
  }

  private trackingHeaders(token: string | null): HttpHeaders {
    return token ? new HttpHeaders({ 'X-Application-Tracking-Token': token }) : new HttpHeaders();
  }

}
