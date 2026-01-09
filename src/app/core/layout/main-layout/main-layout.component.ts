import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { ThemeState } from '../../../state/theme.state';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout" [class.sidebar-collapsed]="themeState.sidebarCollapsed()">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content -->
      <div class="main-wrapper">
        <!-- Header -->
        <app-header></app-header>

        <!-- Page Content -->
        <main class="main-content">
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Mobile Overlay -->
      @if (showMobileOverlay) {
        <div class="mobile-overlay" (click)="themeState.toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    /* ========================================
       Layout Container
       ======================================== */
    .layout {
      min-height: 100vh;
      background: var(--bg-secondary);
      transition: background-color 0.3s ease;
    }

    /* ========================================
       Main Wrapper
       ======================================== */
    .main-wrapper {
      margin-right: 280px;
      min-height: 100vh;
      transition: margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-collapsed .main-wrapper {
      margin-right: 80px;
    }

    :host-context([dir="ltr"]) .main-wrapper {
      margin-right: 0;
      margin-left: 280px;
    }

    :host-context([dir="ltr"]) .sidebar-collapsed .main-wrapper {
      margin-left: 80px;
    }

    /* ========================================
       Main Content
       ======================================== */
    .main-content {
      padding-top: 72px;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .content-container {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ========================================
       Mobile Overlay
       ======================================== */
    .mobile-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    }

    /* ========================================
       Responsive Styles
       ======================================== */
    @media (max-width: 1024px) {
      .main-wrapper {
        margin-right: 0 !important;
        margin-left: 0 !important;
      }

      .mobile-overlay {
        display: block;
      }

      .sidebar-collapsed .mobile-overlay {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding-top: 64px;
      }

      .content-container {
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .content-container {
        padding: 0.75rem;
      }
    }
  `]
})
export class MainLayoutComponent {
  themeState = inject(ThemeState);

  get showMobileOverlay(): boolean {
    return !this.themeState.sidebarCollapsed() && window.innerWidth <= 1024;
  }
}
