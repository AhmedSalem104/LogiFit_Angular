import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BrandingService } from '../../../../core/services/branding.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="register-page">
      <h2>إنشاء حساب جديد</h2>
      <p class="subtitle">سجّل كمتدرب في صالتك الرياضية</p>

      <!-- STEP 1: resolve the gym -->
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
        <!-- STEP 2: account details -->
        <div class="gym-banner">
          <i class="pi pi-building"></i>
          <div><span class="gym-banner-label">الصالة</span><b>{{ resolvedGymName() }}</b></div>
          <button type="button" class="change-gym" (click)="changeGym()" *ngIf="canChangeGym()">تغيير</button>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">الاسم الكامل</label>
            <div class="input-wrapper">
              <i class="pi pi-user"></i>
              <input type="text" class="form-input" formControlName="fullName" placeholder="الاسم الكامل"
                [class.error]="isFieldInvalid('fullName')" />
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('fullName')">الاسم الكامل مطلوب</span>
          </div>

          <div class="form-group">
            <label class="form-label">البريد الإلكتروني</label>
            <div class="input-wrapper">
              <i class="pi pi-envelope"></i>
              <input type="email" class="form-input" formControlName="email" placeholder="example@email.com"
                [class.error]="isFieldInvalid('email')" />
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('email')">
              @if (registerForm.get('email')?.errors?.['required']) { البريد الإلكتروني مطلوب }
              @else { البريد الإلكتروني غير صالح }
            </span>
          </div>

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
                placeholder="كلمة مرور قوية" [class.error]="isFieldInvalid('password')" />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('password')">
              @if (registerForm.get('password')?.errors?.['required']) { كلمة المرور مطلوبة }
              @else { 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم }
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">تأكيد كلمة المرور</label>
            <div class="input-wrapper">
              <i class="pi pi-lock"></i>
              <input [type]="showConfirmPassword ? 'text' : 'password'" class="form-input" formControlName="confirmPassword"
                placeholder="أعد كتابة كلمة المرور" [class.error]="isFieldInvalid('confirmPassword') || passwordMismatch" />
              <button type="button" class="toggle-password" (click)="showConfirmPassword = !showConfirmPassword">
                <i [class]="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('confirmPassword')">تأكيد كلمة المرور مطلوب</span>
            <span class="error-message" *ngIf="passwordMismatch && !isFieldInvalid('confirmPassword')">كلمات المرور غير متطابقة</span>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="acceptTerms" />
              <span>أوافق على <a href="#" class="terms-link">الشروط والأحكام</a></span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading || registerForm.invalid">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">إنشاء الحساب</span>
          </button>

          <div class="error-box" *ngIf="errorMessage">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      }

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
      h2 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
      .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
    }
    .gym-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 1rem; }
    .gym-banner > i { font-size: 1.25rem; color: #3b82f6; }
    .gym-banner .gym-banner-label { display: block; font-size: 0.75rem; color: var(--text-secondary); }
    .gym-banner b { color: var(--text-primary); }
    .gym-banner .change-gym { margin-inline-start: auto; background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
    .gym-banner .change-gym:hover { text-decoration: underline; }
    .form-group { margin-bottom: 1rem; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-wrapper > i:first-child { position: absolute; right: 1rem; color: var(--text-muted); z-index: 1; }
    .input-wrapper .form-input { padding-right: 2.75rem; padding-left: 2.75rem; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { right: auto; left: 1rem; }
    .form-input.error { border-color: #ef4444; }
    .toggle-password { position: absolute; left: 1rem; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; }
    .toggle-password:hover { color: var(--text-secondary); }
    :host-context([dir="ltr"]) .toggle-password { left: auto; right: 1rem; }
    .error-message { display: block; color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-secondary); font-size: 0.9rem; }
    .checkbox-label input { width: 1rem; height: 1rem; accent-color: #3b82f6; }
    .terms-link { color: #3b82f6; text-decoration: none; }
    .terms-link:hover { text-decoration: underline; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 48px; font-size: 1rem; margin-top: 1.5rem; }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .w-full { width: 100%; }
    .error-box { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; margin-top: 1rem; font-size: 0.9rem; }
    .auth-links { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; text-align: center; }
    .login-link, .gym-link { color: var(--text-secondary); }
    .login-link a, .gym-link a { color: #3b82f6; text-decoration: none; font-weight: 500; margin-inline-start: 0.25rem; }
    .login-link a:hover, .gym-link a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private branding = inject(BrandingService);

  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  tenantResolved = signal(false);
  resolvedGymName = signal<string | null>(null);
  gymSubdomain = '';
  resolving = signal(false);
  resolveError = signal<string | null>(null);
  private fromSubdomain = false;
  private subdomain = '';

  constructor() {
    this.registerForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    const b = this.branding.branding();
    if (b?.tenantId) {
      this.subdomain = b.subdomain || this.branding.resolveIdentifier() || '';
      this.applyTenant(b.tenantId, b.name);
      this.fromSubdomain = !!this.branding.resolveIdentifier();
    } else {
      this.branding.clearResolvedTenant();
      this.tenantResolved.set(false);
    }
  }

  canChangeGym(): boolean { return !this.fromSubdomain; }

  private applyTenant(tenantId: string, name?: string): void {
    this.registerForm.patchValue({ tenantId });
    this.resolvedGymName.set(name || 'صالتك');
    this.tenantResolved.set(true);
  }

  resolveGym(): void {
    const sub = this.gymSubdomain.trim();
    if (!sub) return;
    this.resolving.set(true);
    this.resolveError.set(null);
    this.branding.resolveBySubdomain(sub).subscribe({
      next: (b) => { this.resolving.set(false); this.subdomain = b.subdomain || sub; this.applyTenant(b.tenantId, b.name); },
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
    this.registerForm.patchValue({ tenantId: '' });
    this.errorMessage = '';
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
    const { tenantId, fullName, email, phoneNumber, password } = this.registerForm.value;

    // Backend always creates a Client account from public registration.
    this.authService.register({
      tenantId, subdomain: this.subdomain, fullName, email, phoneNumber, password, confirmPassword: password
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.notification.success('تم إنشاء حسابك بنجاح');
        this.router.navigate([this.authService.getRedirectUrlForRole(response.role)]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.translatedMessage || error.error?.message || 'خطأ في التسجيل';
      }
    });
  }
}
