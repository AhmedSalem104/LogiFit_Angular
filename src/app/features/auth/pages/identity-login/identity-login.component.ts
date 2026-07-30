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

type IdentityLoginStep = 'identifier' | 'credentials' | 'destination';

/**
 * The public entry for LogicFit. It proves one global identity first, then lets
 * the user enter an active workspace or resume a pending application. The
 * tenant-specific login remains available only as an explicit compatibility path.
 */
@Component({
  selector: 'app-identity-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="identity-onboarding" aria-labelledby="identity-title">
      <header class="identity-header">
        <span class="eyebrow"><i class="pi pi-shield"></i> LogicFit</span>
        <ol class="progress" aria-label="خطوات الدخول">
          <li [class.active]="step() !== 'destination'" [class.complete]="step() === 'destination'">
            <span>1</span><small>الهوية</small>
          </li>
          <li [class.active]="step() === 'destination'"><span>2</span><small>وجهتك</small></li>
        </ol>
      </header>

      @if (step() === 'identifier') {
        <div class="step-content">
          <div class="step-icon"><i class="pi pi-user"></i></div>
          <h1 id="identity-title">مرحبًا بك في LogicFit</h1>
          <p class="subtitle">ابدأ بهويتك مرة واحدة، ثم اختر مساحة العمل أو تابع طلبك من مكان واحد.</p>

          <form [formGroup]="form" (ngSubmit)="continueToCredentials()" novalidate>
            <label for="identifier">البريد الإلكتروني أو رقم الهاتف</label>
            <div class="input-with-icon">
              <i class="pi pi-envelope"></i>
              <input id="identifier" class="form-input" formControlName="identifier" autocomplete="username" inputmode="email" placeholder="name@example.com أو 01xxxxxxxxx" />
            </div>
            @if (identifierInvalid()) { <p class="field-error">أدخل بريدًا إلكترونيًا أو رقم هاتف للمتابعة.</p> }
            <button class="btn btn-primary w-full" type="submit">متابعة <i class="pi pi-arrow-left"></i></button>
          </form>

          <p class="supporting-copy">لن نعرض ما إذا كانت هذه الهوية مسجلة قبل التحقق منها.</p>
          <p class="secondary-link">ليس لديك حساب؟ <a routerLink="/identity/register">أنشئ هوية جديدة</a></p>
        </div>
      } @else if (step() === 'credentials') {
        <div class="step-content">
          <button type="button" class="back-button" (click)="backToIdentifier()"><i class="pi pi-arrow-right"></i> تعديل الهوية</button>
          <div class="step-icon"><i class="pi pi-lock"></i></div>
          <h1 id="identity-title">أكمل تسجيل الدخول</h1>
          <p class="subtitle">استخدم كلمة المرور المرتبطة بـ <b dir="ltr">{{ form.controls.identifier.value }}</b>.</p>

          <form [formGroup]="form" (ngSubmit)="signIn()" novalidate>
            <label for="password">كلمة المرور</label>
            <div class="input-with-icon">
              <i class="pi pi-lock"></i>
              <input id="password" class="form-input" type="password" formControlName="password" autocomplete="current-password" />
            </div>
            @if (passwordInvalid()) { <p class="field-error">كلمة المرور مطلوبة.</p> }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button class="btn btn-primary w-full" type="submit" [disabled]="loading()">
              @if (loading()) { <i class="pi pi-spin pi-spinner"></i> جارٍ التحقق... } @else { تسجيل الدخول <i class="pi pi-arrow-left"></i> }
            </button>
          </form>

          <div class="compatibility-links">
            <a routerLink="/auth/forgot-password">نسيت كلمة المرور؟</a>
            <span aria-hidden="true">•</span>
            <a routerLink="/auth/login">دخول الجيم بالطريقة السابقة</a>
          </div>
        </div>
      } @else {
        <div class="step-content destination-step">
          <div class="step-icon success"><i class="pi pi-check"></i></div>
          <h1 id="identity-title">اختر وجهتك</h1>
          <p class="subtitle">تظهر مساحاتك وطلباتك معًا؛ متابعة طلب لا تمنعك من دخول مساحة نشطة.</p>

          @if (result()!.activeWorkspaces.length) {
            <section class="choice-section" aria-labelledby="workspaces-title">
              <div class="section-heading"><h2 id="workspaces-title">مساحات العمل النشطة</h2><span>{{ result()!.activeWorkspaces.length }}</span></div>
              <div class="choice-list">
                @for (workspace of result()!.activeWorkspaces; track workspace.workspaceId) {
                  <button class="choice-card workspace-choice" type="button" (click)="selectWorkspace(workspace)" [disabled]="selecting()">
                    <span class="card-icon" [class.freelance]="workspace.workspaceType === WorkspaceType.FreelanceCoach">
                      <i class="pi" [class.pi-building]="workspace.workspaceType === WorkspaceType.Gym" [class.pi-user]="workspace.workspaceType === WorkspaceType.FreelanceCoach"></i>
                    </span>
                    <span class="choice-copy"><b>{{ workspace.name }}</b><small>{{ workspace.identifier || workspaceLabel(workspace) }}</small></span>
                    <i class="pi pi-arrow-left" aria-hidden="true"></i>
                  </button>
                }
              </div>
            </section>
          }

          @if (result()!.pendingApplications.length) {
            <section class="choice-section" aria-labelledby="applications-title">
              <div class="section-heading"><h2 id="applications-title">طلباتك قيد المتابعة</h2><span>{{ result()!.pendingApplications.length }}</span></div>
              <div class="choice-list">
                @for (application of result()!.pendingApplications; track application.applicationId) {
                  <button class="choice-card pending-choice" type="button" (click)="trackApplication(application)" [disabled]="tracking()">
                    <span class="card-icon"><i class="pi pi-clock"></i></span>
                    <span class="choice-copy"><b>{{ applicationLabel(application) }}</b><small>{{ applicationStatus(application.status) }}</small></span>
                    <i class="pi pi-arrow-left" aria-hidden="true"></i>
                  </button>
                }
              </div>
            </section>
          }

          @if (!result()!.activeWorkspaces.length && !result()!.pendingApplications.length) {
            <section class="new-workspace" aria-labelledby="new-workspace-title">
              <h2 id="new-workspace-title">كيف تريد البدء؟</h2>
              <p>لا توجد مساحة نشطة لهذه الهوية بعد. اختر المسار المناسب دون اختيار دور يدوي.</p>
              <div class="action-cards">
                <button type="button" class="action-card" (click)="startGymApplication()">
                  <span class="action-icon gym"><i class="pi pi-building"></i></span>
                  <b>إنشاء جيم</b><small>قدّم بيانات الجيم الأساسية للمراجعة.</small>
                </button>
                <button type="button" class="action-card" (click)="startFreelanceApplication()">
                  <span class="action-icon freelance"><i class="pi pi-user-plus"></i></span>
                  <b>إنشاء مساحة مدرب حر</b><small>مساحة مستقلة بهوية واشتراك خاصين بك.</small>
                </button>
                <button type="button" class="action-card" (click)="showJoinGuidance.set(!showJoinGuidance())" [attr.aria-expanded]="showJoinGuidance()">
                  <span class="action-icon join"><i class="pi pi-link"></i></span>
                  <b>الانضمام لمساحة</b><small>تستخدم رابط دعوة أو QR أو كود مساحة.</small>
                </button>
              </div>
              @if (showJoinGuidance()) {
                <p class="join-guidance"><i class="pi pi-info-circle"></i> اطلب من مالك المساحة رابط الدعوة أو QR. قبول الدعوات والانضمام بالكود سيُفعّلان هنا عند اكتمال واجهة الـAPI الخاصة بهما.</p>
              }
            </section>
          }

          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <button type="button" class="text-button" (click)="reset()">استخدام هوية أخرى</button>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display:block; } .identity-onboarding { color:var(--text-primary); }
    .identity-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:2rem; }.eyebrow { display:inline-flex; align-items:center; gap:.45rem; color:var(--primary-600); font-size:.88rem; font-weight:800; letter-spacing:.02em; }.progress { display:flex; align-items:center; gap:.75rem; padding:0; margin:0; list-style:none; }.progress li { display:flex; align-items:center; gap:.35rem; color:var(--text-muted); font-size:.75rem; font-weight:700; }.progress li + li::before { content:''; width:1.5rem; height:1px; background:var(--border-color); margin-inline-end:.35rem; }.progress span { display:grid; place-items:center; width:1.4rem; height:1.4rem; border:1px solid var(--border-color); border-radius:50%; font-size:.7rem; }.progress .active,.progress .complete { color:var(--primary-600); }.progress .active span,.progress .complete span { border-color:var(--primary-500); background:var(--primary-500); color:#fff; }
    .step-content { animation:enter .22s ease-out; }.step-icon { display:grid; place-items:center; width:3.25rem; height:3.25rem; margin-bottom:1.1rem; border-radius:1rem; background:var(--primary-50); color:var(--primary-600); font-size:1.3rem; }.step-icon.success { background:var(--success-50); color:var(--success-600); }.identity-onboarding h1 { margin:0 0 .55rem; font-size:clamp(1.7rem, 3vw, 2rem); line-height:1.3; letter-spacing:-.02em; }.subtitle { margin:0 0 1.65rem; color:var(--text-secondary); line-height:1.8; }.subtitle b { color:var(--text-primary); font-weight:700; }
    form { display:grid; gap:.55rem; } label { color:var(--text-primary); font-size:.88rem; font-weight:700; }.input-with-icon { position:relative; }.input-with-icon > i { position:absolute; inset-inline-start:1rem; top:50%; transform:translateY(-50%); color:var(--text-muted); }.form-input { box-sizing:border-box; width:100%; min-height:3.1rem; padding:.75rem 1rem .75rem 2.75rem; border:1px solid var(--input-border); border-radius:.8rem; background:var(--input-bg); color:var(--text-primary); font:inherit; transition:border-color .16s, box-shadow .16s; }.form-input:focus { outline:0; border-color:var(--input-focus-border); box-shadow:0 0 0 3px var(--input-focus-ring); }.btn { display:inline-flex; align-items:center; justify-content:center; gap:.55rem; min-height:3.1rem; margin-top:.7rem; border:0; border-radius:.8rem; font:inherit; font-weight:800; cursor:pointer; }.btn:disabled { opacity:.65; cursor:wait; }.w-full { width:100%; }.field-error,.error { margin:.15rem 0 0; color:var(--danger-600); font-size:.82rem; line-height:1.6; }.error { padding:.75rem .9rem; border:1px solid var(--danger-100); border-radius:.75rem; background:var(--danger-50); }
    .supporting-copy { margin:1rem 0 0; color:var(--text-muted); font-size:.78rem; line-height:1.65; }.secondary-link,.compatibility-links { margin:1.1rem 0 0; color:var(--text-secondary); font-size:.88rem; text-align:center; }.secondary-link a,.compatibility-links a,.text-button { color:var(--primary-600); text-decoration:none; font-weight:700; }.secondary-link a:hover,.compatibility-links a:hover { text-decoration:underline; }.compatibility-links { display:flex; justify-content:center; gap:.55rem; flex-wrap:wrap; }.back-button,.text-button { border:0; background:transparent; cursor:pointer; padding:0; font:inherit; }.back-button { display:inline-flex; align-items:center; gap:.35rem; margin:0 0 1.2rem; color:var(--text-secondary); font-size:.85rem; }.text-button { display:block; margin:1.5rem auto 0; }
    .destination-step > .subtitle { margin-bottom:1.3rem; }.choice-section { margin-top:1.15rem; }.section-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:.65rem; }.section-heading h2,.new-workspace h2 { margin:0; font-size:1rem; }.section-heading span { display:grid; place-items:center; min-width:1.45rem; height:1.45rem; padding:0 .3rem; border-radius:99px; color:var(--primary-700); background:var(--primary-50); font-size:.74rem; font-weight:800; }.choice-list { display:grid; gap:.6rem; }.choice-card { display:flex; align-items:center; gap:.8rem; width:100%; min-height:4.4rem; padding:.8rem; border:1px solid var(--border-color); border-radius:1rem; background:var(--bg-primary); color:var(--text-primary); text-align:start; cursor:pointer; transition:transform .16s, border-color .16s, box-shadow .16s; }.choice-card:hover:not(:disabled) { transform:translateY(-1px); border-color:var(--primary-400); box-shadow:var(--shadow-sm); }.choice-card:disabled { opacity:.65; cursor:wait; }.card-icon { display:grid; place-items:center; flex:0 0 auto; width:2.6rem; height:2.6rem; border-radius:.8rem; color:var(--primary-600); background:var(--primary-50); }.card-icon.freelance { color:var(--accent-600); background:var(--accent-50); }.pending-choice .card-icon { color:var(--warning-600); background:var(--warning-50); }.choice-copy { display:grid; min-width:0; gap:.15rem; flex:1; }.choice-copy b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.93rem; }.choice-copy small { color:var(--text-secondary); font-size:.78rem; }
    .new-workspace { margin-top:.5rem; }.new-workspace > p { margin:.5rem 0 1rem; color:var(--text-secondary); font-size:.88rem; line-height:1.7; }.action-cards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:.65rem; }.action-card { display:grid; justify-items:start; gap:.5rem; min-height:9.5rem; padding:1rem; border:1px solid var(--border-color); border-radius:1rem; background:var(--bg-primary); color:var(--text-primary); text-align:start; cursor:pointer; transition:transform .16s, border-color .16s, box-shadow .16s; }.action-card:hover { transform:translateY(-2px); border-color:var(--primary-400); box-shadow:var(--shadow-sm); }.action-card b { font-size:.86rem; line-height:1.45; }.action-card small { color:var(--text-secondary); font-size:.74rem; line-height:1.55; }.action-icon { display:grid; place-items:center; width:2.35rem; height:2.35rem; border-radius:.75rem; color:var(--primary-600); background:var(--primary-50); }.action-icon.freelance { color:var(--accent-600); background:var(--accent-50); }.action-icon.join { color:var(--success-600); background:var(--success-50); }.join-guidance { display:flex; gap:.5rem; margin:1rem 0 0; padding:.8rem; border-radius:.75rem; color:var(--text-secondary); background:var(--bg-secondary); font-size:.8rem; line-height:1.7; }.join-guidance i { margin-top:.25rem; color:var(--primary-600); }
    @keyframes enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } } @media (max-width:600px) { .identity-header { align-items:flex-start; }.progress small { display:none; }.progress li + li::before { width:.9rem; }.action-cards { grid-template-columns:1fr; }.action-card { grid-template-columns:auto 1fr; align-items:center; min-height:auto; }.action-card small { grid-column:2; }.choice-card { min-height:4.1rem; } } @media (max-width:380px) { .eyebrow { font-size:.78rem; }.progress { gap:.4rem; } }
  `],
})
export class IdentityLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly WorkspaceType = WorkspaceType;
  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: [''],
  });
  readonly step = signal<IdentityLoginStep>('identifier');
  readonly result = signal<IdentitySignInResponse | null>(null);
  readonly loading = signal(false);
  readonly selecting = signal(false);
  readonly tracking = signal(false);
  readonly showJoinGuidance = signal(false);
  readonly error = signal('');

  identifierInvalid(): boolean {
    const control = this.form.controls.identifier;
    return control.invalid && control.touched;
  }

  passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.invalid && control.touched;
  }

  continueToCredentials(): void {
    const identifier = this.form.controls.identifier;
    if (identifier.invalid) { identifier.markAsTouched(); return; }
    this.form.controls.password.setValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
    this.error.set('');
    this.step.set('credentials');
  }

  backToIdentifier(): void {
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.error.set('');
    this.step.set('identifier');
  }

  signIn(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { identifier, password } = this.form.getRawValue();
    this.onboarding.identityLogin(identifier, password).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
        this.step.set('destination');

        // A single active workspace with no pending work does not need an
        // unnecessary chooser screen. Pending applications always remain visible.
        if (result.activeWorkspaces.length === 1 && result.pendingApplications.length === 0) {
          this.selectWorkspace(result.activeWorkspaces[0]);
        }
      },
      error: err => {
        this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر التحقق من الهوية. حاول مرة أخرى.');
        this.loading.set(false);
      },
    });
  }

  selectWorkspace(workspace: IdentityWorkspace): void {
    const result = this.result();
    if (!result || this.selecting()) return;
    this.selecting.set(true);
    this.error.set('');
    this.onboarding.selectWorkspace(result.workspaceSelectionToken, workspace.workspaceId).subscribe({
      next: response => {
        this.auth.completeWorkspaceSelection(response, workspace.workspaceType);
        this.router.navigateByUrl(response.mustChangePassword ? '/client/profile' : this.auth.getRedirectUrlForRole(response.role));
      },
      error: err => {
        this.error.set(err?.translatedMessage || err?.error?.message || 'انتهت جلسة اختيار المساحة. سجّل الدخول بالهوية مرة أخرى.');
        this.selecting.set(false);
      },
    });
  }

  trackApplication(application: PendingApplication): void {
    const result = this.result();
    if (!result || this.tracking()) return;
    this.tracking.set(true);
    this.error.set('');
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
        this.error.set(err?.translatedMessage || err?.error?.message || 'انتهت جلسة اختيار المساحة. سجّل الدخول بالهوية مرة أخرى.');
        this.tracking.set(false);
      },
    });
  }

  startGymApplication(): void { this.router.navigate(['/auth/register-gym']); }
  startFreelanceApplication(): void { this.router.navigate(['/auth/register-freelance']); }

  reset(): void {
    this.result.set(null);
    this.error.set('');
    this.showJoinGuidance.set(false);
    this.form.reset();
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.step.set('identifier');
  }

  workspaceLabel(workspace: IdentityWorkspace): string {
    return workspace.workspaceType === WorkspaceType.FreelanceCoach ? 'مساحة مدرب حر' : 'مساحة جيم';
  }

  applicationLabel(application: PendingApplication): string {
    return application.applicationType === 1 ? 'طلب إنشاء جيم'
      : application.applicationType === 2 ? 'طلب إنشاء مساحة مدرب حر'
      : 'طلب انضمام لمساحة';
  }

  applicationStatus(status: number): string {
    return ({ 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال بيانات', 5: 'مقبول', 6: 'مرفوض', 7: 'ملغى', 8: 'منتهي' } as Record<number, string>)[status] || 'مسودة';
  }
}
