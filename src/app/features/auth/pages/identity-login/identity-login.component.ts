import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { IdentitySignInResponse, IdentityWorkspace, PendingApplication, WorkspaceType } from '../../../../core/freelance/models/freelance.models';

@Component({
  selector: 'app-identity-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-flow" dir="rtl">
      @if (!result()) {
        <header>
          <span class="brand-mark"><i class="pi pi-bolt"></i></span>
          <p class="eyebrow">LogicFit Identity</p>
          <h1>أهلاً بك</h1>
          <p>سجّل الدخول بهويتك الموحدة باستخدام البريد الإلكتروني وكلمة المرور.</p>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label for="identity-email">البريد الإلكتروني</label>
          <div class="input-shell"><i class="pi pi-envelope"></i><input id="identity-email" type="email" formControlName="email" autocomplete="email" dir="ltr" placeholder="name@example.com"></div>
          @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">أدخل بريدًا إلكترونيًا صحيحًا.</p> }
          <label for="identity-password">كلمة المرور</label>
          <div class="input-shell"><i class="pi pi-lock"></i><input id="identity-password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" dir="ltr"><button class="input-action" type="button" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"><i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i></button></div>
          <button class="primary" [disabled]="loading() || form.invalid">@if (loading()) { <i class="pi pi-spin pi-spinner"></i> } {{ loading() ? 'جارٍ التحقق...' : 'متابعة' }}</button>
        </form>
        @if (error()) { <p class="error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</p> }
        <p class="security-note"><i class="pi pi-shield"></i> لا نطلب منك اختيار دور؛ الصلاحيات تأتي من مساحة العمل.</p>
      } @else {
        <header class="compact">
          <p class="eyebrow">{{ result()!.activeWorkspaces.length > 1 ? 'مساحاتك' : 'طلباتك' }}</p>
          <h1>{{ result()!.activeWorkspaces.length > 1 ? 'اختر مساحة العمل' : 'طلبات قيد المتابعة' }}</h1>
          <p>اختر الوجهة المطلوبة لإكمال الدخول أو متابعة الطلب.</p>
        </header>
        @if (result()!.activeWorkspaces.length) {
          <h2 class="section-title">مساحات العمل النشطة</h2>
          <div class="cards">
            @for (workspace of result()!.activeWorkspaces; track workspace.workspaceId) {
              <button class="choice-card" type="button" (click)="selectWorkspace(workspace)" [disabled]="selecting()">
                <span class="workspace-icon"><i class="pi" [class.pi-building]="workspace.workspaceType === WorkspaceType.Gym" [class.pi-user]="workspace.workspaceType === WorkspaceType.FreelanceCoach"></i></span>
                <span class="choice-copy"><b>{{ workspace.name }}</b><small>{{ workspace.identifier || workspaceLabel(workspace) }} · {{ workspace.role }}</small></span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }
        @if (result()!.pendingApplications.length) {
          <h2 class="section-title">طلبات قيد المتابعة</h2>
          <div class="cards">
            @for (application of result()!.pendingApplications; track application.applicationId) {
              <button class="choice-card pending" [class.pending-gym]="application.workspaceType === WorkspaceType.Gym" [class.pending-freelance]="application.workspaceType === WorkspaceType.FreelanceCoach" type="button" (click)="trackApplication(application)" [disabled]="tracking()">
                <span class="workspace-icon"><i class="pi" [class.pi-building]="application.workspaceType === WorkspaceType.Gym" [class.pi-user-edit]="application.workspaceType === WorkspaceType.FreelanceCoach" [class.pi-clock]="!application.workspaceType"></i></span>
                <span class="choice-copy"><b>{{ applicationLabel(application) }}</b><small>{{ applicationStatus(application.status) }} · {{ databaseStatus(application) }}</small><span class="pending-message">{{ application.userMessage || 'سيتم عرض المرحلة التالية هنا.' }}</span><em>الخطوة التالية: {{ application.nextStep || 'متابعة الحالة من شاشة التفعيل' }}</em></span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }
        @if (error()) { <p class="error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</p> }
        <button class="text-button" type="button" (click)="reset()">تسجيل الدخول بحساب آخر</button>
      }
    </section>
  `,
  styles: [`:host{display:block}.identity-flow{width:100%;color:var(--text-primary)}header{text-align:center;margin-bottom:1.35rem}header.compact{text-align:start}.brand-mark{display:grid;place-items:center;width:48px;height:48px;margin:0 auto .7rem;border-radius:16px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:1.25rem}.eyebrow{margin:0 0 .25rem;color:#2563eb;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}h1{margin:0;font-size:1.75rem}header p:not(.eyebrow){margin:.45rem 0 0;color:var(--text-secondary);line-height:1.7}form{display:grid;gap:.55rem}label{margin-top:.25rem;font-size:.86rem;font-weight:800}.input-shell{position:relative;display:flex;align-items:center}.input-shell>i{position:absolute;right:.9rem;color:var(--text-muted)}.input-shell input{width:100%;box-sizing:border-box;min-height:48px;padding:.75rem 2.6rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font:inherit}.input-action{position:absolute;left:.55rem;border:0;background:transparent;color:var(--text-muted);cursor:pointer}.field-error,.error{margin:.15rem 0;color:#b91c1c;font-size:.82rem}.error{display:flex;align-items:center;gap:.4rem;padding:.7rem;border-radius:9px;background:#fef2f2}.primary{display:flex;align-items:center;justify-content:center;gap:.45rem;width:100%;min-height:48px;margin-top:.75rem;border:0;border-radius:10px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;font:inherit;font-weight:800;cursor:pointer}.primary:disabled{opacity:.55;cursor:not-allowed}.security-note{margin-top:1.4rem;text-align:center;color:var(--text-secondary);font-size:.78rem}.section-title{margin:1.2rem 0 .55rem;font-size:.92rem}.cards{display:grid;gap:.6rem}.choice-card{display:flex;align-items:center;gap:.75rem;width:100%;padding:.85rem;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-primary);color:var(--text-primary);text-align:start;cursor:pointer}.choice-card:disabled{opacity:.6}.workspace-icon{display:grid;place-items:center;flex:0 0 40px;height:40px;border-radius:12px;background:#eff6ff;color:#2563eb}.pending .workspace-icon{background:#fff7ed;color:#b45309}.pending-freelance{border-color:#ddd6fe}.pending-freelance .workspace-icon{background:#f5f3ff;color:#7c3aed}.pending-gym{border-color:#bfdbfe}.pending-message{display:block;color:var(--text-primary);font-size:.76rem;line-height:1.5}.choice-copy em{display:block;color:#64748b;font-size:.7rem;font-style:normal}.choice-copy{display:grid;gap:.15rem;flex:1}.choice-copy small{color:var(--text-secondary)}.text-button{border:0;background:transparent;color:#2563eb;padding:.65rem 0 0;font:inherit;cursor:pointer}`],
})
export class IdentityLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly WorkspaceType = WorkspaceType;
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  readonly showPassword = signal(false);
  readonly result = signal<IdentitySignInResponse | null>(null);
  readonly loading = signal(false);
  readonly selecting = signal(false);
  readonly tracking = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.onboarding.identityLogin(email, password).subscribe({
      next: value => this.handleIdentity(value),
      error: err => this.fail(err, 'تعذر التحقق من بيانات الدخول.')
    });
  }

  selectWorkspace(workspace: IdentityWorkspace): void {
    const result = this.result();
    if (!result) return;

    this.selecting.set(true);
    this.error.set('');
    this.onboarding.selectWorkspace(result.workspaceSelectionToken, workspace.workspaceId).subscribe({
      next: response => {
        this.auth.completeWorkspaceSelection(response, workspace.workspaceType);
        this.router.navigateByUrl(response.mustChangePassword ? this.auth.getPasswordChangeUrlForRole(response.role) : this.auth.getRedirectUrlForRole(response.role));
      },
      error: err => {
        this.fail(err, 'انتهت جلسة اختيار المساحة. سجّل الدخول مجددًا.');
        this.selecting.set(false);
      }
    });
  }

  trackApplication(application: PendingApplication): void {
    const result = this.result();
    if (!result) return;

    this.tracking.set(true);
    this.error.set('');
    this.onboarding.reissueTrackingSessions(result.workspaceSelectionToken).subscribe({
      next: sessions => {
        const session = sessions.find(item => item.applicationId === application.applicationId);
        if (!session) {
          this.fail(null, 'لا يمكن إصدار جلسة متابعة لهذا الطلب.');
          this.tracking.set(false);
          return;
        }

        this.onboarding.saveTrackingToken(session.trackingToken);
        this.router.navigate(['/identity/application-status']);
      },
      error: err => {
        this.fail(err, 'تعذر فتح متابعة الطلب.');
        this.tracking.set(false);
      }
    });
  }

  reset(): void {
    this.result.set(null);
    this.error.set('');
    this.loading.set(false);
    this.selecting.set(false);
    this.tracking.set(false);
    this.form.reset();
  }

  workspaceLabel(workspace: IdentityWorkspace): string {
    return workspace.workspaceType === WorkspaceType.FreelanceCoach ? 'مساحة مدرب حر' : 'مساحة جيم';
  }

  applicationLabel(application: PendingApplication): string {
    if (application.workspaceType === WorkspaceType.Gym || application.applicationType === 1) return 'طلب إنشاء جيم';
    if (application.workspaceType === WorkspaceType.FreelanceCoach || application.applicationType === 2) return 'طلب مساحة مدرب حر';
    return 'طلب انضمام';
  }

  databaseStatus(application: PendingApplication): string {
    return ({
      Unassigned: 'قاعدة غير مخصصة',
      Provisioning: 'قاعدة قيد التجهيز',
      Ready: 'قاعدة جاهزة',
      Unavailable: 'قاعدة غير متاحة',
      Failed: 'فشل قاعدة البيانات',
      Released: 'تم تحرير القاعدة'
    } as Record<string, string>)[application.databaseStatusCode || 'Unassigned'] || 'حالة القاعدة غير مكتملة';
  }

  applicationStatus(status: number): string {
    return ({ 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال بيانات', 5: 'مقبول', 6: 'مرفوض', 7: 'ملغى', 8: 'منتهٍ' } as Record<number, string>)[status] || 'مسودة';
  }

  private handleIdentity(value: IdentitySignInResponse): void {
    this.loading.set(false);
    this.result.set(value);

    // A deterministic destination must never be hidden behind a context screen.
    // Keep an explicit chooser only when more than one destination is possible.
    if (value.activeWorkspaces.length === 1) {
      this.selectWorkspace(value.activeWorkspaces[0]);
      return;
    }

    if (value.activeWorkspaces.length === 0 && value.pendingApplications.length === 1) {
      this.trackApplication(value.pendingApplications[0]);
      return;
    }

    // Do not render the old empty "ابدأ باستخدام LogicFit" state. Registration and
    // joining remain separate entry flows; this login result means no destination.
    if (!value.activeWorkspaces.length && !value.pendingApplications.length) {
      this.result.set(null);
      this.error.set('لا توجد مساحة عمل نشطة أو طلب قيد المتابعة بهذا الحساب.');
    }
  }

  private fail(error: any, fallback: string): void {
    this.error.set(error?.translatedMessage || error?.error?.message || fallback);
    this.loading.set(false);
  }
}
