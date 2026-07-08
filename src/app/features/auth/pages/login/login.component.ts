import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BrandingService } from '../../../../core/services/branding.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="login-page">
      <h2>مرحباً بعودتك</h2>
      <p class="subtitle">سجل دخولك للوصول إلى لوحة التحكم</p>

      <!-- STEP 1: resolve the gym (only when not on a branded subdomain) -->
      @if (!tenantResolved()) {
        <form (ngSubmit)="resolveGym()">
          <div class="form-group">
            <label class="form-label">معرّف صالتك (subdomain)</label>
            <div class="input-wrapper">
              <i class="pi pi-building"></i>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="gymSubdomain"
                name="gymSubdomain"
                placeholder="مثال: goldgym"
                [class.error]="!!resolveError()"
                autocapitalize="off"
                autocomplete="off"
              />
            </div>
            <span class="hint">اكتب المعرّف الذي حصلت عليه عند تسجيل صالتك</span>
            <span class="error-message" *ngIf="resolveError()">{{ resolveError() }}</span>
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="resolving() || !gymSubdomain.trim()">
            <i class="pi pi-spin pi-spinner" *ngIf="resolving()"></i>
            <span *ngIf="!resolving()">متابعة</span>
          </button>
        </form>
      } @else {
        <!-- STEP 2: credentials -->
        <div class="gym-banner">
          <i class="pi pi-building"></i>
          <div>
            <span class="gym-banner-label">الصالة</span>
            <b>{{ resolvedGymName() }}</b>
          </div>
          <button type="button" class="change-gym" (click)="changeGym()" *ngIf="canChangeGym()">تغيير</button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">رقم الهاتف</label>
            <div class="input-wrapper">
              <i class="pi pi-phone"></i>
              <input type="tel" class="form-input" formControlName="phoneNumber" placeholder="01xxxxxxxxx"
                [class.error]="isFieldInvalid('phoneNumber')" />
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('phoneNumber')">رقم الهاتف مطلوب</span>
          </div>

          <div class="form-group">
            <label class="form-label">كلمة المرور</label>
            <div class="input-wrapper">
              <i class="pi pi-lock"></i>
              <input [type]="showPassword ? 'text' : 'password'" class="form-input" formControlName="password"
                placeholder="أدخل كلمة المرور" [class.error]="isFieldInvalid('password')" />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('password')">كلمة المرور مطلوبة</span>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" />
              <span>تذكرني</span>
            </label>
            <a routerLink="/auth/forgot-password" class="forgot-link">نسيت كلمة المرور؟</a>
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">تسجيل الدخول</span>
          </button>

          <div class="error-box" *ngIf="errorMessage">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      }

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
      h2 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
      .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
    }
    .form-group { margin-bottom: 1.25rem; }
    .gym-banner {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem;
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 10px; margin-bottom: 1.25rem;
    }
    .gym-banner > i { font-size: 1.25rem; color: #3b82f6; }
    .gym-banner .gym-banner-label { display: block; font-size: 0.75rem; color: var(--text-secondary); }
    .gym-banner b { color: var(--text-primary); }
    .gym-banner .change-gym {
      margin-inline-start: auto; background: none; border: none; color: #3b82f6;
      cursor: pointer; font-size: 0.85rem; font-weight: 600;
    }
    .gym-banner .change-gym:hover { text-decoration: underline; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-wrapper > i:first-child { position: absolute; right: 1rem; color: var(--text-muted); z-index: 1; }
    .input-wrapper .form-input { padding-right: 2.75rem; padding-left: 2.75rem; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { right: auto; left: 1rem; }
    .form-input.error { border-color: #ef4444; }
    .toggle-password { position: absolute; left: 1rem; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; }
    .toggle-password:hover { color: var(--text-secondary); }
    :host-context([dir="ltr"]) .toggle-password { left: auto; right: 1rem; }
    .error-message { display: block; color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; }
    .hint { display: block; color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem; }
    .form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-secondary); font-size: 0.9rem; }
    .checkbox-label input { width: 1rem; height: 1rem; accent-color: #3b82f6; }
    .forgot-link { color: #3b82f6; text-decoration: none; font-size: 0.9rem; }
    .forgot-link:hover { text-decoration: underline; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 48px; font-size: 1rem; }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .w-full { width: 100%; }
    .error-box { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; margin-top: 1rem; font-size: 0.9rem; }
    .auth-links { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; text-align: center; }
    .register-link, .gym-link { color: var(--text-secondary); }
    .register-link a, .gym-link a { color: #3b82f6; text-decoration: none; font-weight: 500; margin-inline-start: 0.25rem; }
    .register-link a:hover, .gym-link a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private branding = inject(BrandingService);

  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';

  // Gym resolution state
  tenantResolved = signal(false);
  resolvedGymName = signal<string | null>(null);
  gymSubdomain = '';
  resolving = signal(false);
  resolveError = signal<string | null>(null);
  private fromSubdomain = false; // true when tenant came from the URL (can't change)
  private subdomain = '';        // gym subdomain sent alongside tenantId

  constructor() {
    this.loginForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Only trust a tenant that came from ACTUAL branding (subdomain), never a stale
    // value left in storage by a previous backend/session.
    const b = this.branding.branding();
    if (b?.tenantId) {
      this.subdomain = b.subdomain || this.branding.resolveIdentifier() || '';
      this.applyTenant(b.tenantId, b.name);
      this.fromSubdomain = !!this.branding.resolveIdentifier();
    } else {
      // Non-branded host → ask the user for their gym subdomain.
      this.branding.clearResolvedTenant();
      this.tenantResolved.set(false);
    }
  }

  canChangeGym(): boolean {
    return !this.fromSubdomain;
  }

  private applyTenant(tenantId: string, name?: string): void {
    this.loginForm.patchValue({ tenantId });
    this.resolvedGymName.set(name || 'صالتك');
    this.tenantResolved.set(true);
  }

  resolveGym(): void {
    const sub = this.gymSubdomain.trim();
    if (!sub) return;
    this.resolving.set(true);
    this.resolveError.set(null);

    this.branding.resolveBySubdomain(sub).subscribe({
      next: (b) => {
        this.resolving.set(false);
        this.subdomain = b.subdomain || sub;
        this.applyTenant(b.tenantId, b.name);
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
    this.loginForm.patchValue({ tenantId: '' });
    this.errorMessage = '';
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

    this.authService.login({ tenantId, phoneNumber, password, subdomain: this.subdomain }).subscribe({
      next: (response) => {
        this.loading = false;
        this.notification.success('تم تسجيل الدخول بنجاح');
        const redirectUrl = this.authService.getRedirectUrlForRole(response.role);
        setTimeout(() => this.router.navigateByUrl(redirectUrl), 100);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || error.error?.message || 'خطأ في تسجيل الدخول';
      }
    });
  }
}
