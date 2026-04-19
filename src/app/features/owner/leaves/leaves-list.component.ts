import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HrService } from '../services/hr.service';
import {
  Leave, CreateLeaveRequest, ReviewLeaveRequest,
  LeaveType, LeaveStatus, LeaveTypeLabels, LeaveStatusLabels, Employee
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-leaves-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الإجازات" subtitle="طلبات الإجازة للموظفين"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الإجازات'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>طلب إجازة</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-clock"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ pendingCount() }}</span>
            <span class="mini-stat__label">في انتظار المراجعة</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ approvedCount() }}</span>
            <span class="mini-stat__label">موافق عليها</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-times-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ rejectedCount() }}</span>
            <span class="mini-stat__label">مرفوضة</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown [options]="employeeOptions()" [(ngModel)]="empFilter"
          placeholder="كل الموظفين" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter"
          placeholder="كل الحالات" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="typeOptions" [(ngModel)]="typeFilter"
          placeholder="كل الأنواع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الموظف</th><th>النوع</th><th>من</th><th>إلى</th><th>المدة</th>
                <th>السبب</th><th>الحالة</th><th style="width:150px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td><strong>{{ l.employeeName }}</strong></td>
              <td><span class="badge blue">{{ typeLabels[l.leaveType] }}</span></td>
              <td>{{ l.fromDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ l.toDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ l.durationDays }} يوم</td>
              <td>{{ l.reason || '-' }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  orange: l.status===1, green: l.status===2, red: l.status===3, gray: l.status===4
                }">{{ statusLabels[l.status] }}</span>
              </td>
              <td>
                <button class="action-btn success" *ngIf="l.status===1" (click)="review(l, 2)" pTooltip="قبول"><i class="pi pi-check"></i></button>
                <button class="action-btn danger" *ngIf="l.status===1" (click)="review(l, 3)" pTooltip="رفض"><i class="pi pi-times"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-calendar-minus"></i><p>لا توجد إجازات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'560px'}"
              header="طلب إجازة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الموظف *</label>
          <p-dropdown [options]="employeeOptions()" [(ngModel)]="form.employeeId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">النوع</label>
          <p-dropdown [options]="typeOptions" [(ngModel)]="form.leaveType" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">من *</label>
          <input type="date" class="form-input" [(ngModel)]="form.fromDate"/></div>
        <div><label class="form-label">إلى *</label>
          <input type="date" class="form-input" [(ngModel)]="form.toDate"/></div>
        <div class="full"><label class="form-label">السبب</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.reason"></textarea></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class LeavesListComponent implements OnInit {
  private svc = inject(HrService);
  private toast = inject(NotificationService);
  items = signal<Leave[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(false);
  saving = signal(false);
  empFilter: string | null = null;
  statusFilter: LeaveStatus | null = null;
  typeFilter: LeaveType | null = null;
  dialog = false;
  form: CreateLeaveRequest = this.emptyForm();
  typeLabels = LeaveTypeLabels;
  statusLabels = LeaveStatusLabels;
  typeOptions = Object.entries(LeaveTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as LeaveType }));
  statusOptions = Object.entries(LeaveStatusLabels).map(([v,l]) => ({ label: l, value: Number(v) as LeaveStatus }));

  pendingCount = computed(() => this.items().filter(l => l.status === 1).length);
  approvedCount = computed(() => this.items().filter(l => l.status === 2).length);
  rejectedCount = computed(() => this.items().filter(l => l.status === 3).length);
  employeeOptions = computed(() => this.employees().map(e => ({ label: e.fullName || e.email || e.employeeCode, value: e.id })));

  ngOnInit() {
    this.svc.listEmployees().subscribe(e => this.employees.set(e || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listLeaves({
      employeeId: this.empFilter ?? undefined,
      status: this.statusFilter ?? undefined,
      leaveType: this.typeFilter ?? undefined
    }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  emptyForm(): CreateLeaveRequest {
    return {
      employeeId:'', fromDate: new Date().toISOString().substring(0,10),
      toDate: new Date().toISOString().substring(0,10), leaveType: LeaveType.Annual
    };
  }
  openAdd() { this.form = this.emptyForm(); this.dialog = true; }
  save() {
    if (!this.form.employeeId || !this.form.fromDate || !this.form.toDate) {
      this.toast.error('الموظف والتواريخ مطلوبة'); return;
    }
    this.saving.set(true);
    this.svc.createLeave(this.form).subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  review(l: Leave, decision: LeaveStatus) {
    const body: ReviewLeaveRequest = { decision, notes: '' };
    this.svc.reviewLeave(l.id, body).subscribe({
      next: () => { this.toast.success(decision===2 ? 'تمت الموافقة' : 'تم الرفض'); this.load(); },
      error: (e) => this.toast.error(e?.error?.detail || 'فشل')
    });
  }
}
