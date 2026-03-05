import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ==================== Attendance Interfaces ====================

export interface AttendanceDto {
  id: string;
  clientId: string;
  clientName: string;
  checkInTime: string;
  checkOutTime: string | null;
  notes: string | null;
  durationMinutes: number | null;
}

export interface AttendanceSummaryDto {
  totalCheckIns: number;
  checkedInNow: number;
  averageDurationMinutes: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface DailyBreakdown {
  date: string;
  count: number;
}

export interface CheckInRequest {
  clientId: string;
  notes?: string;
}

export interface AttendanceFilterParams {
  clientId?: string;
  fromDate?: string;
  toDate?: string;
  checkedInOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAttendance(params?: AttendanceFilterParams): Observable<AttendanceDto[]> {
    let httpParams = new HttpParams();
    if (params?.clientId) {
      httpParams = httpParams.set('clientId', params.clientId);
    }
    if (params?.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate);
    }
    if (params?.toDate) {
      httpParams = httpParams.set('toDate', params.toDate);
    }
    if (params?.checkedInOnly !== undefined) {
      httpParams = httpParams.set('checkedInOnly', params.checkedInOnly.toString());
    }
    return this.http.get<AttendanceDto[]>(`${this.apiUrl}/attendance`, { params: httpParams });
  }

  getSummary(fromDate?: string, toDate?: string): Observable<AttendanceSummaryDto> {
    let httpParams = new HttpParams();
    if (fromDate) {
      httpParams = httpParams.set('fromDate', fromDate);
    }
    if (toDate) {
      httpParams = httpParams.set('toDate', toDate);
    }
    return this.http.get<AttendanceSummaryDto>(`${this.apiUrl}/attendance/summary`, { params: httpParams });
  }

  checkIn(request: CheckInRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/attendance/check-in`, request);
  }

  checkOut(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/attendance/${id}/check-out`, {});
  }

  deleteAttendance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attendance/${id}`);
  }
}
