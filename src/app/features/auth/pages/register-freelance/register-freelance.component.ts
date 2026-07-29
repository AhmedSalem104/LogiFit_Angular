import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';

@Component({
  selector: 'app-register-freelance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="freelance-page">
      <a routerLink="/auth/login" class="back-link">← العودة لتسجيل الدخول</a>
      <h2>إنشاء مساحة مدرب حر</h2>
      <p class="subtitle">قدّم طلبك بهويتك وعلامتك المستقلة. لن تُفعّل المساحة قبل اعتماد إدارة المنصة.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h3>الهوية وبيانات المالك</h3>
        <div class="grid">
          <label>الاسم الكامل<input class="form-input" formControlName="ownerFullName" /></label>
          <label>البريد الإلكتروني<input class="form-input" type="email" formControlName="email" autocomplete="email" /></label>
          <label>رقم الهاتف<input class="form-input" formControlName="phoneNumber" autocomplete="tel" /></label>
          <label>كلمة المرور<input class="form-input" type="password" formControlName="password" autocomplete="new-password" /></label>
          <label>تأكيد كلمة المرور<input class="form-input" type="password" formControlName="confirmPassword" autocomplete="new-password" /></label>
        </div>
        <h3>مساحة العمل والهوية البصرية</h3>
        <div class="grid">
          <label>اسم المساحة<input class="form-input" formControlName="workspaceName" /></label>
          <label>المعرّف والرابط<input class="form-input" formControlName="workspaceIdentifier" dir="ltr" placeholder="coach-ahmed" /><small>حروف إنجليزية وأرقام وشرطة فقط.</small></label>
          <label>الاسم التجاري<input class="form-input" formControlName="brandName" /></label>
          <label>اللون الأساسي<input class="form-input color" type="color" formControlName="primaryColor" /></label>
          <label>اللون الثانوي<input class="form-input color" type="color" formControlName="secondaryColor" /></label>
          <label>التخصصات<input class="form-input" formControlName="specialties" placeholder="قوة، تغذية، لياقة" /></label>
          <label>الشهادات<input class="form-input" formControlName="certifications" placeholder="مثال: ISSA" /></label>
        </div>
        <label>نبذة عنك<textarea class="form-input" rows="4" formControlName="bio"></textarea></label>
        <label>رسالة الترحيب<textarea class="form-input" rows="3" formControlName="welcomeMessage"></textarea></label>
        <label class="terms"><input type="checkbox" formControlName="acceptTerms" /> أقر بصحة البيانات وأوافق على مراجعة الطلب.</label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="btn btn-primary w-full" [disabled]="loading() || form.invalid">{{ loading() ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .freelance-page h2 { margin:1rem 0 .45rem; color:var(--text-primary); font-size:1.65rem; }.subtitle { color:var(--text-secondary); line-height:1.7; }.back-link { color:#2563eb; text-decoration:none; font-size:.9rem; }
    form { display:grid; gap:.8rem; margin-top:1.25rem; } h3 { margin:.7rem 0 0; color:var(--text-primary); font-size:1rem; }.grid { display:grid; gap:.8rem; grid-template-columns:repeat(2,minmax(0,1fr)); } label { display:grid; gap:.35rem; color:var(--text-primary); font-size:.85rem; font-weight:600; } small { color:var(--text-secondary); font-weight:400; }.form-input { box-sizing:border-box; width:100%; min-height:42px; padding:.65rem .75rem; border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary); background:var(--bg-primary); font:inherit; }.color { padding:.2rem; }.terms { display:flex; align-items:center; gap:.5rem; font-weight:400; }.btn { min-height:48px; }.w-full { width:100%; }.btn:disabled { opacity:.65; cursor:not-allowed; }.error { color:#b91c1c; margin:0; font-size:.9rem; } @media(max-width:600px) { .grid { grid-template-columns:1fr; } }
  `],
})
export class RegisterFreelanceComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    ownerFullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    workspaceName: ['', Validators.required],
    workspaceIdentifier: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,98}[a-zA-Z0-9])?$/)]],
    brandName: [''], primaryColor: ['#2563eb'], secondaryColor: ['#0f172a'],
    specialties: [''], certifications: [''], bio: ['', Validators.maxLength(4000)], welcomeMessage: ['', Validators.maxLength(1000)],
    acceptTerms: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const data = this.form.getRawValue();
    if (data.password !== data.confirmPassword) { this.error.set('كلمتا المرور غير متطابقتين.'); return; }
    this.loading.set(true); this.error.set('');
    this.onboarding.submitFreelanceWorkspace({
      email: data.email, phoneNumber: data.phoneNumber || undefined, password: data.password,
      workspaceName: data.workspaceName, workspaceIdentifier: data.workspaceIdentifier.toLowerCase(), ownerFullName: data.ownerFullName,
      brandName: data.brandName || undefined, primaryColor: data.primaryColor, secondaryColor: data.secondaryColor,
      specialties: this.toList(data.specialties), certifications: this.toList(data.certifications), bio: data.bio || undefined, welcomeMessage: data.welcomeMessage || undefined,
    }).subscribe({
      next: () => this.router.navigate(['/identity/application-status']),
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر إرسال الطلب.'); this.loading.set(false); },
    });
  }

  private toList(value: string): string[] { return value.split(',').map(item => item.trim()).filter(Boolean); }
}
