import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="forgot-password-page">
      <a routerLink="/auth/login" class="back-link">
        <i class="pi pi-arrow-right"></i>
        <span>العودة لتسجيل الدخول</span>
      </a>

      @if (!emailSent) {
        <h2>نسيت كلمة المرور؟</h2>
        <p class="subtitle">أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور</p>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
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
              @if (forgotForm.get('email')?.errors?.['required']) {
                البريد الإلكتروني مطلوب
              } @else {
                البريد الإلكتروني غير صالح
              }
            </span>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary w-full"
            [disabled]="loading"
          >
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">إرسال رابط الاستعادة</span>
          </button>

          <!-- Error Message -->
          <div class="error-box" *ngIf="errorMessage">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      } @else {
        <div class="success-state">
          <div class="success-icon">
            <i class="pi pi-check"></i>
          </div>
          <h2>تم إرسال الرابط!</h2>
          <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.</p>
          <button class="btn btn-secondary" (click)="resetForm()">
            إرسال مرة أخرى
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .forgot-password-page {
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        text-decoration: none;
        margin-bottom: 2rem;
        font-size: 0.9rem;
        transition: color 0.2s;

        &:hover {
          color: #3b82f6;
        }
      }

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin-bottom: 2rem;
        line-height: 1.6;
      }
    }

    :host-context([dir="ltr"]) .back-link {
      i {
        transform: rotate(180deg);
      }
    }

    .form-group {
      margin-bottom: 1.5rem;
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
      }
    }

    :host-context([dir="ltr"]) {
      .input-wrapper {
        > i:first-child {
          right: auto;
          left: 1rem;
        }

        .form-input {
          padding-right: 1rem;
          padding-left: 2.75rem;
        }
      }
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.5rem;
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

    .success-state {
      text-align: center;

      .success-icon {
        width: 80px;
        height: 80px;
        background: #dcfce7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;

        i {
          font-size: 2rem;
          color: #16a34a;
        }
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-tertiary);
        }
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  forgotForm: FormGroup;
  loading = false;
  errorMessage = '';
  emailSent = false;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.forgotForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email } = this.forgotForm.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.emailSent = true;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || 'خطأ في إرسال الرابط';
      }
    });
  }

  resetForm(): void {
    this.emailSent = false;
    this.forgotForm.reset();
  }
}
