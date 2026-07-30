import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SponsorFreelanceMembershipRequest {
  identityEmail: string;
  fullName: string;
  requestedRole: 3 | 11 | 12;
}

export interface SponsoredMembershipApplication {
  applicationId: string;
  status: number;
  submittedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class FreelanceTeamService {
  private readonly http = inject(HttpClient);

  sponsor(data: SponsorFreelanceMembershipRequest): Observable<SponsoredMembershipApplication> {
    return this.http.post<SponsoredMembershipApplication>(`${environment.apiUrl}/freelance/team/applications`, data);
  }
}
