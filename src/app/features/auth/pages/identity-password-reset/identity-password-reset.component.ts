import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { OtpChallenge } from '../../../../core/freelance/models/freelance.models';

@Component({
  selector: 'app-identity-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="reset" dir="rtl">
      <p class="eyebrow">استعادة آمنة</p>
      <h2>{{ token() || challenge() ? 'تعيين كلمة مرور جديدة' : 'استعادة كلمة المرور' }}</h2>
      @if (done()) {
        <p class="success">{{ done() }}</p><a routerLink="/identity/login">العودة لتسجيل الدخول</a>
      } @else if (token()) {
        <p>استخدم رابط البريد لتعيين كلمة مرور جديدة. ستُلغى كل الجلسات القديمة.</p>
        <form [formGroup]="passwordForm" (ngSubmit)="resetByEmail()">
          <ng-container [ngTemplateOutlet]="passwordFields"></ng-container>
          <button [disabled]="loading() || passwordForm.invalid">{{ loading() ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور' }}</button>
        </form>
      } @else if (challenge()) {
        <p>أدخل رمز OTP ثم اختر كلمة مرور جديدة. الرقم المعروض: <b dir="ltr">{{ challenge()!.maskedPhoneNumber }}</b></p>
        <form [formGroup]="phoneResetForm" (ngSubmit)="resetByPhone()">
          <label>رمز OTP<input class="otp" formControlName="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" dir="ltr"></label>
          <p class="timer" [class.expired]="otpSeconds() === 0">
            {{ otpSeconds() ? 'ينتهي خلال ' + formatTime(otpSeconds()) : 'انتهت صلاحية الرمز' }}
          </p>
          @if (developmentOtpHint) { <p class="dev">{{ developmentOtpHint }}</p> }
          <label>كلمة المرور الجديدة<input type="password" formControlName="password" autocomplete="new-password" dir="ltr"></label>
          <label>تأكيد كلمة المرور<input type="password" formControlName="confirmPassword" autocomplete="new-password" dir="ltr"></label>
          <button [disabled]="loading() || phoneResetForm.invalid || otpSeconds() === 0">{{ loading() ? 'جارٍ التحقق...' : 'تأكيد وتغيير كلمة المرور' }}</button>
          <button type="button" class="secondary" (click)="requestPhone()"
            [disabled]="loading() || resendSeconds() > 0">
            {{ resendSeconds() ? 'إعادة الإرسال خلال ' + formatTime(resendSeconds()) : 'إعادة إرسال الرمز' }}
          </button>
          <button type="button" class="secondary" (click)="cancelPhoneChallenge()">تغيير رقم الهاتف</button>
        </form>
      } @else {
        <div class="methods">
          <button type="button" [class.active]="method() === 'email'" (click)="method.set('email')">رابط البريد</button>
          <button type="button" [class.active]="method() === 'phone'" (click)="method.set('phone')">الهاتف وOTP</button>
        </div>
        @if (method() === 'email') {
          <p>أدخل بريدك وسنرسل رابطًا آمنًا إذا كان الحساب مؤهلاً.</p>
          <form [formGroup]="emailForm" (ngSubmit)="requestEmail()">
            <label>البريد الإلكتروني<input type="email" formControlName="email" autocomplete="email" dir="ltr"></label>
            <button [disabled]="loading() || emailForm.invalid">{{ loading() ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة' }}</button>
          </form>
        } @else {
          <p>أدخل الرقم الموثق مع كود الدولة. ستظهر رسالة عامة سواء وُجد الحساب أم لا.</p>
          <form [formGroup]="phoneForm" (ngSubmit)="requestPhone()">
            <label>رقم الهاتف</label>
            <div class="phone-row" dir="ltr">
              <select formControlName="countryCode" aria-label="كود الدولة">
                <option value="+20">🇪🇬 +20</option><option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option><option value="+965">🇰🇼 +965</option>
                <option value="+974">🇶🇦 +974</option><option value="+973">🇧🇭 +973</option>
                <option value="+968">🇴🇲 +968</option><option value="+962">🇯🇴 +962</option>
              </select>
              <input type="tel" formControlName="phoneNumber" autocomplete="tel-national"
                placeholder="10 5555 6789">
            </div>
            <button [disabled]="loading() || phoneForm.invalid">{{ loading() ? 'جارٍ الإرسال...' : 'إرسال رمز OTP' }}</button>
          </form>
        }
      }
      @if (error()) { <p class="error">{{ error() }}</p> }
      <ng-template #passwordFields>
        <label>كلمة المرور الجديدة<input type="password" formControlName="password" autocomplete="new-password" dir="ltr"></label>
        <label>تأكيد كلمة المرور<input type="password" formControlName="confirmPassword" autocomplete="new-password" dir="ltr"></label>
      </ng-template>
    </section>
  `,
  styles: [`
    .reset h2{margin:.25rem 0;color:var(--text-primary)}.eyebrow{color:#2563eb;font-size:.75rem;font-weight:900}.reset>p{color:var(--text-secondary);line-height:1.7}.methods{display:grid;grid-template-columns:1fr 1fr;gap:.4rem;padding:.3rem;border-radius:10px;background:var(--bg-secondary)}.methods button{min-height:40px;border:0;border-radius:8px;background:transparent;color:var(--text-secondary);font:inherit;font-weight:700}.methods button.active{background:var(--bg-primary);color:#2563eb}form{display:grid;gap:.7rem;margin-top:1rem}label{display:grid;gap:.35rem;font-weight:700}input,select{min-height:46px;padding:.65rem;border:1px solid var(--border-color);border-radius:9px;background:var(--bg-primary);color:var(--text-primary);font:inherit}.phone-row{display:grid;grid-template-columns:108px 1fr;gap:.55rem}.otp{text-align:center;font-size:1.5rem;letter-spacing:.5rem}.timer{margin:0;text-align:center;color:var(--text-secondary);font-size:.8rem}.timer.expired{color:#b91c1c}form>button{min-height:46px;border:0;border-radius:9px;background:#2563eb;color:#fff;font:inherit;font-weight:800}.secondary{background:transparent!important;color:#2563eb!important;border:1px solid #93c5fd!important}.error{color:#b91c1c!important}.success{padding:.8rem;border-radius:.6rem;background:#f0fdf4;color:#166534!important}.dev{padding:.6rem;border:1px dashed #f59e0b;border-radius:8px;background:#fffbeb;color:#92400e;text-align:center}
  `],
})
export class IdentityPasswordResetComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  readonly developmentOtpHint = environment.otpDevelopmentHint;
  readonly method = signal<'email' | 'phone'>('email');
  readonly token = signal<string | null>(null);
  readonly challenge = signal<OtpChallenge | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly done = signal('');
  readonly otpSeconds = signal(0);
  readonly resendSeconds = signal(0);
  private timerId?: ReturnType<typeof setInterval>;
  readonly sessionBinding = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  readonly emailForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  readonly phoneForm = this.fb.nonNullable.group({
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s()-]{8,22}$/)]],
  });
  readonly passwordForm = this.passwordGroup();
  readonly phoneResetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    this.route.fragment.subscribe(fragment => this.token.set(new URLSearchParams(fragment || '').get('token')));
  }

  requestEmail(): void {
    if (this.emailForm.invalid) return;
    this.loading.set(true); this.error.set('');
    this.onboarding.requestIdentityPasswordReset(this.emailForm.controls.email.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set('إذا كان الحساب موجودًا ومؤهلاً، ستصلك رسالة برابط الاستعادة.');
      },
      error: err => this.fail(err, 'تعذر إرسال الطلب.'),
    });
  }

  requestPhone(): void {
    if (this.phoneForm.invalid) return;
    this.loading.set(true); this.error.set('');
    this.onboarding.requestPhonePasswordReset(this.normalizedPhone(), this.sessionBinding).subscribe({
      next: challenge => {
        this.challenge.set(challenge); this.phoneResetForm.controls.code.reset();
        this.startTimer(challenge); this.loading.set(false);
      },
      error: err => this.fail(err, 'تعذر إرسال رمز التحقق.'),
    });
  }

  cancelPhoneChallenge(): void {
    this.stopTimer(); this.challenge.set(null); this.phoneResetForm.controls.code.reset(); this.error.set('');
  }

  formatTime(value: number): string {
    return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void { this.stopTimer(); }

  resetByEmail(): void {
    if (!this.validPasswords(this.passwordForm)) return;
    const token = this.token();
    if (!token) return;
    this.loading.set(true); this.error.set('');
    this.onboarding.resetIdentityPassword(token, this.passwordForm.controls.password.value).subscribe({
      next: () => this.complete(),
      error: err => this.fail(err, 'الرابط غير صالح أو منتهي.'),
    });
  }

  resetByPhone(): void {
    const challenge = this.challenge();
    if (!challenge || !this.validPasswords(this.phoneResetForm)) return;
    this.loading.set(true); this.error.set('');
    this.onboarding.resetPasswordWithPhone(challenge.challengeId, this.phoneResetForm.controls.code.value,
      this.phoneResetForm.controls.password.value, this.sessionBinding).subscribe({
      next: () => this.complete(),
      error: err => this.fail(err, 'الرمز غير صحيح أو منتهي.'),
    });
  }

  private passwordGroup() {
    return this.fb.nonNullable.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }
  private validPasswords(form: typeof this.passwordForm | typeof this.phoneResetForm): boolean {
    if (form.invalid) { form.markAllAsTouched(); return false; }
    if (form.controls.password.value !== form.controls.confirmPassword.value) {
      this.error.set('كلمتا المرور غير متطابقتين.');
      return false;
    }
    return true;
  }
  private complete(): void {
    this.stopTimer();
    this.loading.set(false);
    this.done.set('تم تغيير كلمة المرور وإلغاء كل الجلسات القديمة.');
  }

  private normalizedPhone(): string {
    const { countryCode, phoneNumber } = this.phoneForm.getRawValue();
    const trimmed = phoneNumber.trim();
    return trimmed.startsWith('+')
      ? `+${trimmed.slice(1).replace(/\D/g, '')}`
      : `${countryCode}${trimmed.replace(/\D/g, '').replace(/^0+/, '')}`;
  }

  private startTimer(challenge: OtpChallenge): void {
    this.stopTimer();
    const update = () => {
      const now = Date.now();
      this.otpSeconds.set(Math.max(0, Math.ceil((Date.parse(challenge.expiresAtUtc) - now) / 1000)));
      this.resendSeconds.set(Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAtUtc) - now) / 1000)));
    };
    update();
    this.timerId = setInterval(update, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = undefined;
  }
  private fail(err: any, fallback: string): void {
    this.loading.set(false);
    this.error.set(err?.translatedMessage || err?.error?.message || fallback);
  }
}
