import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { concatMap, of, Subscription, timer } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { ApplicationRequestStatus, ApplicationTrackingStatus } from '../../../../core/freelance/models/freelance.models';

interface ActivationStep {
  key: string;
  label: string;
  detail: string;
  state: 'done' | 'current' | 'blocked' | 'pending';
}

@Component({
  selector: 'app-application-status',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="status-page">
      <h2>متابعة الطلب</h2>
      @if (loading()) { <p class="muted">جارٍ تحميل حالة الطلب...</p> }
      @else {
        @if (status(); as application) {
        <div class="status-card" [class.needs-info]="application.status === Status.NeedsMoreInformation" [class.freelance]="application.workspaceType === 2">
          <div class="status-heading"><span class="type-badge" [class.freelance]="application.workspaceType === 2"><i class="pi" [class.pi-user-edit]="application.workspaceType === 2" [class.pi-building]="application.workspaceType !== 2"></i>{{ application.workspaceType === 2 ? 'مساحة مدرب حر مستقلة' : 'مساحة جيم' }}</span><span class="badge">{{ statusLabel(application.status) }}</span></div>
          <h3>{{ applicationLabel(application.applicationType) }}</h3>
          @if (application.workspaceIdentifier) { <p class="muted" dir="ltr">{{ application.workspaceIdentifier }}</p> }
          <p class="muted">آخر تحديث: {{ (application.lastUpdatedAtUtc || application.reviewedAt || application.submittedAt) | date:'mediumDate' }}</p>
        </div>
        <section class="activation-card"><div class="activation-heading"><div><h3>حالة التفعيل</h3><p>رحلة واضحة؛ يتولى النظام كل خطوات التجهيز تلقائيًا.</p></div><span class="access-badge" [class.ready]="application.canAccessDashboard">{{ application.canAccessDashboard ? 'حسابك جاهز للدخول' : journeyLabel(application.userJourneyStage) }}</span></div><div class="activation-timeline">@for (step of timeline(application); track step.key) {<div class="activation-step" [class.done]="step.state === 'done'" [class.current]="step.state === 'current'" [class.blocked]="step.state === 'blocked'"><span class="step-marker"><i class="pi" [class.pi-check]="step.state === 'done'" [class.pi-exclamation-triangle]="step.state === 'blocked'" [class.pi-clock]="step.state === 'current'" [class.pi-minus]="step.state === 'pending'"></i></span><strong>{{ step.label }}</strong><small>{{ step.detail }}</small></div>}</div><div class="activation-facts"><div><span>المرحلة الحالية</span><b>{{ journeyLabel(application.userJourneyStage) }}</b></div><div><span>الخطوة التالية</span><b>{{ application.nextStep || 'تتم المتابعة تلقائيًا من إدارة المنصة.' }}</b></div><div><span>آخر تحديث</span><b>{{ (application.lastUpdatedAtUtc || application.reviewedAt || application.submittedAt) | date:'medium' }}</b></div></div>@if (application.userMessage) {<div class="activation-message" [class.success]="application.canAccessDashboard" [class.danger]="application.userJourneyStage === 'Rejected' || application.userJourneyStage === 'PaymentRejected'"><i class="pi" [class.pi-check-circle]="application.canAccessDashboard" [class.pi-info-circle]="!application.canAccessDashboard"></i><span>{{ application.userMessage }}</span></div>}</section>
        @if (application.status === Status.NeedsMoreInformation) {
          <div class="information-request"><b>طلب الإدارة:</b><p>{{ application.informationRequest || 'يرجى استكمال البيانات المطلوبة.' }}</p></div>
          <form [formGroup]="form" (ngSubmit)="saveAndResubmit(application)">
            @for (field of application.requestedFields; track field) {
              @if (field !== 'PaymentProof') {
                <label>{{ fieldLabel(field) }}
                  @if (isLongText(field)) { <textarea class="form-input" rows="4" [formControlName]="field"></textarea> }
                  @else { <input class="form-input" [type]="field.includes('Color') ? 'color' : 'text'" [formControlName]="field" /> }
                </label>
              }
            }
            @if (requiresPaymentProof(application)) {
              <div class="proof-request">
                <strong><i class="pi pi-image"></i> إثبات الدفع مطلوب</strong>
                <span>ارفع صورة الإيصال أو ملف PDF ليتمكن فريق الإدارة من التحقق من الدفع.</span>
                <label>صورة أو ملف إثبات الدفع *
                  <input class="form-input" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" (change)="onProofSelected($event)" />
                </label>
                @if (proofFileName) { <small class="proof-file"><i class="pi pi-paperclip"></i> {{ proofFileName }}</small> }
                <small>الأنواع المسموحة: JPG وPNG وPDF — الحد الأقصى 10 ميجابايت.</small>
                @if ((application.paymentProofVersion || 0) > 0 && application.requestedFields.includes('PaymentProof')) {
                  <small>سيُحفظ الرفع كإصدار جديد مع الاحتفاظ بالإصدارات السابقة.</small>
                }
              </div>
            }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button class="btn btn-primary w-full" [disabled]="saving()">{{ saving() ? 'جارٍ إعادة التقديم...' : 'حفظ وإعادة تقديم الطلب' }}</button>
          </form>
        } @else if (application.status === Status.Rejected) {
          <p class="information-request">الطلب مرفوض. يمكنك إنشاء طلب جديد عند تجهيز البيانات أو تغيير الهوية المطلوبة.</p>
          <a routerLink="/auth/register-freelance" class="btn btn-primary">إنشاء طلب جديد</a>
        } @else {
          <p class="information-request">
            @if (application.canAccessDashboard) {
              تم تجهيز مساحة العمل ويمكنك الدخول بأمان.
            } @else {
              يتم تحديث حالة الطلب تلقائيًا كل عدة ثوانٍ. يمكنك أيضًا التحديث يدويًا.
            }
          </p>
        }
        <div class="status-actions">
          @if (application.canAccessDashboard) {
            <button class="btn btn-primary" type="button" (click)="continueToWorkspace()">الدخول إلى المنصة</button>
          }
          @if (!application.canAccessDashboard && application.status !== Status.Rejected) {
            <button class="btn btn-secondary" type="button" [disabled]="loading() || refreshing()" (click)="load()">{{ refreshing() ? 'جارٍ التحديث...' : 'تحديث الحالة الآن' }}</button>
          }
          <button class="btn btn-secondary" type="button" (click)="returnToLogin()">العودة إلى تسجيل الدخول</button>
        </div>
        } @else {
        <div class="information-request"><p>انتهت جلسة المتابعة أو لم تُفتح من هذا المتصفح.</p><a routerLink="/identity/login">سجّل الدخول بالهوية للمتابعة</a></div>
        }
      }
      @if (error() && !status()) { <p class="error" role="alert">{{ error() }}</p> }
    </section>
  `,
  styles: [`
    .status-page h2 { margin:0 0 1rem; color:var(--text-primary); font-size:1.7rem; }.status-card,.information-request { padding:1rem; border:1px solid var(--border-color); border-radius:10px; background:var(--bg-primary); }.status-card.needs-info { border-color:#f59e0b; }.status-card h3 { margin:.55rem 0 .25rem; color:var(--text-primary); }.badge { display:inline-block; padding:.25rem .55rem; border-radius:999px; background:rgba(37,99,235,.1); color:#1d4ed8; font-size:.8rem; font-weight:700; }.muted { color:var(--text-secondary); }.information-request { margin-top:1rem; color:var(--text-primary); line-height:1.7; }.information-request p { margin:.25rem 0 0; } form { display:grid; gap:.85rem; margin-top:1rem; } label { display:grid; gap:.35rem; color:var(--text-primary); font-size:.9rem; font-weight:600; }.form-input { width:100%; box-sizing:border-box; min-height:42px; padding:.65rem .75rem; border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary); background:var(--bg-primary); font:inherit; }.proof-request { display:grid; gap:.35rem; padding:.85rem; border:1px solid #fbbf24; border-radius:9px; color:#92400e; background:#fffbeb; line-height:1.5; }.proof-request strong { display:flex; align-items:center; gap:.4rem; }.proof-request label { color:var(--text-primary); }.proof-request small,.proof-file { color:#78350f; font-weight:500; }.btn { display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:0 1rem; border:0; border-radius:8px; text-decoration:none; font:inherit; font-weight:700; cursor:pointer; }.btn-primary { background:#2563eb; color:#fff; }.btn-secondary { border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); }.btn:disabled { opacity:.65; cursor:not-allowed; }.status-actions { display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1rem; }.error { color:#b91c1c; margin:0; }.status-page > .btn { margin-top:1rem; padding:0 1rem; }
  `, `
    .status-heading{display:flex;align-items:center;justify-content:space-between;gap:.6rem}.type-badge,.access-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .55rem;border-radius:999px;color:#1d4ed8;background:#dbeafe;font-size:.72rem;font-weight:800}.type-badge.freelance{color:#6d28d9;background:#ede9fe}.access-badge{color:#b45309;background:#fef3c7}.access-badge.ready{color:#047857;background:#d1fae5}.activation-card{margin-top:1rem;padding:1rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary)}.activation-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.activation-heading h3{margin:0;color:var(--text-primary)}.activation-heading p{margin:.25rem 0 0;color:var(--text-secondary);font-size:.8rem}.activation-timeline{display:grid;grid-template-columns:repeat(6,1fr);gap:.45rem;margin:1rem 0}.activation-step{display:grid;justify-items:center;gap:.35rem;min-width:0;padding:.6rem .35rem;border:1px solid var(--border-color);border-radius:9px;color:var(--text-secondary);background:var(--bg-secondary);text-align:center}.activation-step.done{border-color:#bbf7d0;color:#047857;background:#f0fdf4}.activation-step.current{border-color:#bfdbfe;color:#1d4ed8;background:#eff6ff}.activation-step.blocked{border-color:#fecdd3;color:#b91c1c;background:#fff1f2}.step-marker{display:grid;place-items:center;width:1.8rem;height:1.8rem;border-radius:50%;background:rgba(148,163,184,.14)}.activation-step strong{font-size:.72rem}.activation-step small{font-size:.62rem;line-height:1.4}.activation-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:.45rem}.activation-facts>div{padding:.55rem;border:1px solid var(--border-color);border-radius:8px}.activation-facts span,.activation-facts b{display:block}.activation-facts span{color:var(--text-secondary);font-size:.65rem}.activation-facts b{margin-top:.2rem;color:var(--text-primary);font-size:.72rem;line-height:1.45}.activation-message{display:flex;align-items:flex-start;gap:.45rem;margin-top:.7rem;padding:.7rem;border:1px solid #bfdbfe;border-radius:8px;color:#1d4ed8;background:#eff6ff;font-size:.78rem;line-height:1.5}.activation-message.success{border-color:#bbf7d0;color:#047857;background:#f0fdf4}.activation-message.danger{border-color:#fecdd3;color:#b91c1c;background:#fff1f2}@media(max-width:700px){.activation-timeline{grid-template-columns:repeat(3,1fr)}.activation-facts{grid-template-columns:repeat(2,1fr)}.activation-heading{flex-direction:column}}@media(max-width:420px){.activation-timeline{grid-template-columns:repeat(2,1fr)}}
  `],
})
export class ApplicationStatusComponent implements OnInit, OnDestroy {
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly Status = ApplicationRequestStatus;
  readonly status = signal<ApplicationTrackingStatus | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    FullName: [''], WorkspaceName: [''], OwnerFullName: [''], BrandName: [''], LogoUrl: [''], PhotoUrl: [''], CoverImageUrl: [''], BackgroundImageUrl: [''], PrimaryColor: ['#2563eb'], SecondaryColor: ['#0f172a'], Bio: [''], Specialties: [''], Certifications: [''], SocialLinks: [''], WelcomeMessage: [''], BookingSettings: [''],
  });
  proofFile: File | null = null;
  proofFileName = '';

  private refreshSubscription: Subscription | null = null;
  private readonly refreshIntervalMs = 10000;

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void { this.stopAutoRefresh(); }

  timeline(application: ApplicationTrackingStatus): ActivationStep[] {
    const requestDone = application.status >= ApplicationRequestStatus.Submitted;
    const paymentDone = application.paymentStatus === 2;
    const reviewDone = application.status === ApplicationRequestStatus.Approved || application.status === ApplicationRequestStatus.Rejected;
    const provisioningDone = application.canAccessDashboard || application.userJourneyStage === 'Ready';
    const subscriptionDone = application.canAccessDashboard || application.userJourneyStage === 'Ready';
    const current = (done: boolean, isCurrent: boolean, blocked = false): ActivationStep['state'] => blocked ? 'blocked' : done ? 'done' : isCurrent ? 'current' : 'pending';
    return [
      { key: 'request', label: 'الطلب', detail: this.statusLabel(application.status), state: current(requestDone, true) },
      { key: 'payment', label: 'الدفع', detail: this.paymentLabel(application.paymentStatus), state: current(paymentDone, requestDone && !paymentDone, application.paymentStatus === 3) },
      { key: 'review', label: 'المراجعة', detail: this.statusLabel(application.status), state: current(reviewDone, application.status === ApplicationRequestStatus.UnderReview, application.status === ApplicationRequestStatus.Rejected) },
      { key: 'provisioning', label: 'تجهيز الحساب', detail: application.canAccessDashboard ? 'اكتمل التجهيز' : application.userJourneyStage === 'Preparing' ? 'جاري التجهيز تلقائيًا' : 'سيبدأ بعد اعتماد الطلب', state: current(provisioningDone, application.userJourneyStage === 'Preparing', application.userJourneyStage === 'Rejected' || application.userJourneyStage === 'PaymentRejected') },
      { key: 'subscription', label: 'التفعيل', detail: application.canAccessDashboard ? 'تم التفعيل' : 'يتم تلقائيًا بعد الجاهزية', state: current(subscriptionDone, application.userJourneyStage === 'Preparing', application.userJourneyStage === 'Rejected' || application.userJourneyStage === 'PaymentRejected') },
      { key: 'access', label: 'الدخول', detail: application.canAccessDashboard ? 'يمكن الدخول' : 'محمي حتى الجاهزية', state: application.canAccessDashboard ? 'done' : application.userJourneyStage === 'Rejected' || application.userJourneyStage === 'PaymentRejected' ? 'blocked' : 'pending' },
    ];
  }

  paymentLabel(status: number | null | undefined): string { return ({ 1: 'قيد المراجعة', 2: 'تم استلامه', 3: 'تحتاج مراجعة', 4: 'تحتاج مراجعة', 5: 'تحتاج مراجعة' } as Record<number, string>)[status ?? 0] || 'بانتظار المراجعة'; }
  journeyLabel(stage: string | null | undefined): string { return ({ Submitted: 'تم إرسال الطلب', UnderReview: 'جاري المراجعة', MoreInformation: 'مطلوب بيانات إضافية', Preparing: 'جاري تجهيز حسابك', PaymentRejected: 'مراجعة الدفع مطلوبة', Rejected: 'تم رفض الطلب', Ready: 'حسابك جاهز للدخول' } as Record<string, string>)[stage || 'Submitted'] || 'جاري متابعة الطلب'; }

  load(): void {
    if (!this.onboarding.getTrackingToken()) { this.recoverTrackingSession(); return; }
    this.stopAutoRefresh();
    this.fetchStatus(true);
  }

  continueToWorkspace(): void {
    this.navigateToLogin('workspace');
  }

  returnToLogin(): void {
    this.navigateToLogin('application-status');
  }

  private fetchStatus(showLoading: boolean): void {
    if (!this.onboarding.getTrackingToken()) { this.recoverTrackingSession(); return; }
    if (showLoading) this.loading.set(true);
    else this.refreshing.set(true);
    this.error.set('');
    this.onboarding.getTrackingStatus().subscribe({
      next: status => {
        this.applyStatus(status);
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: err => {
        this.stopAutoRefresh();
        if (err?.status === 401 || err?.status === 403) {
          this.recoverTrackingSession();
          return;
        }
        this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر تحميل حالة الطلب.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  private shouldAutoRefresh(application: ApplicationTrackingStatus): boolean {
    return !application.canAccessDashboard && ![
      ApplicationRequestStatus.NeedsMoreInformation,
      ApplicationRequestStatus.Rejected,
      ApplicationRequestStatus.Cancelled,
      ApplicationRequestStatus.Expired,
    ].includes(application.status);
  }

  private startAutoRefresh(): void {
    if (this.refreshSubscription) return;
    this.refreshSubscription = timer(this.refreshIntervalMs, this.refreshIntervalMs).subscribe(() => {
      if (!this.refreshing() && !this.saving()) this.fetchStatus(false);
    });
  }

  private stopAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = null;
  }

  saveAndResubmit(application: ApplicationTrackingStatus): void {
    const fields: Record<string, unknown> = {};
    for (const field of application.requestedFields) {
      if (field !== 'PaymentProof') fields[field] = this.toApiValue(field, this.form.get(field)?.value);
    }
    if (this.requiresPaymentProof(application) && !this.proofFile) {
      this.error.set('أرفق صورة أو ملف إثبات الدفع قبل إعادة إرسال الطلب.');
      return;
    }
    this.saving.set(true); this.error.set('');
    const upload$ = this.requiresPaymentProof(application) && this.proofFile
      ? this.onboarding.uploadPaymentProof(this.proofFile)
      : of<unknown>(null);
    upload$.pipe(
      concatMap(() => Object.keys(fields).length ? this.onboarding.updateRequestedFields(fields) : of<unknown>(null)),
      concatMap(() => this.onboarding.resubmit()),
      concatMap(() => this.onboarding.getTrackingStatus()),
    ).subscribe({
      next: status => { this.applyStatus(status); this.proofFile = null; this.proofFileName = ''; this.saving.set(false); },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر حفظ البيانات وإعادة التقديم.'); this.saving.set(false); },
    });
  }

  requiresPaymentProof(application: ApplicationTrackingStatus): boolean {
    return application.status === ApplicationRequestStatus.NeedsMoreInformation
      && !!application.paymentRequestId
      && application.paymentStatus !== 2
      && (application.requestedFields.includes('PaymentProof') || (application.paymentProofVersion || 0) === 0);
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) { this.proofFile = null; this.proofFileName = ''; return; }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
      this.error.set('اختر ملف JPG أو PNG أو PDF بحجم لا يتجاوز 10 ميجابايت.');
      input.value = '';
      this.proofFile = null;
      this.proofFileName = '';
      return;
    }
    this.error.set('');
    this.proofFile = file;
    this.proofFileName = file.name;
  }

  fieldLabel(field: string): string { return ({ FullName: 'الاسم الكامل', WorkspaceName: 'اسم مساحة العمل', OwnerFullName: 'اسم المالك', BrandName: 'الاسم التجاري', LogoUrl: 'رابط الشعار', PhotoUrl: 'رابط الصورة الشخصية', CoverImageUrl: 'رابط الغلاف', BackgroundImageUrl: 'رابط الخلفية', PrimaryColor: 'اللون الأساسي', SecondaryColor: 'اللون الثانوي', Bio: 'النبذة', Specialties: 'التخصصات (مفصولة بفواصل)', Certifications: 'الشهادات (مفصولة بفواصل)', SocialLinks: 'روابط التواصل بصيغة JSON', WelcomeMessage: 'رسالة الترحيب', BookingSettings: 'إعدادات الحجز بصيغة JSON' } as Record<string, string>)[field] || field; }
  isLongText(field: string): boolean { return ['Bio', 'WelcomeMessage', 'SocialLinks', 'BookingSettings'].includes(field); }
  statusLabel(status: ApplicationRequestStatus): string { return ({ 1: 'مسودة', 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال', 5: 'مقبول', 6: 'مرفوض', 7: 'ملغى', 8: 'منتهي' } as Record<number, string>)[status]; }
  applicationLabel(type: number): string { return type === 2 ? 'طلب مساحة مدرب حر' : type === 1 ? 'طلب إنشاء مساحة جيم' : 'طلب انضمام إلى مساحة عمل'; }

  private applyStatus(status: ApplicationTrackingStatus): void {
    this.status.set(status);
    this.patchEditableValues(status);
    if (this.shouldAutoRefresh(status)) this.startAutoRefresh();
    else this.stopAutoRefresh();
  }

  private recoverTrackingSession(): void {
    this.stopAutoRefresh();
    this.onboarding.clearTrackingToken();
    this.loading.set(false);
    this.router.navigate(['/identity/login'], {
      queryParams: { continue: 'application-status' },
      replaceUrl: true,
    });
  }

  private navigateToLogin(continueTarget: string): void {
    this.stopAutoRefresh();
    this.onboarding.clearTrackingToken();
    this.router.navigate(['/identity/login'], {
      queryParams: { continue: continueTarget },
      replaceUrl: true,
    });
  }

  private patchEditableValues(status: ApplicationTrackingStatus): void {
    for (const [field, value] of Object.entries(status.editableValues || {})) {
      const control = this.form.get(field);
      if (control) control.setValue(Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? ''));
    }
  }

  private toApiValue(field: string, value: unknown): unknown {
    const text = String(value ?? '').trim();
    if (['Specialties', 'Certifications'].includes(field)) return text.split(',').map(item => item.trim()).filter(Boolean);
    if (['SocialLinks', 'BookingSettings'].includes(field)) { try { return text ? JSON.parse(text) : {}; } catch { return text; } }
    return text;
  }
}
