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
} from '../models/freelance.models';

/** Public identity and application calls. No tenant JWT is attached to these endpoints. */
@Injectable({ providedIn: 'root' })
export class FreelanceOnboardingService {
  private readonly http = inject(HttpClient);
  private readonly identityBase = `${environment.apiUrl}/identity`;
  private readonly applicationsBase = `${environment.apiUrl}/workspace-applications`;
  private readonly trackingKey = 'logicfit_application_tracking_token';

  identityLogin(identifier: string, password: string): Observable<IdentitySignInResponse> {
    return this.http.post<IdentitySignInResponse>(`${this.identityBase}/login`, { identifier, password });
  }

  registerIdentity(email: string, phoneNumber: string | undefined, password: string): Observable<void> {
    return this.http.post<void>(`${this.identityBase}/register`, { email, phoneNumber, password });
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
    });
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
