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
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FacilitiesService } from '../services/facilities.service';
import { BranchesService } from '../services/branches.service';
import {
  Equipment, CreateEquipmentRequest, EquipmentStatus, EquipmentStatusLabels,
  Room, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TooltipModule, CalendarModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الأجهزة" subtitle="إدارة أجهزة الفروع وصيانتها"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الأجهزة'}]">
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>جهاز جديد</span></button>
        </div>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-cog"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ equipment().length }}</span>
            <span class="mini-stat__label">إجمالي الأجهزة</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ activeCount() }}</span>
            <span class="mini-stat__label">نشط</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-wrench"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ maintCount() }}</span>
            <span class="mini-stat__label">تحت الصيانة</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-times-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ outCount() }}</span>
            <span class="mini-stat__label">خارج الخدمة</span></div></div>
      </div>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="بحث بالاسم / رقم التسلسل..."/>
          <i class="pi pi-search"></i>
        </div>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter"
          placeholder="كل الحالات" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="equipment()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>الاسم</th><th>الرقم التسلسلي</th><th>الماركة / الموديل</th>
              <th>الفرع</th><th>الحالة</th><th>الضمان حتى</th><th>صيانة مفتوحة</th>
              <th style="width:150px">إجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-e>
            <tr>
              <td><strong>{{ e.name }}</strong><small *ngIf="e.category" class="block text-muted-color">{{ e.category }}</small></td>
              <td>{{ e.serialNumber || '-' }}</td>
              <td>{{ e.brand }} {{ e.model }}</td>
              <td>{{ e.branchName || '-' }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  green: e.status===1, orange: e.status===2, red: e.status===3, gray: e.status===4
                }">{{ statusLabels[e.status] }}</span>
              </td>
              <td>{{ e.warrantyUntil ? (e.warrantyUntil | date:'yyyy-MM-dd') : '-' }}</td>
              <td><span *ngIf="e.openMaintenanceCount" class="badge orange">{{ e.openMaintenanceCount }}</span>
                <span *ngIf="!e.openMaintenanceCount" class="text-muted-color">-</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(e)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn" (click)="openStatus(e)" pTooltip="تغيير الحالة"><i class="pi pi-refresh"></i></button>
                <button class="action-btn danger" (click)="remove(e)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-cog"></i><p>لا توجد أجهزة</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'760px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل الجهاز' : 'جهاز جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label>
          <input class="form-input" [(ngModel)]="form.name"/></div>
        <div><label class="form-label">الرقم التسلسلي</label>
          <input class="form-input" [(ngModel)]="form.serialNumber"/></div>
        <div><label class="form-label">الماركة</label>
          <input class="form-input" [(ngModel)]="form.brand"/></div>
        <div><label class="form-label">الموديل</label>
          <input class="form-input" [(ngModel)]="form.model"/></div>
        <div><label class="form-label">الفئة</label>
          <input class="form-input" [(ngModel)]="form.category"/></div>
        <div><label class="form-label">الفرع *</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">القاعة</label>
          <p-dropdown [options]="roomOptions()" [(ngModel)]="form.roomId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">تاريخ الشراء</label>
          <input class="form-input" type="date" [(ngModel)]="form.purchaseDate"/></div>
        <div><label class="form-label">سعر الشراء</label>
          <p-inputNumber [(ngModel)]="form.purchasePrice" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">الضمان حتى</label>
          <input class="form-input" type="date" [(ngModel)]="form.warrantyUntil"/></div>
        <div><label class="form-label">الحالة</label>
          <p-dropdown [options]="statusOptions" [(ngModel)]="form.status" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">رابط الصورة</label>
          <input class="form-input" [(ngModel)]="form.imageUrl"/></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.notes"></textarea></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="statusDialogVisible" [modal]="true" [style]="{width:'440px'}"
              header="تغيير حالة الجهاز" [dismissableMask]="true">
      <div class="form-group">
        <label class="form-label">الحالة الجديدة</label>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusForm.status" appendTo="body" styleClass="w-full"></p-dropdown>
      </div>
      <div class="form-group">
        <label class="form-label">السبب / ملاحظات</label>
        <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="statusForm.notes"></textarea>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="statusDialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveStatus()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class EquipmentListComponent implements OnInit {
  private svc = inject(FacilitiesService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  equipment = signal<Equipment[]>([]);
  branches = signal<Branch[]>([]);
  rooms = signal<Room[]>([]);
  loading = signal(false);
  saving = signal(false);
  search = '';
  branchFilter: string | null = null;
  statusFilter: EquipmentStatus | null = null;

  statusLabels = EquipmentStatusLabels;
  statusOptions = Object.entries(EquipmentStatusLabels).map(([v, label]) => ({ label, value: Number(v) as EquipmentStatus }));

  dialogVisible = false;
  statusDialogVisible = false;
  isEdit = false;
  editingId: string | null = null;
  form: CreateEquipmentRequest = this.emptyForm();
  statusTarget: Equipment | null = null;
  statusForm = { status: EquipmentStatus.Active, notes: '' };

  activeCount = computed(() => this.equipment().filter(e => e.status === EquipmentStatus.Active).length);
  maintCount = computed(() => this.equipment().filter(e => e.status === EquipmentStatus.UnderMaintenance).length);
  outCount = computed(() => this.equipment().filter(e => e.status === EquipmentStatus.OutOfService).length);
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));
  roomOptions = computed(() => this.rooms().filter(r => !this.form.branchId || r.branchId === this.form.branchId)
    .map(r => ({ label: r.name, value: r.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.svc.listRooms().subscribe(r => this.rooms.set(r || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listEquipment({
      branchId: this.branchFilter ?? undefined,
      status: this.statusFilter ?? undefined,
      searchTerm: this.search || undefined
    }).subscribe({
      next: d => { this.equipment.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateEquipmentRequest {
    return { branchId: '', name: '', status: EquipmentStatus.Active };
  }

  openAdd() {
    this.isEdit = false; this.editingId = null;
    this.form = this.emptyForm();
    if (this.branches().length > 0) this.form.branchId = this.branches()[0].id;
    this.dialogVisible = true;
  }

  openEdit(e: Equipment) {
    this.isEdit = true; this.editingId = e.id;
    this.form = {
      branchId: e.branchId, roomId: e.roomId, name: e.name, serialNumber: e.serialNumber,
      brand: e.brand, model: e.model, category: e.category, purchaseDate: e.purchaseDate?.substring(0,10),
      purchasePrice: e.purchasePrice, status: e.status,
      warrantyUntil: e.warrantyUntil?.substring(0,10), imageUrl: e.imageUrl, notes: e.notes
    };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.name || !this.form.branchId) { this.toast.error('الاسم والفرع مطلوبان'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateEquipment(this.editingId, this.form)
      : this.svc.createEquipment(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible = false; this.toast.success('تم الحفظ'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل الحفظ'); }
    });
  }

  openStatus(e: Equipment) {
    this.statusTarget = e;
    this.statusForm = { status: e.status, notes: '' };
    this.statusDialogVisible = true;
  }

  saveStatus() {
    if (!this.statusTarget) return;
    this.svc.changeEquipmentStatus(this.statusTarget.id, this.statusForm).subscribe({
      next: () => { this.statusDialogVisible = false; this.toast.success('تم تغيير الحالة'); this.load(); },
      error: (e) => this.toast.error(e?.error?.detail || 'فشل')
    });
  }

  remove(e: Equipment) {
    Swal.fire({ title: 'حذف الجهاز؟', text: e.name, icon: 'warning', showCancelButton: true,
      confirmButtonText: 'حذف', cancelButtonText: 'إلغاء', confirmButtonColor: '#ef4444' })
      .then(res => { if (res.isConfirmed) this.svc.deleteEquipment(e.id).subscribe({
        next: () => { this.toast.success('تم الحذف'); this.load(); },
        error: (err) => this.toast.error(err?.error?.detail || 'تعذر الحذف')
      }); });
  }
}
