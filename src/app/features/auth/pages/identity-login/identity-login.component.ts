import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  IdentitySignInResponse,
  IdentityWorkspace,
  PendingApplication,
  WorkspaceType,
} from '../../../../core/freelance/models/freelance.models';

/** Email-only global sign-in. A tenant session is issued only after workspace selection. */
@Component({
  selector: 'app-identity-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-page">
      <div class="stepper" aria-label="خطوات الدخول">
        <span class="step active">1</span><span class="line"></span><span class="step" [class.active]="result()">2</span>
      </div>

      @if (!result()) {
        <p class="eyebrow">LogicFit Identity</p>
        <h2>تسجيل الدخول إلى حسابك</h2>
        <p class="subtitle">استخدم بريدك الإلكتروني المؤكد، ثم اختر مساحة العمل التي تريد إدارتها.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label for="identity-email">البريد الإلكتروني</label>
          <input id="identity-email" class="form-input" type="email" formControlName="email" autocomplete="email" dir="ltr" />
          @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">أدخل بريدًا إلكترونيًا صحيحًا.</p> }
          <label for="identity-password">كلمة المرور</label>
          <input id="identity-password" class="form-input" type="password" formControlName="password" autocomplete="current-password" dir="ltr" />
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary w-full" [disabled]="loading() || form.invalid">
            {{ loading() ? 'جارٍ التحقق...' : 'متابعة' }}
          </button>
        </form>
        <div class="helper-links">
          <a routerLink="/identity/reset-password">نسيت كلمة المرور؟</a>
          <a routerLink="/identity/register">إنشاء هوية جديدة</a>
        </div>
        <p class="secondary-link">تريد الدخول إلى جيم محدد؟ <a routerLink="/auth/login">دخول الجيم</a></p>
      } @else {
        <p class="eyebrow">الخطوة 2 من 2</p>
        <h2>اختر وجهتك</h2>
        <p class="subtitle">يمكنك دخول مساحة نشطة أو متابعة طلب قائم دون أن يحجب أحدهما الآخر.</p>

        @if (result()!.activeWorkspaces.length) {
          <h3>مساحات العمل النشطة</h3>
          <div class="cards">
            @for (workspace of result()!.activeWorkspaces; track workspace.workspaceId) {
              <button class="choice-card" type="button" (click)="selectWorkspace(workspace)" [disabled]="selecting()">
                <span class="card-icon"><i class="pi" [class.pi-building]="workspace.workspaceType === WorkspaceType.Gym" [class.pi-user]="workspace.workspaceType === WorkspaceType.FreelanceCoach"></i></span>
                <span><b>{{ workspace.name }}</b><small>{{ workspace.identifier || workspaceLabel(workspace) }}</small></span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }

        @if (result()!.pendingApplications.length) {
          <h3>طلباتك قيد المتابعة</h3>
          <div class="cards">
            @for (application of result()!.pendingApplications; track application.applicationId) {
              <button class="choice-card pending" type="button" (click)="trackApplication(application)" [disabled]="tracking()">
                <span class="card-icon"><i class="pi pi-clock"></i></span>
                <span><b>{{ applicationLabel(application) }}</b><small>{{ applicationStatus(application.status) }}</small></span>
                <i class="pi pi-arrow-left"></i>
              </button>
            }
          </div>
        }

        @if (!result()!.activeWorkspaces.length && !result()!.pendingApplications.length) {
          <div class="empty">
            <b>لا توجد مساحة عمل أو طلب قائم لهذا البريد.</b>
            <div class="start-cards">
              <a routerLink="/auth/register-gym"><i class="pi pi-building"></i> إنشاء جيم</a>
              <a routerLink="/auth/register-freelance"><i class="pi pi-user-plus"></i> مساحة مدرب حر</a>
              <a routerLink="/identity/register"><i class="pi pi-users"></i> الانضمام بدعوة</a>
            </div>
          </div>
        }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="button" class="text-button" (click)="reset()">استخدام حساب آخر</button>
      }
    </section>
  `,
  styles: [`
    .identity-page { width:100%; }.stepper { display:flex; align-items:center; justify-content:center; gap:.45rem; margin:0 0 1.25rem; }.step { display:grid; place-items:center; width:1.75rem; height:1.75rem; border-radius:50%; background:var(--bg-secondary); color:var(--text-muted); font-size:.8rem; font-weight:800; }.step.active { background:#2563eb; color:#fff; }.line { width:3.5rem; height:2px; background:var(--border-color); }.eyebrow { margin:0 0 .35rem; color:#2563eb; font-weight:800; font-size:.75rem; letter-spacing:.08em; text-transform:uppercase; }.identity-page h2 { margin:0 0 .45rem; color:var(--text-primary); font-size:1.75rem; }.subtitle { margin:0 0 1.5rem; color:var(--text-secondary); line-height:1.7; } form { display:grid; gap:.55rem; } label { color:var(--text-primary); font-size:.9rem; font-weight:700; margin-top:.35rem; }.form-input { width:100%; box-sizing:border-box; min-height:46px; padding:.7rem .85rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-primary); color:var(--text-primary); }.field-error,.error { margin:.1rem 0 0; color:#b91c1c; font-size:.85rem; }.btn { min-height:48px; margin-top:1rem; }.w-full { width:100%; }.btn:disabled { opacity:.65; cursor:not-allowed; }.helper-links { display:flex; justify-content:space-between; gap:1rem; margin-top:1rem; font-size:.88rem; }.helper-links a,.secondary-link a,.text-button { color:#2563eb; text-decoration:none; }.secondary-link { margin-top:1.5rem; text-align:center; color:var(--text-secondary); } h3 { margin:1.5rem 0 .65rem; color:var(--text-primary); font-size:1rem; }.cards { display:grid; gap:.65rem; }.choice-card { width:100%; display:flex; align-items:center; gap:.8rem; padding:.9rem; text-align:start; border:1px solid var(--border-color); border-radius:10px; background:var(--bg-primary); color:var(--text-primary); cursor:pointer; }.choice-card:hover:not(:disabled) { border-color:#3b82f6; background:rgba(59,130,246,.04); }.choice-card:disabled { opacity:.6; cursor:wait; }.choice-card > span:nth-child(2) { display:grid; gap:.15rem; flex:1; }.choice-card small { color:var(--text-secondary); }.card-icon { display:grid; place-items:center; width:2.25rem; height:2.25rem; border-radius:50%; color:#2563eb; background:rgba(37,99,235,.1); }.pending .card-icon { color:#b45309; background:#fff7ed; }.text-button { border:0; background:transparent; cursor:pointer; padding:1rem 0 0; font:inherit; }.empty { padding:1rem; border-radius:10px; color:var(--text-secondary); background:var(--bg-secondary); line-height:1.7; }.start-cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; margin-top:.85rem; }.start-cards a { display:grid; gap:.35rem; align-content:center; min-height:74px; padding:.7rem; border:1px solid var(--border-color); border-radius:.65rem; color:var(--text-primary); background:var(--bg-primary); text-decoration:none; font-size:.82rem; }.start-cards i { color:#2563eb; }.start-cards a:hover { border-color:#3b82f6; } @media (max-width:480px) { .helper-links { flex-direction:column; gap:.55rem; }.start-cards { grid-template-columns:1fr; } }
  `],
})
export class IdentityLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly WorkspaceType = WorkspaceType;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly result = signal<IdentitySignInResponse | null>(null);
  readonly loading = signal(false);
  readonly selecting = signal(false);
  readonly tracking = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.onboarding.identityLogin(email, password).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
        if (!result.requiresWorkspaceSelection && result.activeWorkspaces.length === 1 && result.pendingApplications.length === 0) {
          this.selectWorkspace(result.activeWorkspaces[0]);
        }
      },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر التحقق من بيانات الدخول.'); this.loading.set(false); },
    });
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
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'انتهت جلسة اختيار المساحة. سجّل الدخول مرة أخرى.'); this.selecting.set(false); },
    });
  }

  trackApplication(application: PendingApplication): void {
    const result = this.result();
    if (!result) return;
    this.tracking.set(true); this.error.set('');
    this.onboarding.reissueTrackingSessions(result.workspaceSelectionToken).subscribe({
      next: sessions => {
        const session = sessions.find(item => item.applicationId === application.applicationId);
        if (!session) { this.error.set('لا يمكن إصدار جلسة متابعة لهذا الطلب.'); this.tracking.set(false); return; }
        this.onboarding.saveTrackingToken(session.trackingToken);
        this.router.navigate(['/identity/application-status']);
      },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'انتهت جلسة اختيار المساحة. سجّل الدخول مرة أخرى.'); this.tracking.set(false); },
    });
  }

  reset(): void { this.result.set(null); this.error.set(''); this.form.reset(); }
  workspaceLabel(workspace: IdentityWorkspace): string { return workspace.workspaceType === WorkspaceType.FreelanceCoach ? 'مساحة مدرب حر' : 'مساحة جيم'; }
  applicationLabel(application: PendingApplication): string { return application.applicationType === 2 ? 'طلب إنشاء مساحة مدرب حر' : 'طلب انضمام'; }
  applicationStatus(status: number): string { return ({ 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال بيانات', 5: 'مقبول', 6: 'مرفوض', 7: 'ملغى', 8: 'منتهي' } as Record<number, string>)[status] || 'مسودة'; }
}
