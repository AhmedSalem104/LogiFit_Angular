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
import { FacilitiesService } from '../services/facilities.service';
import {
  MaintenanceTicket, CreateMaintenanceRequest, ResolveMaintenanceRequest,
  MaintenanceStatus, MaintenanceStatusLabels, Equipment
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule, InputNumberModule,
    InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الصيانة" subtitle="بلاغات صيانة الأجهزة"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الصيانة'}]">
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>بلاغ جديد</span></button>
        </div>
      </app-page-header>

      <div class="state-card error-state" *ngIf="!loading() && errorMessage()" role="alert">
        <i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل بلاغات الصيانة</strong><p>{{ errorMessage() }}</p><button type="button" class="btn btn-primary" (click)="load()">إعادة المحاولة</button></div>
      </div>
      <div class="state-card warning-state" *ngIf="!errorMessage() && referenceError()" role="status">
        <i class="pi pi-info-circle"></i><span>{{ referenceError() }}</span>
      </div>

      <div class="stats-row" *ngIf="!errorMessage()">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-wrench"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ tickets().length }}</span>
            <span class="mini-stat__label">إجمالي البلاغات</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-clock"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ pendingCount() }}</span>
            <span class="mini-stat__label">معلقة</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon purple"><i class="pi pi-sync"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ inProgressCount() }}</span>
            <span class="mini-stat__label">قيد التنفيذ</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ completedCount() }}</span>
            <span class="mini-stat__label">مكتملة</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown [options]="equipmentOptions()" [(ngModel)]="equipFilter"
          placeholder="كل الأجهزة" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter"
          placeholder="كل الحالات" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading() && !errorMessage()">
        <p-table [value]="tickets()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>الجهاز</th><th>الوصف</th><th>تاريخ البلاغ</th><th>الفني</th>
              <th>التكلفة</th><th>الحالة</th><th>المدة</th><th style="width:130px">إجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td><strong>{{ m.equipmentName }}</strong></td>
              <td>{{ m.description }}</td>
              <td>{{ m.issueDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ m.technicianName || '-' }}</td>
              <td>{{ (m.cost || 0) | number:'1.0-2' }} ج.م</td>
              <td>
                <span class="badge" [ngClass]="{
                  orange: m.status===1, purple: m.status===2, green: m.status===3, gray: m.status===4
                }">{{ statusLabels[m.status] }}</span>
              </td>
              <td>{{ m.durationDays != null ? (m.durationDays + ' يوم') : '-' }}</td>
              <td>
                <button *ngIf="m.status !== 3 && m.status !== 4" class="action-btn success"
                  (click)="openResolve(m)" pTooltip="إنهاء الصيانة"><i class="pi pi-check"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-wrench"></i><p>لا توجد بلاغات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'600px'}"
              header="بلاغ صيانة جديد" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الجهاز *</label>
          <p-dropdown [options]="equipmentOptions()" [(ngModel)]="form.equipmentId" [filter]="true"
            appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">تاريخ البلاغ *</label>
          <input type="date" class="form-input" [(ngModel)]="form.issueDate"/></div>
        <div><label class="form-label">التكلفة المبدئية</label>
          <p-inputNumber [(ngModel)]="form.cost" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">اسم الفني</label>
          <input class="form-input" [(ngModel)]="form.technicianName"/></div>
        <div><label class="form-label">هاتف الفني</label>
          <input class="form-input" [(ngModel)]="form.technicianContact"/></div>
        <div class="full"><label class="form-label">وصف المشكلة *</label>
          <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="form.description"></textarea></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.putEquipmentUnderMaintenance"></p-inputSwitch>
            <span>تحويل الجهاز تلقائياً إلى "تحت الصيانة"</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">إنشاء البلاغ</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="resolveDialogVisible" [modal]="true" [style]="{width:'520px'}"
              header="إنهاء الصيانة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div><label class="form-label">التكلفة النهائية</label>
          <p-inputNumber [(ngModel)]="resolveForm.finalCost" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div>
          <label style="display:flex; gap:.5rem; align-items:center; padding-top:1.75rem;">
            <p-inputSwitch [(ngModel)]="resolveForm.reactivateEquipment"></p-inputSwitch>
            <span>إعادة تفعيل الجهاز</span>
          </label>
        </div>
        <div class="full"><label class="form-label">ملاحظات الحل</label>
          <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="resolveForm.resolutionNotes"></textarea></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="resolveDialogVisible=false">إلغاء</button>
        <button class="btn btn-success" (click)="saveResolve()" [disabled]="saving()">إنهاء</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .state-card { display:flex; align-items:center; gap:.75rem; min-height:130px; padding:1.25rem; margin-bottom:1.25rem; border:1px dashed #fecaca; border-radius:16px; color:#991b1b; background:#fff7f7; }
    .state-card i { font-size:1.5rem; color:#dc2626; }
    .state-card p { margin:.35rem 0 .75rem; color:#7f1d1d; }
    .warning-state { min-height:auto; border-color:#fde68a; color:#92400e; background:#fffbeb; }
    .warning-state i { color:#d97706; }
  `]
})
export class MaintenanceListComponent implements OnInit {
  private svc = inject(FacilitiesService);
  private toast = inject(NotificationService);

  tickets = signal<MaintenanceTicket[]>([]);
  equipments = signal<Equipment[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  referenceError = signal<string | null>(null);
  saving = signal(false);
  equipFilter: string | null = null;
  statusFilter: MaintenanceStatus | null = null;
  statusLabels = MaintenanceStatusLabels;
  statusOptions = Object.entries(MaintenanceStatusLabels).map(([v, label]) => ({ label, value: Number(v) as MaintenanceStatus }));

  dialogVisible = false;
  resolveDialogVisible = false;
  form: CreateMaintenanceRequest = this.emptyForm();
  resolveForm: ResolveMaintenanceRequest & { id?: string } = { reactivateEquipment: true };

  pendingCount = computed(() => this.tickets().filter(t => t.status === 1).length);
  inProgressCount = computed(() => this.tickets().filter(t => t.status === 2).length);
  completedCount = computed(() => this.tickets().filter(t => t.status === 3).length);
  equipmentOptions = computed(() => this.equipments().map(e => ({ label: `${e.name} — ${e.branchName || ''}`, value: e.id })));

  ngOnInit() {
    this.svc.listEquipment().subscribe({ next: e => this.equipments.set(e || []), error: () => this.referenceError.set('تعذر تحميل قائمة الأجهزة.') });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.svc.listMaintenance({
      equipmentId: this.equipFilter ?? undefined,
      status: this.statusFilter ?? undefined
    }).subscribe({
      next: d => { this.tickets.set(d || []); this.loading.set(false); },
      error: (e) => {
        const message = e?.translatedMessage || e?.error?.detail || e?.error?.message || 'تعذر تحميل بلاغات الصيانة';
        this.errorMessage.set(message);
        this.toast.error(message);
        this.loading.set(false);
      }
    });
  }

  emptyForm(): CreateMaintenanceRequest {
    return {
      equipmentId: '',
      issueDate: new Date().toISOString().substring(0, 10),
      description: '',
      putEquipmentUnderMaintenance: true
    };
  }

  openAdd() { this.form = this.emptyForm(); this.dialogVisible = true; }

  save() {
    if (!this.form.equipmentId || !this.form.description) { this.toast.error('الجهاز والوصف مطلوبان'); return; }
    this.saving.set(true);
    this.svc.createMaintenance(this.form).subscribe({
      next: () => { this.saving.set(false); this.dialogVisible = false; this.toast.success('تم إنشاء البلاغ'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  openResolve(m: MaintenanceTicket) {
    this.resolveForm = { id: m.id, resolutionNotes: '', finalCost: m.cost, reactivateEquipment: true };
    this.resolveDialogVisible = true;
  }

  saveResolve() {
    if (!this.resolveForm.id) return;
    this.saving.set(true);
    this.svc.resolveMaintenance(this.resolveForm.id, {
      resolutionNotes: this.resolveForm.resolutionNotes,
      finalCost: this.resolveForm.finalCost,
      reactivateEquipment: this.resolveForm.reactivateEquipment
    }).subscribe({
      next: () => { this.saving.set(false); this.resolveDialogVisible = false; this.toast.success('تم الإنهاء'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
