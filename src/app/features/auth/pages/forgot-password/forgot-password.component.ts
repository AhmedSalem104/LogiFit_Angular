import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BrandingService } from '../../../../core/services/branding.service';
import { TenantResponse } from '../../../../core/auth/models/auth.models';

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

      <h2>نسيت كلمة المرور؟</h2>
      <p class="subtitle">اختر صالتك وأدخل رقم هاتفك لإرسال رمز إعادة التعيين</p>

      <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
        <!-- Gym context -->
        @if (resolvedGymName()) {
          <div class="gym-banner">
            <i class="pi pi-building"></i>
            <div><span class="gym-banner-label">الصالة</span><b>{{ resolvedGymName() }}</b></div>
          </div>
        } @else {
          <div class="form-group">
            <label class="form-label">الصالة</label>
            <div class="input-wrapper">
              <i class="pi pi-building"></i>
              <select class="form-input form-select" formControlName="tenantId" [class.error]="isFieldInvalid('tenantId')">
                <option value="">-- اختر الصالة --</option>
                @for (tenant of tenants(); track tenant.id) {
                  <option [value]="tenant.id">{{ tenant.name }}</option>
                }
              </select>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('tenantId')">يرجى اختيار الصالة</span>
          </div>
        }

        <!-- Phone -->
        <div class="form-group">
          <label class="form-label">رقم الهاتف</label>
          <div class="input-wrapper">
            <i class="pi pi-phone"></i>
            <input type="tel" class="form-input" formControlName="phoneNumber" placeholder="01xxxxxxxxx"
              [class.error]="isFieldInvalid('phoneNumber')" />
          </div>
          <span class="error-message" *ngIf="isFieldInvalid('phoneNumber')">رقم الهاتف مطلوب</span>
        </div>

        <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
          <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
          <span *ngIf="!loading">إرسال رمز الاستعادة</span>
        </button>

        <div class="error-box" *ngIf="errorMessage">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .forgot-password-page {
      .back-link { display:inline-flex; align-items:center; gap:.5rem; color:var(--text-secondary); text-decoration:none; margin-bottom:2rem; font-size:.9rem; transition:color .2s; }
      .back-link:hover { color:#3b82f6; }
      h2 { font-size:1.75rem; font-weight:700; color:var(--text-primary); margin-bottom:.5rem; }
      .subtitle { color:var(--text-secondary); margin-bottom:2rem; line-height:1.6; }
    }
    :host-context([dir="ltr"]) .back-link i { transform:rotate(180deg); }
    .form-group { margin-bottom:1.25rem; }
    .gym-banner { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; margin-bottom:1.25rem; }
    .gym-banner > i { font-size:1.25rem; color:#3b82f6; }
    .gym-banner .gym-banner-label { display:block; font-size:.75rem; color:var(--text-secondary); }
    .gym-banner b { color:var(--text-primary); }
    .input-wrapper { position:relative; display:flex; align-items:center; }
    .input-wrapper > i:first-child { position:absolute; right:1rem; color:var(--text-muted); z-index:1; }
    .input-wrapper .form-input { padding-right:2.75rem; padding-left:2.75rem; }
    .form-select { cursor:pointer; appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:left 1rem center; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { right:auto; left:1rem; }
    :host-context([dir="ltr"]) .form-select { background-position:right 1rem center; }
    .form-input.error { border-color:#ef4444; }
    .error-message { display:block; color:#ef4444; font-size:.8rem; margin-top:.5rem; }
    .btn { display:flex; align-items:center; justify-content:center; gap:.5rem; height:48px; font-size:1rem; }
    .btn:disabled { opacity:.7; cursor:not-allowed; }
    .w-full { width:100%; }
    .error-box { display:flex; align-items:center; gap:.5rem; padding:1rem; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; color:#dc2626; margin-top:1rem; font-size:.9rem; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private branding = inject(BrandingService);

  forgotForm: FormGroup;
  loading = false;
  errorMessage = '';
  tenants = signal<TenantResponse[]>([]);
  resolvedGymName = signal<string | null>(null);

  constructor() {
    this.forgotForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const tenantId = this.branding.getResolvedTenantId();
    if (tenantId) {
      this.forgotForm.patchValue({ tenantId });
      this.resolvedGymName.set(this.branding.branding()?.name ?? 'صالتك');
    } else {
      this.authService.getTenants().subscribe({
        next: (data) => this.tenants.set(data),
        error: () => {}
      });
    }
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
    const { tenantId, phoneNumber } = this.forgotForm.value;

    this.authService.forgotPassword({ tenantId, phoneNumber }).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('تم إرسال رمز إعادة التعيين');
        // Navigate to reset screen, carrying tenant + phone (and dev resetToken if returned).
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { tenantId, phoneNumber, token: res?.resetToken ?? '' }
        });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || 'خطأ في إرسال الرمز';
      }
    });
  }
}
