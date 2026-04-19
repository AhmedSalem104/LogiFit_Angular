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
import { HrService } from '../services/hr.service';
import { BranchesService } from '../services/branches.service';
import {
  PayrollRun, GeneratePayrollRequest, PayrollItem, PayrollStatus, PayrollStatusLabels,
  UpdatePayrollItemRequest, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule, InputNumberModule,
    DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="كشوف الرواتب" subtitle="توليد واعتماد كشوف الرواتب"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الرواتب'}]">
        <button class="btn btn-primary" (click)="openGenerate()"><i class="pi pi-play"></i><span>توليد كشف جديد</span></button>
      </app-page-header>

      <div class="toolbar">
        <p-dropdown [options]="yearOptions" [(ngModel)]="yearFilter"
          placeholder="السنة" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="monthOptions" [(ngModel)]="monthFilter"
          placeholder="الشهر" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="runs()">
          <ng-template pTemplate="header">
            <tr><th>السنة / الشهر</th><th>الفرع</th><th>عدد الموظفين</th>
                <th>الإجمالي</th><th>الحالة</th><th>الاعتماد</th><th>الصرف</th>
                <th style="width:220px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td><strong>{{ r.year }}/{{ r.month.toString().padStart(2, '0') }}</strong></td>
              <td>{{ r.branchName || 'كل الفروع' }}</td>
              <td>{{ r.itemsCount }}</td>
              <td><strong>{{ r.totalAmount | number:'1.0-2' }}</strong></td>
              <td><span class="badge" [ngClass]="{gray:r.status===1, blue:r.status===2, green:r.status===3, red:r.status===4}">
                {{ statusLabels[r.status] }}</span></td>
              <td>{{ r.approvedAt ? (r.approvedAt | date:'yyyy-MM-dd') : '-' }}</td>
              <td>{{ r.paidAt ? (r.paidAt | date:'yyyy-MM-dd') : '-' }}</td>
              <td>
                <button class="action-btn" (click)="view(r)" pTooltip="عرض التفاصيل"><i class="pi pi-eye"></i></button>
                <button class="action-btn success" *ngIf="r.status===1" (click)="approve(r)" pTooltip="اعتماد"><i class="pi pi-check"></i></button>
                <button class="action-btn success" *ngIf="r.status===2" (click)="pay(r)" pTooltip="صرف"><i class="pi pi-dollar"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-receipt"></i><p>لا توجد كشوف</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="generateDialog" [modal]="true" [style]="{width:'460px'}"
              header="توليد كشف رواتب" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">السنة *</label>
          <p-dropdown [options]="yearOptions" [(ngModel)]="genForm.year" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الشهر *</label>
          <p-dropdown [options]="monthOptions" [(ngModel)]="genForm.month" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">الفرع (اختياري)</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="genForm.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="generateDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveGenerate()" [disabled]="saving()">توليد</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="viewDialog" [modal]="true" [style]="{width:'960px', maxWidth:'95vw'}"
              [header]="'كشف ' + selected?.year + '/' + selected?.month" [dismissableMask]="true">
      <div *ngIf="selected" class="data-card">
        <p-table [value]="selected.items || []">
          <ng-template pTemplate="header">
            <tr><th>الموظف</th><th>الأساسي</th><th>العمولات</th><th>مكافأة</th>
                <th>خصومات</th><th>الصافي</th><th>الصرف</th>
                <th *ngIf="selected && selected.status === 1" style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-it>
            <tr>
              <td><strong>{{ it.employeeName }}</strong></td>
              <td>{{ it.baseSalary | number:'1.0-2' }}</td>
              <td>{{ it.commissionTotal | number:'1.0-2' }}</td>
              <td>{{ it.bonus | number:'1.0-2' }}</td>
              <td>{{ it.deductions | number:'1.0-2' }}</td>
              <td><strong>{{ it.netSalary | number:'1.0-2' }}</strong></td>
              <td>{{ it.paidAt ? (it.paidAt | date:'yyyy-MM-dd') : '-' }}</td>
              <td *ngIf="selected && selected.status === 1">
                <button class="action-btn" (click)="openEditItem(it)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="itemDialog" [modal]="true" [style]="{width:'440px'}"
              header="تعديل بند كشف الراتب" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">مكافأة</label>
          <p-inputNumber [(ngModel)]="itemForm.bonus" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">خصومات</label>
          <p-inputNumber [(ngModel)]="itemForm.deductions" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="itemForm.notes"></textarea></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="itemDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveItem()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class PayrollComponent implements OnInit {
  private svc = inject(HrService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);
  runs = signal<PayrollRun[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  yearFilter: number | null = null;
  monthFilter: number | null = null;
  branchFilter: string | null = null;
  statusLabels = PayrollStatusLabels;
  yearOptions = Array.from({length: 10}, (_, i) => {
    const y = new Date().getFullYear() - i; return { label: y.toString(), value: y };
  });
  monthOptions = Array.from({length: 12}, (_, i) => ({ label: `شهر ${i+1}`, value: i+1 }));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  generateDialog = false;
  viewDialog = false;
  itemDialog = false;
  selected: PayrollRun | null = null;
  editingItem: PayrollItem | null = null;
  genForm: GeneratePayrollRequest = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  itemForm: UpdatePayrollItemRequest = { bonus: 0, deductions: 0 };

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listPayrolls({
      year: this.yearFilter ?? undefined,
      month: this.monthFilter ?? undefined,
      branchId: this.branchFilter ?? undefined
    }).subscribe({
      next: d => { this.runs.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  openGenerate() {
    this.genForm = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    this.generateDialog = true;
  }
  saveGenerate() {
    if (!this.genForm.year || !this.genForm.month) { this.toast.error('السنة والشهر مطلوبان'); return; }
    this.saving.set(true);
    this.svc.generatePayroll(this.genForm).subscribe({
      next: () => { this.saving.set(false); this.generateDialog=false; this.toast.success('تم التوليد'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  view(r: PayrollRun) {
    this.selected = r;
    this.viewDialog = true;
  }
  openEditItem(it: PayrollItem) {
    this.editingItem = it;
    this.itemForm = { bonus: it.bonus, deductions: it.deductions, notes: it.notes || '' };
    this.itemDialog = true;
  }
  saveItem() {
    if (!this.editingItem) return;
    this.saving.set(true);
    this.svc.updatePayrollItem(this.editingItem.id, this.itemForm).subscribe({
      next: () => { this.saving.set(false); this.itemDialog=false; this.toast.success('تم'); this.load();
        if (this.selected) this.view(this.selected); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  approve(r: PayrollRun) {
    Swal.fire({ title:'اعتماد الكشف؟', icon:'question', showCancelButton:true,
      confirmButtonText:'اعتماد', cancelButtonText:'إلغاء' })
      .then(res => { if(res.isConfirmed) this.svc.approvePayroll(r.id).subscribe({
        next: () => { this.toast.success('تم الاعتماد'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'فشل')
      }); });
  }
  pay(r: PayrollRun) {
    Swal.fire({ title:'صرف الكشف نهائياً؟', text:`سيتم تحديث كل العمولات والبنود إلى "مدفوعة"`,
      icon:'warning', showCancelButton:true, confirmButtonText:'صرف', cancelButtonText:'إلغاء' })
      .then(res => { if(res.isConfirmed) this.svc.payPayroll(r.id).subscribe({
        next: () => { this.toast.success('تم الصرف'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'فشل')
      }); });
  }
}
