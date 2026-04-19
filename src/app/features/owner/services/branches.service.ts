import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Branch, CreateBranchRequest, UpdateBranchRequest, SetOperatingHoursRequest
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/Branches`;

  list(params?: { isActive?: boolean; searchTerm?: string }): Observable<Branch[]> {
    let p = new HttpParams();
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    return this.http.get<Branch[]>(this.url, { params: p });
  }

  get(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.url}/${id}`);
  }

  create(body: CreateBranchRequest): Observable<string> {
    return this.http.post<string>(this.url, body);
  }

  update(id: string, body: UpdateBranchRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  setOperatingHours(id: string, body: SetOperatingHoursRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/operating-hours`, body);
  }
}
