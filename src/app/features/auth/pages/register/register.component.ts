import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TenantResponse, UserRoleValues } from '../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="register-page">
      <h2>إنشاء حساب جديد</h2>
      <p class="subtitle">سجل كمدرب أو متدرب في صالتك الرياضية</p>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <!-- Account Type Selection -->
        <div class="form-group">
          <label class="form-label">نوع الحساب</label>
          <div class="role-selection">
            <button
              type="button"
              class="role-btn"
              [class.active]="selectedRole() === 'coach'"
              (click)="selectRole('coach')"
            >
              <i class="pi pi-user-edit"></i>
              <span>مدرب</span>
            </button>
            <button
              type="button"
              class="role-btn"
              [class.active]="selectedRole() === 'client'"
              (click)="selectRole('client')"
            >
              <i class="pi pi-user"></i>
              <span>متدرب</span>
            </button>
          </div>
        </div>

        <!-- Gym Selection -->
        <div class="form-group">
          <label class="form-label">الصالة الرياضية</label>
          <div class="input-wrapper">
            <i class="pi pi-building"></i>
            <select
              class="form-input form-select"
              formControlName="tenantId"
              [class.error]="isFieldInvalid('tenantId')"
            >
              <option value="">اختر الصالة</option>
              @for (tenant of tenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.name }}</option>
              }
            </select>
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('tenantId')">
            يرجى اختيار الصالة
          </span>
          <span class="hint" *ngIf="tenantsLoading()">جاري تحميل الصالات...</span>
        </div>

        <!-- Full Name -->
        <div class="form-group">
          <label class="form-label">الاسم الكامل</label>
          <div class="input-wrapper">
            <i class="pi pi-user"></i>
            <input
              type="text"
              class="form-input"
              formControlName="fullName"
              placeholder="الاسم الكامل"
              [class.error]="isFieldInvalid('fullName')"
            />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('fullName')">
            الاسم الكامل مطلوب
          </span>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label class="form-label">البريد الإلكتروني</label>
          <div class="input-wrapper">
            <i class="pi pi-envelope"></i>
            <input
              type="email"
              class="form-input"
              formControlName="email"
              placeholder="example@email.com"
              [class.error]="isFieldInvalid('email')"
            />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('email')">
            @if (registerForm.get('email')?.errors?.['required']) {
              البريد الإلكتروني مطلوب
            } @else {
              البريد الإلكتروني غير صالح
            }
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
              placeholder="كلمة مرور قوية"
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
            @if (registerForm.get('password')?.errors?.['required']) {
              كلمة المرور مطلوبة
            } @else {
              كلمة المرور يجب أن تكون 6 أحرف على الأقل
            }
          </span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label class="form-label">تأكيد كلمة المرور</label>
          <div class="input-wrapper">
            <i class="pi pi-lock"></i>
            <input
              [type]="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              formControlName="confirmPassword"
              placeholder="أعد كتابة كلمة المرور"
              [class.error]="isFieldInvalid('confirmPassword') || passwordMismatch"
            />
            <button
              type="button"
              class="toggle-password"
              (click)="showConfirmPassword = !showConfirmPassword"
            >
              <i [class]="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('confirmPassword')">
            تأكيد كلمة المرور مطلوب
          </span>
          <span class="error-message" *ngIf="passwordMismatch && !isFieldInvalid('confirmPassword')">
            كلمات المرور غير متطابقة
          </span>
        </div>

        <!-- Terms -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="acceptTerms" />
            <span>أوافق على <a href="#" class="terms-link">الشروط والأحكام</a></span>
          </label>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="btn btn-primary w-full"
          [disabled]="loading || registerForm.invalid || !selectedRole()"
        >
          <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
          <span *ngIf="!loading">إنشاء الحساب</span>
        </button>

        <!-- Error Message -->
        <div class="error-box" *ngIf="errorMessage">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Links -->
      <div class="auth-links">
        <div class="login-link">
          <span>لديك حساب بالفعل؟</span>
          <a routerLink="/auth/login">تسجيل الدخول</a>
        </div>
        <div class="gym-link">
          <span>تريد تسجيل صالة جديدة؟</span>
          <a routerLink="/auth/register-gym">سجل صالتك</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
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

    .role-selection {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .role-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      i {
        font-size: 1.5rem;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      &:hover {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.05);
      }

      &.active {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);

        i {
          color: #3b82f6;
        }
      }
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: left 1rem center;
      padding-left: 2.5rem !important;
    }

    :host-context([dir="ltr"]) .form-select {
      background-position: right 1rem center;
      padding-left: 2.75rem !important;
      padding-right: 2.5rem !important;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      > i:first-child {
        position: absolute;
        right: 1rem;
        color: var(--text-muted);
      }

      .form-input {
        padding-right: 2.75rem;
        padding-left: 2.75rem;
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

    .hint {
      display: block;
      color: var(--text-muted);
      font-size: 0.8rem;
      margin-top: 0.5rem;
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

    .terms-link {
      color: #3b82f6;
      text-decoration: none;

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
      margin-top: 1.5rem;

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

    .login-link, .gym-link {
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

    :host-context([dir="ltr"]) .login-link a,
    :host-context([dir="ltr"]) .gym-link a {
      margin-right: 0;
      margin-left: 0.25rem;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  tenants = signal<TenantResponse[]>([]);
  tenantsLoading = signal(false);
  selectedRole = signal<'coach' | 'client' | null>(null);

  constructor() {
    this.registerForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.tenantsLoading.set(true);
    this.authService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants.set(tenants);
        this.tenantsLoading.set(false);
      },
      error: () => {
        this.tenantsLoading.set(false);
      }
    });
  }

  selectRole(role: 'coach' | 'client'): void {
    this.selectedRole.set(role);
  }

  get passwordMismatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch || !this.selectedRole()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { tenantId, fullName, email, phoneNumber, password } = this.registerForm.value;
    const role = this.selectedRole() === 'coach' ? UserRoleValues.Coach : UserRoleValues.Client;

    this.authService.register({
      tenantId,
      fullName,
      email,
      phoneNumber,
      password,
      confirmPassword: password,
      role
    }).subscribe({
      next: () => {
        this.loading = false;
        const roleText = this.selectedRole() === 'coach' ? 'مدرب' : 'متدرب';
        this.notification.success(`تم تسجيلك كـ ${roleText} بنجاح`);
        // Navigate to appropriate dashboard based on role
        const redirectUrl = this.authService.getRedirectUrl();
        this.router.navigate([redirectUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || error.error?.title || 'خطأ في التسجيل';
      }
    });
  }
}
