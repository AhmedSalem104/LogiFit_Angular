import { Component, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeState } from '../../../../state/theme.state';
import { NotificationsApiService, NotificationDto, NotificationTypeLabels } from '../../../services/notifications-api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header" [class.sidebar-collapsed]="themeState.sidebarCollapsed()">
      <!-- Sidebar Toggle -->
      <button class="toggle-btn" (click)="themeState.toggleSidebar()" title="تصغير/تكبير القائمة">
        <i class="pi" [class.pi-chevron-right]="themeState.sidebarCollapsed()" [class.pi-chevron-left]="!themeState.sidebarCollapsed()"></i>
      </button>

      <!-- Page Title / Breadcrumb -->
      <div class="page-info">
        <h1 class="page-title">{{ getPageTitle() }}</h1>
        <p class="page-subtitle">{{ getGreeting() }}</p>
      </div>

      <!-- Spacer -->
      <div class="spacer"></div>

      <!-- Actions Bar -->
      <div class="header-actions">
        <!-- Theme Toggle -->
        <button
          class="action-btn theme-btn"
          (click)="themeState.toggleDarkMode()"
          [title]="themeState.darkMode() ? 'Light Mode' : 'Dark Mode'"
        >
          <i class="pi" [class.pi-sun]="themeState.darkMode()" [class.pi-moon]="!themeState.darkMode()"></i>
        </button>

        <!-- Notification Bell -->
        <div class="notification-wrapper">
          <button
            class="action-btn notification-btn"
            (click)="toggleNotificationPanel($event)"
            title="الاشعارات"
          >
            <i class="pi pi-bell"></i>
            @if (notificationsApi.unreadCount() > 0) {
              <span class="notification-badge">{{ notificationsApi.unreadCount() > 99 ? '99+' : notificationsApi.unreadCount() }}</span>
            }
          </button>

          <!-- Notification Dropdown Panel -->
          @if (showNotifications()) {
            <div class="notification-panel">
              <div class="notification-panel-header">
                <span class="notification-panel-title">الاشعارات</span>
                @if (notificationsApi.unreadCount() > 0) {
                  <button class="mark-all-read-btn" (click)="markAllAsRead()">قراءة الكل</button>
                }
              </div>
              <div class="notification-panel-body">
                @if (loadingNotifications()) {
                  <div class="notification-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                  </div>
                } @else if (notifications().length === 0) {
                  <div class="notification-empty">
                    <i class="pi pi-inbox"></i>
                    <span>لا توجد اشعارات</span>
                  </div>
                } @else {
                  @for (notification of notifications(); track notification.id) {
                    <div
                      class="notification-item"
                      [class.unread]="!notification.isRead"
                      (click)="markAsRead(notification)"
                    >
                      <div class="notification-icon-wrapper" [class]="'type-' + notification.type">
                        <i class="pi" [class]="getNotificationIcon(notification.type)"></i>
                      </div>
                      <div class="notification-content">
                        <span class="notification-title">{{ notification.title }}</span>
                        <span class="notification-body">{{ notification.body }}</span>
                        <span class="notification-time">{{ getTimeAgo(notification.createdAt) }}</span>
                      </div>
                      @if (!notification.isRead) {
                        <div class="unread-dot"></div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- Divider -->
        <div class="header-divider"></div>

        <!-- User Info (No Dropdown) -->
        <div class="user-section">
          <div class="user-avatar">
            <span>{{ getInitials() }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ authService.user()?.fullName || 'المستخدم' }}</span>
            <span class="user-role">{{ getRoleLabel() }}</span>
          </div>
        </div>

        <!-- Logout Button -->
        <button class="logout-btn" (click)="authService.logout()" title="تسجيل الخروج">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    /* ========================================
       Header Container
       ======================================== */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 280px;
      height: 72px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 1rem;
      z-index: 999;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

      &.sidebar-collapsed {
        right: 80px;
      }
    }

    :host-context([dir="ltr"]) .header {
      right: 0;
      left: 280px;

      &.sidebar-collapsed {
        left: 80px;
      }
    }

    /* ========================================
       Toggle Button
       ======================================== */
    .toggle-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: var(--gradient-primary);
        color: white;
        transform: scale(1.05);
      }

      i {
        font-size: 0.85rem;
        transition: transform 0.3s ease;
      }
    }

    :host-context([dir="ltr"]) .toggle-btn i {
      transform: rotate(180deg);
    }

    /* ========================================
       Page Info
       ======================================== */
    .page-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .page-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .page-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }

    .spacer {
      flex: 1;
    }

    /* ========================================
       Header Actions
       ======================================== */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
        transform: translateY(-2px);
      }

      i {
        font-size: 1rem;
      }
    }

    .theme-btn {
      &:hover {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%);
        color: var(--warning-500);
      }
    }

    /* ========================================
       Divider
       ======================================== */
    .header-divider {
      width: 1px;
      height: 32px;
      background: var(--border-color);
      margin: 0 0.5rem;
    }

    /* ========================================
       User Section
       ======================================== */
    .user-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.375rem 0.75rem 0.375rem 0.5rem;
      background: var(--bg-tertiary);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    :host-context([dir="ltr"]) .user-section {
      padding: 0.375rem 0.5rem 0.375rem 0.75rem;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      background: var(--gradient-primary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;

      span {
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.2;
      white-space: nowrap;
    }

    .user-role {
      font-size: 0.7rem;
      color: var(--text-muted);
      line-height: 1.2;
    }

    /* ========================================
       Logout Button
       ======================================== */
    .logout-btn {
      width: 40px;
      height: 40px;
      border: 1px solid rgba(239, 68, 68, 0.2);
      background: rgba(239, 68, 68, 0.08);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ef4444;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        transform: translateY(-2px);
      }

      i {
        font-size: 1rem;
      }
    }

    /* ========================================
       Notification Bell & Panel
       ======================================== */
    .notification-wrapper {
      position: relative;
    }

    .notification-btn {
      &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
        color: var(--primary-500, #3b82f6);
      }
    }

    .notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border: 2px solid var(--bg-primary);
      pointer-events: none;
    }

    .notification-panel {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      width: 360px;
      max-height: 480px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      z-index: 1001;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .notification-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .notification-panel-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .mark-all-read-btn {
      background: none;
      border: none;
      color: var(--primary-500, #3b82f6);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;

      &:hover {
        background: rgba(59, 130, 246, 0.1);
      }
    }

    .notification-panel-body {
      overflow-y: auto;
      max-height: 400px;
    }

    .notification-loading,
    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;
      color: var(--text-muted);

      i {
        font-size: 2rem;
      }

      span {
        font-size: 0.875rem;
      }
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--bg-secondary);
      }

      &.unread {
        background: rgba(59, 130, 246, 0.04);

        &:hover {
          background: rgba(59, 130, 246, 0.08);
        }
      }
    }

    .notification-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--bg-tertiary);
      color: var(--text-secondary);

      &.type-1 { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.type-2 { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.type-3 { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.type-4 { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      &.type-5 { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

      i { font-size: 0.9rem; }
    }

    .notification-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .notification-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .notification-body {
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-500, #3b82f6);
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    /* ========================================
       Responsive
       ======================================== */
    @media (max-width: 1024px) {
      .header {
        right: 0 !important;
        left: 0 !important;
      }

      .page-info {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .header {
        padding: 0 1rem;
        height: 64px;
      }

      .action-btn {
        width: 36px;
        height: 36px;
      }

      .user-section {
        padding: 0.25rem;
      }

      .user-details {
        display: none;
      }

      .header-divider {
        display: none;
      }

      .notification-panel {
        width: calc(100vw - 32px);
        left: auto;
        right: -8px;
        transform: none;
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  themeState = inject(ThemeState);
  notificationsApi = inject(NotificationsApiService);

  showNotifications = signal(false);
  notifications = signal<NotificationDto[]>([]);
  loadingNotifications = signal(false);

  private pollInterval: any;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.notificationsApi.refreshUnreadCount();
      // Poll every 60 seconds
      this.pollInterval = setInterval(() => {
        this.notificationsApi.refreshUnreadCount();
      }, 60000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotifications.set(false);
    }
  }

  toggleNotificationPanel(event: Event): void {
    event.stopPropagation();
    const isOpen = this.showNotifications();
    this.showNotifications.set(!isOpen);
    if (!isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.loadingNotifications.set(true);
    this.notificationsApi.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loadingNotifications.set(false);
      },
      error: () => {
        this.loadingNotifications.set(false);
      }
    });
  }

  markAsRead(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.notificationsApi.markAsRead(notification.id).subscribe(() => {
        notification.isRead = true;
        this.notificationsApi.refreshUnreadCount();
      });
    }
  }

  markAllAsRead(): void {
    this.notificationsApi.markAllAsRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    });
  }

  getNotificationIcon(type: number): string {
    switch (type) {
      case 1: return 'pi-info-circle';
      case 2: return 'pi-bolt';
      case 3: return 'pi-apple';
      case 4: return 'pi-calendar-times';
      case 5: return 'pi-envelope';
      default: return 'pi-bell';
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'الان';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
  }

  getRoleLabel(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'Owner': return 'مالك الصالة';
      case 'Coach': return 'مدرب';
      case 'Client': return 'عميل';
      default: return '';
    }
  }

  getInitials(): string {
    const name = this.authService.user()?.fullName || '';
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getPageTitle(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'Owner': return 'لوحة تحكم المالك';
      case 'Coach': return 'لوحة تحكم المدرب';
      case 'Client': return 'برنامجي التدريبي';
      default: return 'LogicFit';
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    const name = this.authService.user()?.fullName?.split(' ')[0] || '';

    let greeting = '';
    if (hour < 12) {
      greeting = 'صباح الخير';
    } else if (hour < 17) {
      greeting = 'مساء الخير';
    } else {
      greeting = 'مساء الخير';
    }

    return name ? `${greeting}، ${name}` : greeting;
  }
}
