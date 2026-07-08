import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BrandingService } from '../../../../core/services/branding.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="forgot-password-page">
      <a routerLink="/auth/login" class="back-link">
        <i class="pi pi-arrow-right"></i>
        <span>العودة لتسجيل الدخول</span>
      </a>

      <h2>نسيت كلمة المرور؟</h2>
      <p class="subtitle">حدّد صالتك وأدخل رقم هاتفك لإرسال رمز إعادة التعيين</p>

      @if (!tenantResolved()) {
        <form (ngSubmit)="resolveGym()">
          <div class="form-group">
            <label class="form-label">معرّف صالتك (subdomain)</label>
            <div class="input-wrapper">
              <i class="pi pi-building"></i>
              <input type="text" class="form-input" [(ngModel)]="gymSubdomain" name="gymSubdomain"
                placeholder="مثال: goldgym" [class.error]="!!resolveError()" autocapitalize="off" autocomplete="off" />
            </div>
            <span class="error-message" *ngIf="resolveError()">{{ resolveError() }}</span>
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="resolving() || !gymSubdomain.trim()">
            <i class="pi pi-spin pi-spinner" *ngIf="resolving()"></i>
            <span *ngIf="!resolving()">متابعة</span>
          </button>
        </form>
      } @else {
        <div class="gym-banner">
          <i class="pi pi-building"></i>
          <div><span class="gym-banner-label">الصالة</span><b>{{ resolvedGymName() }}</b></div>
          <button type="button" class="change-gym" (click)="changeGym()" *ngIf="canChangeGym()">تغيير</button>
        </div>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
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
      }
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
    .gym-banner .change-gym { margin-inline-start:auto; background:none; border:none; color:#3b82f6; cursor:pointer; font-size:.85rem; font-weight:600; }
    .gym-banner .change-gym:hover { text-decoration:underline; }
    .input-wrapper { position:relative; display:flex; align-items:center; }
    .input-wrapper > i:first-child { position:absolute; right:1rem; color:var(--text-muted); z-index:1; }
    .input-wrapper .form-input { padding-right:2.75rem; padding-left:2.75rem; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { right:auto; left:1rem; }
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

  tenantResolved = signal(false);
  resolvedGymName = signal<string | null>(null);
  gymSubdomain = '';
  resolving = signal(false);
  resolveError = signal<string | null>(null);
  private fromSubdomain = false;
  private tenantId = '';

  constructor() {
    this.forgotForm = this.fb.group({
      phoneNumber: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const b = this.branding.branding();
    if (b?.tenantId) {
      this.tenantId = b.tenantId;
      this.resolvedGymName.set(b.name || 'صالتك');
      this.tenantResolved.set(true);
      this.fromSubdomain = !!this.branding.resolveIdentifier();
    } else {
      this.branding.clearResolvedTenant();
    }
  }

  canChangeGym(): boolean { return !this.fromSubdomain; }

  resolveGym(): void {
    const sub = this.gymSubdomain.trim();
    if (!sub) return;
    this.resolving.set(true);
    this.resolveError.set(null);
    this.branding.resolveBySubdomain(sub).subscribe({
      next: (b) => {
        this.resolving.set(false);
        this.tenantId = b.tenantId;
        this.resolvedGymName.set(b.name || 'صالتك');
        this.tenantResolved.set(true);
      },
      error: (err) => {
        this.resolving.set(false);
        this.resolveError.set(err?.status === 404
          ? 'لا توجد صالة بهذا المعرّف. تأكد من الكتابة الصحيحة.'
          : (err?.translatedMessage || 'تعذّر العثور على الصالة'));
      }
    });
  }

  changeGym(): void {
    this.branding.clearResolvedTenant();
    this.tenantResolved.set(false);
    this.resolvedGymName.set(null);
    this.tenantId = '';
    this.errorMessage = '';
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
    const { phoneNumber } = this.forgotForm.value;

    this.authService.forgotPassword({ tenantId: this.tenantId, phoneNumber }).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('تم إرسال رمز إعادة التعيين');
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { tenantId: this.tenantId, phoneNumber, token: res?.resetToken ?? '' }
        });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || 'خطأ في إرسال الرمز';
      }
    });
  }
}
