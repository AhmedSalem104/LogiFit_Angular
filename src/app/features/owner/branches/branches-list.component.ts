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
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { BranchesService } from '../services/branches.service';
import {
  Branch, CreateBranchRequest, OperatingHour, DayOfWeekLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branches-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule,
    CalendarModule, PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header
        title="الفروع"
        subtitle="إدارة فروع الجيم وساعات العمل"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الفروع'}]"
      >
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAdd()">
            <i class="pi pi-plus"></i><span>فرع جديد</span>
          </button>
        </div>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon blue"><i class="pi pi-building"></i></div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ branches().length }}</span>
            <span class="mini-stat__label">إجمالي الفروع</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ activeCount() }}</span>
            <span class="mini-stat__label">نشط</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon purple"><i class="pi pi-users"></i></div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ totalClients() }}</span>
            <span class="mini-stat__label">إجمالي الأعضاء النشطين</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon orange"><i class="pi pi-sign-in"></i></div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ todayCheckIns() }}</span>
            <span class="mini-stat__label">حضور اليوم</span>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" placeholder="بحث بالاسم أو الكود..."/>
          <i class="pi pi-search"></i>
        </div>
        <p-dropdown
          [options]="statusOptions" [(ngModel)]="statusFilter"
          placeholder="كل الفروع" [showClear]="true"
          (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="filtered()" [paginator]="true" [rows]="10" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>الاسم</th>
              <th>الكود</th>
              <th>المدينة</th>
              <th>الهاتف</th>
              <th>السعة</th>
              <th>ساعات العمل</th>
              <th>الأعضاء</th>
              <th>الحالة</th>
              <th style="width:180px">إجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-b>
            <tr>
              <td>
                <div class="flex items-center gap-2">
                  <strong>{{ b.name }}</strong>
                  <span *ngIf="b.isDefault" class="badge blue">افتراضي</span>
                </div>
              </td>
              <td>{{ b.code || '-' }}</td>
              <td>{{ b.city || '-' }}</td>
              <td>{{ b.phoneNumber || '-' }}</td>
              <td>{{ b.capacity || '-' }}</td>
              <td>{{ b.openTime || '-' }} - {{ b.closeTime || '-' }}</td>
              <td>{{ b.activeClientsCount || 0 }}</td>
              <td>
                <span class="badge" [class.green]="b.isActive" [class.gray]="!b.isActive">
                  {{ b.isActive ? 'نشط' : 'متوقف' }}
                </span>
              </td>
              <td>
                <button class="action-btn" (click)="openEdit(b)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn" (click)="openHours(b)" pTooltip="ساعات العمل"><i class="pi pi-clock"></i></button>
                <button class="action-btn danger" *ngIf="!b.isDefault" (click)="remove(b)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9"><div class="empty-state"><i class="pi pi-building"></i><p>لا توجد فروع</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Branch Add/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'720px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل فرع' : 'إضافة فرع جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div>
          <label class="form-label">اسم الفرع <span class="text-red-500">*</span></label>
          <input class="form-input" [(ngModel)]="form.name" placeholder="الفرع الرئيسي"/>
        </div>
        <div>
          <label class="form-label">الكود</label>
          <input class="form-input" [(ngModel)]="form.code" placeholder="MAIN"/>
        </div>
        <div>
          <label class="form-label">المدينة</label>
          <input class="form-input" [(ngModel)]="form.city" placeholder="القاهرة"/>
        </div>
        <div>
          <label class="form-label">الهاتف</label>
          <input class="form-input" [(ngModel)]="form.phoneNumber" placeholder="+20..."/>
        </div>
        <div class="full">
          <label class="form-label">العنوان</label>
          <input class="form-input" [(ngModel)]="form.address"/>
        </div>
        <div>
          <label class="form-label">البريد</label>
          <input class="form-input" [(ngModel)]="form.email" type="email"/>
        </div>
        <div>
          <label class="form-label">السعة</label>
          <p-inputNumber [(ngModel)]="form.capacity" [min]="0" styleClass="w-full"></p-inputNumber>
        </div>
        <div>
          <label class="form-label">ساعة الفتح</label>
          <input class="form-input" [(ngModel)]="form.openTime" placeholder="06:00:00"/>
        </div>
        <div>
          <label class="form-label">ساعة الإغلاق</label>
          <input class="form-input" [(ngModel)]="form.closeTime" placeholder="23:00:00"/>
        </div>
        <div>
          <label class="form-label">خط العرض (latitude)</label>
          <p-inputNumber [(ngModel)]="form.latitude" mode="decimal" [maxFractionDigits]="6" styleClass="w-full"></p-inputNumber>
        </div>
        <div>
          <label class="form-label">خط الطول (longitude)</label>
          <p-inputNumber [(ngModel)]="form.longitude" mode="decimal" [maxFractionDigits]="6" styleClass="w-full"></p-inputNumber>
        </div>
        <div class="full" style="display:flex; gap:2rem; align-items:center;">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch>
            <span>نشط</span>
          </label>
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isDefault"></p-inputSwitch>
            <span>فرع افتراضي</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
          {{ saving() ? 'جارٍ الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إنشاء') }}
        </button>
      </div>
    </p-dialog>

    <!-- Operating Hours Dialog -->
    <p-dialog [(visible)]="hoursDialogVisible" [modal]="true" [style]="{width:'600px', maxWidth:'95vw'}"
              [header]="'ساعات العمل — ' + (selectedBranch?.name || '')" [dismissableMask]="true">
      <div class="hours-list" *ngIf="hours.length">
        <div class="hours-row" *ngFor="let h of hours; let i = index">
          <span class="day">{{ dayLabels[h.dayOfWeek] }}</span>
          <label class="closed">
            <p-inputSwitch [(ngModel)]="h.isClosed"></p-inputSwitch>
            <span>مغلق</span>
          </label>
          <input class="form-input" *ngIf="!h.isClosed" [(ngModel)]="h.openTime" placeholder="06:00:00"/>
          <input class="form-input" *ngIf="!h.isClosed" [(ngModel)]="h.closeTime" placeholder="23:00:00"/>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="hoursDialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveHours()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .hours-list { display:flex; flex-direction:column; gap:.5rem; }
    .hours-row {
      display:grid; grid-template-columns: 110px 110px 1fr 1fr; gap:.75rem; align-items:center;
      padding:.5rem .75rem; border-radius: 10px; background: var(--bg-secondary);
    }
    .hours-row .day { font-weight: 600; }
    .hours-row .closed { display:flex; gap:.4rem; align-items:center; font-size:.8rem; color: var(--text-secondary); }
    @media (max-width: 600px) { .hours-row { grid-template-columns: 1fr 1fr; } .hours-row .day { grid-column: 1/-1; } }
  `]
})
export class BranchesListComponent implements OnInit {
  private svc = inject(BranchesService);
  private toast = inject(NotificationService);

  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);

  search = '';
  statusFilter: boolean | null = null;
  statusOptions = [
    { label: 'نشط', value: true },
    { label: 'متوقف', value: false }
  ];

  dialogVisible = false;
  hoursDialogVisible = false;
  isEdit = false;
  editingId: string | null = null;
  selectedBranch: Branch | null = null;
  form: CreateBranchRequest = this.emptyForm();
  hours: OperatingHour[] = [];
  dayLabels = DayOfWeekLabels;

  activeCount = computed(() => this.branches().filter(b => b.isActive).length);
  totalClients = computed(() => this.branches().reduce((s, b) => s + (b.activeClientsCount || 0), 0));
  todayCheckIns = computed(() => this.branches().reduce((s, b) => s + (b.todayCheckInsCount || 0), 0));
  filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.branches().filter(b =>
      (!q || b.name?.toLowerCase().includes(q) || b.code?.toLowerCase().includes(q))
    );
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.list({ isActive: this.statusFilter ?? undefined }).subscribe({
      next: data => { this.branches.set(data || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل تحميل الفروع'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateBranchRequest {
    return {
      name: '', isActive: true, isDefault: false,
      openTime: '06:00:00', closeTime: '23:00:00'
    };
  }

  openAdd() {
    this.isEdit = false; this.editingId = null;
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openEdit(b: Branch) {
    this.isEdit = true; this.editingId = b.id;
    this.form = {
      name: b.name, code: b.code, address: b.address, city: b.city,
      phoneNumber: b.phoneNumber, email: b.email, latitude: b.latitude, longitude: b.longitude,
      isActive: b.isActive, isDefault: b.isDefault, capacity: b.capacity,
      openTime: b.openTime, closeTime: b.closeTime, managerId: b.managerId,
      logoUrl: b.logoUrl, coverImageUrl: b.coverImageUrl
    };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.name?.trim()) { this.toast.error('اسم الفرع مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.update(this.editingId, this.form)
      : this.svc.create(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false); this.dialogVisible = false;
        this.toast.success(this.isEdit ? 'تم التعديل' : 'تم الإنشاء');
        this.load();
      },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل الحفظ'); }
    });
  }

  remove(b: Branch) {
    Swal.fire({
      title: 'حذف الفرع؟',
      text: `سيتم حذف "${b.name}" نهائياً`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        this.svc.delete(b.id).subscribe({
          next: () => { this.toast.success('تم الحذف'); this.load(); },
          error: (e) => this.toast.error(e?.error?.detail || 'تعذر الحذف')
        });
      }
    });
  }

  openHours(b: Branch) {
    this.selectedBranch = b;
    const existing = b.operatingHours || [];
    this.hours = Array.from({ length: 7 }, (_, day) => {
      const found = existing.find(h => h.dayOfWeek === day);
      return found
        ? { ...found }
        : { dayOfWeek: day, openTime: b.openTime || '06:00:00', closeTime: b.closeTime || '23:00:00', isClosed: false };
    });
    this.hoursDialogVisible = true;
  }

  saveHours() {
    if (!this.selectedBranch) return;
    this.saving.set(true);
    this.svc.setOperatingHours(this.selectedBranch.id, { hours: this.hours }).subscribe({
      next: () => {
        this.saving.set(false); this.hoursDialogVisible = false;
        this.toast.success('تم حفظ ساعات العمل'); this.load();
      },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل الحفظ'); }
    });
  }
}
