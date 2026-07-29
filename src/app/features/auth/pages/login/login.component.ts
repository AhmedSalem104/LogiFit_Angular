import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BrandingService } from '../../../../core/services/branding.service';
import { TenantStatusService } from '../../../../core/tenant/tenant-status.service';
import { PasswordFieldComponent } from '../../../../shared/components/password-field/password-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, PasswordFieldComponent],
  template: `
    <section class="login-page" [attr.data-step]="onboardingStep" [class.access-choice-page]="isChoosingAccess()">
      @if (isChoosingAccess()) {
        <section class="access-choice" aria-labelledby="access-choice-title">
          <div class="choice-heading">
            <span class="choice-eyebrow"><i class="pi pi-compass" aria-hidden="true"></i> LogicFit</span>
            <h2 id="access-choice-title">كيف تريد المتابعة؟</h2>
            <p>اختر المسار المناسب لك. ستنتقل بعدها إلى خطوات قصيرة وواضحة، مع حفظ كل مسار بشكل مستقل.</p>
          </div>

          <div class="access-card-grid" role="list">
            <button type="button" class="access-card gym" role="listitem" (click)="chooseGymLogin()">
              <span class="access-card-icon"><i class="pi pi-building" aria-hidden="true"></i></span>
              <strong>الدخول إلى جيم</strong>
              <small>للأعضاء والموظفين والمدربين التابعين لصالة محددة.</small>
            </button>
            <button type="button" class="access-card identity" role="listitem" (click)="goToIdentityLogin()">
              <span class="access-card-icon"><i class="pi pi-id-card" aria-hidden="true"></i></span>
              <strong>الدخول بالهوية</strong>
              <small>للمدرب الحر وفريقه أو لمتابعة طلب قائم بأمان.</small>
            </button>
            <button type="button" class="access-card freelance" role="listitem" (click)="goToFreelanceRegistration()">
              <span class="access-card-icon"><i class="pi pi-briefcase" aria-hidden="true"></i></span>
              <strong>مساحة مدرب حر</strong>
              <small>أنشئ مساحة مستقلة لعملائك وبرامجك وفريقك.</small>
            </button>
            <button type="button" class="access-card owner" role="listitem" (click)="goToGymRegistration()">
              <span class="access-card-icon"><i class="pi pi-building-columns" aria-hidden="true"></i></span>
              <strong>تسجيل جيم جديد</strong>
              <small>قدّم طلب إنشاء وإدارة مساحة جيم على المنصة.</small>
            </button>
            <button type="button" class="access-card client" role="listitem" (click)="goToClientRegistration()">
              <span class="access-card-icon"><i class="pi pi-user-plus" aria-hidden="true"></i></span>
              <strong>حساب عميل جديد</strong>
              <small>أنشئ حسابك إذا تلقيت دعوة أو رابطًا من الجيم.</small>
            </button>
          </div>
        </section>
      } @else {
      <header class="flow-header">
        <div class="flow-meta">
          <span class="step-pill">الخطوة {{ onboardingStep }} من 2</span>
          <span class="step-caption">{{ tenantResolved() ? 'تحقق من بيانات الدخول' : 'حدد مساحة عملك أولاً' }}</span>
        </div>
        <div class="progress-track" aria-label="تقدم تسجيل الدخول" role="progressbar" aria-valuemin="1" aria-valuemax="2" [attr.aria-valuenow]="onboardingStep">
          <span class="progress-fill" [style.width.%]="stepProgress"></span>
        </div>
      </header>

      @if (!tenantResolved()) {
        <div class="screen-intro">
          <div class="intro-icon"><i class="pi pi-building"></i></div>
          <div>
            <h2>أين تريد الدخول؟</h2>
            <p>اكتب معرّف الصالة للوصول إلى حسابك ولوحة العمل الصحيحة.</p>
          </div>
        </div>

        @if (!manualMode()) {
          <form (ngSubmit)="resolveGym()" novalidate>
            <div class="form-group">
              <label class="form-label" for="gym-subdomain">معرّف الصالة</label>
              <div class="input-wrapper">
                <i class="pi pi-building" aria-hidden="true"></i>
                <input
                  id="gym-subdomain"
                  type="text"
                  class="form-input"
                  [(ngModel)]="gymSubdomain"
                  name="gymSubdomain"
                  placeholder="مثال: goldgym"
                  [class.error]="!!resolveError()"
                  autocapitalize="off"
                  autocomplete="organization"
                  autofocus
                />
              </div>
              <span class="hint">ستجده في رابط الصالة أو الرسالة التي وصلت إليك عند التسجيل.</span>
              <span class="error-message" *ngIf="resolveError()">{{ resolveError() }}</span>
            </div>

            <button type="submit" class="btn btn-primary w-full" [disabled]="resolving() || !gymSubdomain.trim()">
              <i class="pi pi-spin pi-spinner" *ngIf="resolving()"></i>
              <span *ngIf="!resolving()">متابعة إلى بيانات الدخول</span>
            </button>
          </form>

          @if (canReturnToAccessChoice()) {
            <button type="button" class="back-to-options" (click)="returnToAccessChoice()">
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
              اختيار طريقة دخول أخرى
            </button>
          }
          <button type="button" class="testing-link" (click)="manualMode.set(true)">
            <i class="pi pi-wrench" aria-hidden="true"></i>
            وضع الاختبار: إدخال TenantId يدوياً
          </button>
        } @else {
          <form (ngSubmit)="useManualTenant()" novalidate>
            <div class="testing-banner"><i class="pi pi-info-circle"></i> هذا المسار مخصص للاختبار فقط.</div>
            <div class="form-group">
              <label class="form-label" for="manual-tenant-id">معرّف الصالة (TenantId)</label>
              <div class="input-wrapper">
                <i class="pi pi-key" aria-hidden="true"></i>
                <input
                  id="manual-tenant-id"
                  type="text"
                  class="form-input"
                  [(ngModel)]="manualTenantId"
                  name="manualTenantId"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  [class.error]="!!manualError()"
                  autocapitalize="off"
                  autocomplete="off"
                />
              </div>
              <span class="error-message" *ngIf="manualError()">{{ manualError() }}</span>
            </div>
            <button type="submit" class="btn btn-primary w-full" [disabled]="!manualTenantId.trim()">متابعة إلى بيانات الدخول</button>
          </form>
          <button type="button" class="testing-link" (click)="manualMode.set(false)">
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
            العودة إلى معرّف الصالة
          </button>
        }
      } @else {
        <div class="screen-intro compact">
          <div class="intro-icon success"><i class="pi pi-check"></i></div>
          <div>
            <h2>أهلاً بعودتك</h2>
            <p>أدخل بياناتك لإكمال الدخول إلى مساحة العمل.</p>
          </div>
        </div>

        <div class="gym-banner">
          <i class="pi pi-building" aria-hidden="true"></i>
          <div>
            <span class="gym-banner-label">مساحة العمل المحددة</span>
            <b>{{ resolvedGymName() }}</b>
          </div>
          <button type="button" class="change-gym" (click)="changeGym()" *ngIf="canChangeGym()">تغيير</button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label class="form-label" for="phone-number">رقم الهاتف</label>
            <div class="input-wrapper">
              <i class="pi pi-phone" aria-hidden="true"></i>
              <input id="phone-number" type="tel" class="form-input" formControlName="phoneNumber" placeholder="01xxxxxxxxx"
                autocomplete="tel" [class.error]="isFieldInvalid('phoneNumber')" />
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('phoneNumber')">رقم الهاتف مطلوب</span>
          </div>

          <div class="form-group">
            <label class="form-label">كلمة المرور</label>
            <div class="input-wrapper password-wrapper">
              <app-password-field formControlName="password"></app-password-field>
            </div>
            <span class="error-message" *ngIf="isFieldInvalid('password')">كلمة المرور مطلوبة</span>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" />
              <span>تذكرني</span>
            </label>
            <button type="button" class="forgot-link" (click)="goToForgotPassword()">نسيت كلمة المرور؟</button>
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">دخول آمن إلى مساحة العمل</span>
          </button>

          <div class="error-box" *ngIf="errorMessage" role="alert">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      }
      }
    </section>
  `,
  styles: [`
    .login-page { color: var(--text-primary); }
    .access-choice { display:grid; gap:1.25rem; }.choice-heading { text-align:center; }.choice-eyebrow { align-items:center; color:var(--primary-700); display:inline-flex; font-size:.78rem; font-weight:800; gap:.4rem; margin-bottom:.7rem; }.choice-heading h2 { margin:0 0 .55rem; }.choice-heading p { color:var(--text-secondary); font-size:.9rem; line-height:1.65; margin:0 auto; max-width:34rem; }.access-card-grid { display:grid; gap:.7rem; grid-template-columns:repeat(2, minmax(0, 1fr)); }.access-card { align-items:flex-start; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:14px; color:var(--text-primary); cursor:pointer; display:grid; gap:.38rem; min-height:142px; padding:.9rem; text-align:start; transition:border-color .2s ease, box-shadow .2s ease, transform .2s ease; }.access-card:hover,.access-card:focus-visible { border-color:var(--primary-400); box-shadow:0 10px 22px color-mix(in srgb, var(--primary-500) 14%, transparent); outline:none; transform:translateY(-2px); }.access-card-icon { align-items:center; background:var(--primary-100); border-radius:10px; color:var(--primary-600); display:flex; font-size:1rem; height:34px; justify-content:center; margin-bottom:.15rem; width:34px; }.access-card strong { font-size:.84rem; }.access-card small { color:var(--text-secondary); font-size:.71rem; line-height:1.45; }.access-card.freelance .access-card-icon { background:#f3e8ff; color:#7e22ce; }.access-card.owner .access-card-icon { background:#ecfdf5; color:#047857; }.access-card.client .access-card-icon { background:#fff7ed; color:#c2410c; }.access-card.client { grid-column:1 / -1; min-height:auto; }
    .flow-header { margin-bottom: 1.8rem; }
    .flow-meta { align-items: center; display: flex; gap: .7rem; justify-content: space-between; margin-bottom: .7rem; }
    .step-pill { background: color-mix(in srgb, var(--primary-100) 65%, transparent); border-radius: 999px; color: var(--primary-700); font-size: .76rem; font-weight: 800; padding: .38rem .72rem; }
    .step-caption { color: var(--text-muted); font-size: .78rem; }
    .progress-track { background: var(--bg-tertiary); border-radius: 999px; height: 7px; overflow: hidden; width: 100%; }
    .progress-fill { background: var(--gradient-primary); border-radius: inherit; display: block; height: 100%; transition: width .35s ease; }

    .screen-intro { align-items: flex-start; display: flex; gap: .9rem; margin-bottom: 1.65rem; }
    .screen-intro.compact { margin-bottom: 1.25rem; }
    .intro-icon { align-items: center; background: var(--primary-100); border-radius: 13px; color: var(--primary-600); display: flex; flex: 0 0 auto; font-size: 1.15rem; height: 46px; justify-content: center; width: 46px; }
    .intro-icon.success { background: var(--success-100); color: var(--success-600); }
    h2 { font-size: clamp(1.55rem, 3vw, 2rem); letter-spacing: -.03em; line-height: 1.2; margin: .05rem 0 .38rem; }
    .screen-intro p { color: var(--text-secondary); font-size: .92rem; line-height: 1.6; margin: 0; }

    .form-group { margin-bottom: 1.15rem; }
    .form-label { color: var(--text-primary); display: block; font-size: .88rem; font-weight: 700; margin-bottom: .55rem; }
    .input-wrapper { align-items: center; display: flex; position: relative; }
    .input-wrapper > i:first-child { color: var(--text-muted); position: absolute; right: 1rem; z-index: 1; }
    :host-context([dir="ltr"]) .input-wrapper > i:first-child { left: 1rem; right: auto; }
    .input-wrapper .form-input { padding-inline-end: 2.8rem; }
    .password-wrapper { min-height: 48px; }
    .password-wrapper app-password-field { width: 100%; }
    .form-input.error { border-color: var(--danger-500); }
    .hint, .error-message { display: block; font-size: .78rem; line-height: 1.5; margin-top: .45rem; }
    .hint { color: var(--text-muted); }
    .error-message { color: var(--danger-600); }

    .gym-banner { align-items: center; background: color-mix(in srgb, var(--success-50) 72%, var(--bg-primary)); border: 1px solid color-mix(in srgb, var(--success-500) 30%, var(--border-color)); border-radius: 13px; display: flex; gap: .75rem; margin-bottom: 1.2rem; padding: .82rem .9rem; }
    .gym-banner > i { color: var(--success-600); font-size: 1.05rem; }
    .gym-banner > div { display: grid; gap: .15rem; }
    .gym-banner-label { color: var(--text-secondary); font-size: .7rem; }
    .gym-banner b { font-size: .9rem; }
    .change-gym { background: transparent; border: 0; color: var(--primary-600); cursor: pointer; font-size: .8rem; font-weight: 800; margin-inline-start: auto; padding: .35rem; }
    .change-gym:hover { text-decoration: underline; }

    .form-options { align-items: center; display: flex; justify-content: space-between; margin: .15rem 0 1.35rem; }
    .checkbox-label { align-items: center; color: var(--text-secondary); cursor: pointer; display: flex; font-size: .84rem; gap: .45rem; }
    .checkbox-label input { accent-color: var(--primary-600); height: 1rem; width: 1rem; }
    .forgot-link { background:transparent; border:0; color:var(--primary-600); cursor:pointer; font:inherit; font-size:.84rem; font-weight:700; padding:0; }
    .forgot-link:hover { text-decoration: underline; }
    .btn { align-items: center; border-radius: 12px; display: flex; font-size: .95rem; font-weight: 800; gap: .5rem; height: 50px; justify-content: center; transition: transform .2s ease, box-shadow .2s ease; }
    .btn:not(:disabled):hover { box-shadow: 0 10px 22px color-mix(in srgb, var(--primary-500) 25%, transparent); transform: translateY(-1px); }
    .btn:disabled { cursor: not-allowed; opacity: .68; }
    .w-full { width: 100%; }
    .error-box { align-items: center; background: var(--danger-50); border: 1px solid var(--danger-100); border-radius: 11px; color: var(--danger-600); display: flex; font-size: .84rem; gap: .55rem; line-height: 1.5; margin-top: 1rem; padding: .8rem .9rem; }

    .back-to-options,.testing-link { align-items: center; background: transparent; border: 0; color: var(--text-muted); cursor: pointer; display: flex; font-size: .76rem; gap: .4rem; justify-content: center; margin: 1rem auto 0; padding: .25rem; }
    .back-to-options { color:var(--primary-600); font-weight:700; }
    .testing-link:hover { color: var(--primary-600); }
    .testing-banner { align-items: center; background: var(--warning-50); border: 1px solid var(--warning-100); border-radius: 10px; color: var(--warning-600); display: flex; font-size: .8rem; gap: .45rem; margin-bottom: 1rem; padding: .7rem .75rem; }

    @media (max-width: 560px) {
      .flow-header { margin-bottom: 1.35rem; }
      .flow-meta { align-items: flex-start; flex-direction: column; gap: .4rem; }
      .step-caption { font-size: .73rem; }
      .screen-intro { gap: .7rem; margin-bottom: 1.25rem; }
      .intro-icon { border-radius: 11px; height: 40px; width: 40px; }
      h2 { font-size: 1.45rem; }
      .screen-intro p { font-size: .84rem; }
      .form-options { align-items: flex-start; flex-direction: column; gap: .7rem; }
      .btn { font-size: .88rem; }
      .gym-banner { align-items: flex-start; }
      .access-card-grid { grid-template-columns:1fr; }.access-card { min-height:auto; }.access-card.client { grid-column:auto; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly branding = inject(BrandingService);
  private readonly tenantStatus = inject(TenantStatusService);

  readonly loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  readonly tenantResolved = signal(false);
  readonly entryMode = signal<'choice' | 'gym'>('choice');
  readonly resolvedGymName = signal<string | null>(null);
  gymSubdomain = '';
  readonly resolving = signal(false);
  readonly resolveError = signal<string | null>(null);
  private fromSubdomain = false;
  private subdomain = '';

  readonly manualMode = signal(false);
  manualTenantId = '';
  readonly manualError = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      tenantId: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  get onboardingStep(): number {
    return this.tenantResolved() ? 2 : 1;
  }

  get stepProgress(): number {
    return this.onboardingStep * 50;
  }

  ngOnInit(): void {
    const currentBranding = this.branding.branding();
    if (currentBranding?.tenantId) {
      this.subdomain = currentBranding.subdomain || this.branding.resolveIdentifier() || '';
      this.applyTenant(currentBranding.tenantId, currentBranding.name);
      this.fromSubdomain = !!this.branding.resolveIdentifier();
      this.entryMode.set('gym');
      return;
    }

    this.branding.clearResolvedTenant();
    this.tenantResolved.set(false);
    this.entryMode.set('choice');
  }

  isChoosingAccess(): boolean {
    return this.entryMode() === 'choice' && !this.fromSubdomain;
  }

  chooseGymLogin(): void { this.entryMode.set('gym'); }
  goToIdentityLogin(): void { void this.router.navigate(['/identity/login']); }
  goToFreelanceRegistration(): void { void this.router.navigate(['/auth/register-freelance']); }
  goToGymRegistration(): void { void this.router.navigate(['/auth/register-gym']); }
  goToClientRegistration(): void { void this.router.navigate(['/auth/register']); }
  goToForgotPassword(): void { void this.router.navigate(['/auth/forgot-password']); }
  canReturnToAccessChoice(): boolean { return !this.fromSubdomain; }

  returnToAccessChoice(): void {
    this.changeGym();
    this.entryMode.set('choice');
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
    const subdomain = this.gymSubdomain.trim();
    if (!subdomain) return;

    this.resolving.set(true);
    this.resolveError.set(null);

    this.branding.resolveBySubdomain(subdomain).subscribe({
      next: (resolvedBranding) => {
        this.resolving.set(false);
        this.subdomain = resolvedBranding.subdomain || subdomain;
        this.applyTenant(resolvedBranding.tenantId, resolvedBranding.name);
      },
      error: (error) => {
        this.resolving.set(false);
        this.resolveError.set(error?.status === 404
          ? 'لا توجد صالة بهذا المعرّف. تأكد من الكتابة الصحيحة.'
          : (error?.translatedMessage || 'تعذّر العثور على الصالة.'));
      }
    });
  }

  useManualTenant(): void {
    const tenantId = this.manualTenantId.trim();
    const guid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guid.test(tenantId)) {
      this.manualError.set('صيغة المعرّف غير صحيحة (GUID).');
      return;
    }

    this.manualError.set(null);
    this.subdomain = '';
    this.applyTenant(tenantId, 'صالة (وضع الاختبار)');
  }

  changeGym(): void {
    this.branding.clearResolvedTenant();
    this.tenantResolved.set(false);
    this.resolvedGymName.set(null);
    this.manualMode.set(false);
    this.manualError.set(null);
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
        this.notification.success('تم تسجيل الدخول بنجاح.');
        const redirectUrl = response.mustChangePassword
          ? '/client/profile'
          : this.authService.getRedirectUrlForRole(response.role);
        setTimeout(() => this.router.navigateByUrl(redirectUrl), 100);
      },
      error: (error) => {
        this.loading = false;
        const tenantStatus = this.tenantStatus.resolve(error.error?.code);
        if (tenantStatus) {
          if (tenantStatus.code === 'TENANT_NOT_FOUND') {
            this.changeGym();
            this.resolveError.set(tenantStatus.message);
          } else {
            this.errorMessage = tenantStatus.message;
          }
          return;
        }

        this.errorMessage = error.translatedMessage || error.error?.message || 'حدث خطأ أثناء تسجيل الدخول.';
      }
    });
  }
}
