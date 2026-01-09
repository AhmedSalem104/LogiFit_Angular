import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeState } from '../../../../state/theme.state';
import { UserRole } from '../../../auth/models/auth.models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="sidebar"
      [class.collapsed]="themeState.sidebarCollapsed()"
      [class.hovered]="isHovered"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Logo Section -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-title">LogicFit</span>
            <span class="logo-subtitle">Gym Management</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (group of visibleNavGroups; track group.title) {
          <div class="nav-section">
            <div class="section-title">
              <span class="title-text">{{ group.title }}</span>
              <div class="title-line"></div>
            </div>
            <ul class="nav-list">
              @for (item of group.items; track item.route) {
                @if (canShowItem(item)) {
                  <li>
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="active"
                      class="nav-link"
                      [title]="isCollapsed ? item.label : ''"
                    >
                      <div class="nav-icon-wrapper">
                        <i [class]="'pi ' + item.icon"></i>
                      </div>
                      <span class="nav-text">{{ item.label }}</span>
                      @if (item.badge && item.badge > 0) {
                        <span class="nav-badge">{{ item.badge }}</span>
                      }
                      <div class="active-indicator"></div>
                    </a>
                  </li>
                }
              }
            </ul>
          </div>
        }
      </nav>

      <!-- User Profile Section -->
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar-wrapper">
            <div class="user-avatar">
              <span>{{ getInitials() }}</span>
            </div>
            <div class="status-indicator"></div>
          </div>
          <div class="user-info">
            <span class="user-name">{{ authService.user()?.fullName || 'المستخدم' }}</span>
            <span class="user-role-badge">{{ getRoleLabel() }}</span>
          </div>
        </div>
        <button class="logout-button" (click)="authService.logout()" title="تسجيل الخروج">
          <i class="pi pi-sign-out"></i>
          <span class="logout-text">خروج</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    /* ========================================
       Sidebar Container
       ======================================== */
    .sidebar {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: 280px;
      background: linear-gradient(180deg, #0a0f1a 0%, #131b2e 50%, #1a2540 100%);
      display: flex;
      flex-direction: column;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      overflow: hidden;
      border-left: 1px solid rgba(255, 255, 255, 0.06);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
        pointer-events: none;
      }

      /* Collapsed State */
      &.collapsed {
        width: 80px;

        .logo-text,
        .section-title .title-text,
        .nav-text,
        .nav-badge,
        .user-info,
        .logout-text {
          opacity: 0;
          width: 0;
          margin: 0;
          padding: 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .section-title .title-line {
          opacity: 1;
          width: 24px;
        }

        .nav-link {
          justify-content: center;
          padding: 0.875rem;
        }

        .nav-icon-wrapper {
          margin: 0;
        }

        .sidebar-footer {
          padding: 1rem 0.75rem;
        }

        .user-profile {
          justify-content: center;
        }

        .logout-button {
          width: 44px;
          height: 44px;
          padding: 0;
          justify-content: center;
        }

        /* Hover Expand */
        &.hovered {
          width: 280px;

          .logo-text,
          .section-title .title-text,
          .nav-text,
          .nav-badge,
          .user-info,
          .logout-text {
            opacity: 1;
            width: auto;
          }

          .section-title .title-line {
            opacity: 0;
            width: 0;
          }

          .nav-link {
            justify-content: flex-start;
            padding: 0.75rem 1rem;
          }

          .nav-icon-wrapper {
            margin-left: 0.875rem;
          }

          .sidebar-footer {
            padding: 1rem;
          }

          .user-profile {
            justify-content: flex-start;
          }

          .logout-button {
            width: auto;
            height: auto;
            padding: 0.625rem 1rem;
          }
        }
      }
    }

    /* LTR Support */
    :host-context([dir="ltr"]) .sidebar {
      right: auto;
      left: 0;
      border-left: none;
      border-right: 1px solid rgba(255, 255, 255, 0.06);

      .nav-icon-wrapper {
        margin-left: 0;
        margin-right: 0.875rem;
      }

      .active-indicator {
        right: auto;
        left: 0;
        border-radius: 0 4px 4px 0;
      }

      &.collapsed .nav-icon-wrapper {
        margin-right: 0;
      }

      &.collapsed.hovered .nav-icon-wrapper {
        margin-right: 0.875rem;
      }
    }

    /* ========================================
       Header / Logo
       ======================================== */
    .sidebar-header {
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      position: relative;
      z-index: 1;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .logo-icon {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow:
        0 8px 24px rgba(59, 130, 246, 0.35),
        inset 0 1px 1px rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
        border-radius: inherit;
      }

      svg {
        width: 24px;
        height: 24px;
        color: white;
        position: relative;
        z-index: 1;
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .logo-title {
      font-size: 1.375rem;
      font-weight: 700;
      background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
      letter-spacing: -0.02em;
    }

    .logo-subtitle {
      font-size: 0.7rem;
      color: rgba(148, 163, 184, 0.8);
      white-space: nowrap;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ========================================
       Navigation
       ======================================== */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      z-index: 1;

      &::-webkit-scrollbar {
        width: 3px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .nav-section {
      margin-bottom: 1.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .section-title {
      padding: 0.5rem 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      min-height: 28px;

      .title-text {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(148, 163, 184, 0.6);
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      .title-line {
        height: 2px;
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.4) 0%, transparent 100%);
        border-radius: 1px;
        opacity: 0;
        width: 0;
        margin: 0 auto;
        transition: all 0.3s ease;
      }
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: rgba(203, 213, 225, 0.85);
      text-decoration: none;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
        opacity: 0;
        transition: opacity 0.25s ease;
      }

      &:hover {
        color: #f1f5f9;

        &::before {
          opacity: 1;
        }

        .nav-icon-wrapper {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
      }

      &.active {
        color: white;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);

        .nav-icon-wrapper {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        .active-indicator {
          opacity: 1;
        }

        .nav-text {
          font-weight: 500;
        }
      }
    }

    .nav-icon-wrapper {
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      flex-shrink: 0;
      margin-left: 0.875rem;
      transition: all 0.25s ease;

      i {
        font-size: 1rem;
      }
    }

    .nav-text {
      font-size: 0.9rem;
      white-space: nowrap;
      transition: all 0.3s ease;
    }

    .nav-badge {
      margin-right: auto;
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      transition: all 0.3s ease;
    }

    :host-context([dir="ltr"]) .nav-badge {
      margin-right: 0.5rem;
      margin-left: auto;
    }

    .active-indicator {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 28px;
      background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 4px 0 0 4px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    /* ========================================
       Footer / User Profile
       ======================================== */
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }

    .user-profile {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }

    .user-avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .user-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      span {
        font-size: 0.9rem;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
      }
    }

    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: 2px solid #0a0f1a;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
    }

    :host-context([dir="ltr"]) .status-indicator {
      right: auto;
      left: -2px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role-badge {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.125rem 0.5rem;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-radius: 6px;
      width: fit-content;
    }

    .logout-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.15);
      border-radius: 10px;
      color: #f87171;
      cursor: pointer;
      transition: all 0.25s ease;
      font-size: 0.8rem;
      font-family: inherit;
      white-space: nowrap;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
        transform: translateY(-1px);
      }

      i {
        font-size: 0.95rem;
      }

      .logout-text {
        transition: all 0.3s ease;
      }
    }

    /* ========================================
       Mobile Responsive
       ======================================== */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(100%);

        &:not(.collapsed),
        &.collapsed.hovered {
          transform: translateX(0);
        }
      }

      :host-context([dir="ltr"]) .sidebar {
        transform: translateX(-100%);

        &:not(.collapsed),
        &.collapsed.hovered {
          transform: translateX(0);
        }
      }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  themeState = inject(ThemeState);

  isHovered = false;

  get isCollapsed(): boolean {
    return this.themeState.sidebarCollapsed() && !this.isHovered;
  }

  onMouseEnter(): void {
    if (this.themeState.sidebarCollapsed()) {
      this.isHovered = true;
    }
  }

  onMouseLeave(): void {
    this.isHovered = false;
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

  // Navigation structure
  navGroups: NavGroup[] = [
    {
      title: 'الرئيسية',
      items: [
        { label: 'لوحة التحكم', icon: 'pi-th-large', route: '/owner/dashboard', roles: [UserRole.Owner] },
        { label: 'لوحة التحكم', icon: 'pi-th-large', route: '/coach/dashboard', roles: [UserRole.Coach] },
        { label: 'برنامجي', icon: 'pi-th-large', route: '/client/my-program', roles: [UserRole.Client] },
      ]
    },
    {
      title: 'إدارة الأعضاء',
      roles: [UserRole.Owner],
      items: [
        { label: 'العملاء', icon: 'pi-users', route: '/owner/clients', roles: [UserRole.Owner] },
        { label: 'المدربين', icon: 'pi-id-card', route: '/owner/coaches', roles: [UserRole.Owner] },
      ]
    },
    {
      title: 'الاشتراكات',
      roles: [UserRole.Owner],
      items: [
        { label: 'خطط الاشتراك', icon: 'pi-wallet', route: '/owner/subscription-plans', roles: [UserRole.Owner] },
        { label: 'الاشتراكات', icon: 'pi-list', route: '/owner/subscriptions', roles: [UserRole.Owner] },
      ]
    },
    {
      title: 'المتدربين',
      roles: [UserRole.Coach],
      items: [
        { label: 'متدربيني', icon: 'pi-users', route: '/coach/trainees', roles: [UserRole.Coach] },
        { label: 'برامج التمارين', icon: 'pi-calendar', route: '/coach/workout-programs', roles: [UserRole.Coach] },
        { label: 'الخطط الغذائية', icon: 'pi-heart', route: '/coach/diet-plans', roles: [UserRole.Coach] },
      ]
    },
    {
      title: 'المكتبة',
      roles: [UserRole.Coach],
      items: [
        { label: 'التمارين', icon: 'pi-bolt', route: '/coach/exercises', roles: [UserRole.Coach] },
        { label: 'الأطعمة', icon: 'pi-apple', route: '/coach/foods', roles: [UserRole.Coach] },
        { label: 'العضلات', icon: 'pi-heart', route: '/coach/muscles', roles: [UserRole.Coach] },
        { label: 'القياسات', icon: 'pi-chart-line', route: '/coach/measurements', roles: [UserRole.Coach] },
      ]
    },
    {
      title: 'الحساب',
      roles: [UserRole.Coach],
      items: [
        { label: 'ملفي الشخصي', icon: 'pi-user', route: '/coach/profile', roles: [UserRole.Coach] },
      ]
    },
    {
      title: 'التمارين',
      roles: [UserRole.Client],
      items: [
        { label: 'برنامجي', icon: 'pi-calendar', route: '/client/my-program', roles: [UserRole.Client] },
        { label: 'خطتي الغذائية', icon: 'pi-heart', route: '/client/my-diet', roles: [UserRole.Client] },
      ]
    },
    {
      title: 'المتابعة',
      roles: [UserRole.Client],
      items: [
        { label: 'قياساتي', icon: 'pi-chart-line', route: '/client/my-measurements', roles: [UserRole.Client] },
        { label: 'تقدمي', icon: 'pi-chart-bar', route: '/client/my-progress', roles: [UserRole.Client] },
        { label: 'اشتراكاتي', icon: 'pi-wallet', route: '/client/my-subscriptions', roles: [UserRole.Client] },
      ]
    },
    {
      title: 'الحساب',
      roles: [UserRole.Client],
      items: [
        { label: 'ملفي الشخصي', icon: 'pi-user', route: '/client/profile', roles: [UserRole.Client] },
      ]
    },
    {
      title: 'التقارير',
      roles: [UserRole.Owner],
      items: [
        { label: 'التقارير', icon: 'pi-chart-bar', route: '/owner/reports', roles: [UserRole.Owner] },
      ]
    },
    {
      title: 'الإعدادات',
      roles: [UserRole.Owner],
      items: [
        { label: 'إعدادات الصالة', icon: 'pi-cog', route: '/owner/gym-settings', roles: [UserRole.Owner] },
      ]
    }
  ];

  get visibleNavGroups(): NavGroup[] {
    return this.navGroups.filter(group => {
      if (!group.roles) return true;
      return this.authService.hasRole(group.roles);
    });
  }

  canShowItem(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.authService.hasRole(item.roles);
  }
}
