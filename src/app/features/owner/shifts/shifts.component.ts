import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HrService } from '../services/hr.service';
import { BranchesService } from '../services/branches.service';
import {
  Shift, CreateShiftRequest, ShiftAssignment, AssignShiftRequest, Branch, Employee
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, TabViewModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الورديات" subtitle="إدارة ورديات الموظفين وتعييناتها"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الورديات'}]"></app-page-header>

      <p-tabView>
        <p-tabPanel header="قوالب الورديات">
          <div style="margin-bottom: 1rem;">
            <button class="btn btn-primary" (click)="openAddShift()"><i class="pi pi-plus"></i><span>وردية جديدة</span></button>
          </div>
          <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
          <div class="data-card" *ngIf="!loading()">
            <p-table [value]="shifts()">
              <ng-template pTemplate="header">
                <tr><th>الاسم</th><th>الفرع</th><th>البداية</th><th>النهاية</th><th>اللون</th><th>الحالة</th><th style="width:120px">إجراءات</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-s>
                <tr>
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.branchName || 'كل الفروع' }}</td>
                  <td>{{ s.startTime }}</td>
                  <td>{{ s.endTime }}</td>
                  <td><span class="color-chip" [style.background]="s.color"></span></td>
                  <td><span class="badge" [class.green]="s.isActive" [class.gray]="!s.isActive">{{ s.isActive ? 'نشطة':'متوقفة' }}</span></td>
                  <td>
                    <button class="action-btn" (click)="openEditShift(s)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                    <button class="action-btn danger" (click)="removeShift(s)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-clock"></i><p>لا توجد ورديات</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <p-tabPanel header="تعيينات يومية">
          <div class="toolbar">
            <button class="btn btn-primary" (click)="openAssign()"><i class="pi pi-plus"></i><span>تعيين جديد</span></button>
            <input type="date" class="form-input" [(ngModel)]="assignFrom" (change)="loadAssignments()"/>
            <input type="date" class="form-input" [(ngModel)]="assignTo" (change)="loadAssignments()"/>
          </div>
          <div class="data-card">
            <p-table [value]="assignments()" [paginator]="true" [rows]="15">
              <ng-template pTemplate="header">
                <tr><th>التاريخ</th><th>الموظف</th><th>الوردية</th><th>ملاحظات</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-a>
                <tr>
                  <td>{{ a.date | date:'yyyy-MM-dd (EEEE)' }}</td>
                  <td>{{ a.employeeName }}</td>
                  <td>{{ a.shiftName }}</td>
                  <td>{{ a.notes || '-' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="4"><div class="empty-state"><i class="pi pi-calendar-plus"></i><p>لا توجد تعيينات</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>

    <p-dialog [(visible)]="shiftDialog" [modal]="true" [style]="{width:'500px'}"
              [header]="isEdit ? 'تعديل':'وردية جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="shiftForm.name"/></div>
        <div><label class="form-label">البداية (HH:mm:ss)</label><input class="form-input" [(ngModel)]="shiftForm.startTime" placeholder="06:00:00"/></div>
        <div><label class="form-label">النهاية (HH:mm:ss)</label><input class="form-input" [(ngModel)]="shiftForm.endTime" placeholder="14:00:00"/></div>
        <div><label class="form-label">الفرع</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="shiftForm.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">اللون</label><input type="color" class="form-input" [(ngModel)]="shiftForm.color"/></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="shiftForm.isActive"></p-inputSwitch><span>نشطة</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="shiftDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveShift()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="assignDialog" [modal]="true" [style]="{width:'440px'}"
              header="تعيين موظف لوردية" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الوردية *</label>
          <p-dropdown [options]="shiftOptions()" [(ngModel)]="assignForm.shiftId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">الموظف *</label>
          <p-dropdown [options]="employeeOptions()" [(ngModel)]="assignForm.employeeId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">التاريخ *</label>
          <input type="date" class="form-input" [(ngModel)]="assignForm.date"/></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <input class="form-input" [(ngModel)]="assignForm.notes"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="assignDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveAssignment()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .color-chip { width:24px; height:24px; border-radius:6px; display:inline-block; border:1px solid var(--border-color); }
  `]
})
export class ShiftsComponent implements OnInit {
  private svc = inject(HrService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);
  shifts = signal<Shift[]>([]);
  assignments = signal<ShiftAssignment[]>([]);
  branches = signal<Branch[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(false);
  saving = signal(false);
  shiftDialog = false; isEdit=false; editingId: string | null = null;
  shiftForm: CreateShiftRequest = this.emptyShift();
  assignDialog = false;
  assignForm: AssignShiftRequest = { shiftId:'', employeeId:'', date: new Date().toISOString().substring(0,10) };
  assignFrom=''; assignTo='';
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));
  shiftOptions = computed(() => this.shifts().map(s => ({ label: `${s.name} (${s.startTime}-${s.endTime})`, value: s.id })));
  employeeOptions = computed(() => this.employees().map(e => ({ label: e.fullName || e.email || e.employeeCode, value: e.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.svc.listEmployees().subscribe(e => this.employees.set(e || []));
    this.load();
    this.loadAssignments();
  }
  load() {
    this.loading.set(true);
    this.svc.listShifts().subscribe({
      next: d => { this.shifts.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  loadAssignments() {
    this.svc.listShiftAssignments({
      fromDate: this.assignFrom || undefined, toDate: this.assignTo || undefined
    }).subscribe({
      next: d => this.assignments.set(d || []),
      error: () => this.toast.error('فشل تحميل التعيينات')
    });
  }
  emptyShift(): CreateShiftRequest {
    return { name:'', startTime:'06:00:00', endTime:'14:00:00', color:'#3b82f6', isActive:true };
  }
  openAddShift() { this.isEdit=false; this.editingId=null; this.shiftForm = this.emptyShift(); this.shiftDialog=true; }
  openEditShift(s: Shift) {
    this.isEdit=true; this.editingId=s.id;
    this.shiftForm = { branchId:s.branchId, name:s.name, startTime:s.startTime, endTime:s.endTime, color:s.color, isActive:s.isActive };
    this.shiftDialog=true;
  }
  saveShift() {
    if (!this.shiftForm.name) { this.toast.error('الاسم مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateShift(this.editingId, this.shiftForm)
      : this.svc.createShift(this.shiftForm);
    obs.subscribe({
      next: () => { this.saving.set(false); this.shiftDialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  removeShift(s: Shift) {
    Swal.fire({ title:'حذف؟', text:s.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteShift(s.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
  openAssign() {
    this.assignForm = { shiftId:'', employeeId:'', date: new Date().toISOString().substring(0,10) };
    this.assignDialog = true;
  }
  saveAssignment() {
    if (!this.assignForm.shiftId || !this.assignForm.employeeId || !this.assignForm.date) {
      this.toast.error('كل الحقول مطلوبة'); return;
    }
    this.saving.set(true);
    this.svc.assignShift(this.assignForm).subscribe({
      next: () => { this.saving.set(false); this.assignDialog=false; this.toast.success('تم'); this.loadAssignments(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
