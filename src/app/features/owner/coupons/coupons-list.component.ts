import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceService } from '../services/finance.service';
import {
  Coupon, CreateCouponRequest, DiscountType, CouponApplicability,
  DiscountTypeLabels, CouponApplicabilityLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الكوبونات" subtitle="إدارة كوبونات الخصم"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الكوبونات'}]">
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openValidate()"><i class="pi pi-check-square"></i><span>التحقق من كود</span></button>
          <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>كوبون جديد</span></button>
        </div>
      </app-page-header>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="بحث بالكود..."/>
          <i class="pi pi-search"></i>
        </div>
        <p-dropdown [options]="activeOptions" [(ngModel)]="activeFilter"
          placeholder="الكل" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الكود</th><th>النوع</th><th>القيمة</th><th>ينطبق على</th>
                <th>الاستخدامات</th><th>تاريخ البداية</th><th>النهاية</th><th>الحالة</th>
                <th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td><code class="code-pill">{{ c.code }}</code></td>
              <td>{{ typeLabels[c.discountType] }}</td>
              <td>{{ c.discountType===1 ? (c.discountValue + '%') : (c.discountValue | number:'1.0-2') }}</td>
              <td><span class="badge purple">{{ applyLabels[c.applicableTo] }}</span></td>
              <td>{{ c.usedCount || 0 }} / {{ c.maxUses || '∞' }}</td>
              <td>{{ c.startDate ? (c.startDate | date:'yyyy-MM-dd') : '—' }}</td>
              <td>{{ c.endDate ? (c.endDate | date:'yyyy-MM-dd') : '—' }}</td>
              <td><span class="badge" [class.green]="c.isActive" [class.gray]="!c.isActive">{{ c.isActive ? 'نشط':'متوقف' }}</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(c)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(c)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9"><div class="empty-state"><i class="pi pi-ticket"></i><p>لا توجد كوبونات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'720px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل كوبون':'كوبون جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">الكود *</label><input class="form-input" [(ngModel)]="form.code" style="text-transform:uppercase"/></div>
        <div><label class="form-label">نوع الخصم</label>
          <p-dropdown [options]="typeOptions" [(ngModel)]="form.discountType" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">قيمة الخصم</label>
          <p-inputNumber [(ngModel)]="form.discountValue" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">ينطبق على</label>
          <p-dropdown [options]="applyOptions" [(ngModel)]="form.applicableTo" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">أدنى مبلغ</label>
          <p-inputNumber [(ngModel)]="form.minimumAmount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">أقصى قيمة خصم</label>
          <p-inputNumber [(ngModel)]="form.maxDiscountAmount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">أقصى استخدام</label>
          <p-inputNumber [(ngModel)]="form.maxUses" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">أقصى استخدام للمستخدم</label>
          <p-inputNumber [(ngModel)]="form.maxUsesPerUser" [min]="1" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">تاريخ البداية</label>
          <input type="date" class="form-input" [(ngModel)]="form.startDate"/></div>
        <div><label class="form-label">تاريخ النهاية</label>
          <input type="date" class="form-input" [(ngModel)]="form.endDate"/></div>
        <div class="full"><label class="form-label">الوصف</label><input class="form-input" [(ngModel)]="form.description"/></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch><span>نشط</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="validateDialog" [modal]="true" [style]="{width:'460px'}"
              header="التحقق من كوبون" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">الكود</label><input class="form-input" [(ngModel)]="validateCode" style="text-transform:uppercase"/></div>
        <div><label class="form-label">المبلغ</label>
          <p-inputNumber [(ngModel)]="validateAmount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">السياق</label>
          <p-dropdown [options]="applyOptions" [(ngModel)]="validateContext" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
      </div>
      <div *ngIf="validateResult()" class="validate-result" [class.valid]="validateResult()!.isValid" [class.invalid]="!validateResult()!.isValid">
        <i class="pi" [class.pi-check-circle]="validateResult()!.isValid" [class.pi-times-circle]="!validateResult()!.isValid"></i>
        <div>
          <strong>{{ validateResult()!.isValid ? 'الكود صالح' : 'الكود غير صالح' }}</strong>
          <div *ngIf="validateResult()!.isValid">قيمة الخصم التقديرية: <strong>{{ validateResult()!.estimatedDiscount | number:'1.0-2' }}</strong></div>
          <div *ngIf="!validateResult()!.isValid">{{ validateResult()!.errorMessage }}</div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="validateDialog=false">إغلاق</button>
        <button class="btn btn-primary" (click)="runValidate()" [disabled]="validating()">تحقق</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .code-pill { background: var(--bg-secondary); padding: .25rem .6rem; border-radius: 8px; font-weight: 600; letter-spacing: .05em; }
    .validate-result { margin-top: 1rem; padding: 1rem; border-radius: 12px; display:flex; gap:1rem; align-items: flex-start; }
    .validate-result.valid { background: rgba(16,185,129,.1); color:#10b981; }
    .validate-result.invalid { background: rgba(239,68,68,.1); color:#ef4444; }
    .validate-result i { font-size: 1.5rem; }
  `]
})
export class CouponsListComponent implements OnInit {
  private svc = inject(FinanceService);
  private toast = inject(NotificationService);
  items = signal<Coupon[]>([]);
  loading = signal(false);
  saving = signal(false);
  validating = signal(false);
  search = '';
  activeFilter: boolean | null = null;
  activeOptions = [{ label:'نشط', value:true },{ label:'متوقف', value:false }];
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateCouponRequest = this.emptyForm();

  validateDialog = false;
  validateCode = ''; validateAmount = 0; validateContext: CouponApplicability | null = null;
  validateResult = signal<any>(null);

  typeLabels = DiscountTypeLabels;
  applyLabels = CouponApplicabilityLabels;
  typeOptions = Object.entries(DiscountTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as DiscountType }));
  applyOptions = Object.entries(CouponApplicabilityLabels).map(([v,l]) => ({ label: l, value: Number(v) as CouponApplicability }));

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listCoupons({ isActive: this.activeFilter ?? undefined, search: this.search || undefined }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  emptyForm(): CreateCouponRequest {
    return {
      code:'', discountType: DiscountType.Percentage, discountValue: 10,
      applicableTo: CouponApplicability.All, isActive: true, maxUsesPerUser: 1
    };
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = this.emptyForm(); this.dialog = true; }
  openEdit(c: Coupon) {
    this.isEdit=true; this.editingId=c.id;
    this.form = {
      code:c.code, description:c.description, discountType:c.discountType, discountValue:c.discountValue,
      minimumAmount:c.minimumAmount, maxDiscountAmount:c.maxDiscountAmount, maxUses:c.maxUses,
      maxUsesPerUser:c.maxUsesPerUser, startDate:c.startDate?.substring(0,10), endDate:c.endDate?.substring(0,10),
      applicableTo:c.applicableTo, isActive:c.isActive
    };
    this.dialog = true;
  }
  save() {
    if (!this.form.code || this.form.discountValue==null) { this.toast.error('الكود وقيمة الخصم مطلوبة'); return; }
    this.saving.set(true);
    const payload = { ...this.form, code: this.form.code.toUpperCase() };
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateCoupon(this.editingId, payload)
      : this.svc.createCoupon(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(c: Coupon) {
    Swal.fire({ title:'حذف الكوبون؟', text:c.code, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteCoupon(c.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }

  openValidate() {
    this.validateCode=''; this.validateAmount=0; this.validateContext=null; this.validateResult.set(null);
    this.validateDialog=true;
  }
  runValidate() {
    if (!this.validateCode) { this.toast.error('أدخل الكود'); return; }
    this.validating.set(true);
    this.svc.validateCoupon({ code: this.validateCode.toUpperCase(), amount: this.validateAmount, context: this.validateContext ?? undefined }).subscribe({
      next: r => { this.validating.set(false); this.validateResult.set(r); },
      error: (e) => { this.validating.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
