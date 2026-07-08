import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="reset-password-page">
      <a routerLink="/auth/login" class="back-link">
        <i class="pi pi-arrow-right"></i>
        <span>العودة لتسجيل الدخول</span>
      </a>

      @if (!done()) {
        <h2>إعادة تعيين كلمة المرور</h2>
        <p class="subtitle">أدخل الرمز الذي وصلك وكلمة المرور الجديدة</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">رمز إعادة التعيين</label>
            <div class="input-wrapper">
              <i class="pi pi-key"></i>
              <input type="text" class="form-input" formControlName="resetToken" placeholder="أدخل الرمز"
                [class.error]="isFieldInvalid('resetToken')" />
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('resetToken')">الرمز مطلوب</span>
          </div>

          <div class="form-group">
            <label class="form-label">كلمة المرور الجديدة</label>
            <div class="input-wrapper">
              <i class="pi pi-lock"></i>
              <input [type]="showPassword ? 'text' : 'password'" class="form-input" formControlName="newPassword"
                placeholder="كلمة مرور قوية" [class.error]="isFieldInvalid('newPassword')" />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('newPassword')">
              @if (form.get('newPassword')?.errors?.['required']) { كلمة المرور مطلوبة }
              @else { 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم }
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">تأكيد كلمة المرور</label>
            <div class="input-wrapper">
              <i class="pi pi-lock"></i>
              <input [type]="showPassword ? 'text' : 'password'" class="form-input" formControlName="confirmPassword"
                placeholder="أعد كتابة كلمة المرور" [class.error]="mismatch" />
            </div>
            <span class="error-message" *ngIf="mismatch">كلمات المرور غير متطابقة</span>
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">تعيين كلمة المرور</span>
          </button>

          <div class="error-box" *ngIf="errorMessage">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      } @else {
        <div class="success-state">
          <div class="success-icon"><i class="pi pi-check"></i></div>
          <h2>تم بنجاح!</h2>
          <p>تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
          <a routerLink="/auth/login" class="btn btn-primary">تسجيل الدخول</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .reset-password-page {
      .back-link { display:inline-flex; align-items:center; gap:.5rem; color:var(--text-secondary); text-decoration:none; margin-bottom:2rem; font-size:.9rem; }
      .back-link:hover { color:#3b82f6; }
      h2 { font-size:1.75rem; font-weight:700; color:var(--text-primary); margin-bottom:.5rem; }
      .subtitle { color:var(--text-secondary); margin-bottom:2rem; line-height:1.6; }
    }
    :host-context([dir="ltr"]) .back-link i { transform:rotate(180deg); }
    .form-group { margin-bottom:1.25rem; }
    .input-wrapper { position:relative; display:flex; align-items:center; }
    .input-wrapper > i:first-child { position:absolute; right:1rem; color:var(--text-muted); z-index:1; }
    .input-wrapper .form-input { padding-right:2.75rem; padding-left:2.75rem; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { right:auto; left:1rem; }
    .form-input.error { border-color:#ef4444; }
    .toggle-password { position:absolute; left:1rem; background:none; border:none; color:var(--text-muted); cursor:pointer; padding:.25rem; }
    :host-context([dir="ltr"]) .toggle-password { left:auto; right:1rem; }
    .error-message { display:block; color:#ef4444; font-size:.8rem; margin-top:.5rem; }
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; height:48px; font-size:1rem; text-decoration:none; }
    .btn:disabled { opacity:.7; cursor:not-allowed; }
    .w-full { width:100%; }
    .error-box { display:flex; align-items:center; gap:.5rem; padding:1rem; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; color:#dc2626; margin-top:1rem; font-size:.9rem; }
    .success-state { text-align:center; }
    .success-state .success-icon { width:80px; height:80px; background:#dcfce7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .success-state .success-icon i { font-size:2rem; color:#16a34a; }
    .success-state p { color:var(--text-secondary); margin-bottom:2rem; line-height:1.6; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';
  done = signal(false);

  private tenantId = '';
  private subdomain = '';
  private phoneNumber = '';

  constructor() {
    this.form = this.fb.group({
      resetToken: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.tenantId = q.get('tenantId') ?? '';
    this.subdomain = q.get('subdomain') ?? '';
    this.phoneNumber = q.get('phoneNumber') ?? '';
    const token = q.get('token');
    if (token) this.form.patchValue({ resetToken: token });

    // If arrived without context, send the user back to request a code.
    if ((!this.tenantId && !this.subdomain) || !this.phoneNumber) {
      this.notification.warn('يرجى طلب رمز إعادة التعيين أولاً');
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  get mismatch(): boolean {
    const p = this.form.get('newPassword')?.value;
    const c = this.form.get('confirmPassword')?.value;
    return p && c && p !== c;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.mismatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { resetToken, newPassword } = this.form.value;

    this.authService.resetPassword({
      tenantId: this.tenantId,
      subdomain: this.subdomain,
      phoneNumber: this.phoneNumber,
      resetToken,
      newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.done.set(true);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || 'الرمز غير صحيح أو منتهي';
      }
    });
  }
}
