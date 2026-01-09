import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TenantResponse } from '../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <h2>مرحباً بعودتك</h2>
      <p class="subtitle">سجل دخولك للوصول إلى لوحة التحكم</p>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <!-- Gym Selection -->
        <div class="form-group">
          <label class="form-label">اختر الصالة</label>
          <div class="input-wrapper">
            <i class="pi pi-building"></i>
            <select
              class="form-input form-select"
              formControlName="tenantId"
              [class.error]="isFieldInvalid('tenantId')"
            >
              <option value="">-- اختر الصالة --</option>
              @for (tenant of tenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.name }}</option>
              }
            </select>
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('tenantId')">
            يرجى اختيار الصالة
          </span>
          <span class="loading-text" *ngIf="loadingTenants()">
            <i class="pi pi-spin pi-spinner"></i>
            جاري تحميل الصالات...
          </span>
        </div>

        <!-- Phone Number -->
        <div class="form-group">
          <label class="form-label">رقم الهاتف</label>
          <div class="input-wrapper">
            <i class="pi pi-phone"></i>
            <input
              type="tel"
              class="form-input"
              formControlName="phoneNumber"
              placeholder="01xxxxxxxxx"
              [class.error]="isFieldInvalid('phoneNumber')"
            />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('phoneNumber')">
            رقم الهاتف مطلوب
          </span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label">كلمة المرور</label>
          <div class="input-wrapper">
            <i class="pi pi-lock"></i>
            <input
              [type]="showPassword ? 'text' : 'password'"
              class="form-input"
              formControlName="password"
              placeholder="أدخل كلمة المرور"
              [class.error]="isFieldInvalid('password')"
            />
            <button
              type="button"
              class="toggle-password"
              (click)="showPassword = !showPassword"
            >
              <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('password')">
            كلمة المرور مطلوبة
          </span>
        </div>

        <!-- Remember & Forgot -->
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="rememberMe" />
            <span>تذكرني</span>
          </label>
          <a routerLink="/auth/forgot-password" class="forgot-link">
            نسيت كلمة المرور؟
          </a>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="btn btn-primary w-full"
          [disabled]="loading"
        >
          <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
          <span *ngIf="!loading">تسجيل الدخول</span>
        </button>

        <!-- Error Message -->
        <div class="error-box" *ngIf="errorMessage">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Register Links -->
      <div class="auth-links">
        <div class="register-link">
          <span>ليس لديك حساب؟</span>
          <a routerLink="/auth/register">إنشاء حساب</a>
        </div>
        <div class="gym-link">
          <span>تريد تسجيل صالة جديدة؟</span>
          <a routerLink="/auth/register-gym">سجل صالتك</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin-bottom: 2rem;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      > i:first-child {
        position: absolute;
        right: 1rem;
        color: var(--text-muted);
        z-index: 1;
      }

      .form-input {
        padding-right: 2.75rem;
        padding-left: 2.75rem;
      }

      .form-select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: left 1rem center;
      }
    }

    :host-context([dir="ltr"]) {
      .input-wrapper {
        > i:first-child {
          right: auto;
          left: 1rem;
        }

        .form-input {
          padding-right: 2.75rem;
          padding-left: 2.75rem;
        }

        .form-select {
          background-position: right 1rem center;
        }
      }
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .toggle-password {
      position: absolute;
      left: 1rem;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;

      &:hover {
        color: var(--text-secondary);
      }
    }

    :host-context([dir="ltr"]) .toggle-password {
      left: auto;
      right: 1rem;
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .loading-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.9rem;

      input {
        width: 1rem;
        height: 1rem;
        accent-color: #3b82f6;
      }
    }

    .forgot-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 0.9rem;

      &:hover {
        text-decoration: underline;
      }
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      font-size: 1rem;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .w-full {
      width: 100%;
    }

    .error-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      margin-top: 1rem;
      font-size: 0.9rem;
    }

    .auth-links {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }

    .register-link, .gym-link {
      color: var(--text-secondary);

      a {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
        margin-right: 0.25rem;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    :host-context([dir="ltr"]) .register-link a,
    :host-context([dir="ltr"]) .gym-link a {
      margin-right: 0;
      margin-left: 0.25rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loginForm: FormGroup;
  loading = false;
  loadingTenants = signal(false);
  showPassword = false;
  errorMessage = '';
  tenants = signal<TenantResponse[]>([]);

  constructor() {
    this.loginForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.loadingTenants.set(true);
    this.authService.getTenants().subscribe({
      next: (data) => {
        this.tenants.set(data);
        this.loadingTenants.set(false);
      },
      error: () => {
        this.loadingTenants.set(false);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { tenantId, phoneNumber, password } = this.loginForm.value;

    this.authService.login({ tenantId, phoneNumber, password }).subscribe({
      next: (response) => {
        this.loading = false;
        this.notification.success('تم تسجيل الدخول بنجاح');
        // Use role from response directly to avoid signal timing issues
        const redirectUrl = this.authService.getRedirectUrlForRole(response.role);

        // Small delay to allow signals to update before navigation
        setTimeout(() => {
          this.router.navigateByUrl(redirectUrl);
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || error.error?.title || 'خطأ في تسجيل الدخول';
      }
    });
  }
}
