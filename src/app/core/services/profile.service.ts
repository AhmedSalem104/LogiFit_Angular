import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** The authenticated user's own profile — resolved from the token (any role). */
export interface SelfProfile {
  id: string;
  tenantId: string;
  email?: string;
  phoneNumber?: string;
  role: number;
  isActive: boolean;
  walletBalance?: number;
  profile?: SelfProfileDetails;
}

export interface SelfProfileDetails {
  fullName?: string;
  profilePictureUrl?: string;
  gender?: number;      // 1 = Male, 2 = Female
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalHistory?: string;
}

export interface UpdateSelfProfileRequest {
  fullName?: string;
  gender?: number;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalHistory?: string;
}

/**
 * Self-profile endpoints under /api/profile — self from token, so the same
 * service serves every role (owner / back-office / coach / trainer).
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/profile`;

  get(): Observable<SelfProfile> {
    return this.http.get<SelfProfile>(this.api);
  }

  update(data: UpdateSelfProfileRequest): Observable<void> {
    return this.http.put<void>(this.api, data);
  }

  uploadPicture(file: File): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/picture`, fd);
  }

  deletePicture(): Observable<void> {
    return this.http.delete<void>(`${this.api}/picture`);
  }

  /** Prefix a relative upload URL (/uploads/...) with the backend origin. */
  fullImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }
}
