import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==================== Notification Interfaces ====================
export interface NotificationDto {
  id: string;
  senderId?: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  title: string;
  body: string;
  type: number; // 1=General, 2=WorkoutAssigned, 3=DietPlanAssigned, 4=SubscriptionExpiring, 5=Custom
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface SendNotificationRequest {
  recipientId: string;
  title: string;
  body: string;
  type?: number;
}

export interface BulkNotificationRequest {
  recipientIds: string[];
  title: string;
  body: string;
  type?: number;
}

export const NotificationType = {
  General: 1,
  WorkoutAssigned: 2,
  DietPlanAssigned: 3,
  SubscriptionExpiring: 4,
  Custom: 5
} as const;

export const NotificationTypeLabels: Record<number, string> = {
  1: 'عام',
  2: 'برنامج تدريبي',
  3: 'خطة غذائية',
  4: 'اشتراك',
  5: 'مخصص'
};

@Injectable({
  providedIn: 'root'
})
export class NotificationsApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Reactive unread count signal
  unreadCount = signal(0);

  getNotifications(params?: { isRead?: boolean; type?: number }): Observable<NotificationDto[]> {
    let httpParams = new HttpParams();
    if (params?.isRead !== undefined) httpParams = httpParams.set('isRead', params.isRead.toString());
    if (params?.type !== undefined) httpParams = httpParams.set('type', params.type.toString());
    return this.http.get<NotificationDto[]>(`${this.apiUrl}/notifications`, { params: httpParams });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notifications/unread-count`).pipe(
      tap(count => this.unreadCount.set(count))
    );
  }

  sendNotification(data: SendNotificationRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/notifications`, data);
  }

  sendBulkNotification(data: BulkNotificationRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/bulk`, data);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/read-all`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}
