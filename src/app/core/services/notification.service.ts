import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type NotificationType = 'success' | 'info' | 'warn' | 'error';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  sticky?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultDuration = 4000;

  constructor(private messageService: MessageService) {}

  /**
   * Show success notification
   */
  success(message: string, title: string = 'نجاح'): void {
    this.show({ message, title, type: 'success' });
  }

  /**
   * Show error notification
   */
  error(message: string, title: string = 'خطأ'): void {
    this.show({ message, title, type: 'error' });
  }

  /**
   * Show warning notification
   */
  warn(message: string, title: string = 'تحذير'): void {
    this.show({ message, title, type: 'warn' });
  }

  /**
   * Show info notification
   */
  info(message: string, title: string = 'معلومة'): void {
    this.show({ message, title, type: 'info' });
  }

  /**
   * Show custom notification
   */
  show(options: NotificationOptions): void {
    this.messageService.add({
      severity: options.type || 'info',
      summary: options.title || '',
      detail: options.message,
      life: options.duration || this.defaultDuration,
      sticky: options.sticky || false
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.messageService.clear();
  }
}
