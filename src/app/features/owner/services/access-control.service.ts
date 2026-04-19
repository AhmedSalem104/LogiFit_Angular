import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MembershipCard, IssueCardRequest, RevokeCardRequest,
  GateAccessResponse, CheckInQrRequest, GateAccessLog, GateAccessResult
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Membership Cards
  listCards(params?: { clientId?: string; isActive?: boolean }): Observable<MembershipCard[]> {
    let p = new HttpParams();
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    return this.http.get<MembershipCard[]>(`${this.api}/MembershipCards`, { params: p });
  }

  issueCard(body: IssueCardRequest): Observable<MembershipCard> {
    return this.http.post<MembershipCard>(`${this.api}/MembershipCards/issue`, body);
  }

  revokeCard(id: string, body: RevokeCardRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/MembershipCards/${id}/revoke`, body);
  }

  // Gate Access
  checkInQr(body: CheckInQrRequest): Observable<GateAccessResponse> {
    return this.http.post<GateAccessResponse>(`${this.api}/GateAccess/check-in-qr`, body);
  }

  logs(params?: {
    clientId?: string;
    branchId?: string;
    result?: GateAccessResult;
    fromDate?: string;
    toDate?: string;
    take?: number;
  }): Observable<GateAccessLog[]> {
    let p = new HttpParams();
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.result !== undefined) p = p.set('result', params.result);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    if (params?.take) p = p.set('take', params.take);
    return this.http.get<GateAccessLog[]>(`${this.api}/GateAccess/logs`, { params: p });
  }
}
