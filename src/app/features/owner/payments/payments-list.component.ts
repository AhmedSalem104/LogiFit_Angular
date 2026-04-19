import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceService } from '../services/finance.service';
import { BranchesService } from '../services/branches.service';
import { OwnerService, Client } from '../services/owner.service';
import {
  Payment, CreatePaymentRequest, Branch,
  PaymentMethodEnum, PaymentMethodGymLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="المدفوعات" subtitle="تسجيل ومتابعة المدفوعات"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'المدفوعات'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>دفعة جديدة</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-dollar"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ total() | number:'1.0-0' }}</span>
            <span class="mini-stat__label">إجمالي المدفوعات (ج.م)</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-list"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ items().length }}</span>
            <span class="mini-stat__label">عدد الدفعات</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown [options]="clientOptions()" [(ngModel)]="clientFilter"
          placeholder="كل العملاء" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="methodOptions" [(ngModel)]="methodFilter"
          placeholder="كل الطرق" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="load()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="load()"/>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>التاريخ</th><th>العميل</th><th>الفاتورة</th><th>الفرع</th>
                <th>الطريقة</th><th>رقم الإيصال</th><th>المبلغ</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-p>
            <tr>
              <td>{{ p.receivedAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>{{ p.clientName || '-' }}</td>
              <td>{{ p.invoiceNumber || '-' }}</td>
              <td>{{ p.branchName || '-' }}</td>
              <td><span class="badge blue">{{ methodLabels[p.method] }}</span></td>
              <td>{{ p.receiptNumber || '-' }}</td>
              <td><strong>{{ p.amount | number:'1.0-2' }}</strong></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7"><div class="empty-state"><i class="pi pi-dollar"></i><p>لا توجد مدفوعات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'540px'}"
              header="دفعة جديدة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">العميل</label>
          <p-dropdown [options]="clientOptions()" [(ngModel)]="form.clientId" [filter]="true" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الفرع</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">معرف الفاتورة (اختياري)</label>
          <input class="form-input" [(ngModel)]="form.invoiceId"/></div>
        <div><label class="form-label">معرف الاشتراك (اختياري)</label>
          <input class="form-input" [(ngModel)]="form.subscriptionId"/></div>
        <div><label class="form-label">المبلغ *</label>
          <p-inputNumber [(ngModel)]="form.amount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">طريقة الدفع</label>
          <p-dropdown [options]="methodOptions" [(ngModel)]="form.method" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">رقم الإيصال</label>
          <input class="form-input" [(ngModel)]="form.receiptNumber"/></div>
        <div><label class="form-label">رقم المرجع</label>
          <input class="form-input" [(ngModel)]="form.referenceNumber"/></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <input class="form-input" [(ngModel)]="form.notes"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class PaymentsListComponent implements OnInit {
  private svc = inject(FinanceService);
  private branchesSvc = inject(BranchesService);
  private ownerSvc = inject(OwnerService);
  private toast = inject(NotificationService);

  items = signal<Payment[]>([]);
  clients = signal<Client[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  clientFilter: string | null = null;
  branchFilter: string | null = null;
  methodFilter: PaymentMethodEnum | null = null;
  fromDate=''; toDate='';
  dialog = false;
  form: CreatePaymentRequest = { amount: 0, method: PaymentMethodEnum.Cash };
  methodLabels = PaymentMethodGymLabels;
  methodOptions = Object.entries(PaymentMethodGymLabels).map(([v,l]) => ({ label: l, value: Number(v) as PaymentMethodEnum }));
  total = computed(() => this.items().reduce((s,p) => s + (p.amount || 0), 0));
  clientOptions = computed(() => this.clients().map(c => ({ label: c.fullName || c.email || c.id, value: c.id })));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.ownerSvc.getClients().subscribe(c => this.clients.set(c || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listPayments({
      clientId: this.clientFilter ?? undefined,
      branchId: this.branchFilter ?? undefined,
      method: this.methodFilter ?? undefined,
      fromDate: this.fromDate || undefined, toDate: this.toDate || undefined
    }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  openAdd() { this.form = { amount: 0, method: PaymentMethodEnum.Cash }; this.dialog = true; }
  save() {
    if (!this.form.amount) { this.toast.error('أدخل المبلغ'); return; }
    this.saving.set(true);
    this.svc.createPayment(this.form).subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
