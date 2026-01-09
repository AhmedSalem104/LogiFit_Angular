import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeState } from '../../../../state/theme.state';

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
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeState = inject(ThemeState);


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
