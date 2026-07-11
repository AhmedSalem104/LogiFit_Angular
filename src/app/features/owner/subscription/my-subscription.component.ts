import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { TenantStatusService } from '../../../core/tenant/tenant-status.service';
import { TenantBillingService } from './tenant-billing.service';
import {
  PlatformPlan, MySubscription, PlatformPaymentMethod, PaymentRequest,
  TenantSubscriptionSummary, UsageMetric,
  TenantSubscriptionStatus, PaymentRequestStatus,
  TENANT_SUB_STATUS_AR, PAYMENT_REQUEST_STATUS_AR, BILLING_CYCLE_AR, FEATURE_AR
} from './tenant-billing.models';

type View = 'overview' | 'plans' | 'payment';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="subscription-page">
      <div class="page-head">
        <div>
          <h1>اشتراك الصالة في المنصة</h1>
          <p class="muted">أدر اشتراك صالتك في منصة LogicFit والدفع ومتابعة الحالة</p>
        </div>
        <a routerLink="/owner/subscription/invoices" class="btn btn-ghost">
          <i class="pi pi-credit-card"></i> فواتير المنصة
        </a>
      </div>

      @if (onboarding()) {
        <div class="onboarding-banner">
          <i class="pi pi-hourglass"></i>
          <div>
            <b>صالتك بانتظار الموافقة</b>
            <span>أكمل اختيار الباقة ورفع إثبات الدفع. سيتم تفعيل باقي النظام تلقائياً بعد موافقة الإدارة.</span>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading"><i class="pi pi-spin pi-spinner"></i> جاري التحميل...</div>
      } @else {

        <!-- ============ OVERVIEW ============ -->
        @if (view() === 'overview' && sub()?.hasSubscription) {
          <div class="card status-card" [class]="'status-' + sub()!.status">
            <div class="status-head">
              <div>
                <span class="badge" [class]="'badge-' + sub()!.status">{{ statusLabel(sub()!.status!) }}</span>
                <h2>{{ sub()!.planName }}</h2>
              </div>
              <div class="price-block" *ngIf="sub()!.amount != null">
                <span class="price">{{ sub()!.amount }}</span>
                <span class="cur">{{ sub()!.currency }}</span>
              </div>
            </div>

            <div class="status-meta">
              <div class="meta"><span class="muted">يبدأ</span><b>{{ sub()!.startDate | date:'yyyy/MM/dd' }}</b></div>
              <div class="meta"><span class="muted">ينتهي</span><b>{{ sub()!.endDate | date:'yyyy/MM/dd' }}</b></div>
              <div class="meta"><span class="muted">الأيام المتبقية</span>
                <b [class.danger]="(sub()!.remainingDays ?? 0) <= 7">{{ sub()!.remainingDays ?? 0 }} يوم</b>
              </div>
              <div class="meta" *ngIf="sub()!.trialEndsAt"><span class="muted">تنتهي التجربة</span><b>{{ sub()!.trialEndsAt | date:'yyyy/MM/dd' }}</b></div>
            </div>

            <!-- Usage bars -->
            <div class="usage-grid">
              <div class="usage" *ngIf="sub()!.members">{{ renderUsage('الأعضاء', sub()!.members!) }}</div>
              <div class="usage" *ngIf="sub()!.coaches">{{ renderUsage('المدربين', sub()!.coaches!) }}</div>
              <div class="usage" *ngIf="sub()!.branches">{{ renderUsage('الفروع', sub()!.branches!) }}</div>
              <div class="usage" *ngIf="sub()!.employees">{{ renderUsage('الموظفين', sub()!.employees!) }}</div>
            </div>

            <div class="features" *ngIf="sub()!.features?.length">
              <span class="chip" *ngFor="let f of sub()!.features">{{ featureLabel(f) }}</span>
            </div>

            <div class="actions">
              <button class="btn btn-primary" (click)="goToPlans()"><i class="pi pi-arrow-up"></i> ترقية الباقة</button>
              <button class="btn btn-secondary" (click)="renew()"><i class="pi pi-refresh"></i> تجديد</button>
            </div>
          </div>

          <!-- Payment requests history -->
          @if (paymentRequests().length) {
            <div class="card">
              <h3>سجل طلبات الدفع</h3>
              <div class="pr-list">
                @for (pr of paymentRequests(); track pr.id) {
                  <div class="pr-row">
                    <div>
                      <b>{{ pr.planName }}</b>
                      <span class="muted small"> — {{ pr.amount }} {{ pr.currency }} · {{ pr.createdAt | date:'yyyy/MM/dd' }}</span>
                    </div>
                    <div class="pr-right">
                      <span class="badge" [class]="'pr-' + pr.status">{{ prStatusLabel(pr.status) }}</span>
                      @if (pr.status === PRStatus.Rejected && pr.rejectReason) {
                        <span class="reject-reason">سبب الرفض: {{ pr.rejectReason }}</span>
                        <button class="btn btn-sm btn-primary" (click)="resubmit(pr.planId)">إعادة الرفع</button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- No subscription yet -->
        @if (view() === 'overview' && !sub()?.hasSubscription) {
          <div class="card empty">
            <i class="pi pi-star empty-icon"></i>
            <h2>لا يوجد اشتراك بعد</h2>
            <p class="muted">اختر باقة لتفعيل صالتك على منصة LogicFit</p>
            <button class="btn btn-primary" (click)="goToPlans()">عرض الباقات</button>
          </div>
        }

        <!-- ============ PLANS ============ -->
        @if (view() === 'plans') {
          <div class="plans-head">
            <h2>{{ sub()?.hasSubscription ? 'اختر باقة للترقية' : 'اختر باقتك' }}</h2>
            @if (sub()?.hasSubscription) {
              <button class="btn btn-ghost" (click)="view.set('overview')"><i class="pi pi-arrow-right"></i> رجوع</button>
            }
          </div>
          <div class="plans-grid">
            @for (plan of plans(); track plan.id) {
              <div class="plan-card" [class.current]="plan.id === sub()?.planId">
                <div class="plan-top">
                  <h3>{{ plan.name }}</h3>
                  <div class="plan-price"><span>{{ plan.price }}</span> <small>{{ plan.currency }} / {{ cycleLabel(plan) }}</small></div>
                </div>
                <p class="muted" *ngIf="plan.description">{{ plan.description }}</p>
                <ul class="limits">
                  <li><i class="pi pi-users"></i> الأعضاء: {{ limitLabel(plan.maxMembers) }}</li>
                  <li><i class="pi pi-id-card"></i> المدربين: {{ limitLabel(plan.maxCoaches) }}</li>
                  <li><i class="pi pi-building"></i> الفروع: {{ limitLabel(plan.maxBranches) }}</li>
                  <li><i class="pi pi-briefcase"></i> الموظفين: {{ limitLabel(plan.maxEmployees) }}</li>
                </ul>
                <div class="features">
                  <span class="chip" *ngFor="let f of plan.features">{{ featureLabel(f) }}</span>
                </div>
                <button class="btn btn-primary w-full"
                  [disabled]="plan.id === sub()?.planId || submitting()"
                  (click)="choosePlan(plan)">
                  {{ plan.id === sub()?.planId ? 'باقتك الحالية' : (sub()?.hasSubscription ? 'ترقية' : 'اختيار') }}
                </button>
              </div>
            }
          </div>
        }

        <!-- ============ PAYMENT ============ -->
        @if (view() === 'payment' && summary()) {
          <div class="card payment-card">
            <div class="plans-head">
              <h2>إتمام الدفع — {{ summary()!.planName }}</h2>
              <button class="btn btn-ghost" (click)="view.set('overview')"><i class="pi pi-times"></i> إلغاء</button>
            </div>
            <div class="amount-due">
              المبلغ المطلوب: <b>{{ summary()!.amount }} {{ summary()!.currency }}</b>
            </div>

            <h4>1) اختر طريقة الدفع وحوّل المبلغ</h4>
            <div class="methods">
              @for (m of paymentMethods(); track m.id) {
                <label class="method" [class.selected]="form.paymentMethodId === m.id">
                  <input type="radio" name="pm" [value]="m.id" [(ngModel)]="form.paymentMethodId" />
                  <div class="method-body">
                    <div class="method-name"><b>{{ m.name }}</b> <span class="muted small">({{ m.type }})</span></div>
                    <div class="method-details muted small">
                      <span *ngIf="m.accountName">الاسم: {{ m.accountName }}</span>
                      <span *ngIf="m.accountNumber"> · الحساب: {{ m.accountNumber }}</span>
                      <span *ngIf="m.iban"> · IBAN: {{ m.iban }}</span>
                      <span *ngIf="m.walletNumber"> · محفظة: {{ m.walletNumber }}</span>
                    </div>
                    <div class="method-instructions small" *ngIf="m.instructions">{{ m.instructions }}</div>
                  </div>
                  <img *ngIf="m.qrImageUrl" [src]="m.qrImageUrl" class="qr" alt="QR" />
                </label>
              }
              @if (!paymentMethods().length) {
                <p class="muted">لا توجد طرق دفع متاحة حالياً. تواصل مع الدعم.</p>
              }
            </div>

            <h4>2) ارفع إثبات التحويل</h4>
            <div class="proof-form">
              <div class="field">
                <label>صورة الإيصال</label>
                <input type="file" accept="image/*" (change)="onFile($event)" />
              </div>
              <div class="field">
                <label>رقم العملية (اختياري)</label>
                <input type="text" [(ngModel)]="form.transactionNumber" placeholder="TX..." />
              </div>
              <div class="field">
                <label>تاريخ الدفع (اختياري)</label>
                <input type="date" [(ngModel)]="form.paymentDate" />
              </div>
              <div class="field full">
                <label>ملاحظات (اختياري)</label>
                <textarea [(ngModel)]="form.notes" rows="2"></textarea>
              </div>
            </div>

            <button class="btn btn-primary" [disabled]="submitting()" (click)="submitProof()">
              <i class="pi" [class.pi-spin]="submitting()" [class.pi-spinner]="submitting()" [class.pi-check]="!submitting()"></i>
              إرسال طلب الدفع
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .subscription-page { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    .onboarding-banner { display:flex; align-items:center; gap:.9rem; background:#fffbeb; border:1px solid #fcd34d; color:#92400e; border-radius:12px; padding:1rem 1.25rem; margin-bottom:1.25rem; }
    .onboarding-banner i { font-size:1.5rem; } .onboarding-banner b { display:block; margin-bottom:.15rem; } .onboarding-banner span { font-size:.85rem; }
    .page-head { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--text-primary); }
    h2 { font-size:1.25rem; font-weight:700; color:var(--text-primary); }
    h3 { font-size:1.05rem; font-weight:700; color:var(--text-primary); margin-bottom:.75rem; }
    h4 { font-size:.95rem; font-weight:700; color:var(--text-primary); margin:1.25rem 0 .5rem; }
    .muted { color:var(--text-secondary); }
    .small { font-size:.8rem; }
    .loading { text-align:center; padding:3rem; color:var(--text-secondary); }
    .card { background:var(--bg-primary); border:1px solid var(--border-color); border-radius:14px; padding:1.5rem; margin-bottom:1.25rem; }
    .status-head { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .price-block .price { font-size:1.75rem; font-weight:800; color:var(--accent-color); }
    .price-block .cur { color:var(--text-secondary); margin-inline-start:.25rem; }
    .badge { display:inline-block; padding:.2rem .7rem; border-radius:999px; font-size:.75rem; font-weight:700; margin-bottom:.4rem; }
    .badge-3 { background:#dcfce7; color:#15803d; } .badge-2 { background:#dbeafe; color:#1d4ed8; }
    .badge-1 { background:#fef9c3; color:#a16207; } .badge-4,.badge-5 { background:#fee2e2; color:#b91c1c; }
    .badge-6,.badge-7 { background:#f3f4f6; color:#6b7280; }
    .status-meta { display:flex; flex-wrap:wrap; gap:1.5rem; margin:1.25rem 0; }
    .meta { display:flex; flex-direction:column; gap:.15rem; } .meta b.danger { color:#dc2626; }
    .usage-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; margin:1rem 0; }
    .usage { white-space:pre-line; font-size:.85rem; color:var(--text-secondary); background:var(--bg-secondary); border-radius:10px; padding:.75rem 1rem; }
    .features { display:flex; flex-wrap:wrap; gap:.4rem; margin:.75rem 0; }
    .chip { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:999px; padding:.2rem .7rem; font-size:.75rem; color:var(--text-primary); }
    .actions { display:flex; gap:.75rem; margin-top:1rem; flex-wrap:wrap; }
    .empty { text-align:center; padding:3rem 1.5rem; }
    .empty-icon { font-size:3rem; color:var(--accent-color); margin-bottom:1rem; }
    .plans-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .plans-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1.25rem; }
    .plan-card { background:var(--bg-primary); border:1px solid var(--border-color); border-radius:14px; padding:1.5rem; display:flex; flex-direction:column; gap:.75rem; }
    .plan-card.current { border-color:var(--accent-color); box-shadow:0 0 0 2px var(--accent-color) inset; }
    .plan-price span { font-size:1.6rem; font-weight:800; color:var(--accent-color); }
    .limits { list-style:none; display:flex; flex-direction:column; gap:.4rem; font-size:.85rem; color:var(--text-secondary); }
    .limits i { color:var(--accent-color); margin-inline-end:.4rem; }
    .amount-due { background:var(--bg-secondary); border-radius:10px; padding:.75rem 1rem; margin:.75rem 0 1rem; }
    .methods { display:flex; flex-direction:column; gap:.75rem; }
    .method { display:flex; align-items:center; gap:.75rem; border:1px solid var(--border-color); border-radius:12px; padding:1rem; cursor:pointer; }
    .method.selected { border-color:var(--accent-color); background:var(--bg-secondary); }
    .method-body { flex:1; } .qr { width:64px; height:64px; border-radius:8px; object-fit:cover; }
    .proof-form { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
    .field { display:flex; flex-direction:column; gap:.35rem; } .field.full { grid-column:1/-1; }
    .field label { font-size:.85rem; color:var(--text-secondary); }
    .field input, .field textarea { padding:.6rem .75rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-secondary); color:var(--text-primary); }
    .pr-list { display:flex; flex-direction:column; gap:.6rem; }
    .pr-row { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:.75rem; border:1px solid var(--border-color); border-radius:10px; flex-wrap:wrap; }
    .pr-right { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
    .pr-2 { background:#dcfce7; color:#15803d; } .pr-1 { background:#fef9c3; color:#a16207; }
    .pr-3 { background:#fee2e2; color:#b91c1c; } .pr-4,.pr-5 { background:#f3f4f6; color:#6b7280; }
    .reject-reason { color:#b91c1c; font-size:.8rem; }
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; padding:.6rem 1.1rem; border-radius:9px; border:none; cursor:pointer; font-weight:600; font-size:.9rem; }
    .btn-primary { background:var(--accent-color); color:#fff; } .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .btn-secondary { background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color); }
    .btn-ghost { background:transparent; color:var(--text-secondary); border:1px solid var(--border-color); }
    .btn-sm { padding:.35rem .7rem; font-size:.8rem; } .w-full { width:100%; }
    @media (max-width:640px){ .proof-form { grid-template-columns:1fr; } }
  `]
})
export class MySubscriptionComponent implements OnInit {
  private billing = inject(TenantBillingService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private tenantStatus = inject(TenantStatusService);

  readonly PRStatus = PaymentRequestStatus;

  /** Pending-approval (billing-only) mode — from the interceptor or ?onboarding=1. */
  readonly onboarding = computed(() =>
    this.tenantStatus.onboarding() || !!this.route.snapshot.queryParamMap.get('onboarding'));

  loading = signal(true);
  submitting = signal(false);
  view = signal<View>('overview');
  sub = signal<MySubscription | null>(null);
  plans = signal<PlatformPlan[]>([]);
  paymentMethods = signal<PlatformPaymentMethod[]>([]);
  paymentRequests = signal<PaymentRequest[]>([]);
  summary = signal<TenantSubscriptionSummary | null>(null);

  form: { planId: string; paymentMethodId?: string; transactionNumber?: string; paymentDate?: string; notes?: string; proof?: File } = { planId: '' };

  ngOnInit(): void {
    this.load();
    // If routed here from a 402 (plan limit), jump straight to plans/upgrade.
    if (this.route.snapshot.queryParamMap.get('upgrade')) {
      this.view.set('plans');
    }
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      sub: this.billing.getMySubscription(),
      plans: this.billing.getPlans(),
      requests: this.billing.getPaymentRequests()
    }).subscribe({
      next: ({ sub, plans, requests }) => {
        this.sub.set(sub);
        this.plans.set([...plans].sort((a, b) => a.displayOrder - b.displayOrder));
        this.paymentRequests.set(requests);
        if (!sub.hasSubscription && !this.route.snapshot.queryParamMap.get('upgrade')) {
          this.view.set('overview'); // shows empty-state CTA
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPlans(): void { this.view.set('plans'); }

  choosePlan(plan: PlatformPlan): void {
    this.submitting.set(true);
    const req$ = this.sub()?.hasSubscription ? this.billing.upgrade(plan.id) : this.billing.selectPlan(plan.id);
    req$.subscribe({
      next: (summary) => { this.submitting.set(false); this.startPayment(summary); },
      error: (e) => { this.submitting.set(false); this.notify.error(e.translatedMessage || 'تعذّر اختيار الباقة'); }
    });
  }

  renew(): void {
    this.submitting.set(true);
    this.billing.renew().subscribe({
      next: (summary) => { this.submitting.set(false); this.startPayment(summary); },
      error: (e) => { this.submitting.set(false); this.notify.error(e.translatedMessage || 'تعذّر التجديد'); }
    });
  }

  resubmit(planId: string): void {
    const plan = this.plans().find(p => p.id === planId);
    if (plan) this.choosePlan(plan);
  }

  private startPayment(summary: TenantSubscriptionSummary): void {
    this.summary.set(summary);
    this.form = { planId: summary.planId };
    this.billing.getPaymentMethods().subscribe({
      next: (methods) => this.paymentMethods.set([...methods].sort((a, b) => a.displayOrder - b.displayOrder)),
      error: () => this.paymentMethods.set([])
    });
    this.view.set('payment');
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.form.proof = input.files?.[0];
  }

  submitProof(): void {
    if (!this.form.proof) { this.notify.error('يرجى رفع صورة إثبات الدفع'); return; }
    this.submitting.set(true);
    this.billing.submitPaymentRequest({ ...this.form, planId: this.summary()!.planId }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success('تم إرسال طلب الدفع بنجاح. سيتم مراجعته وتفعيل الاشتراك.');
        this.view.set('overview');
        this.load();
      },
      error: (e) => { this.submitting.set(false); this.notify.error(e.translatedMessage || 'تعذّر إرسال الطلب'); }
    });
  }

  // ---- display helpers ----
  statusLabel(s: TenantSubscriptionStatus): string { return TENANT_SUB_STATUS_AR[s] ?? '—'; }
  prStatusLabel(s: PaymentRequestStatus): string { return PAYMENT_REQUEST_STATUS_AR[s] ?? '—'; }
  cycleLabel(p: PlatformPlan): string { return BILLING_CYCLE_AR[p.billingCycle] ?? ''; }
  featureLabel(f: string): string { return (FEATURE_AR as any)[f] ?? f; }
  limitLabel(v: number | null): string { return v == null ? 'غير محدود' : String(v); }
  renderUsage(label: string, m: UsageMetric): string {
    const limit = m.limit == null ? '∞' : m.limit;
    return `${label}\n${m.used} / ${limit}`;
  }
}
