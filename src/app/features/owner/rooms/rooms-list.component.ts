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
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FacilitiesService } from '../services/facilities.service';
import { BranchesService } from '../services/branches.service';
import {
  Room, CreateRoomRequest, RoomType, RoomTypeLabels, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rooms-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header
        title="القاعات"
        subtitle="إدارة قاعات وغرف الفروع"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'القاعات'}]"
      >
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAdd()">
            <i class="pi pi-plus"></i><span>قاعة جديدة</span>
          </button>
        </div>
      </app-page-header>

      <div class="toolbar">
        <p-dropdown class="flex-fill" [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="typeOptions" [(ngModel)]="typeFilter"
          placeholder="كل الأنواع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="rooms()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>الاسم</th><th>الفرع</th><th>النوع</th><th>السعة</th><th>الحالة</th>
              <th style="width:120px">إجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td>{{ r.name }}</td>
              <td>{{ r.branchName || '-' }}</td>
              <td><span class="badge blue">{{ typeLabels[r.type] || '-' }}</span></td>
              <td>{{ r.capacity || '-' }}</td>
              <td>
                <span class="badge" [class.green]="r.isActive" [class.gray]="!r.isActive">
                  {{ r.isActive ? 'نشط' : 'متوقف' }}
                </span>
              </td>
              <td>
                <button class="action-btn" (click)="openEdit(r)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(r)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6"><div class="empty-state"><i class="pi pi-th-large"></i><p>لا توجد قاعات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'560px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل القاعة' : 'قاعة جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full">
          <label class="form-label">الاسم <span class="text-red-500">*</span></label>
          <input class="form-input" [(ngModel)]="form.name"/>
        </div>
        <div>
          <label class="form-label">الفرع <span class="text-red-500">*</span></label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId"
            placeholder="اختر الفرع..." appendTo="body" styleClass="w-full"></p-dropdown>
        </div>
        <div>
          <label class="form-label">النوع</label>
          <p-dropdown [options]="typeOptions" [(ngModel)]="form.type" appendTo="body" styleClass="w-full"></p-dropdown>
        </div>
        <div>
          <label class="form-label">السعة</label>
          <p-inputNumber [(ngModel)]="form.capacity" [min]="0" styleClass="w-full"></p-inputNumber>
        </div>
        <div class="full">
          <label class="form-label">رابط الصورة</label>
          <input class="form-input" [(ngModel)]="form.imageUrl"/>
        </div>
        <div class="full">
          <label class="form-label">الوصف</label>
          <input class="form-input" [(ngModel)]="form.description"/>
        </div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch>
            <span>نشط</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class RoomsListComponent implements OnInit {
  private svc = inject(FacilitiesService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  rooms = signal<Room[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  isEdit = false;
  editingId: string | null = null;
  branchFilter: string | null = null;
  typeFilter: RoomType | null = null;
  typeLabels = RoomTypeLabels;
  typeOptions = Object.entries(RoomTypeLabels).map(([v, label]) => ({ label, value: Number(v) as RoomType }));
  form: CreateRoomRequest = this.emptyForm();

  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listRooms({
      branchId: this.branchFilter ?? undefined,
      type: this.typeFilter ?? undefined
    }).subscribe({
      next: d => { this.rooms.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل تحميل القاعات'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateRoomRequest {
    return { branchId: '', name: '', type: RoomType.Cardio, isActive: true, capacity: 20 };
  }

  openAdd() {
    this.isEdit = false; this.editingId = null;
    this.form = this.emptyForm();
    if (this.branches().length > 0) this.form.branchId = this.branches()[0].id;
    this.dialogVisible = true;
  }

  openEdit(r: Room) {
    this.isEdit = true; this.editingId = r.id;
    this.form = {
      branchId: r.branchId, name: r.name, type: r.type, capacity: r.capacity,
      description: r.description, imageUrl: r.imageUrl, isActive: r.isActive
    };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.name || !this.form.branchId) { this.toast.error('الاسم والفرع مطلوبان'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateRoom(this.editingId, this.form)
      : this.svc.createRoom(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible = false; this.toast.success('تم الحفظ'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل الحفظ'); }
    });
  }

  remove(r: Room) {
    Swal.fire({ title:'حذف القاعة؟', text:r.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(res => { if(res.isConfirmed) this.svc.deleteRoom(r.id).subscribe({
        next: () => { this.toast.success('تم الحذف'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر الحذف')
      }); });
  }
}
