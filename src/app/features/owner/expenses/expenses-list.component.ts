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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceService } from '../services/finance.service';
import { BranchesService } from '../services/branches.service';
import {
  Expense, CreateExpenseRequest, ExpenseCategory, Branch,
  PaymentMethodEnum, PaymentMethodGymLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="المصروفات" subtitle="تسجيل ومتابعة المصروفات"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'المصروفات'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>مصروف جديد</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-money-bill"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ total() | number:'1.0-0' }}</span>
            <span class="mini-stat__label">إجمالي المصروفات (ج.م)</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-list"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ items().length }}</span>
            <span class="mini-stat__label">عدد المصروفات</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter" placeholder="كل الفروع"
          [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="categoryOptions()" [(ngModel)]="categoryFilter" placeholder="كل الفئات"
          [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="load()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="load()"/>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>التاريخ</th><th>الفئة</th><th>الوصف</th><th>المورد</th><th>الفرع</th>
                <th>طريقة الدفع</th><th>المبلغ</th><th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-e>
            <tr>
              <td>{{ e.expenseDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ e.categoryName || '-' }}</td>
              <td>{{ e.description }}</td>
              <td>{{ e.vendorName || '-' }}</td>
              <td>{{ e.branchName || '-' }}</td>
              <td><span class="badge blue">{{ payLabels[e.paymentMethod] }}</span></td>
              <td><strong>{{ e.amount | number:'1.0-2' }}</strong></td>
              <td>
                <button class="action-btn" (click)="openEdit(e)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(e)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-inbox"></i><p>لا توجد مصروفات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'680px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل مصروف' : 'مصروف جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">الفئة *</label>
          <p-dropdown [options]="categoryOptions()" [(ngModel)]="form.categoryId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الفرع</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">المبلغ *</label>
          <p-inputNumber [(ngModel)]="form.amount" [min]="0" mode="decimal" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">التاريخ *</label>
          <input type="date" class="form-input" [(ngModel)]="form.expenseDate"/></div>
        <div><label class="form-label">طريقة الدفع</label>
          <p-dropdown [options]="paymentOptions" [(ngModel)]="form.paymentMethod" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">اسم المورد</label><input class="form-input" [(ngModel)]="form.vendorName"/></div>
        <div><label class="form-label">رقم المرجع</label><input class="form-input" [(ngModel)]="form.referenceNumber"/></div>
        <div><label class="form-label">رابط الإيصال</label><input class="form-input" [(ngModel)]="form.receiptImageUrl"/></div>
        <div class="full"><label class="form-label">الوصف *</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.description"></textarea></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class ExpensesListComponent implements OnInit {
  private svc = inject(FinanceService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);
  items = signal<Expense[]>([]);
  categories = signal<ExpenseCategory[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  branchFilter: string | null = null;
  categoryFilter: string | null = null;
  fromDate = ''; toDate = '';
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateExpenseRequest = this.emptyForm();
  payLabels = PaymentMethodGymLabels;
  paymentOptions = Object.entries(PaymentMethodGymLabels).map(([v, label]) => ({ label, value: Number(v) as PaymentMethodEnum }));

  total = computed(() => this.items().reduce((s, e) => s + (e.amount || 0), 0));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));
  categoryOptions = computed(() => this.categories().map(c => ({ label: c.name, value: c.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.svc.listExpenseCategories().subscribe(c => this.categories.set(c || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listExpenses({
      branchId: this.branchFilter ?? undefined,
      categoryId: this.categoryFilter ?? undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateExpenseRequest {
    return {
      categoryId: '', amount: 0, expenseDate: new Date().toISOString().substring(0, 10),
      description: '', paymentMethod: PaymentMethodEnum.Cash
    };
  }

  openAdd() { this.isEdit = false; this.editingId = null; this.form = this.emptyForm(); this.dialog = true; }
  openEdit(e: Expense) {
    this.isEdit = true; this.editingId = e.id;
    this.form = {
      branchId: e.branchId, categoryId: e.categoryId, amount: e.amount,
      expenseDate: e.expenseDate?.substring(0,10), description: e.description,
      vendorName: e.vendorName, paymentMethod: e.paymentMethod,
      receiptImageUrl: e.receiptImageUrl, referenceNumber: e.referenceNumber
    };
    this.dialog = true;
  }
  save() {
    if (!this.form.categoryId || !this.form.amount || !this.form.description) { this.toast.error('الفئة، المبلغ، والوصف مطلوبة'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateExpense(this.editingId, this.form)
      : this.svc.createExpense(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog = false; this.toast.success('تم'); this.load(); },
      error: (err: any) => { this.saving.set(false); this.toast.error(err?.error?.detail || 'فشل'); }
    });
  }
  remove(e: Expense) {
    Swal.fire({ title:'حذف المصروف؟', icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteExpense(e.id).subscribe({
        next: () => { this.toast.success('تم الحذف'); this.load(); },
        error: (err) => this.toast.error(err?.error?.detail || 'تعذر')
      }); });
  }
}
