import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';

@Component({
  selector: 'app-identity-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-register">
      <h2>إنشاء هوية LogicFit</h2>
      <p class="subtitle">الهوية لا تمنحك وصولًا تلقائيًا لأي مساحة عمل. يستخدمها مالك المساحة لإرسال طلب انضمامك ثم تعتمد الإدارة الطلب.</p>
      @if (completed()) { <div class="success">تم إنشاء الهوية. أعطِ مالك مساحة المدرب الحر بريدك الإلكتروني نفسه ليقدّم طلب الانضمام.</div> }
      @else { <form [formGroup]="form" (ngSubmit)="submit()"><label>البريد الإلكتروني<input class="form-input" type="email" formControlName="email" autocomplete="email" /></label><label>رقم الهاتف (اختياري)<input class="form-input" formControlName="phoneNumber" autocomplete="tel" /></label><label>كلمة المرور<input class="form-input" type="password" formControlName="password" autocomplete="new-password" /></label><label>تأكيد كلمة المرور<input class="form-input" type="password" formControlName="confirmPassword" autocomplete="new-password" /></label>@if (error()) { <p class="error">{{ error() }}</p> }<button class="btn btn-primary" [disabled]="saving() || form.invalid">{{ saving() ? 'جارٍ الإنشاء...' : 'إنشاء الهوية' }}</button></form> }
      <p class="link"><a routerLink="/identity/login">لديك هوية بالفعل؟ سجّل الدخول</a></p>
    </section>
  `,
  styles: [`
    .identity-register h2 { margin:0 0 .5rem; color:var(--text-primary); font-size:1.65rem; }.subtitle { color:var(--text-secondary); line-height:1.7; }.identity-register form { display:grid; gap:.8rem; margin-top:1rem; } label { display:grid; gap:.35rem; color:var(--text-primary); font-size:.9rem; font-weight:600; }.form-input { width:100%; box-sizing:border-box; min-height:42px; padding:.65rem .75rem; border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary); background:var(--bg-primary); font:inherit; }.btn { min-height:46px; }.btn:disabled { opacity:.65; }.success { margin-top:1rem; padding:.9rem; border:1px solid #86efac; border-radius:.65rem; color:#166534; background:#f0fdf4; line-height:1.7; }.error { margin:0; color:#b91c1c; }.link { margin-top:1rem; }.link a { color:#2563eb; }
  `],
})
export class IdentityRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  readonly saving = signal(false);
  readonly completed = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], phoneNumber: [''], password: ['', [Validators.required, Validators.minLength(8)]], confirmPassword: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const data = this.form.getRawValue();
    if (data.password !== data.confirmPassword) { this.error.set('كلمتا المرور غير متطابقتين.'); return; }
    this.saving.set(true); this.error.set('');
    this.onboarding.registerIdentity(data.email, data.phoneNumber || undefined, data.password).subscribe({ next: () => { this.saving.set(false); this.completed.set(true); }, error: err => { this.saving.set(false); this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر إنشاء الهوية.'); } });
  }
}
