import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HrService } from '../services/hr.service';
import { BranchesService } from '../services/branches.service';
import {
  Employee, CreateEmployeeRequest, SalaryType, SalaryTypeLabels,
  EmployeeRoleLabels, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule, InputNumberModule,
    DropdownModule, MultiSelectModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الموظفين" subtitle="إدارة موظفي الجيم"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الموظفين'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>موظف جديد</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-users"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ items().length }}</span>
            <span class="mini-stat__label">إجمالي الموظفين</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ activeCount() }}</span>
            <span class="mini-stat__label">نشط</span></div></div>
      </div>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="بحث..."/>
          <i class="pi pi-search"></i>
        </div>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الكود</th><th>الاسم</th><th>الدور</th><th>المسمى</th><th>القسم</th>
                <th>تاريخ الالتحاق</th><th>الراتب الأساسي</th><th>الحالة</th>
                <th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-e>
            <tr>
              <td><code>{{ e.employeeCode }}</code></td>
              <td>{{ e.fullName || e.email || '-' }}</td>
              <td><span class="badge blue">{{ roleLabels[e.role] }}</span></td>
              <td>{{ e.jobTitle }}</td>
              <td>{{ e.department || '-' }}</td>
              <td>{{ e.joinDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ e.baseSalary | number }} ({{ salaryLabels[e.salaryType] }})</td>
              <td><span class="badge" [class.green]="e.isActive" [class.gray]="!e.isActive">{{ e.isActive ? 'نشط':'منتهي' }}</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(e)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" *ngIf="e.isActive" (click)="terminate(e)" pTooltip="إنهاء"><i class="pi pi-times"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9"><div class="empty-state"><i class="pi pi-users"></i><p>لا يوجد موظفين</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'800px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل موظف':'موظف جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div *ngIf="!isEdit"><label class="form-label">User Id *</label>
          <input class="form-input" [(ngModel)]="form.userId" placeholder="GUID"/></div>
        <div><label class="form-label">الكود *</label><input class="form-input" [(ngModel)]="form.employeeCode"/></div>
        <div><label class="form-label">المسمى الوظيفي *</label><input class="form-input" [(ngModel)]="form.jobTitle"/></div>
        <div><label class="form-label">القسم</label><input class="form-input" [(ngModel)]="form.department"/></div>
        <div><label class="form-label">تاريخ الالتحاق *</label>
          <input type="date" class="form-input" [(ngModel)]="form.joinDate"/></div>
        <div><label class="form-label">نوع الراتب</label>
          <p-dropdown [options]="salaryOptions" [(ngModel)]="form.salaryType" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الراتب الأساسي</label>
          <p-inputNumber [(ngModel)]="form.baseSalary" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div *ngIf="form.salaryType===2"><label class="form-label">أجر الساعة</label>
          <p-inputNumber [(ngModel)]="form.hourlyRate" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">رقم قومي</label><input class="form-input" [(ngModel)]="form.nationalId"/></div>
        <div><label class="form-label">حساب بنكي</label><input class="form-input" [(ngModel)]="form.bankAccount"/></div>
        <div><label class="form-label">اسم البنك</label><input class="form-input" [(ngModel)]="form.bankName"/></div>
        <div><label class="form-label">جهة اتصال طوارئ</label><input class="form-input" [(ngModel)]="form.emergencyContactName"/></div>
        <div><label class="form-label">هاتف طوارئ</label><input class="form-input" [(ngModel)]="form.emergencyContactPhone"/></div>
        <div class="full"><label class="form-label">المؤهلات</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.qualifications"></textarea></div>
        <div class="full"><label class="form-label">الفروع</label>
          <p-multiSelect [options]="branchOptions()" [(ngModel)]="form.branchIds" appendTo="body" styleClass="w-full"></p-multiSelect></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class EmployeesListComponent implements OnInit {
  private svc = inject(HrService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);
  items = signal<Employee[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  search = '';
  branchFilter: string | null = null;
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateEmployeeRequest = this.emptyForm();
  roleLabels = EmployeeRoleLabels;
  salaryLabels = SalaryTypeLabels;
  salaryOptions = Object.entries(SalaryTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as SalaryType }));
  activeCount = computed(() => this.items().filter(e => e.isActive).length);
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listEmployees({
      branchId: this.branchFilter ?? undefined,
      searchTerm: this.search || undefined
    }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  emptyForm(): CreateEmployeeRequest {
    return {
      userId:'', employeeCode:'', jobTitle:'', joinDate: new Date().toISOString().substring(0,10),
      baseSalary: 0, salaryType: SalaryType.Monthly, branchIds: []
    };
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = this.emptyForm(); this.dialog=true; }
  openEdit(e: Employee) {
    this.isEdit=true; this.editingId=e.id;
    this.form = {
      userId:e.userId, employeeCode:e.employeeCode, jobTitle:e.jobTitle, department:e.department,
      joinDate:e.joinDate?.substring(0,10), baseSalary:e.baseSalary, salaryType:e.salaryType,
      hourlyRate:e.hourlyRate, bankAccount:e.bankAccount, bankName:e.bankName,
      nationalId:e.nationalId, emergencyContactName:e.emergencyContactName,
      emergencyContactPhone:e.emergencyContactPhone, qualifications:e.qualifications,
      branchIds: e.branchIds || []
    };
    this.dialog=true;
  }
  save() {
    if (!this.form.employeeCode || !this.form.jobTitle) { this.toast.error('الكود والمسمى مطلوبان'); return; }
    if (!this.isEdit && !this.form.userId) { this.toast.error('User Id مطلوب للإضافة'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateEmployee(this.editingId, this.form)
      : this.svc.createEmployee(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  terminate(e: Employee) {
    Swal.fire({ title:'إنهاء خدمة الموظف؟', input:'text', inputPlaceholder:'السبب...',
      showCancelButton:true, confirmButtonText:'إنهاء', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.terminateEmployee(e.id, { reason: r.value || '' }).subscribe({
        next: () => { this.toast.success('تم الإنهاء'); this.load(); },
        error: (err) => this.toast.error(err?.error?.detail || 'فشل')
      }); });
  }
}
