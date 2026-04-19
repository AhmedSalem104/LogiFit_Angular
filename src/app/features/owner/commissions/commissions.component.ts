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
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HrService } from '../services/hr.service';
import {
  Commission, CommissionRule, CreateCommissionRuleRequest,
  CommissionSourceType, CommissionSourceTypeLabels, CommissionStatus, CommissionStatusLabels,
  CommissionRuleType, CommissionRuleTypeLabels, EmployeeRole, EmployeeRoleLabels, Employee
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule, InputNumberModule,
    InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, TabViewModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="العمولات" subtitle="عمولات المبيعات وقواعد الحساب"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'العمولات'}]"></app-page-header>

      <p-tabView>
        <p-tabPanel header="العمولات">
          <div class="toolbar">
            <p-dropdown [options]="employeeOptions()" [(ngModel)]="empFilter"
              placeholder="كل الموظفين" [showClear]="true" [filter]="true" (onChange)="loadCommissions()" appendTo="body"></p-dropdown>
            <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter"
              placeholder="كل الحالات" [showClear]="true" (onChange)="loadCommissions()" appendTo="body"></p-dropdown>
            <p-dropdown [options]="sourceOptions" [(ngModel)]="sourceFilter"
              placeholder="كل المصادر" [showClear]="true" (onChange)="loadCommissions()" appendTo="body"></p-dropdown>
          </div>
          <div class="data-card">
            <p-table [value]="commissions()" [paginator]="true" [rows]="10">
              <ng-template pTemplate="header">
                <tr><th>الموظف</th><th>المصدر</th><th>قيمة المصدر</th><th>العمولة</th>
                    <th>التاريخ</th><th>الحالة</th><th>الوصف</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-c>
                <tr>
                  <td><strong>{{ c.employeeName }}</strong></td>
                  <td><span class="badge purple">{{ sourceLabels[c.sourceType] }}</span></td>
                  <td>{{ c.sourceAmount | number:'1.0-2' }}</td>
                  <td><strong>{{ c.amount | number:'1.0-2' }}</strong></td>
                  <td>{{ c.earnedDate | date:'yyyy-MM-dd' }}</td>
                  <td><span class="badge" [ngClass]="{orange:c.status===1, blue:c.status===2, green:c.status===3, gray:c.status===4}">{{ statusLabels[c.status] }}</span></td>
                  <td>{{ c.description || '-' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-percentage"></i><p>لا توجد عمولات</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <p-tabPanel header="قواعد العمولة">
          <div style="margin-bottom: 1rem;">
            <button class="btn btn-primary" (click)="openAddRule()"><i class="pi pi-plus"></i><span>قاعدة جديدة</span></button>
          </div>
          <div class="data-card">
            <p-table [value]="rules()">
              <ng-template pTemplate="header">
                <tr><th>الموظف / الدور</th><th>المصدر</th><th>النوع</th><th>القيمة</th>
                    <th>أدنى مبلغ</th><th>الحالة</th><th style="width:120px">إجراءات</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-r>
                <tr>
                  <td>
                    <span *ngIf="r.employeeName">{{ r.employeeName }}</span>
                    <span *ngIf="!r.employeeName && r.role" class="badge blue">{{ roleLabels[r.role] }}</span>
                  </td>
                  <td><span class="badge purple">{{ sourceLabels[r.sourceType] }}</span></td>
                  <td>{{ ruleTypeLabels[r.type] }}</td>
                  <td>{{ r.type===1 ? (r.value + '%') : (r.value | number:'1.0-2') }}</td>
                  <td>{{ r.minAmount != null ? (r.minAmount | number) : '-' }}</td>
                  <td><span class="badge" [class.green]="r.isActive" [class.gray]="!r.isActive">{{ r.isActive ? 'نشطة':'متوقفة' }}</span></td>
                  <td>
                    <button class="action-btn" (click)="openEditRule(r)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                    <button class="action-btn danger" (click)="removeRule(r)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-cog"></i><p>لا توجد قواعد</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>

    <p-dialog [(visible)]="ruleDialog" [modal]="true" [style]="{width:'560px'}"
              [header]="isEdit ? 'تعديل قاعدة':'قاعدة جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">لموظف معين</label>
          <p-dropdown [options]="employeeOptions()" [(ngModel)]="ruleForm.employeeId" [showClear]="true" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">أو لدور كامل</label>
          <p-dropdown [options]="roleOptions" [(ngModel)]="ruleForm.role" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">المصدر *</label>
          <p-dropdown [options]="sourceOptions" [(ngModel)]="ruleForm.sourceType" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">نوع القاعدة</label>
          <p-dropdown [options]="ruleTypeOptions" [(ngModel)]="ruleForm.type" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">القيمة</label>
          <p-inputNumber [(ngModel)]="ruleForm.value" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">أدنى مبلغ</label>
          <p-inputNumber [(ngModel)]="ruleForm.minAmount" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="ruleForm.isActive"></p-inputSwitch><span>نشطة</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="ruleDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveRule()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class CommissionsComponent implements OnInit {
  private svc = inject(HrService);
  private toast = inject(NotificationService);
  commissions = signal<Commission[]>([]);
  rules = signal<CommissionRule[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(false);
  saving = signal(false);
  empFilter: string | null = null;
  statusFilter: CommissionStatus | null = null;
  sourceFilter: CommissionSourceType | null = null;
  ruleDialog = false; isEdit=false; editingId: string | null = null;
  ruleForm: CreateCommissionRuleRequest = this.emptyRule();

  sourceLabels = CommissionSourceTypeLabels;
  statusLabels = CommissionStatusLabels;
  ruleTypeLabels = CommissionRuleTypeLabels;
  roleLabels = EmployeeRoleLabels;
  sourceOptions = Object.entries(CommissionSourceTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as CommissionSourceType }));
  statusOptions = Object.entries(CommissionStatusLabels).map(([v,l]) => ({ label: l, value: Number(v) as CommissionStatus }));
  ruleTypeOptions = Object.entries(CommissionRuleTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as CommissionRuleType }));
  roleOptions = Object.entries(EmployeeRoleLabels).map(([v,l]) => ({ label: l, value: Number(v) as EmployeeRole }));
  employeeOptions = computed(() => this.employees().map(e => ({ label: e.fullName || e.email || e.employeeCode, value: e.id })));

  ngOnInit() {
    this.svc.listEmployees().subscribe(e => this.employees.set(e || []));
    this.loadCommissions();
    this.loadRules();
  }
  loadCommissions() {
    this.svc.listCommissions({
      employeeId: this.empFilter ?? undefined,
      status: this.statusFilter ?? undefined,
      sourceType: this.sourceFilter ?? undefined
    }).subscribe({
      next: d => this.commissions.set(d || []),
      error: () => this.toast.error('فشل التحميل')
    });
  }
  loadRules() {
    this.svc.listCommissionRules().subscribe({
      next: d => this.rules.set(d || []),
      error: () => this.toast.error('فشل التحميل')
    });
  }
  emptyRule(): CreateCommissionRuleRequest {
    return {
      sourceType: CommissionSourceType.SubscriptionSale,
      type: CommissionRuleType.Percentage, value: 10, isActive: true
    };
  }
  openAddRule() { this.isEdit=false; this.editingId=null; this.ruleForm = this.emptyRule(); this.ruleDialog=true; }
  openEditRule(r: CommissionRule) {
    this.isEdit=true; this.editingId=r.id;
    this.ruleForm = {
      employeeId:r.employeeId, role:r.role, sourceType:r.sourceType,
      type:r.type, value:r.value, minAmount:r.minAmount, isActive:r.isActive
    };
    this.ruleDialog=true;
  }
  saveRule() {
    if (!this.ruleForm.sourceType || this.ruleForm.value==null) { this.toast.error('المصدر والقيمة مطلوبان'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateCommissionRule(this.editingId, this.ruleForm)
      : this.svc.createCommissionRule(this.ruleForm);
    obs.subscribe({
      next: () => { this.saving.set(false); this.ruleDialog=false; this.toast.success('تم'); this.loadRules(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  removeRule(r: CommissionRule) {
    Swal.fire({ title:'حذف القاعدة؟', icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(res => { if(res.isConfirmed) this.svc.deleteCommissionRule(r.id).subscribe({
        next: () => { this.toast.success('تم'); this.loadRules(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
