import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AppointmentDto {
  id: string;
  coachId?: string;
  coachName?: string;
  clientId?: string;
  clientName?: string;
  startTime: string;
  endTime: string;
  title?: string;
  notes?: string;
  status: number; // 1=Pending, 2=Confirmed, 3=Cancelled, 4=Completed
}

export interface CreateAppointmentCommand {
  coachId?: string;
  clientId: string;
  startTime: string;
  endTime: string;
  title: string;
  notes?: string;
}

export const AppointmentStatusLabels: Record<number, string> = {
  1: 'قيد الانتظار',
  2: 'مؤكد',
  3: 'ملغي',
  4: 'مكتمل'
};

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAppointments(params?: {
    coachId?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
    status?: number;
  }): Observable<AppointmentDto[]> {
    const queryParts: string[] = [];
    if (params?.coachId) queryParts.push(`coachId=${params.coachId}`);
    if (params?.clientId) queryParts.push(`clientId=${params.clientId}`);
    if (params?.fromDate) queryParts.push(`fromDate=${params.fromDate}`);
    if (params?.toDate) queryParts.push(`toDate=${params.toDate}`);
    if (params?.status !== undefined) queryParts.push(`status=${params.status}`);
    const queryString = queryParts.length ? '?' + queryParts.join('&') : '';
    return this.http.get<AppointmentDto[]>(`${this.apiUrl}/appointments${queryString}`);
  }

  getAppointmentById(id: string): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${this.apiUrl}/appointments/${id}`);
  }

  createAppointment(command: CreateAppointmentCommand): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/appointments`, command);
  }

  updateStatus(id: string, status: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/appointments/${id}/status`, { status });
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${id}`);
  }
}
