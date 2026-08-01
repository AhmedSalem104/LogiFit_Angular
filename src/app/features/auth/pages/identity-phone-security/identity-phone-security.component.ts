import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { OtpChallenge, OtpPurpose } from '../../../../core/freelance/models/freelance.models';

@Component({
  selector: 'app-identity-phone-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section dir="rtl">
      <p class="eyebrow">أمان الهوية</p><h2>تغيير رقم الهاتف الموثق</h2>
      <p class="description">سنرسل OTP إلى الرقم الجديد. بعد نجاح التغيير ستُلغى الجلسات القديمة لحماية حسابك.</p>
      @if (!challenge()) {
        <form [formGroup]="phoneForm" (ngSubmit)="request()">
          <label>رقم الهاتف الجديد</label>
          <div class="phone-row" dir="ltr">
            <select formControlName="countryCode" aria-label="كود الدولة">
              <option value="+20">🇪🇬 +20</option><option value="+966">🇸🇦 +966</option>
              <option value="+971">🇦🇪 +971</option><option value="+965">🇰🇼 +965</option>
              <option value="+974">🇶🇦 +974</option><option value="+973">🇧🇭 +973</option>
              <option value="+968">🇴🇲 +968</option><option value="+962">🇯🇴 +962</option>
            </select>
            <input formControlName="phoneNumber" type="tel" inputmode="tel"
              autocomplete="tel-national" placeholder="10 5555 6789">
          </div>
          <button [disabled]="busy() || phoneForm.invalid">{{ busy() ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق' }}</button>
        </form>
      } @else {
        <form [formGroup]="otpForm" (ngSubmit)="verify()">
          <label>رمز OTP</label>
          <input class="otp" formControlName="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" dir="ltr">
          <p class="timer" [class.expired]="otpSeconds() === 0">
            {{ otpSeconds() ? 'ينتهي خلال ' + formatTime(otpSeconds()) : 'انتهت صلاحية الرمز' }}
          </p>
          @if (developmentOtpHint) { <p class="dev">{{ developmentOtpHint }}</p> }
          <button [disabled]="busy() || otpForm.invalid || otpSeconds() === 0">{{ busy() ? 'جارٍ التحقق...' : 'تأكيد الرقم الجديد' }}</button>
          <button type="button" class="secondary" (click)="request()"
            [disabled]="busy() || resendSeconds() > 0">
            {{ resendSeconds() ? 'إعادة الإرسال خلال ' + formatTime(resendSeconds()) : 'إعادة إرسال الرمز' }}
          </button>
          <button type="button" class="secondary" (click)="cancelChallenge()">تغيير الرقم</button>
        </form>
      }
      @if (error()) { <p class="error">{{ error() }}</p> }
    </section>
  `,
  styles: [`
    section{width:100%}.eyebrow{color:#2563eb;font-size:.75rem;font-weight:900}.description{color:var(--text-secondary);line-height:1.7}form{display:grid;gap:.65rem}label{font-weight:800}input,select{min-height:48px;padding:.7rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font:inherit}.phone-row{display:grid;grid-template-columns:108px 1fr;gap:.55rem}.otp{text-align:center;font-size:1.5rem;letter-spacing:.5rem}button{min-height:48px;border:0;border-radius:10px;background:#2563eb;color:#fff;font:inherit;font-weight:800}.secondary{background:transparent;color:#2563eb;border:1px solid #93c5fd}.timer{margin:0;text-align:center;color:var(--text-secondary);font-size:.8rem}.timer.expired{color:#b91c1c}.dev{padding:.6rem;background:#fffbeb;color:#92400e;border:1px dashed #f59e0b;border-radius:8px;text-align:center}.error{color:#b91c1c}
  `],
})
export class IdentityPhoneSecurityComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  readonly developmentOtpHint = environment.otpDevelopmentHint;
  readonly challenge = signal<OtpChallenge | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly otpSeconds = signal(0);
  readonly resendSeconds = signal(0);
  private timerId?: ReturnType<typeof setInterval>;
  readonly sessionBinding = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  readonly phoneForm = this.fb.nonNullable.group({
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s()-]{8,22}$/)]],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
  });

  request(): void {
    if (this.phoneForm.invalid) return;
    this.busy.set(true); this.error.set('');
    this.onboarding.requestPhoneVerification(this.normalizedPhone(), OtpPurpose.ChangePhone,
      null, this.sessionBinding).subscribe({
      next: challenge => {
        this.challenge.set(challenge); this.otpForm.reset(); this.startTimer(challenge); this.busy.set(false);
      },
      error: err => this.fail(err, 'تعذر إرسال الرمز.'),
    });
  }

  cancelChallenge(): void {
    this.stopTimer(); this.challenge.set(null); this.otpForm.reset(); this.error.set('');
  }

  formatTime(value: number): string {
    return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void { this.stopTimer(); }

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

  verify(): void {
    const challenge = this.challenge();
    if (!challenge || this.otpForm.invalid) return;
    this.busy.set(true); this.error.set('');
    this.onboarding.verifyPhone(challenge.challengeId, this.otpForm.controls.code.value,
      OtpPurpose.ChangePhone, null, this.sessionBinding).subscribe({
      next: () => this.auth.logout(),
      error: err => this.fail(err, 'الرمز غير صحيح أو منتهي.'),
    });
  }

  private fail(err: any, fallback: string): void {
    this.error.set(err?.translatedMessage || err?.error?.message || fallback);
    this.busy.set(false);
  }
}
