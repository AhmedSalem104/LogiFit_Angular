import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeState } from '../../../state/theme.state';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout">
      <!-- Theme Toggle -->
      <div class="auth-actions">
        <button
          class="action-btn"
          (click)="themeState.toggleLanguage()"
          [title]="themeState.language() === 'ar' ? 'Switch to English' : 'التبديل للعربية'"
        >
          <span>{{ themeState.language() === 'ar' ? 'EN' : 'ع' }}</span>
        </button>
        <button
          class="action-btn"
          (click)="themeState.toggleDarkMode()"
          [title]="themeState.darkMode() ? 'الوضع الفاتح' : 'الوضع الداكن'"
        >
          <i [class]="themeState.darkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
        </button>
      </div>

      <!-- Left Side - Branding -->
      <div class="auth-branding">
        <div class="branding-content">
          <div class="logo">
            <i class="pi pi-bolt"></i>
            <span>LogicFit</span>
          </div>
          <h1>نظام إدارة الصالات الرياضية</h1>
          <p>إدارة شاملة للمدربين والعملاء والاشتراكات وبرامج التمارين والخطط الغذائية</p>

          <div class="features">
            <div class="feature">
              <i class="pi pi-users"></i>
              <span>إدارة العملاء والمدربين</span>
            </div>
            <div class="feature">
              <i class="pi pi-calendar"></i>
              <span>برامج تمارين مخصصة</span>
            </div>
            <div class="feature">
              <i class="pi pi-apple"></i>
              <span>خطط غذائية متكاملة</span>
            </div>
            <div class="feature">
              <i class="pi pi-chart-bar"></i>
              <span>تقارير وإحصائيات شاملة</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="auth-form-container">
        <div class="auth-form-wrapper">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      position: relative;
    }

    .auth-actions {
      position: fixed;
      top: 1.5rem;
      left: 1.5rem;
      display: flex;
      gap: 0.5rem;
      z-index: 100;
    }

    :host-context([dir="rtl"]) .auth-actions {
      left: auto;
      right: 1.5rem;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s ease;
      font-weight: 600;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .auth-branding {
      flex: 1;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -30%;
        width: 60%;
        height: 60%;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      }
    }

    .branding-content {
      color: white;
      text-align: center;
      max-width: 500px;
      position: relative;
      z-index: 1;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2rem;

      i {
        font-size: 2.5rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 1rem;
        border-radius: 16px;
      }

      span {
        font-size: 2.5rem;
        font-weight: 700;
      }
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    p {
      font-size: 1rem;
      opacity: 0.9;
      line-height: 1.7;
      margin-bottom: 3rem;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      text-align: right;
    }

    :host-context([dir="ltr"]) .features {
      text-align: left;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }

      i {
        font-size: 1.25rem;
      }

      span {
        font-size: 0.9rem;
      }
    }

    .auth-form-container {
      width: 500px;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .auth-form-wrapper {
      width: 100%;
      max-width: 400px;
    }

    @media (max-width: 1024px) {
      .auth-layout {
        flex-direction: column;
      }

      .auth-branding {
        padding: 2rem;
        min-height: 40vh;
      }

      h1 {
        font-size: 1.5rem;
      }

      .features {
        display: none;
      }

      .auth-form-container {
        width: 100%;
        flex: 1;
        padding: 2rem;
      }
    }

    @media (max-width: 480px) {
      .auth-branding {
        padding: 1.5rem;
        min-height: 30vh;
      }

      .logo {
        i {
          font-size: 2rem;
          padding: 0.75rem;
        }

        span {
          font-size: 2rem;
        }
      }

      h1 {
        font-size: 1.25rem;
      }

      p {
        display: none;
      }

      .auth-form-container {
        padding: 1.5rem;
      }
    }
  `]
})
export class AuthLayoutComponent {
  themeState = inject(ThemeState);
}
