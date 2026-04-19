import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceService } from '../services/finance.service';
import { BranchesService } from '../services/branches.service';
import { OwnerService, Client } from '../services/owner.service';
import {
  Invoice, CreateInvoiceRequest, InvoiceItem, InvoiceItemType, InvoiceItemTypeLabels,
  InvoiceStatus, InvoiceStatusLabels, Branch, PaymentMethodEnum, PaymentMethodGymLabels,
  CreatePaymentRequest
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الفواتير" subtitle="إدارة فواتير العملاء"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الفواتير'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>فاتورة جديدة</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-file"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ invoices().length }}</span>
            <span class="mini-stat__label">إجمالي الفواتير</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ paidTotal() | number:'1.0-0' }}</span>
            <span class="mini-stat__label">المحصل (ج.م)</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-clock"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ pendingTotal() | number:'1.0-0' }}</span>
            <span class="mini-stat__label">المتبقي (ج.م)</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown [options]="clientOptions()" [(ngModel)]="clientFilter"
          placeholder="كل العملاء" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter"
          placeholder="كل الحالات" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="load()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="load()"/>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="invoices()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الرقم</th><th>العميل</th><th>التاريخ</th><th>الاستحقاق</th>
                <th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th>
                <th style="width:160px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-i>
            <tr>
              <td><strong>{{ i.invoiceNumber }}</strong></td>
              <td>{{ i.clientName || '-' }}</td>
              <td>{{ i.issueDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ i.dueDate ? (i.dueDate | date:'yyyy-MM-dd') : '—' }}</td>
              <td>{{ i.total | number:'1.0-2' }}</td>
              <td>{{ i.amountPaid | number:'1.0-2' }}</td>
              <td>{{ i.remainingAmount | number:'1.0-2' }}</td>
              <td><span class="badge" [ngClass]="statusClass(i.status)">{{ statusLabels[i.status] }}</span></td>
              <td>
                <button class="action-btn" (click)="view(i)" pTooltip="عرض"><i class="pi pi-eye"></i></button>
                <button class="action-btn success" *ngIf="i.status===1" (click)="issue(i)" pTooltip="إصدار"><i class="pi pi-send"></i></button>
                <button class="action-btn success" *ngIf="i.remainingAmount > 0 && i.status !== 6" (click)="openPay(i)" pTooltip="تسجيل دفعة"><i class="pi pi-dollar"></i></button>
                <button class="action-btn danger" *ngIf="i.status !== 6 && i.status !== 4" (click)="cancel(i)" pTooltip="إلغاء"><i class="pi pi-times"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9"><div class="empty-state"><i class="pi pi-file"></i><p>لا توجد فواتير</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Add Invoice Dialog -->
    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'920px', maxWidth:'95vw'}"
              header="فاتورة جديدة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">العميل</label>
          <p-dropdown [options]="clientOptions()" [(ngModel)]="form.clientId" [filter]="true" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الفرع</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">تاريخ الإصدار</label>
          <input type="date" class="form-input" [(ngModel)]="form.issueDate"/></div>
        <div><label class="form-label">تاريخ الاستحقاق</label>
          <input type="date" class="form-input" [(ngModel)]="form.dueDate"/></div>
        <div class="full">
          <label class="form-label">ملاحظات</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.notes"></textarea>
        </div>
      </div>

      <h4 class="items-title">عناصر الفاتورة</h4>
      <div class="items-list">
        <div class="item-row" *ngFor="let it of form.items; let idx = index">
          <p-dropdown [options]="itemTypeOptions" [(ngModel)]="it.itemType" placeholder="النوع" appendTo="body"></p-dropdown>
          <input class="form-input" [(ngModel)]="it.description" placeholder="الوصف"/>
          <p-inputNumber [(ngModel)]="it.quantity" [min]="1" placeholder="الكمية"></p-inputNumber>
          <p-inputNumber [(ngModel)]="it.unitPrice" [min]="0" placeholder="السعر"></p-inputNumber>
          <p-inputNumber [(ngModel)]="it.taxRate" [min]="0" [max]="100" placeholder="الضريبة %"></p-inputNumber>
          <p-inputNumber [(ngModel)]="it.discountAmount" [min]="0" placeholder="الخصم"></p-inputNumber>
          <button class="action-btn danger" (click)="removeItem(idx)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
        </div>
      </div>
      <button class="btn btn-ghost" (click)="addItem()"><i class="pi pi-plus"></i><span>إضافة بند</span></button>

      <div class="invoice-totals">
        <div><span>الإجمالي الفرعي:</span><strong>{{ subtotal() | number:'1.0-2' }}</strong></div>
        <div><span>الضريبة:</span><strong>{{ taxTotal() | number:'1.0-2' }}</strong></div>
        <div><span>الخصم:</span><strong>{{ discountTotal() | number:'1.0-2' }}</strong></div>
        <div class="grand"><span>الإجمالي الكلي:</span><strong>{{ grandTotal() | number:'1.0-2' }}</strong></div>
      </div>

      <div class="dialog-grid">
        <div>
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.issueImmediately"></p-inputSwitch>
            <span>إصدار فورياً</span>
          </label>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ الفاتورة</button>
      </div>
    </p-dialog>

    <!-- View Dialog -->
    <p-dialog [(visible)]="viewDialog" [modal]="true" [style]="{width:'720px', maxWidth:'95vw'}"
              [header]="'فاتورة ' + (selected?.invoiceNumber || '')" [dismissableMask]="true">
      <div *ngIf="selected" class="view-body">
        <div class="view-meta">
          <div><span>العميل:</span><strong>{{ selected.clientName || '-' }}</strong></div>
          <div><span>التاريخ:</span><strong>{{ selected.issueDate | date:'yyyy-MM-dd' }}</strong></div>
          <div><span>الحالة:</span><span class="badge" [ngClass]="statusClass(selected.status)">{{ statusLabels[selected.status] }}</span></div>
        </div>
        <h4>العناصر</h4>
        <table class="simple-table"><thead><tr><th>الوصف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
          <tbody><tr *ngFor="let it of selected.items">
            <td>{{ it.description }}</td><td>{{ it.quantity }}</td>
            <td>{{ it.unitPrice | number:'1.0-2' }}</td><td>{{ it.lineTotal | number:'1.0-2' }}</td>
          </tr></tbody>
        </table>
        <div class="view-totals">
          <div><span>الفرعي:</span><strong>{{ selected.subtotal | number:'1.0-2' }}</strong></div>
          <div><span>الضريبة:</span><strong>{{ selected.taxAmount | number:'1.0-2' }}</strong></div>
          <div><span>الخصم:</span><strong>{{ selected.discountAmount | number:'1.0-2' }}</strong></div>
          <div class="grand"><span>الإجمالي:</span><strong>{{ selected.total | number:'1.0-2' }}</strong></div>
          <div><span>المدفوع:</span><strong>{{ selected.amountPaid | number:'1.0-2' }}</strong></div>
          <div class="grand" style="color:#ef4444"><span>المتبقي:</span><strong>{{ selected.remainingAmount | number:'1.0-2' }}</strong></div>
        </div>
        <h4 *ngIf="selected.payments && selected.payments.length">المدفوعات</h4>
        <table *ngIf="selected.payments && selected.payments.length" class="simple-table">
          <thead><tr><th>التاريخ</th><th>الطريقة</th><th>المبلغ</th><th>رقم الإيصال</th></tr></thead>
          <tbody><tr *ngFor="let p of selected.payments">
            <td>{{ p.receivedAt | date:'yyyy-MM-dd HH:mm' }}</td><td>{{ payLabels[p.method] }}</td>
            <td>{{ p.amount | number:'1.0-2' }}</td><td>{{ p.receiptNumber || '-' }}</td>
          </tr></tbody>
        </table>
      </div>
    </p-dialog>

    <!-- Payment Dialog -->
    <p-dialog [(visible)]="payDialog" [modal]="true" [style]="{width:'440px'}"
              header="تسجيل دفعة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">المبلغ *</label>
          <p-inputNumber [(ngModel)]="payForm.amount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">طريقة الدفع</label>
          <p-dropdown [options]="paymentOptions" [(ngModel)]="payForm.method" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">رقم الإيصال</label>
          <input class="form-input" [(ngModel)]="payForm.receiptNumber"/></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <input class="form-input" [(ngModel)]="payForm.notes"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="payDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="savePayment()" [disabled]="saving()">حفظ الدفعة</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .items-title { margin: 1rem 0 .5rem; font-weight: 600; }
    .items-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .75rem; }
    .item-row {
      display:grid; grid-template-columns: 140px 1fr 80px 100px 80px 100px 40px;
      gap:.5rem; align-items:center;
    }
    @media (max-width:800px) { .item-row { grid-template-columns: 1fr 1fr; } }
    .invoice-totals {
      margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: 12px;
      display:flex; flex-direction:column; gap:.35rem;
    }
    .invoice-totals > div { display:flex; justify-content:space-between; }
    .invoice-totals > div.grand { font-size: 1.1rem; padding-top:.5rem; border-top:1px dashed var(--border-color); color: var(--primary-500); }
    .view-body { display:flex; flex-direction:column; gap: 1rem; }
    .view-meta { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 10px; }
    .view-meta > div { display:flex; gap:.5rem; align-items:center; }
    .view-meta > div span { color: var(--text-secondary); font-size: .8rem; }
    .simple-table { width:100%; border-collapse: collapse; }
    .simple-table th, .simple-table td { padding: .5rem .75rem; border-bottom: 1px solid var(--border-color); text-align: right; }
    .simple-table th { background: var(--bg-secondary); font-size:.8rem; color: var(--text-secondary); }
    .view-totals { padding: 1rem; background: var(--bg-secondary); border-radius: 12px; display: flex; flex-direction: column; gap: .35rem; }
    .view-totals > div { display:flex; justify-content:space-between; }
    .view-totals > div.grand { font-weight:700; padding-top:.5rem; border-top:1px dashed var(--border-color); }
  `]
})
export class InvoicesListComponent implements OnInit {
  private svc = inject(FinanceService);
  private branchesSvc = inject(BranchesService);
  private ownerSvc = inject(OwnerService);
  private toast = inject(NotificationService);

  invoices = signal<Invoice[]>([]);
  clients = signal<Client[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);

  clientFilter: string | null = null;
  branchFilter: string | null = null;
  statusFilter: InvoiceStatus | null = null;
  fromDate=''; toDate='';

  dialog = false;
  viewDialog = false;
  payDialog = false;
  selected: Invoice | null = null;
  form: CreateInvoiceRequest = this.emptyForm();
  payForm: CreatePaymentRequest = { amount: 0, method: PaymentMethodEnum.Cash };

  statusLabels = InvoiceStatusLabels;
  payLabels = PaymentMethodGymLabels;
  statusOptions = Object.entries(InvoiceStatusLabels).map(([v,l]) => ({ label: l, value: Number(v) as InvoiceStatus }));
  itemTypeOptions = Object.entries(InvoiceItemTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as InvoiceItemType }));
  paymentOptions = Object.entries(PaymentMethodGymLabels).map(([v,l]) => ({ label: l, value: Number(v) as PaymentMethodEnum }));

  paidTotal = computed(() => this.invoices().reduce((s,i) => s + (i.amountPaid || 0), 0));
  pendingTotal = computed(() => this.invoices().reduce((s,i) => s + (i.remainingAmount || 0), 0));
  clientOptions = computed(() => this.clients().map(c => ({ label: c.fullName || c.email || c.id, value: c.id })));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  subtotal = computed(() => (this.form.items || []).reduce((s, it) => s + (Number(it.quantity||0) * Number(it.unitPrice||0)), 0));
  taxTotal = computed(() => (this.form.items || []).reduce((s, it) => {
    const base = Number(it.quantity||0) * Number(it.unitPrice||0) - Number(it.discountAmount||0);
    return s + base * (Number(it.taxRate||0) / 100);
  }, 0));
  discountTotal = computed(() => (this.form.items || []).reduce((s, it) => s + Number(it.discountAmount||0), 0));
  grandTotal = computed(() => this.subtotal() + this.taxTotal() - this.discountTotal());

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.ownerSvc.getClients().subscribe(c => this.clients.set(c || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listInvoices({
      clientId: this.clientFilter ?? undefined,
      branchId: this.branchFilter ?? undefined,
      status: this.statusFilter ?? undefined,
      fromDate: this.fromDate || undefined, toDate: this.toDate || undefined
    }).subscribe({
      next: d => { this.invoices.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateInvoiceRequest {
    return {
      issueDate: new Date().toISOString().substring(0, 10),
      issueImmediately: true,
      items: [{ itemType: InvoiceItemType.Manual, description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountAmount: 0 }]
    };
  }

  openAdd() { this.form = this.emptyForm(); this.dialog = true; }
  addItem() {
    this.form.items.push({ itemType: InvoiceItemType.Manual, description:'', quantity:1, unitPrice:0, taxRate:0, discountAmount:0 });
  }
  removeItem(i: number) { this.form.items.splice(i, 1); }

  save() {
    if (!this.form.items.length) { this.toast.error('أضف عنصر واحد على الأقل'); return; }
    this.saving.set(true);
    this.svc.createInvoice(this.form).subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم إنشاء الفاتورة'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  view(i: Invoice) {
    this.svc.getInvoice(i.id).subscribe({
      next: inv => { this.selected = inv; this.viewDialog = true; },
      error: () => this.toast.error('تعذر تحميل الفاتورة')
    });
  }

  issue(i: Invoice) {
    this.svc.issueInvoice(i.id).subscribe({
      next: () => { this.toast.success('تم الإصدار'); this.load(); },
      error: (e) => this.toast.error(e?.error?.detail || 'فشل')
    });
  }

  cancel(i: Invoice) {
    Swal.fire({ title:'إلغاء الفاتورة؟', input:'text', inputPlaceholder:'السبب...',
      showCancelButton:true, confirmButtonText:'إلغاء', cancelButtonText:'رجوع', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed && r.value) this.svc.cancelInvoice(i.id, { reason: r.value }).subscribe({
        next: () => { this.toast.success('تم الإلغاء'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'فشل')
      }); });
  }

  openPay(i: Invoice) {
    this.selected = i;
    this.payForm = { invoiceId: i.id, amount: i.remainingAmount, method: PaymentMethodEnum.Cash };
    this.payDialog = true;
  }

  savePayment() {
    if (!this.payForm.amount) { this.toast.error('أدخل المبلغ'); return; }
    this.saving.set(true);
    this.svc.createPayment(this.payForm).subscribe({
      next: () => { this.saving.set(false); this.payDialog=false; this.toast.success('تم تسجيل الدفعة'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  statusClass(s: InvoiceStatus): Record<string, boolean> {
    return {
      gray: s === 1, blue: s === 2, orange: s === 3, green: s === 4, red: s === 5 || s === 6
    };
  }
}
