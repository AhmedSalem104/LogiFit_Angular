import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';

@Component({
  selector: 'app-identity-email-verification', standalone: true, imports: [RouterModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="email-action"><i class="pi" [class.pi-spin]="loading()" [class.pi-spinner]="loading()" [class.pi-check-circle]="completed()" [class.pi-times-circle]="error()"></i><h2>{{ loading() ? 'جارٍ تأكيد البريد...' : completed() ? 'تم تأكيد بريدك الإلكتروني' : 'تعذر تأكيد البريد' }}</h2><p>{{ message() }}</p><a class="btn btn-primary" routerLink="/identity/login">الانتقال لتسجيل الدخول</a></section>`,
  styles: [`.email-action{text-align:center;display:grid;justify-items:center;gap:.8rem}.email-action i{font-size:2.4rem;color:#2563eb}.email-action h2{margin:0;color:var(--text-primary)}.email-action p{margin:0;color:var(--text-secondary);line-height:1.7}.email-action .pi-check-circle{color:#16a34a}.email-action .pi-times-circle{color:#dc2626}.btn{text-decoration:none;padding:.75rem 1rem}`],
})
export class IdentityEmailVerificationComponent {
  private readonly route = inject(ActivatedRoute); private readonly onboarding = inject(FreelanceOnboardingService);
  readonly loading = signal(true); readonly completed = signal(false); readonly error = signal(false); readonly message = signal('نتحقق من رابط التأكيد الآمن.');
  constructor() { this.route.fragment.subscribe(fragment => { const token = new URLSearchParams(fragment || '').get('token'); if (!token) { this.fail('رابط التأكيد غير مكتمل أو منتهي الصلاحية.'); return; } this.onboarding.verifyIdentityEmail(token).subscribe({ next: () => { this.loading.set(false); this.completed.set(true); this.message.set('يمكنك الآن تسجيل الدخول بالبريد وكلمة المرور.'); }, error: () => this.fail('الرابط غير صالح أو انتهت صلاحيته أو تم استخدامه سابقًا.') }); }); }
  private fail(message: string): void { this.loading.set(false); this.error.set(true); this.message.set(message); }
}
