import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  IdentitySignInResponse,
  IdentityWorkspace,
  PendingApplication,
  WorkspaceType,
} from '../../../../core/freelance/models/freelance.models';

/** Identity-first sign-in: it never issues a tenant session until a workspace is selected. */
@Component({
  selector: 'app-identity-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-page" [class.recovery-mode]="trackingRecovery">
      <div class="identity-steps" aria-label="خطوات الدخول بالهوية">
        <span class="identity-step" [class.active]="!result()" [class.complete]="!!result()"><b>1</b> إثبات الهوية</span>
        <span class="identity-step" [class.active]="!!result()"><b>2</b> اختيار الوجهة</span>
      </div>
      @if (!result()) {
        @if (trackingRecovery) {
          <div class="recovery-banner"><i class="pi pi-refresh" aria-hidden="true"></i><div><b>استعادة متابعة الطلب</b><p>انتهت جلسة المتابعة المؤقتة. أثبت هويتك لإصدار جلسة جديدة دون فقدان طلبك.</p></div></div>
        }
        <h2>{{ trackingRecovery ? 'أثبت هويتك للمتابعة' : 'الدخول إلى حسابك' }}</h2>
        <p class="subtitle">استخدم بريدك الإلكتروني أو رقم هاتفك، ثم اختر مساحة العمل أو الطلب الذي تريد متابعته.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label>البريد الإلكتروني أو رقم الهاتف</label>
          <input class="form-input" formControlName="identifier" autocomplete="username" />
          <label>كلمة المرور</label>
          <input class="form-input" type="password" formControlName="password" autocomplete="current-password" />
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary w-full" [disabled]="loading() || form.invalid">
            {{ loading() ? 'جارٍ التحقق...' : 'متابعة' }}
          </button>
        </form>
        <p class="secondary-link">تريد الدخول إلى جيم محدد؟ <a routerLink="/auth/login">دخول الجيم</a></p>
      } @else {
        @if (trackingRecovery) {
          <div class="recovery-banner success"><i class="pi pi-check-circle" aria-hidden="true"></i><div><b>تم التحقق من هويتك</b><p>اختر طلبك من القائمة لإصدار جلسة متابعة جديدة وآمنة.</p></div></div>
        }
        <h2>اختر وجهتك</h2>
        <p class="subtitle">يمكنك الدخول إلى مساحة نشطة أو متابعة أي طلب قائم دون أن يؤثر أحدهما في الآخر.</p>

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
          <h3>{{ trackingRecovery ? 'اختر الطلب الذي تريد متابعته' : 'طلباتك قيد المتابعة' }}</h3>
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
          <p class="empty">لا توجد مساحة عمل نشطة أو طلبات قائمة لهذه الهوية.</p>
        }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="button" class="text-button" (click)="reset()">استخدام حساب آخر</button>
      }
    </section>
  `,
  styles: [`
    .identity-steps { align-items:center; display:flex; gap:.6rem; margin:0 0 1.5rem; }.identity-step { align-items:center; color:var(--text-muted); display:flex; font-size:.78rem; font-weight:700; gap:.4rem; }.identity-step:not(:last-child)::after { background:var(--border-color); content:''; height:1px; margin-inline-start:.2rem; width:1.75rem; }.identity-step b { align-items:center; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:50%; display:flex; height:1.45rem; justify-content:center; width:1.45rem; }.identity-step.active { color:var(--primary-700); }.identity-step.active b,.identity-step.complete b { background:var(--primary-600); border-color:var(--primary-600); color:#fff; }.identity-page h2 { margin:0 0 .45rem; color:var(--text-primary); font-size:1.75rem; }
    .subtitle { margin:0 0 1.5rem; color:var(--text-secondary); line-height:1.7; }
    form { display:grid; gap:.55rem; } label { color:var(--text-primary); font-size:.9rem; font-weight:600; margin-top:.35rem; }
    .form-input { width:100%; min-height:46px; padding:.7rem .85rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-primary); color:var(--text-primary); }
    .btn { min-height:48px; margin-top:1rem; } .w-full { width:100%; } .btn:disabled { opacity:.65; cursor:not-allowed; }
    h3 { margin:1.5rem 0 .65rem; color:var(--text-primary); font-size:1rem; }.cards { display:grid; gap:.65rem; }
    .choice-card { width:100%; display:flex; align-items:center; gap:.8rem; padding:.9rem; text-align:start; border:1px solid var(--border-color); border-radius:10px; background:var(--bg-primary); color:var(--text-primary); cursor:pointer; }
    .choice-card:hover:not(:disabled) { border-color:#3b82f6; background:rgba(59,130,246,.04); }.choice-card:disabled { opacity:.6; cursor:wait; }
    .choice-card > span:nth-child(2) { display:grid; gap:.15rem; flex:1; }.choice-card small { color:var(--text-secondary); }.card-icon { display:grid; place-items:center; width:2.25rem; height:2.25rem; border-radius:50%; color:#2563eb; background:rgba(37,99,235,.1); }.pending .card-icon { color:#b45309; background:#fff7ed; }
    .recovery-banner { align-items:flex-start; background:var(--primary-50); border:1px solid var(--primary-200); border-radius:12px; color:var(--primary-800); display:flex; gap:.7rem; line-height:1.55; margin:0 0 1.25rem; padding:.8rem .9rem; }.recovery-banner.success { background:var(--success-50); border-color:var(--success-100); color:var(--success-600); }.recovery-banner i { font-size:1.1rem; margin-top:.15rem; }.recovery-banner div { display:grid; gap:.15rem; }.recovery-banner p { font-size:.82rem; margin:0; }.secondary-link { margin-top:1.5rem; text-align:center; color:var(--text-secondary); }.secondary-link a,.text-button { color:#2563eb; text-decoration:none; }.text-button { border:0; background:transparent; cursor:pointer; padding:1rem 0 0; font:inherit; }
    .error { margin:.75rem 0 0; color:#b91c1c; font-size:.9rem; }.empty { padding:1rem; border-radius:8px; color:var(--text-secondary); background:var(--bg-secondary); }
  `],
})
export class IdentityLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly WorkspaceType = WorkspaceType;
  readonly trackingRecovery = this.route.snapshot.queryParamMap.get('continue') === 'application-status';
  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
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
    const { identifier, password } = this.form.getRawValue();
    this.onboarding.identityLogin(identifier, password).subscribe({
      next: result => { this.result.set(result); this.loading.set(false); },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر التحقق من الهوية.'); this.loading.set(false); },
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
