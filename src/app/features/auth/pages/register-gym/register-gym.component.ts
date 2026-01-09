import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register-gym',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="register-page">
      <h2>تسجيل صالة جديدة</h2>
      <p class="subtitle">أنشئ حسابك وابدأ إدارة صالتك الرياضية</p>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <!-- Gym Name -->
        <div class="form-group">
          <label class="form-label">اسم الصالة</label>
          <div class="input-wrapper">
            <i class="pi pi-building"></i>
            <input
              type="text"
              class="form-input"
              formControlName="gymName"
              placeholder="اسم الصالة الرياضية"
              [class.error]="isFieldInvalid('gymName')"
            />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('gymName')">
            اسم الصالة مطلوب
          </span>
        </div>

        <!-- Owner Name -->
        <div class="form-group">
          <label class="form-label">اسم المالك</label>
          <div class="input-wrapper">
            <i class="pi pi-user"></i>
            <input
              type="text"
              class="form-input"
              formControlName="ownerName"
              placeholder="الاسم الكامل"
              [class.error]="isFieldInvalid('ownerName')"
            />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('ownerName')">
            اسم المالك مطلوب
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
          [disabled]="loading || registerForm.invalid"
        >
          <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
          <span *ngIf="!loading">تسجيل الصالة</span>
        </button>

        <!-- Error Message -->
        <div class="error-box" *ngIf="errorMessage">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Login Link -->
      <div class="login-link">
        <span>لديك حساب بالفعل؟</span>
        <a routerLink="/auth/login">تسجيل الدخول</a>
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

    .form-group {
      margin-bottom: 1rem;
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

    .login-link {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
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

    :host-context([dir="ltr"]) .login-link a {
      margin-right: 0;
      margin-left: 0.25rem;
    }
  `]
})
export class RegisterGymComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      gymName: ['', [Validators.required]],
      ownerName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
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
    if (this.registerForm.invalid || this.passwordMismatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { gymName, ownerName, email, phoneNumber, password } = this.registerForm.value;

    this.authService.registerGym({
      gymName,
      ownerName,
      email,
      phoneNumber,
      password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('تم تسجيل الصالة بنجاح، يرجى تسجيل الدخول');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || error.error?.title || 'خطأ في التسجيل';
      }
    });
  }
}
