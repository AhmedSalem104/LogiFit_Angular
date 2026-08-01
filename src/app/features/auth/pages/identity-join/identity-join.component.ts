import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  IdentitySignInResponse,
  OtpChallenge,
  WorkspaceClientJoinPreview,
  WorkspaceInvitePreview,
} from '../../../../core/freelance/models/freelance.models';

type Preview = WorkspaceInvitePreview | WorkspaceClientJoinPreview;

@Component({
  selector: 'app-identity-join',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="join-flow" dir="rtl">
      <div class="steps"><b>1</b><span></span><b [class.active]="identity()">2</b><span></span><b [class.active]="done()">3</b></div>
      @if (loading()) {
        <div class="center"><i class="pi pi-spin pi-spinner"></i><p>جارٍ التحقق من الرابط...</p></div>
      } @else if (!preview()) {
        <div class="center"><i class="pi pi-link broken"></i><h2>الرابط غير صالح أو منتهي</h2></div>
      } @else {
        <header>
          <span class="workspace-logo"><i class="pi" [class.pi-users]="mode() === 'invite'" [class.pi-user-plus]="mode() === 'client'"></i></span>
          <p class="eyebrow">{{ mode() === 'invite' ? 'دعوة فريق' : 'انضمام عميل' }}</p>
          <h2>{{ workspaceName() }}</h2>
          @if (mode() === 'invite') {
            <p>ستدخل بالدور المحدد في الدعوة: <b>{{ inviteRole() }}</b></p>
          } @else {
            <p>أثبت هويتك أولاً ثم أرسل طلب الانضمام إلى هذه المساحة.</p>
          }
        </header>

        @if (!identity()) {
          <form [formGroup]="form" (ngSubmit)="signIn()">
            <label>البريد الإلكتروني</label>
            <input type="email" formControlName="email" autocomplete="email" dir="ltr">
            <label>كلمة المرور</label>
            <input type="password" formControlName="password" autocomplete="current-password" dir="ltr">
            <button class="primary" [disabled]="form.invalid || busy()">
              {{ busy() ? 'جارٍ التحقق...' : 'متابعة' }}
            </button>
          </form>
          <p class="helper">ليس لديك حساب؟ <a routerLink="/identity/register">أنشئ حسابًا بنفس بريد الدعوة</a></p>
        } @else if (otp()) {
          <form [formGroup]="otpForm" (ngSubmit)="completeWithOtp()">
            <label>رمز التحقق الإضافي</label>
            <input class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" formControlName="code" dir="ltr">
            <p class="timer" [class.expired]="otpSeconds() === 0">
              {{ otpSeconds() ? 'ينتهي خلال ' + formatTime(otpSeconds()) : 'انتهت صلاحية الرمز' }}
            </p>
            @if (developmentOtpHint) { <p class="dev">{{ developmentOtpHint }}</p> }
            <button class="primary" [disabled]="otpForm.invalid || busy() || otpSeconds() === 0">
              {{ busy() ? 'جارٍ التأكيد...' : 'تأكيد وقبول الدعوة' }}
            </button>
            <button class="secondary" type="button" (click)="requestInviteOtp()"
              [disabled]="busy() || resendSeconds() > 0">
              {{ resendSeconds() ? 'إعادة الإرسال خلال ' + formatTime(resendSeconds()) : 'إعادة إرسال الرمز' }}
            </button>
          </form>
        } @else if (!done()) {
          <button class="primary" (click)="complete()" [disabled]="busy()">
            {{ busy() ? 'جارٍ التنفيذ...' : (mode() === 'invite' ? 'قبول الدعوة' : 'إرسال طلب الانضمام') }}
          </button>
          <button class="secondary" type="button" routerLink="/identity/login">هذه الدعوة ليست لي</button>
        } @else {
          <div class="success"><i class="pi pi-check-circle"></i><h2>تمت العملية بنجاح</h2>
            <a routerLink="/identity/login">العودة إلى الدخول الموحد</a></div>
        }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      }
    </section>
  `,
  styles: [`
    .join-flow{width:100%}.steps{display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem}.steps b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--bg-secondary);color:var(--text-muted)}.steps b:first-child,.steps b.active{background:#2563eb;color:#fff}.steps span{width:55px;height:2px;background:var(--border-color)}header,.center,.success{text-align:center}.workspace-logo{display:grid;place-items:center;width:52px;height:52px;margin:0 auto .7rem;border-radius:16px;background:#eff6ff;color:#2563eb;font-size:1.3rem}.eyebrow{margin:0;color:#2563eb;font-size:.75rem;font-weight:900}h2{margin:.3rem 0;color:var(--text-primary)}header p,.helper{color:var(--text-secondary)}form{display:grid;gap:.55rem}label{font-weight:800;font-size:.86rem}input{min-height:48px;padding:.7rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font:inherit}.otp{text-align:center;font-size:1.5rem;letter-spacing:.5rem}.timer{margin:0;text-align:center;color:var(--text-secondary);font-size:.8rem}.timer.expired{color:#b91c1c}.primary,.secondary{width:100%;min-height:48px;margin-top:.8rem;border-radius:10px;font:inherit;font-weight:800;cursor:pointer}.primary{border:0;background:#2563eb;color:#fff}.secondary{border:1px solid var(--border-color);background:transparent;color:var(--text-secondary)}button:disabled{opacity:.6}.helper{text-align:center;font-size:.82rem}.helper a,.success a{color:#2563eb}.dev{padding:.6rem;border:1px dashed #f59e0b;border-radius:8px;background:#fffbeb;color:#92400e;text-align:center;font-size:.8rem}.error{padding:.7rem;border-radius:8px;background:#fef2f2;color:#b91c1c}.success i{font-size:2.5rem;color:#16a34a}.broken{font-size:2rem;color:#dc2626}
  `],
})
export class IdentityJoinComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly fb = inject(FormBuilder);
  readonly developmentOtpHint = environment.otpDevelopmentHint;
  readonly mode = signal<'invite' | 'client'>((this.route.snapshot.data['mode'] as 'invite' | 'client') || 'invite');
  readonly preview = signal<Preview | null>(null);
  readonly token = signal<string | null>(null);
  readonly loading = signal(true);
  readonly identity = signal<IdentitySignInResponse | null>(null);
  readonly otp = signal<OtpChallenge | null>(null);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal('');
  readonly otpSeconds = signal(0);
  readonly resendSeconds = signal(0);
  private timerId?: ReturnType<typeof setInterval>;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
  });
  private readonly sessionBinding = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  constructor() {
    this.route.fragment.subscribe(fragment => {
      const token = new URLSearchParams(fragment || '').get(this.mode() === 'invite' ? 'token' : 'code');
      this.token.set(token);
      const request: Observable<Preview> = this.mode() === 'invite'
        ? this.onboarding.previewWorkspaceInvite(token || '')
        : this.onboarding.previewClientJoin(token || '');
      request.subscribe({
        next: value => { this.preview.set(value); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  workspaceName(): string { return this.preview()?.workspaceName || ''; }
  inviteRole(): string { return String((this.preview() as WorkspaceInvitePreview | null)?.role ?? 'عضو'); }

  signIn(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.busy.set(true); this.error.set('');
    this.onboarding.identityLogin(value.email, value.password).subscribe({
      next: identity => { this.identity.set(identity); this.busy.set(false); },
      error: err => { this.error.set(err?.translatedMessage || 'تعذر تسجيل الدخول.'); this.busy.set(false); },
    });
  }

  complete(): void {
    const token = this.token();
    const identity = this.identity();
    if (!token || !identity) return;
    this.busy.set(true); this.error.set('');
    if (this.mode() === 'client') {
      this.onboarding.joinWorkspaceAsClient(token, identity.workspaceSelectionToken).subscribe({
        next: () => this.completeSuccess(),
        error: err => this.completeFailure(err),
      });
      return;
    }
    this.onboarding.acceptWorkspaceInvite(token, identity.workspaceSelectionToken).subscribe({
      next: () => this.completeSuccess(),
      error: err => {
        if (err?.error?.message === 'INVITE_OTP_REQUIRED' || err?.error?.code === 'INVITE_OTP_REQUIRED') {
          this.requestInviteOtp();
        } else {
          this.completeFailure(err);
        }
      },
    });
  }

  completeWithOtp(): void {
    const token = this.token(), identity = this.identity(), challenge = this.otp();
    if (!token || !identity || !challenge || this.otpForm.invalid) return;
    this.busy.set(true); this.error.set('');
    this.onboarding.acceptWorkspaceInvite(token, identity.workspaceSelectionToken, challenge.challengeId,
      this.otpForm.controls.code.value, this.sessionBinding).subscribe({
      next: () => this.completeSuccess(),
      error: err => this.completeFailure(err),
    });
  }

  requestInviteOtp(): void {
    const token = this.token(), identity = this.identity();
    if (!token || !identity) return;
    this.busy.set(true); this.error.set('');
    this.onboarding.requestInviteOtp(token, identity.workspaceSelectionToken, this.sessionBinding).subscribe({
      next: challenge => {
        this.otp.set(challenge); this.otpForm.reset(); this.startTimer(challenge); this.busy.set(false);
      },
      error: err => this.completeFailure(err),
    });
  }

  formatTime(value: number): string {
    return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void { this.stopTimer(); }

  private completeSuccess(): void {
    this.stopTimer();
    this.done.set(true); this.busy.set(false); this.otp.set(null);
  }
  private completeFailure(err: any): void {
    const code = err?.error?.message || err?.error?.code;
    this.error.set(code === 'OTP_EXPIRED' ? 'انتهت صلاحية الرمز. أعد الإرسال.'
      : code === 'OTP_LOCKED' ? 'تم تجاوز عدد المحاولات. أعد الإرسال.'
      : code === 'OTP_ALREADY_USED' ? 'تم استخدام هذا الرمز بالفعل.'
      : err?.translatedMessage || code || 'تعذر إكمال العملية.');
    this.busy.set(false);
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
}
