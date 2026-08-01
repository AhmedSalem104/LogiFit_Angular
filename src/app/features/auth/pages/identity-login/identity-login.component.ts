import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  IdentitySignInResponse,
  IdentityWorkspace,
  OtpChallenge,
  PendingApplication,
  WorkspaceType,
} from '../../../../core/freelance/models/freelance.models';

type LoginMethod = 'email' | 'phone';

@Component({
  selector: 'app-identity-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-flow" dir="rtl">
      <nav class="stepper" aria-label="خطوات تسجيل الدخول">
        @for (item of steps(); track item.label; let last = $last) {
          <span class="step" [class.active]="item.active" [class.done]="item.done">
            <i class="pi" [class.pi-check]="item.done" [class.pi-circle-fill]="!item.done"></i>
            <small>{{ item.label }}</small>
          </span>
          @if (!last) { <span class="line" [class.done]="item.done"></span> }
        }
      </nav>

      @if (!result() && !challenge()) {
        <header>
          <span class="brand-mark"><i class="pi pi-bolt"></i></span>
          <p class="eyebrow">LogicFit Identity</p>
          <h1>أهلاً بيك</h1>
          <p>ادخل بهوية واحدة للوصول إلى كل مساحات العمل والطلبات المرتبطة بك.</p>
        </header>

        <div class="method-switch" role="tablist" aria-label="طريقة الدخول">
          <button type="button" role="tab" [class.active]="method() === 'email'" (click)="chooseMethod('email')">
            <i class="pi pi-envelope"></i><span>البريد وكلمة المرور</span>
          </button>
          <button type="button" role="tab" [class.active]="method() === 'phone'" (click)="chooseMethod('phone')">
            <i class="pi pi-mobile"></i><span>رقم الهاتف وOTP</span>
          </button>
        </div>

        @if (method() === 'email') {
          <form [formGroup]="emailForm" (ngSubmit)="submitEmail()" novalidate>
            <label for="identity-email">البريد الإلكتروني</label>
            <div class="input-shell">
              <i class="pi pi-envelope"></i>
              <input id="identity-email" type="email" formControlName="email" autocomplete="email" dir="ltr"
                placeholder="name@example.com" />
            </div>
            @if (emailForm.controls.email.touched && emailForm.controls.email.invalid) {
              <p class="field-error">أدخل بريدًا إلكترونيًا صحيحًا.</p>
            }
            <label for="identity-password">كلمة المرور</label>
            <div class="input-shell">
              <i class="pi pi-lock"></i>
              <input id="identity-password" [type]="showPassword() ? 'text' : 'password'"
                formControlName="password" autocomplete="current-password" dir="ltr" />
              <button class="input-action" type="button" (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'">
                <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
              </button>
            </div>
            <button class="primary" [disabled]="loading() || emailForm.invalid">
              @if (loading()) { <i class="pi pi-spin pi-spinner"></i> }
              {{ loading() ? 'جارٍ التحقق...' : 'متابعة' }}
            </button>
          </form>
        } @else {
          <form [formGroup]="phoneForm" (ngSubmit)="requestOtp()" novalidate>
            <label for="identity-phone">رقم الهاتف</label>
            <div class="phone-row" dir="ltr">
              <select formControlName="countryCode" aria-label="كود الدولة">
                <option value="+20">🇪🇬 +20</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+973">🇧🇭 +973</option>
                <option value="+968">🇴🇲 +968</option>
                <option value="+962">🇯🇴 +962</option>
              </select>
              <input id="identity-phone" type="tel" inputmode="tel" formControlName="phoneNumber"
                autocomplete="tel-national" placeholder="10 5555 6789" />
            </div>
            <p class="hint">سيصل رمز تحقق إلى رقمك الموثق. لن نعرض ما إذا كان الرقم مسجلاً.</p>
            <button class="primary" [disabled]="loading() || phoneForm.invalid">
              @if (loading()) { <i class="pi pi-spin pi-spinner"></i> }
              {{ loading() ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق' }}
            </button>
          </form>
        }

        @if (error()) { <p class="error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</p> }
        <div class="helper-links">
          <a routerLink="/identity/reset-password">نسيت كلمة المرور؟</a>
          <a routerLink="/identity/register">إنشاء حساب جديد</a>
        </div>
        <p class="security-note"><i class="pi pi-shield"></i> لا نطلب منك اختيار دور؛ صلاحياتك تأتي من مساحة العمل.</p>
      } @else if (challenge()) {
        <header>
          <span class="brand-mark"><i class="pi pi-mobile"></i></span>
          <p class="eyebrow">تحقق إضافي</p>
          <h1>أدخل رمز OTP</h1>
          <p>أرسلنا الرمز إلى <b dir="ltr">{{ challenge()!.maskedPhoneNumber }}</b></p>
        </header>
        <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" novalidate>
          <input class="otp-input" formControlName="code" inputmode="numeric" autocomplete="one-time-code"
            maxlength="6" aria-label="رمز التحقق" dir="ltr" />
          <p class="timer" [class.expired]="otpSeconds() === 0">
            {{ otpSeconds() > 0 ? 'ينتهي الرمز خلال ' + formatTime(otpSeconds()) : 'انتهت صلاحية الرمز' }}
          </p>
          @if (developmentOtpHint) {
            <p class="development-note"><i class="pi pi-code"></i> {{ developmentOtpHint }}</p>
          }
          @if (error()) { <p class="error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</p> }
          <button class="primary" [disabled]="loading() || otpForm.invalid || otpSeconds() === 0">
            @if (loading()) { <i class="pi pi-spin pi-spinner"></i> }
            {{ loading() ? 'جارٍ التحقق...' : 'تأكيد الرمز' }}
          </button>
          <button class="secondary" type="button" (click)="requestOtp()" [disabled]="loading() || resendSeconds() > 0">
            {{ resendSeconds() > 0 ? 'إعادة الإرسال خلال ' + formatTime(resendSeconds()) : 'إعادة إرسال الرمز' }}
          </button>
          <button class="text-button" type="button" (click)="cancelOtp()">تغيير رقم الهاتف</button>
        </form>
      } @else {
        <header class="compact">
          <p class="eyebrow">اختيار السياق</p>
          <h1>{{ result()!.activeWorkspaces.length > 1 ? 'اختر مساحة العمل' : 'وجهتك جاهزة' }}</h1>
          <p>يمكنك دخول مساحة نشطة ومتابعة طلباتك المعلقة بشكل مستقل.</p>
        </header>

        @if (result()!.activeWorkspaces.length) {
          <h2 class="section-title">مساحات العمل النشطة</h2>
          <div class="cards">
            @for (workspace of result()!.activeWorkspaces; track workspace.workspaceId) {
              <button class="choice-card" type="button" (click)="selectWorkspace(workspace)" [disabled]="selecting()">
                <span class="workspace-icon">
                  <i class="pi" [class.pi-building]="workspace.workspaceType === WorkspaceType.Gym"
                    [class.pi-user]="workspace.workspaceType === WorkspaceType.FreelanceCoach"></i>
                </span>
                <span class="choice-copy">
                  <b>{{ workspace.name }}</b>
                  <small>{{ workspace.identifier || workspaceLabel(workspace) }} · {{ workspace.role }}</small>
                </span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }

        @if (result()!.pendingApplications.length) {
          <h2 class="section-title">طلبات قيد المتابعة</h2>
          <div class="cards">
            @for (application of result()!.pendingApplications; track application.applicationId) {
              <button class="choice-card pending" type="button" (click)="trackApplication(application)" [disabled]="tracking()">
                <span class="workspace-icon"><i class="pi pi-clock"></i></span>
                <span class="choice-copy">
                  <b>{{ applicationLabel(application) }}</b><small>{{ applicationStatus(application.status) }}</small>
                </span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }

        @if (!result()!.activeWorkspaces.length && !result()!.pendingApplications.length) {
          <div class="empty">
            <h2>ابدأ باستخدام LogicFit</h2>
            <p>لا توجد مساحة أو طلب مرتبط بهذه الهوية حتى الآن.</p>
            <div class="start-actions">
              <a routerLink="/auth/register-gym"><i class="pi pi-building"></i><b>إنشاء جيم</b><small>مساحة لفريق وفروع</small></a>
              <a routerLink="/auth/register-freelance"><i class="pi pi-user-plus"></i><b>مدرب حر</b><small>مساحتك المستقلة</small></a>
              <a routerLink="/identity/accept-invite"><i class="pi pi-users"></i><b>الانضمام</b><small>بدعوة أو رابط</small></a>
            </div>
          </div>
        }
        @if (error()) { <p class="error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</p> }
        <button class="text-button" type="button" (click)="reset()">استخدام حساب آخر</button>
      }
    </section>
  `,
  styles: [`
    :host{display:block}.identity-flow{width:100%;color:var(--text-primary)}.stepper{display:flex;align-items:flex-start;justify-content:center;margin:0 0 1.6rem}.step{display:grid;justify-items:center;gap:.35rem;min-width:58px;color:var(--text-muted)}.step i{display:grid;place-items:center;width:25px;height:25px;border:2px solid var(--border-color);border-radius:50%;font-size:.5rem}.step small{font-size:.7rem;font-weight:700}.step.active{color:#2563eb}.step.active i,.step.done i{border-color:#2563eb;background:#2563eb;color:#fff}.line{width:54px;height:2px;margin-top:12px;background:var(--border-color)}.line.done{background:#2563eb}header{text-align:center;margin-bottom:1.35rem}header.compact{text-align:start}.brand-mark{display:grid;place-items:center;width:48px;height:48px;margin:0 auto .7rem;border-radius:16px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:1.25rem;box-shadow:0 10px 25px rgba(37,99,235,.22)}.eyebrow{margin:0 0 .25rem;color:#2563eb;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}h1{margin:0;color:var(--text-primary);font-size:1.75rem}header p:not(.eyebrow){margin:.45rem 0 0;color:var(--text-secondary);line-height:1.7}.method-switch{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;padding:.3rem;margin-bottom:1.2rem;border-radius:12px;background:var(--bg-secondary)}.method-switch button{display:flex;align-items:center;justify-content:center;gap:.45rem;min-height:42px;border:0;border-radius:9px;background:transparent;color:var(--text-secondary);font:inherit;font-size:.82rem;font-weight:700;cursor:pointer}.method-switch button.active{background:var(--bg-primary);color:#2563eb;box-shadow:0 2px 8px rgba(15,23,42,.08)}form{display:grid;gap:.55rem}label{margin-top:.25rem;font-size:.86rem;font-weight:800}.input-shell{position:relative;display:flex;align-items:center}.input-shell>i{position:absolute;right:.9rem;color:var(--text-muted)}.input-shell input,.phone-row input,.phone-row select{width:100%;box-sizing:border-box;min-height:48px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font:inherit}.input-shell input{padding:.75rem 2.6rem}.input-action{position:absolute;left:.55rem;border:0;background:transparent;color:var(--text-muted);cursor:pointer}.phone-row{display:grid;grid-template-columns:108px 1fr;gap:.55rem}.phone-row select,.phone-row input{padding:.65rem}.field-error,.error{margin:.15rem 0;color:#b91c1c;font-size:.82rem}.error{display:flex;align-items:center;gap:.4rem;padding:.7rem;border-radius:9px;background:#fef2f2}.hint,.timer,.security-note{margin:.2rem 0;color:var(--text-secondary);font-size:.78rem;line-height:1.6}.primary,.secondary{display:flex;align-items:center;justify-content:center;gap:.45rem;width:100%;min-height:48px;margin-top:.75rem;border-radius:10px;font:inherit;font-weight:800;cursor:pointer}.primary{border:0;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff}.secondary{border:1px solid #93c5fd;background:transparent;color:#2563eb}.primary:disabled,.secondary:disabled{opacity:.55;cursor:not-allowed}.helper-links{display:flex;justify-content:space-between;margin-top:1rem;font-size:.82rem}.helper-links a,.text-button{color:#2563eb;text-decoration:none}.security-note{text-align:center;margin-top:1.4rem}.security-note i{margin-inline-end:.3rem}.otp-input{width:100%;box-sizing:border-box;min-height:62px;border:1px solid #93c5fd;border-radius:12px;background:var(--bg-primary);color:var(--text-primary);text-align:center;font-size:1.65rem;font-weight:900;letter-spacing:.55rem}.timer{text-align:center}.timer.expired{color:#b91c1c}.development-note{margin:.25rem 0;padding:.65rem;border:1px dashed #f59e0b;border-radius:9px;background:#fffbeb;color:#92400e;text-align:center;font-size:.8rem}.text-button{border:0;background:transparent;padding:.65rem 0 0;font:inherit;cursor:pointer}.section-title{margin:1.2rem 0 .55rem;font-size:.92rem}.cards{display:grid;gap:.6rem}.choice-card{display:flex;align-items:center;gap:.75rem;width:100%;padding:.85rem;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-primary);color:var(--text-primary);text-align:start;cursor:pointer}.choice-card:hover{border-color:#60a5fa}.choice-card:disabled{opacity:.6}.workspace-icon{display:grid;place-items:center;flex:0 0 40px;height:40px;border-radius:12px;background:#eff6ff;color:#2563eb}.pending .workspace-icon{background:#fff7ed;color:#b45309}.choice-copy{display:grid;gap:.15rem;flex:1}.choice-copy small{color:var(--text-secondary)}.empty{padding:1rem;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-secondary)}.empty h2{margin:0}.empty p{color:var(--text-secondary)}.start-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}.start-actions a{display:grid;gap:.25rem;padding:.65rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);text-decoration:none}.start-actions i{color:#2563eb}.start-actions small{color:var(--text-secondary);font-size:.72rem}@media(max-width:480px){.step small{display:none}.step{min-width:30px}.line{width:42px}.method-switch{grid-template-columns:1fr}.start-actions{grid-template-columns:1fr}.helper-links{flex-direction:column;gap:.6rem}.phone-row{grid-template-columns:100px 1fr}}
  `],
})
export class IdentityLoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private timerId?: ReturnType<typeof setInterval>;
  private readonly sessionBinding = this.getSessionBinding();

  readonly WorkspaceType = WorkspaceType;
  readonly developmentOtpHint = environment.otpDevelopmentHint;
  readonly method = signal<LoginMethod>('email');
  readonly showPassword = signal(false);
  readonly result = signal<IdentitySignInResponse | null>(null);
  readonly challenge = signal<OtpChallenge | null>(null);
  readonly loading = signal(false);
  readonly selecting = signal(false);
  readonly tracking = signal(false);
  readonly error = signal('');
  readonly otpSeconds = signal(0);
  readonly resendSeconds = signal(0);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly phoneForm = this.fb.nonNullable.group({
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s()-]{8,22}$/)]],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
  });

  steps() {
    const verified = !!this.result();
    const otp = !!this.challenge();
    return [
      { label: 'الهوية', active: !verified && !otp, done: verified || otp },
      { label: 'التحقق', active: otp, done: verified },
      { label: 'المساحة', active: verified, done: false },
    ];
  }

  chooseMethod(method: LoginMethod): void {
    this.method.set(method);
    this.error.set('');
  }

  submitEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { email, password } = this.emailForm.getRawValue();
    this.onboarding.identityLogin(email, password).subscribe({
      next: result => this.handleIdentity(result),
      error: err => this.fail(err, 'تعذر التحقق من بيانات الدخول.'),
    });
  }

  requestOtp(): void {
    if (this.phoneForm.invalid) { this.phoneForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    this.onboarding.requestPhoneLogin(this.normalizedPhone(), this.sessionBinding).subscribe({
      next: challenge => {
        this.challenge.set(challenge);
        this.otpForm.reset();
        this.startTimer(challenge);
        this.loading.set(false);
      },
      error: err => this.fail(err, 'تعذر إرسال رمز التحقق الآن.'),
    });
  }

  verifyOtp(): void {
    const challenge = this.challenge();
    if (!challenge || this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    this.onboarding.verifyPhoneLogin(challenge.challengeId, this.otpForm.controls.code.value, this.sessionBinding).subscribe({
      next: result => this.handleIdentity(result),
      error: err => this.fail(err, this.otpError(err)),
    });
  }

  cancelOtp(): void {
    this.stopTimer();
    this.challenge.set(null);
    this.otpForm.reset();
    this.error.set('');
  }

  selectWorkspace(workspace: IdentityWorkspace): void {
    const result = this.result();
    if (!result) return;
    this.selecting.set(true); this.error.set('');
    this.onboarding.selectWorkspace(result.workspaceSelectionToken, workspace.workspaceId).subscribe({
      next: response => {
        this.auth.completeWorkspaceSelection(response, workspace.workspaceType);
        this.router.navigateByUrl(response.mustChangePassword ? '/client/profile' : this.auth.getRedirectUrlForRole(response.role));
      },
      error: err => {
        this.error.set(err?.translatedMessage || err?.error?.message || 'انتهت جلسة اختيار المساحة. سجل الدخول مجددًا.');
        this.selecting.set(false);
      },
    });
  }

  trackApplication(application: PendingApplication): void {
    const result = this.result();
    if (!result) return;
    this.tracking.set(true); this.error.set('');
    this.onboarding.reissueTrackingSessions(result.workspaceSelectionToken).subscribe({
      next: sessions => {
        const session = sessions.find(item => item.applicationId === application.applicationId);
        if (!session) {
          this.error.set('لا يمكن إصدار جلسة متابعة لهذا الطلب.');
          this.tracking.set(false);
          return;
        }
        this.onboarding.saveTrackingToken(session.trackingToken);
        this.router.navigate(['/identity/application-status']);
      },
      error: err => {
        this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر فتح متابعة الطلب.');
        this.tracking.set(false);
      },
    });
  }

  reset(): void {
    this.stopTimer();
    this.result.set(null);
    this.challenge.set(null);
    this.error.set('');
    this.emailForm.reset();
    this.phoneForm.reset({ countryCode: '+20', phoneNumber: '' });
  }

  formatTime(value: number): string {
    return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
  }

  workspaceLabel(workspace: IdentityWorkspace): string {
    return workspace.workspaceType === WorkspaceType.FreelanceCoach ? 'مساحة مدرب حر' : 'مساحة جيم';
  }
  applicationLabel(application: PendingApplication): string {
    return application.applicationType === 2 ? 'طلب مساحة مدرب حر' : 'طلب انضمام';
  }
  applicationStatus(status: number): string {
    return ({ 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال بيانات', 5: 'مقبول',
      6: 'مرفوض', 7: 'ملغى', 8: 'منتهي' } as Record<number, string>)[status] || 'مسودة';
  }

  ngOnDestroy(): void { this.stopTimer(); }

  private handleIdentity(result: IdentitySignInResponse): void {
    this.stopTimer();
    this.challenge.set(null);
    this.result.set(result);
    this.loading.set(false);
    if (!result.requiresWorkspaceSelection && result.activeWorkspaces.length === 1 &&
        result.pendingApplications.length === 0) {
      this.selectWorkspace(result.activeWorkspaces[0]);
    }
  }

  private startTimer(challenge: OtpChallenge): void {
    this.stopTimer();
    const update = () => {
      const now = Date.now();
      this.otpSeconds.set(Math.max(0, Math.ceil((new Date(challenge.expiresAtUtc).getTime() - now) / 1000)));
      this.resendSeconds.set(Math.max(0, Math.ceil((new Date(challenge.resendAvailableAtUtc).getTime() - now) / 1000)));
    };
    update();
    this.timerId = setInterval(update, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = undefined;
  }

  private normalizedPhone(): string {
    const { countryCode, phoneNumber } = this.phoneForm.getRawValue();
    const trimmed = phoneNumber.trim();
    if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
    return `${countryCode}${trimmed.replace(/\D/g, '').replace(/^0+/, '')}`;
  }

  private getSessionBinding(): string {
    const key = 'logicfit_auth_session_binding';
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem(key, value);
    }
    return value;
  }

  private otpError(error: any): string {
    const code = error?.error?.message || error?.error?.code;
    if (code === 'OTP_EXPIRED') return 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.';
    if (code === 'OTP_LOCKED') return 'تم تجاوز عدد المحاولات. اطلب رمزًا جديدًا.';
    if (code === 'OTP_ALREADY_USED') return 'تم استخدام هذا الرمز من قبل.';
    return 'الرمز غير صحيح أو لم يعد صالحًا.';
  }

  private fail(error: any, fallback: string): void {
    this.error.set(error?.translatedMessage || error?.error?.message || fallback);
    this.loading.set(false);
  }
}
