import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  BillingCycle,
  PublicWorkspacePlan,
  SubmitWorkspaceApplication,
  WorkspaceType,
} from '../../../../core/freelance/models/freelance.models';

/**
 * Short public onboarding for both tenant types. The server owns the technical lifecycle after
 * this one submit action, so the applicant never has to create an identity, tenant or database.
 */
@Component({
  selector: 'app-register-workspace',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="workspace-page">
      <a routerLink="/identity/login" class="back-link">← العودة إلى الدخول الموحد</a>
      <header class="hero">
        <span class="eyebrow">LogicFit</span>
        <h2>أنشئ مساحتك في خطوات بسيطة</h2>
        <p>اختر نوع المساحة والباقة، أدخل بياناتك الأساسية وأرسل إثبات الدفع. سنتولى المراجعة والتجهيز والتفعيل تلقائيًا.</p>
      </header>

      <div class="type-switch" role="tablist" aria-label="نوع المساحة">
        <button type="button" role="tab" [attr.aria-selected]="workspaceType() === WorkspaceType.Gym" [class.active]="workspaceType() === WorkspaceType.Gym" (click)="setWorkspaceType(WorkspaceType.Gym)">
          <i class="pi pi-building"></i><span>جيم</span><small>إدارة صالة وفروع وموظفين</small>
        </button>
        <button type="button" role="tab" [attr.aria-selected]="workspaceType() === WorkspaceType.FreelanceCoach" [class.active]="workspaceType() === WorkspaceType.FreelanceCoach" (click)="setWorkspaceType(WorkspaceType.FreelanceCoach)">
          <i class="pi pi-user-edit"></i><span>مدرب حر</span><small>مساحة مستقلة لإدارة العملاء والجلسات</small>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <section class="section-card">
          <div class="section-title"><span>1</span><div><h3>اختر الباقة</h3><p>السعر النهائي يؤخذ من الباقة المحفوظة على الخادم.</p></div></div>
          @if (plansLoading()) { <p class="muted">جارٍ تحميل الباقات...</p> }
          @else if (plans().length === 0) { <p class="notice danger">لا توجد باقات متاحة حاليًا. حاول مرة أخرى لاحقًا.</p> }
          @else {
            <div class="plans">
              @for (plan of plans(); track plan.id) {
                <button type="button" class="plan" [class.selected]="selectedPlan()?.id === plan.id" (click)="selectPlan(plan)">
                  <span class="plan-check"><i class="pi" [class.pi-check-circle]="selectedPlan()?.id === plan.id" [class.pi-circle]="selectedPlan()?.id !== plan.id"></i></span>
                  <strong>{{ plan.name }}</strong><b>{{ plan.price | number:'1.0-2' }} {{ plan.currency }}</b>
                  <small>{{ cycleLabel(plan.billingCycle) }} · {{ plan.durationInDays }} يوم</small>
                  @if (plan.description) { <em>{{ plan.description }}</em> }
                </button>
              }
            </div>
          }
        </section>

        <section class="section-card">
          <div class="section-title"><span>2</span><div><h3>بيانات المالك والمساحة</h3><p>هذه هي البيانات الأساسية اللازمة لإنشاء الطلب.</p></div></div>
          <div class="grid">
            <label>اسم المالك *<input class="form-input" formControlName="ownerFullName" autocomplete="name" /></label>
            <label>البريد الإلكتروني *<input class="form-input" type="email" formControlName="email" autocomplete="email" /></label>
            <label>الهاتف<input class="form-input" formControlName="phoneNumber" autocomplete="tel" /></label>
            <label>كلمة المرور *<input class="form-input" type="password" formControlName="password" autocomplete="new-password" /><small>8 أحرف على الأقل.</small></label>
            <label>اسم المساحة *<input class="form-input" formControlName="workspaceName" /></label>
            <label>المعرف / الرابط *<input class="form-input" formControlName="workspaceIdentifier" dir="ltr" placeholder="my-workspace" /><small>حروف إنجليزية وأرقام وشرطة فقط.</small></label>
            <label>الاسم التجاري<input class="form-input" formControlName="brandName" /></label>
            @if (workspaceType() === WorkspaceType.FreelanceCoach) {
              <label>التخصص<input class="form-input" formControlName="specialization" placeholder="تدريب قوة، تغذية..." /></label>
              <label>طريقة تقديم التدريب<input class="form-input" formControlName="deliveryMode" placeholder="أونلاين، حضوري، مختلط" /></label>
            }
          </div>
          <label>نبذة مختصرة<textarea class="form-input" rows="3" formControlName="description"></textarea></label>
        </section>

        <section class="section-card">
          <div class="section-title"><span>3</span><div><h3>إتمام الدفع وإرسال الطلب</h3><p>بعد الإرسال لن تحتاج إلى تنفيذ أي خطوة تقنية؛ راقب حالة الطلب فقط.</p></div></div>
          <div class="payment-summary"><span>المبلغ المطلوب</span><strong>{{ selectedPlan() ? (selectedPlan()!.price | number:'1.0-2') + ' ' + selectedPlan()!.currency : 'اختر باقة أولًا' }}</strong></div>
          <div class="grid">
            <label>رقم العملية / المرجع<input class="form-input" formControlName="paymentTransactionNumber" placeholder="اختياري حسب وسيلة الدفع" /></label>
            <label>إثبات الدفع *<input class="form-input file" type="file" accept="image/jpeg,image/png,application/pdf" (change)="selectProof($event)" /><small>{{ proofName() || 'JPG أو PNG أو PDF حتى 10MB' }}</small></label>
          </div>
          <label class="terms"><input type="checkbox" formControlName="acceptTerms" /> أقر بصحة البيانات وأوافق على مراجعة الطلب.</label>
        </section>

        @if (error()) { <p class="notice danger" role="alert">{{ error() }}</p> }
        <button class="submit-button" type="submit" [disabled]="submitting() || form.invalid || !selectedPlan() || !proofFile() || plansLoading()">
          {{ submitting() ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب ومتابعة الحالة' }}
        </button>
        <p class="privacy-note"><i class="pi pi-shield"></i> يتم حفظ كلمات المرور مشفرة، وتستخدم بيانات الدفع للمراجعة فقط.</p>
      </form>
    </section>
  `,
  styles: [`
    :host{display:block}.workspace-page{max-width:760px;margin:0 auto;color:var(--text-primary)}.back-link{display:inline-block;margin-bottom:1rem;color:var(--text-secondary);text-decoration:none;font-size:.9rem}.hero{text-align:center;margin:0 auto 1.25rem}.eyebrow{display:inline-block;color:#2563eb;font-weight:800;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase}.hero h2{margin:.35rem 0 .45rem;font-size:1.65rem}.hero p{margin:0;color:var(--text-secondary);line-height:1.7;font-size:.9rem}.type-switch{display:grid;grid-template-columns:repeat(2,1fr);gap:.65rem;margin-bottom:1rem}.type-switch button{display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:.6rem;text-align:start;padding:.8rem;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer}.type-switch button i{grid-row:span 2;font-size:1.3rem;color:#2563eb}.type-switch button span{font-weight:800}.type-switch button small{color:var(--text-secondary);font-size:.7rem;margin-top:.2rem}.type-switch button.active{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#eff6ff}.type-switch button:nth-child(2) i{color:#7c3aed}.type-switch button:nth-child(2).active{border-color:#7c3aed;background:#f5f3ff;box-shadow:0 0 0 2px rgba(124,58,237,.12)}form{display:grid;gap:.85rem}.section-card{display:grid;gap:.8rem;padding:1rem;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-primary)}.section-title{display:flex;align-items:flex-start;gap:.65rem}.section-title>span{display:grid;place-items:center;flex:0 0 1.75rem;height:1.75rem;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-weight:800}.section-title h3{margin:0;font-size:1rem}.section-title p{margin:.2rem 0 0;color:var(--text-secondary);font-size:.78rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}label{display:grid;gap:.35rem;color:var(--text-primary);font-size:.82rem;font-weight:700}.form-input{box-sizing:border-box;width:100%;min-height:42px;padding:.62rem .7rem;border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);background:var(--bg-primary);font:inherit}.form-input:focus{outline:2px solid rgba(37,99,235,.2);border-color:#2563eb}.form-input.file{padding:.45rem}.section-card>label:not(.terms){margin-top:.1rem}.section-card small{color:var(--text-secondary);font-weight:400;font-size:.68rem}.plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}.plan{display:grid;gap:.25rem;text-align:start;padding:.75rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer}.plan.selected{border-color:#2563eb;background:#eff6ff}.plan-check{color:#2563eb}.plan b{font-size:.95rem}.plan small,.plan em{color:var(--text-secondary);font-size:.7rem;font-style:normal;line-height:1.4}.payment-summary{display:flex;justify-content:space-between;align-items:center;padding:.7rem .8rem;border-radius:8px;background:var(--bg-secondary);color:var(--text-secondary);font-size:.8rem}.payment-summary strong{color:#1d4ed8;font-size:1rem}.terms{display:flex;align-items:center;gap:.5rem;font-weight:500}.terms input{accent-color:#2563eb}.submit-button{min-height:48px;border:0;border-radius:9px;background:#2563eb;color:#fff;font:inherit;font-weight:800;cursor:pointer}.submit-button:disabled{opacity:.6;cursor:not-allowed}.notice{margin:0;padding:.7rem .8rem;border-radius:8px;font-size:.82rem;line-height:1.5}.notice.danger{border:1px solid #fecdd3;color:#b91c1c;background:#fff1f2}.privacy-note{margin:0;text-align:center;color:var(--text-secondary);font-size:.72rem}.privacy-note i{margin-inline-end:.25rem}@media(max-width:680px){.plans{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}@media(max-width:480px){.type-switch{grid-template-columns:1fr}.section-card{padding:.8rem}}
  `],
})
export class RegisterWorkspaceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly router = inject(Router);
  readonly WorkspaceType = WorkspaceType;
  readonly plans = signal<PublicWorkspacePlan[]>([]);
  readonly selectedPlan = signal<PublicWorkspacePlan | null>(null);
  readonly workspaceType = signal<WorkspaceType>(WorkspaceType.FreelanceCoach);
  readonly plansLoading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly proofFile = signal<File | null>(null);
  readonly proofName = signal('');
  readonly form = this.fb.nonNullable.group({
    ownerFullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    workspaceName: ['', Validators.required],
    workspaceIdentifier: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,98}[a-zA-Z0-9])?$/)]],
    brandName: [''],
    specialization: [''],
    deliveryMode: [''],
    description: ['', Validators.maxLength(4000)],
    paymentTransactionNumber: [''],
    acceptTerms: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    const configuredType = Number(this.route.snapshot.data['workspaceType']);
    if (configuredType === WorkspaceType.Gym || configuredType === WorkspaceType.FreelanceCoach) this.workspaceType.set(configuredType);
    this.onboarding.getPublicPlans().subscribe({
      next: plans => { this.plans.set(plans); this.selectedPlan.set(plans[0] || null); this.plansLoading.set(false); },
      error: err => { this.error.set(this.readError(err, 'تعذر تحميل الباقات.')); this.plansLoading.set(false); },
    });
  }

  setWorkspaceType(type: WorkspaceType): void { this.workspaceType.set(type); }
  selectPlan(plan: PublicWorkspacePlan): void { this.selectedPlan.set(plan); }

  selectProof(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) { this.proofFile.set(null); this.proofName.set(''); return; }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      this.proofFile.set(null); this.proofName.set(''); this.error.set('اختر ملف JPG أو PNG أو PDF بحجم لا يتجاوز 10MB.'); return;
    }
    this.error.set(''); this.proofFile.set(file); this.proofName.set(file.name);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const plan = this.selectedPlan();
    const proof = this.proofFile();
    if (!plan || !proof) { this.error.set('اختر الباقة وأرفق إثبات الدفع.'); return; }
    const data = this.form.getRawValue();
    this.submitting.set(true); this.error.set('');
    const request: SubmitWorkspaceApplication = {
      workspaceType: this.workspaceType(), planId: plan.id, email: data.email, phoneNumber: data.phoneNumber || undefined,
      password: data.password, workspaceName: data.workspaceName, workspaceIdentifier: data.workspaceIdentifier,
      ownerFullName: data.ownerFullName, brandName: data.brandName || undefined, specialization: data.specialization || undefined,
      deliveryMode: data.deliveryMode || undefined, description: data.description || undefined,
      billingCycle: plan.billingCycle, paymentTransactionNumber: data.paymentTransactionNumber || undefined,
      paymentDate: new Date().toISOString(), idempotencyKey: this.idempotencyKey(),
    };
    this.onboarding.submitWorkspace(request, proof).subscribe({
      next: () => this.router.navigate(['/identity/application-status']),
      error: err => { this.error.set(this.readError(err, 'تعذر إرسال الطلب. راجع البيانات وحاول مرة أخرى.')); this.submitting.set(false); },
    });
  }

  cycleLabel(cycle: BillingCycle): string { return ({ 1: 'شهري', 2: 'كل 6 أشهر', 3: 'سنوي' } as Record<number, string>)[cycle] || 'حسب الباقة'; }

  private idempotencyKey(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `public-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private readError(error: any, fallback: string): string {
    return error?.translatedMessage || error?.error?.message || error?.error?.title || fallback;
  }
}
