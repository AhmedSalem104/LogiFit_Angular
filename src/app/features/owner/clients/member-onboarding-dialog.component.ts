import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OnboardClientRequest, SubscriptionPlan } from '../services/owner.service';

export interface MemberOnboardingValue {
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender?: number;
  birthDate?: string;
  registrationDate: string;
  notes?: string;
  membership: NonNullable<OnboardClientRequest['membership']> | null;
}

/**
 * The canonical Gym member flow from TOP-GYM:
 * member data -> membership/payment -> review and save.
 *
 * The dialog deliberately owns all three stages so the operator does not
 * have to create a user in one screen and finish the same member in another.
 * The server still owns validation, duplicate detection and the transaction.
 */
@Component({
  selector: 'app-member-onboarding-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="mod-overlay" (click)="onBackdrop($event)">
        <section class="mod-dialog" role="dialog" aria-modal="true" aria-labelledby="member-dialog-title">
          <header class="mod-header">
            <div>
              <span class="mod-eyebrow">رحلة المشترك · 1 إلى 3</span>
              <h2 id="member-dialog-title">إضافة مشترك وعضويته</h2>
              <p>أنشئ سجل المشترك والعضوية والدفع في عملية واحدة.</p>
            </div>
            <button type="button" class="icon-button" (click)="cancel.emit()" [disabled]="saving" aria-label="إغلاق">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <ol class="mod-steps" aria-label="مراحل إضافة المشترك">
            <li [class.active]="step === 1" [class.done]="step > 1"><span>1</span><strong>بيانات المشترك</strong></li>
            <li [class.active]="step === 2" [class.done]="step > 2"><span>2</span><strong>العضوية والدفع</strong></li>
            <li [class.active]="step === 3"><span>3</span><strong>مراجعة وحفظ</strong></li>
          </ol>

          <form class="mod-body" (ngSubmit)="continue()" novalidate>
            @if (step === 1) {
              <div class="mod-section-heading">
                <h3>بيانات المشترك الأساسية</h3>
                <p>الاسم ورقم الهاتف هما الحد الأدنى لإنشاء سجل صحيح.</p>
              </div>

              <div class="form-grid">
                <label class="field full">
                  <span>الاسم الكامل <b>*</b></span>
                  <input name="fullName" [(ngModel)]="draft.fullName" (blur)="touched = true" placeholder="مثال: أحمد سالم" autocomplete="name" />
                  @if (touched && !draft.fullName.trim()) { <small class="field-error">اكتب الاسم الكامل.</small> }
                </label>

                <label class="field">
                  <span>رقم الهاتف <b>*</b></span>
                  <input name="phoneNumber" [(ngModel)]="draft.phoneNumber" (blur)="touched = true" placeholder="01xxxxxxxxx" inputmode="tel" autocomplete="tel" />
                  @if (touched && !validPhone()) { <small class="field-error">اكتب رقم هاتف مصري صحيح.</small> }
                </label>

                <label class="field">
                  <span>البريد الإلكتروني <em>(اختياري)</em></span>
                  <input name="email" [(ngModel)]="draft.email" placeholder="name@example.com" type="email" autocomplete="email" />
                </label>

                <label class="field">
                  <span>النوع <em>(اختياري)</em></span>
                  <select name="gender" [(ngModel)]="draft.gender">
                    <option [ngValue]="undefined">— اختر —</option>
                    <option [ngValue]="1">ذكر</option>
                    <option [ngValue]="2">أنثى</option>
                  </select>
                </label>

                <label class="field">
                  <span>تاريخ الميلاد <em>(اختياري)</em></span>
                  <input name="birthDate" [(ngModel)]="draft.birthDate" type="date" />
                </label>

                <label class="field">
                  <span>تاريخ التسجيل <b>*</b></span>
                  <input name="registrationDate" [(ngModel)]="draft.registrationDate" type="date" />
                </label>

                <label class="field full">
                  <span>ملاحظات <em>(اختياري)</em></span>
                  <textarea name="notes" [(ngModel)]="draft.notes" rows="3" placeholder="ملاحظات تشغيلية عن المشترك"></textarea>
                </label>
              </div>
            }

            @if (step === 2) {
              <div class="mod-section-heading">
                <h3>العضوية والدفع</h3>
                <p>اختر الباقة وسجّل أول دفعة. سيُحفظ سجل الدفع داخل حساب المشترك.</p>
              </div>

              @if (plansLoading) {
                <div class="inline-state loading"><i class="pi pi-spin pi-spinner"></i><span>جاري تحميل الباقات...</span></div>
              } @else if (plansError) {
                <div class="inline-state error"><i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل الباقات</strong><small>{{ plansError }}</small></div></div>
              } @else if (!plans.length) {
                <div class="inline-state warning"><i class="pi pi-info-circle"></i><div><strong>لا توجد باقات نشطة</strong><small>أنشئ باقة نشطة قبل إضافة عضوية للمشترك.</small></div></div>
              }

              <label class="membership-toggle">
                <input type="checkbox" name="includeMembership" [(ngModel)]="includeMembership" />
                <span><strong>إضافة العضوية الآن</strong><small>يمكن حفظ المشترك بدون عضوية إذا كانت ستُضاف لاحقًا.</small></span>
              </label>

              @if (includeMembership) {
                <div class="form-grid">
                  <label class="field full">
                    <span>الباقة <b>*</b></span>
                    <select name="planId" [(ngModel)]="membership.planId">
                      <option value="">— اختر الباقة —</option>
                      @for (plan of plans; track plan.id) {
                        <option [value]="plan.id">{{ plan.name }} · {{ plan.price | number:'1.0-2' }} جنيه · {{ plan.durationMonths }} شهر</option>
                      }
                    </select>
                    @if (touched && !membership.planId) { <small class="field-error">اختر الباقة قبل المتابعة.</small> }
                  </label>

                  <label class="field">
                    <span>بداية العضوية <b>*</b></span>
                    <input name="startDate" [(ngModel)]="membership.startDate" type="date" />
                  </label>

                  <label class="field">
                    <span>طريقة الدفع</span>
                    <select name="paymentMethod" [(ngModel)]="membership.paymentMethod">
                      <option [ngValue]="0">كاش</option>
                      <option [ngValue]="1">محفظة</option>
                      <option [ngValue]="2">كارت</option>
                      <option [ngValue]="3">تحويل بنكي</option>
                    </select>
                  </label>

                  <label class="field">
                    <span>المبلغ المدفوع</span>
                    <input name="amountPaid" [(ngModel)]="membership.amountPaid" type="number" min="0" step="0.01" inputmode="decimal" />
                  </label>

                  <label class="field">
                    <span>الخصم</span>
                    <input name="discount" [(ngModel)]="membership.discount" type="number" min="0" step="0.01" inputmode="decimal" />
                  </label>

                  <label class="field full">
                    <span>ملاحظات الدفع <em>(اختياري)</em></span>
                    <input name="membershipNotes" [(ngModel)]="membership.notes" placeholder="رقم إيصال أو ملاحظة التحصيل" />
                  </label>
                </div>

                @if (selectedPlan()) {
                  <div class="price-summary">
                    <div><span>سعر الباقة</span><strong>{{ selectedPlan()!.price | number:'1.0-2' }} جنيه</strong></div>
                    <div><span>بعد الخصم</span><strong>{{ netAmount() | number:'1.0-2' }} جنيه</strong></div>
                    <div class="remaining"><span>المتبقي</span><strong>{{ remainingAmount() | number:'1.0-2' }} جنيه</strong></div>
                  </div>
                }
              } @else {
                <div class="skip-note"><i class="pi pi-info-circle"></i><span>سيُنشأ المشترك الآن ويمكن إضافة العضوية لاحقًا من ملفه.</span></div>
              }
            }

            @if (step === 3) {
              <div class="mod-section-heading">
                <h3>راجع البيانات قبل الحفظ</h3>
                <p>لا يتم إنشاء أي سجل إلا بعد تأكيد هذه الخطوة.</p>
              </div>
              <div class="review-grid">
                <div><span>المشترك</span><strong>{{ draft.fullName }}</strong><small>{{ draft.phoneNumber }}{{ draft.email ? ' · ' + draft.email : '' }}</small></div>
                <div><span>التسجيل</span><strong>{{ draft.registrationDate | date:'dd/MM/yyyy' }}</strong><small>{{ draft.notes || 'بدون ملاحظات' }}</small></div>
                <div><span>العضوية</span><strong>{{ includeMembership ? (selectedPlan()?.name || 'لم يتم اختيار باقة') : 'بدون عضوية الآن' }}</strong><small>{{ includeMembership ? (membership.startDate | date:'dd/MM/yyyy') : 'يمكن إضافتها من الملف' }}</small></div>
                <div><span>الدفع</span><strong>{{ includeMembership ? ((membership.amountPaid || 0) | number:'1.0-2') + ' جنيه' : 'غير مطبق' }}</strong><small>{{ includeMembership ? paymentLabel() : '—' }}</small></div>
              </div>
              @if (includeMembership && !membership.planId) { <div class="review-error"><i class="pi pi-exclamation-triangle"></i>اختر الباقة قبل إنشاء المشترك.</div> }
            }

            <footer class="mod-actions">
              <button type="button" class="btn secondary" (click)="back()" [disabled]="saving">{{ step > 1 ? 'السابق' : 'إلغاء' }}</button>
              @if (step < 3) {
                <button type="submit" class="btn primary" [disabled]="saving || (step === 2 && plansLoading)">التالي <i class="pi pi-arrow-left"></i></button>
              } @else {
                <button type="submit" class="btn primary" [disabled]="saving || (includeMembership && !membership.planId)">
                  @if (saving) { <i class="pi pi-spin pi-spinner"></i> }
                  إنشاء المشترك وحفظ العضوية
                </button>
              }
            </footer>
          </form>
        </section>
      </div>
    }
  `,
  styles: [`
    .mod-overlay { position:fixed; inset:0; z-index:1100; display:grid; place-items:center; padding:1rem; background:rgba(15,23,42,.62); backdrop-filter:blur(2px); }
    .mod-dialog { width:min(100%,720px); max-height:calc(100vh - 2rem); overflow:auto; border:1px solid var(--border-color,#e2e8f0); border-radius:1.1rem; background:var(--bg-primary,#fff); color:var(--text-primary,#0f172a); box-shadow:0 24px 80px rgba(15,23,42,.3); }
    .mod-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.3rem 1.45rem 1rem; border-bottom:1px solid var(--border-color,#e2e8f0); }
    .mod-eyebrow { color:#2563eb; font-size:.76rem; font-weight:800; }
    .mod-header h2 { margin:.35rem 0 .2rem; font-size:1.3rem; }
    .mod-header p, .mod-section-heading p { margin:0; color:var(--text-secondary,#64748b); font-size:.84rem; line-height:1.6; }
    .icon-button { display:grid; place-items:center; width:36px; height:36px; border:1px solid var(--border-color,#e2e8f0); border-radius:.6rem; color:var(--text-secondary,#64748b); background:transparent; cursor:pointer; }
    .icon-button:disabled { opacity:.5; cursor:not-allowed; }
    .mod-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:.7rem; padding:1rem 1.45rem; margin:0; list-style:none; border-bottom:1px solid var(--border-color,#e2e8f0); }
    .mod-steps li { display:flex; align-items:center; gap:.5rem; color:#94a3b8; font-size:.78rem; }
    .mod-steps span { display:grid; place-items:center; flex:0 0 28px; width:28px; height:28px; border-radius:50%; background:#e2e8f0; color:#64748b; font-weight:800; }
    .mod-steps li.active, .mod-steps li.done { color:#1d4ed8; }
    .mod-steps li.active span, .mod-steps li.done span { color:#fff; background:#2563eb; }
    .mod-body { padding:1.35rem 1.45rem 1.45rem; }
    .mod-section-heading { margin-bottom:1rem; }
    .mod-section-heading h3 { margin:0 0 .3rem; font-size:1.05rem; }
    .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.85rem; }
    .field { display:grid; align-content:start; gap:.38rem; min-width:0; color:var(--text-secondary,#475569); font-size:.82rem; font-weight:700; }
    .field.full { grid-column:1 / -1; }
    .field b { color:#dc2626; }
    .field em { color:var(--text-muted,#94a3b8); font-size:.75rem; font-style:normal; font-weight:400; }
    .field input, .field select, .field textarea { width:100%; box-sizing:border-box; border:1px solid var(--border-color,#cbd5e1); border-radius:.6rem; padding:.68rem .75rem; background:var(--bg-secondary,#f8fafc); color:var(--text-primary,#0f172a); font:inherit; font-weight:400; }
    .field textarea { resize:vertical; }
    .field input:focus, .field select:focus, .field textarea:focus { outline:2px solid rgba(37,99,235,.18); border-color:#2563eb; }
    .field-error { color:#b91c1c; font-size:.76rem; font-weight:600; }
    .membership-toggle { display:flex; align-items:flex-start; gap:.65rem; margin:0 0 1rem; padding:.8rem; border:1px solid #bfdbfe; border-radius:.7rem; background:#eff6ff; color:#1e3a8a; cursor:pointer; }
    .membership-toggle input { margin-top:.25rem; accent-color:#2563eb; }
    .membership-toggle span { display:grid; gap:.15rem; }
    .membership-toggle small { color:#475569; font-weight:400; }
    .inline-state, .skip-note, .review-error { display:flex; align-items:flex-start; gap:.6rem; padding:.75rem .85rem; border-radius:.65rem; margin-bottom:1rem; font-size:.84rem; }
    .inline-state small { display:block; margin-top:.2rem; color:var(--text-secondary,#64748b); }
    .inline-state.loading { color:#1d4ed8; background:#eff6ff; }
    .inline-state.error, .review-error { color:#991b1b; background:#fef2f2; border:1px solid #fecaca; }
    .inline-state.warning, .skip-note { color:#92400e; background:#fffbeb; border:1px solid #fde68a; }
    .price-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:.65rem; margin-top:1rem; padding:.8rem; border-radius:.7rem; background:var(--bg-secondary,#f8fafc); }
    .price-summary div { display:grid; gap:.2rem; }
    .price-summary span, .review-grid span { color:var(--text-secondary,#64748b); font-size:.75rem; }
    .price-summary strong { font-size:1rem; }
    .price-summary .remaining strong { color:#15803d; }
    .review-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; }
    .review-grid > div { display:grid; gap:.25rem; padding:.85rem; border:1px solid var(--border-color,#e2e8f0); border-radius:.7rem; background:var(--bg-secondary,#f8fafc); }
    .review-grid small { color:var(--text-secondary,#64748b); line-height:1.5; }
    .mod-actions { display:flex; justify-content:flex-start; gap:.65rem; margin-top:1.35rem; padding-top:1rem; border-top:1px solid var(--border-color,#e2e8f0); }
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; min-height:42px; padding:0 1.1rem; border:0; border-radius:.6rem; font:inherit; font-weight:800; cursor:pointer; }
    .btn:disabled { opacity:.55; cursor:not-allowed; }
    .btn.primary { color:#fff; background:#2563eb; }
    .btn.secondary { color:var(--text-secondary,#475569); background:transparent; border:1px solid var(--border-color,#cbd5e1); }
    @media (max-width:600px) { .mod-header, .mod-body { padding-inline:1rem; } .mod-steps { padding-inline:1rem; gap:.35rem; } .mod-steps li { flex-direction:column; text-align:center; gap:.25rem; font-size:.7rem; } .form-grid, .review-grid, .price-summary { grid-template-columns:1fr; } .field.full { grid-column:auto; } .mod-actions .btn { flex:1; } }
  `]
})
export class MemberOnboardingDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() saving = false;
  @Input() plans: SubscriptionPlan[] = [];
  @Input() plansLoading = false;
  @Input() plansError: string | null = null;

  @Output() save = new EventEmitter<MemberOnboardingValue>();
  @Output() cancel = new EventEmitter<void>();

  step: 1 | 2 | 3 = 1;
  touched = false;
  includeMembership = true;
  draft = this.emptyDraft();
  membership = this.emptyMembership();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) this.reset();
  }

  private emptyDraft() {
    const today = new Date().toISOString().slice(0, 10);
    return { fullName: '', phoneNumber: '', email: '', gender: undefined as number | undefined, birthDate: '', registrationDate: today, notes: '' };
  }

  private emptyMembership() {
    return { planId: '', startDate: new Date().toISOString().slice(0, 10), paymentMethod: 0, amountPaid: 0, discount: 0, notes: '', issueCard: true };
  }

  reset(): void {
    this.step = 1;
    this.touched = false;
    this.includeMembership = true;
    this.draft = this.emptyDraft();
    this.membership = this.emptyMembership();
  }

  validPhone(): boolean { return /^0\d{9,10}$/.test(this.draft.phoneNumber.trim()); }

  selectedPlan(): SubscriptionPlan | undefined { return this.plans.find(plan => plan.id === this.membership.planId); }

  netAmount(): number {
    return Math.max(0, (this.selectedPlan()?.price || 0) - Number(this.membership.discount || 0));
  }

  remainingAmount(): number { return Math.max(0, this.netAmount() - Number(this.membership.amountPaid || 0)); }

  paymentLabel(): string { return ['كاش', 'محفظة', 'كارت', 'تحويل بنكي'][this.membership.paymentMethod] || 'غير محدد'; }

  back(): void {
    if (this.step === 1) {
      this.cancel.emit();
      return;
    }
    this.step = this.step === 3 ? 2 : 1;
    this.touched = false;
  }

  continue(): void {
    this.touched = true;
    if (this.step === 1) {
      if (!this.draft.fullName.trim() || !this.validPhone()) return;
      this.membership.startDate = this.draft.registrationDate || this.membership.startDate;
      this.step = 2;
      this.touched = false;
      return;
    }
    if (this.step === 2) {
      if (this.includeMembership && (!this.membership.planId || !this.membership.startDate)) return;
      this.step = 3;
      this.touched = false;
      return;
    }
    this.save.emit({
      fullName: this.draft.fullName.trim(),
      phoneNumber: this.draft.phoneNumber.trim(),
      email: this.draft.email.trim() || undefined,
      gender: this.draft.gender,
      birthDate: this.draft.birthDate || undefined,
      registrationDate: this.draft.registrationDate,
      notes: this.draft.notes.trim() || undefined,
      membership: this.includeMembership ? { ...this.membership, notes: [this.draft.notes.trim(), this.membership.notes.trim()].filter(Boolean).join(' · ') || undefined } : null
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.saving) this.cancel.emit();
  }
}
