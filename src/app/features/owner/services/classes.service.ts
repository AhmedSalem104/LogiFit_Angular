import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GroupClass, CreateGroupClassRequest, UpdateGroupClassRequest,
  ClassSchedule, CreateScheduleRequest, CancelScheduleRequest,
  ClassEnrollment, BookClassRequest, CancelEnrollmentRequest
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Group Classes
  listClasses(params?: { branchId?: string; isActive?: boolean; category?: string }): Observable<GroupClass[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.category) p = p.set('category', params.category);
    return this.http.get<GroupClass[]>(`${this.api}/GroupClasses`, { params: p });
  }
  createClass(body: CreateGroupClassRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/GroupClasses`, body);
  }
  updateClass(id: string, body: UpdateGroupClassRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/GroupClasses/${id}`, body);
  }
  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/GroupClasses/${id}`);
  }

  // Schedules
  listSchedules(params?: {
    groupClassId?: string; coachId?: string; roomId?: string; branchId?: string;
    fromDate?: string; toDate?: string; includeCancelled?: boolean;
  }): Observable<ClassSchedule[]> {
    let p = new HttpParams();
    if (params?.groupClassId) p = p.set('groupClassId', params.groupClassId);
    if (params?.coachId) p = p.set('coachId', params.coachId);
    if (params?.roomId) p = p.set('roomId', params.roomId);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    if (params?.includeCancelled !== undefined) p = p.set('includeCancelled', params.includeCancelled);
    return this.http.get<ClassSchedule[]>(`${this.api}/ClassSchedules`, { params: p });
  }
  createSchedule(body: CreateScheduleRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/ClassSchedules`, body);
  }
  cancelSchedule(id: string, body: CancelScheduleRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/ClassSchedules/${id}/cancel`, body);
  }

  // Enrollments
  listEnrollments(scheduleId: string, includeCancelled = false): Observable<ClassEnrollment[]> {
    return this.http.get<ClassEnrollment[]>(`${this.api}/ClassSchedules/${scheduleId}/enrollments`, {
      params: new HttpParams().set('includeCancelled', includeCancelled)
    });
  }
  book(scheduleId: string, body: BookClassRequest): Observable<ClassEnrollment> {
    return this.http.post<ClassEnrollment>(`${this.api}/ClassSchedules/${scheduleId}/book`, body);
  }
  cancelEnrollment(enrollmentId: string, body: CancelEnrollmentRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/ClassSchedules/enrollments/${enrollmentId}/cancel`, body);
  }
  markAttended(enrollmentId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/ClassSchedules/enrollments/${enrollmentId}/attended`, {});
  }
}
