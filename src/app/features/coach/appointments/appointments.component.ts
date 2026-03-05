import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { AppointmentsService, AppointmentDto, AppointmentStatusLabels, CreateAppointmentCommand } from '../services/appointments.service';
import { CoachService } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    DialogModule,
    CalendarModule,
    InputTextareaModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="appointments-page">
      <app-page-header
        title="المواعيد"
        subtitle="إدارة ومتابعة مواعيد المتدربين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'المواعيد'}]"
      >
        <button class="btn btn-primary" (click)="openCreateDialog()">
          <i class="pi pi-plus"></i>
          <span>موعد جديد</span>
        </button>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon total-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ totalCount() }}</span>
            <span class="mini-stat__label">إجمالي المواعيد</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon pending-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ pendingCount() }}</span>
            <span class="mini-stat__label">قيد الانتظار</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon confirmed-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ confirmedCount() }}</span>
            <span class="mini-stat__label">مؤكدة</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon today-icon">
            <i class="pi pi-sun"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ todayCount() }}</span>
            <span class="mini-stat__label">مواعيد اليوم</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            type="text"
            pInputText
            [(ngModel)]="searchQuery"
            (input)="applyFilters()"
            placeholder="بحث بالاسم أو العنوان..."
          />
        </div>
        <p-dropdown
          [options]="statusOptions"
          [(ngModel)]="filterStatus"
          placeholder="جميع الحالات"
          (onChange)="applyFilters()"
          [showClear]="true"
          styleClass="filter-dropdown"
        ></p-dropdown>
        <p-calendar
          [(ngModel)]="filterFromDate"
          placeholder="من تاريخ"
          dateFormat="yy-mm-dd"
          [showIcon]="true"
          [showClear]="true"
          (onSelect)="applyFilters()"
          (onClear)="applyFilters()"
          styleClass="filter-calendar"
        ></p-calendar>
        <p-calendar
          [(ngModel)]="filterToDate"
          placeholder="إلى تاريخ"
          dateFormat="yy-mm-dd"
          [showIcon]="true"
          [showClear]="true"
          (onSelect)="applyFilters()"
          (onClear)="applyFilters()"
          styleClass="filter-calendar"
        ></p-calendar>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Appointments Table -->
      <div class="table-container" *ngIf="!loading()">
        <div class="table-header">
          <div class="table-title">
            <h3>قائمة المواعيد</h3>
            <span class="badge">{{ filteredAppointments().length }}</span>
          </div>
        </div>

        <p-table
          [value]="filteredAppointments()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} موعد"
          styleClass="appointments-table"
          [tableStyle]="{'min-width': '60rem'}"
          [sortField]="'startTime'"
          [sortOrder]="-1"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="clientName" style="width: 20%">
                <div class="th-content">
                  المتدرب
                  <p-sortIcon field="clientName"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="title" style="width: 20%">
                <div class="th-content">
                  العنوان
                  <p-sortIcon field="title"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="startTime" style="width: 25%">
                <div class="th-content">
                  التاريخ والوقت
                  <p-sortIcon field="startTime"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="status" style="width: 15%">
                <div class="th-content">
                  الحالة
                  <p-sortIcon field="status"></p-sortIcon>
                </div>
              </th>
              <th style="width: 20%">الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-apt>
            <tr class="appointment-row">
              <td>
                <div class="client-info">
                  <div class="client-avatar">{{ getInitials(apt.clientName || '') }}</div>
                  <span class="client-name">{{ apt.clientName }}</span>
                </div>
              </td>
              <td>
                <span class="title-cell">{{ apt.title }}</span>
              </td>
              <td>
                <div class="datetime-cell">
                  <span class="date-part">{{ formatDate(apt.startTime) }}</span>
                  <span class="time-part">{{ formatTime(apt.startTime) }} - {{ formatTime(apt.endTime) }}</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getStatusLabel(apt.status)"
                  [severity]="getStatusSeverity(apt.status)"
                  [rounded]="true"
                ></p-tag>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- Pending: Confirm, Cancel, Delete -->
                  <button
                    *ngIf="apt.status === 1"
                    class="action-btn confirm-btn"
                    (click)="confirmAppointment(apt)"
                    title="تأكيد"
                  >
                    <i class="pi pi-check"></i>
                  </button>
                  <button
                    *ngIf="apt.status === 1 || apt.status === 2"
                    class="action-btn cancel-btn"
                    (click)="cancelAppointment(apt)"
                    title="إلغاء"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                  <!-- Confirmed: Complete -->
                  <button
                    *ngIf="apt.status === 2"
                    class="action-btn complete-btn"
                    (click)="completeAppointment(apt)"
                    title="اكتمل"
                  >
                    <i class="pi pi-check-circle"></i>
                  </button>
                  <!-- Delete always available except completed -->
                  <button
                    *ngIf="apt.status !== 4"
                    class="action-btn delete-btn"
                    (click)="deleteAppointment(apt)"
                    title="حذف"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <i class="pi pi-calendar"></i>
                  <h4>لا توجد مواعيد</h4>
                  <p>لم يتم العثور على مواعيد مطابقة</p>
                  <button class="btn btn-outline" (click)="clearFilters()">مسح الفلاتر</button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Appointment Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        header="إنشاء موعد جديد"
        [modal]="true"
        [style]="{width: '550px'}"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>المتدرب *</label>
            <p-dropdown
              [options]="traineeOptions"
              [(ngModel)]="appointmentForm.clientId"
              placeholder="اختر المتدرب"
              [filter]="true"
              filterPlaceholder="بحث..."
              [style]="{width: '100%'}"
            ></p-dropdown>
          </div>
          <div class="form-group">
            <label>العنوان *</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="appointmentForm.title"
              placeholder="عنوان الموعد"
              [style]="{width: '100%'}"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>وقت البدء *</label>
              <p-calendar
                [(ngModel)]="appointmentForm.startTime"
                [showTime]="true"
                hourFormat="24"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
                placeholder="اختر وقت البدء"
              ></p-calendar>
            </div>
            <div class="form-group">
              <label>وقت الانتهاء *</label>
              <p-calendar
                [(ngModel)]="appointmentForm.endTime"
                [showTime]="true"
                hourFormat="24"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
                placeholder="اختر وقت الانتهاء"
              ></p-calendar>
            </div>
          </div>
          <div class="form-group">
            <label>ملاحظات</label>
            <textarea
              pInputTextarea
              [(ngModel)]="appointmentForm.notes"
              rows="3"
              placeholder="ملاحظات إضافية..."
              [style]="{width: '100%'}"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveAppointment()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            <span>{{ saving() ? 'جاري الحفظ...' : 'حفظ' }}</span>
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .appointments-page {
      max-width: 1400px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .mini-stat {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mini-stat__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;

      &.total-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      &.pending-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      &.confirmed-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.today-icon {
        background: rgba(168, 85, 247, 0.1);
        color: #a855f7;
      }
    }

    .mini-stat__content {
      display: flex;
      flex-direction: column;
    }

    .mini-stat__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .mini-stat__label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 200px;

      i.pi-search {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      input {
        padding: 0.65rem 2.5rem 0.65rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.9rem;
        width: 100%;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    :host ::ng-deep .filter-dropdown {
      .p-dropdown {
        border-radius: 10px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
      }
    }

    :host ::ng-deep .filter-calendar {
      .p-calendar {
        .p-inputtext {
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
      }
    }

    .table-container {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .badge {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    :host ::ng-deep .appointments-table {
      .p-datatable-thead > tr > th {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 1rem;
        border: none;
        border-bottom: 1px solid var(--border-color);
      }

      .p-datatable-tbody > tr {
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }

        > td {
          padding: 0.875rem 1rem;
          border: none;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
      }

      .p-paginator {
        padding: 1rem;
        border: none;
        background: transparent;
      }

      .p-sortable-column:hover {
        background: var(--bg-secondary) !important;
      }
    }

    .th-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .client-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .title-cell {
      color: var(--text-primary);
      font-weight: 500;
    }

    .datetime-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .date-part {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .time-part {
        color: var(--text-secondary);
        font-size: 0.85rem;
        direction: ltr;
        text-align: right;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &.confirm-btn {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;

        &:hover {
          background: #22c55e;
          color: white;
        }
      }

      &.complete-btn {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;

        &:hover {
          background: #3b82f6;
          color: white;
        }
      }

      &.cancel-btn {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;

        &:hover {
          background: #f59e0b;
          color: white;
        }
      }

      &.delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;

        &:hover {
          background: #ef4444;
          color: white;
        }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 3.5rem;
        margin-bottom: 1rem;
        opacity: 0.3;
        color: #3b82f6;
      }

      h4 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
        font-size: 1.1rem;
      }

      p {
        margin: 0 0 1.5rem;
        font-size: 0.9rem;
      }
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }

      input, textarea {
        width: 100%;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.btn-primary {
        background: #3b82f6;
        color: white;

        &:hover {
          background: #2563eb;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
      }
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .filters-row {
        flex-direction: column;

        .search-box {
          width: 100%;
        }
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  appointments = signal<AppointmentDto[]>([]);
  filteredAppointments = signal<AppointmentDto[]>([]);

  // Filters
  searchQuery = '';
  filterStatus: number | null = null;
  filterFromDate: Date | null = null;
  filterToDate: Date | null = null;

  // Dialog
  dialogVisible = false;
  appointmentForm: {
    clientId: string;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    notes: string;
  } = {
    clientId: '',
    title: '',
    startTime: null,
    endTime: null,
    notes: ''
  };

  traineeOptions: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'قيد الانتظار', value: 1 },
    { label: 'مؤكد', value: 2 },
    { label: 'ملغي', value: 3 },
    { label: 'مكتمل', value: 4 }
  ];

  // Computed stats
  totalCount = computed(() => this.appointments().length);
  pendingCount = computed(() => this.appointments().filter(a => a.status === 1).length);
  confirmedCount = computed(() => this.appointments().filter(a => a.status === 2).length);
  todayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments().filter(a => a.startTime && a.startTime.startsWith(today)).length;
  });

  ngOnInit(): void {
    this.loadTrainees();
    this.loadAppointments();
  }

  loadTrainees(): void {
    this.coachService.getTrainees().subscribe({
      next: (data) => {
        this.traineeOptions = data.map(t => ({
          label: t.clientName || t.fullName || t.profile?.fullName || '',
          value: t.clientId || t.id
        }));
      },
      error: () => {
        this.traineeOptions = [];
      }
    });
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.appointmentsService.getAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.filteredAppointments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.appointments.set([]);
        this.filteredAppointments.set([]);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let result = this.appointments();

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      result = result.filter(a =>
        (a.clientName || '').toLowerCase().includes(query) ||
        (a.title || '').toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (this.filterStatus !== null) {
      result = result.filter(a => a.status === this.filterStatus);
    }

    // Filter by date range
    if (this.filterFromDate) {
      const from = this.filterFromDate.toISOString().split('T')[0];
      result = result.filter(a => a.startTime >= from);
    }
    if (this.filterToDate) {
      const to = this.filterToDate.toISOString().split('T')[0] + 'T23:59:59';
      result = result.filter(a => a.startTime <= to);
    }

    this.filteredAppointments.set(result);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = null;
    this.filterFromDate = null;
    this.filterToDate = null;
    this.filteredAppointments.set(this.appointments());
  }

  openCreateDialog(): void {
    this.appointmentForm = {
      clientId: '',
      title: '',
      startTime: null,
      endTime: null,
      notes: ''
    };
    this.dialogVisible = true;
  }

  saveAppointment(): void {
    if (!this.appointmentForm.clientId || !this.appointmentForm.title || !this.appointmentForm.startTime || !this.appointmentForm.endTime) {
      this.notificationService.warn('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (this.appointmentForm.endTime <= this.appointmentForm.startTime) {
      this.notificationService.warn('وقت الانتهاء يجب أن يكون بعد وقت البدء');
      return;
    }

    this.saving.set(true);

    const command: CreateAppointmentCommand = {
      clientId: this.appointmentForm.clientId,
      title: this.appointmentForm.title,
      startTime: this.appointmentForm.startTime.toISOString(),
      endTime: this.appointmentForm.endTime.toISOString(),
      notes: this.appointmentForm.notes || undefined
    };

    this.appointmentsService.createAppointment(command).subscribe({
      next: (id) => {
        const clientName = this.traineeOptions.find(t => t.value === this.appointmentForm.clientId)?.label || '';
        const newAppointment: AppointmentDto = {
          id: typeof id === 'string' ? id : String(id),
          clientId: this.appointmentForm.clientId,
          clientName,
          startTime: command.startTime,
          endTime: command.endTime,
          title: command.title,
          notes: command.notes,
          status: 1
        };
        this.appointments.update(list => [newAppointment, ...list]);
        this.applyFilters();
        this.dialogVisible = false;
        this.saving.set(false);
        this.notificationService.success('تم إنشاء الموعد بنجاح');
      },
      error: (err) => {
        console.error('Error creating appointment:', err);
        this.saving.set(false);
        this.notificationService.error('حدث خطأ أثناء إنشاء الموعد');
      }
    });
  }

  confirmAppointment(apt: AppointmentDto): void {
    Swal.fire({
      title: 'تأكيد الموعد',
      text: `هل تريد تأكيد موعد "${apt.title}" مع ${apt.clientName}؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، تأكيد',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateAppointmentStatus(apt, 2, 'تم تأكيد الموعد بنجاح');
      }
    });
  }

  completeAppointment(apt: AppointmentDto): void {
    Swal.fire({
      title: 'إكمال الموعد',
      text: `هل تريد تحديد موعد "${apt.title}" كمكتمل؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، مكتمل',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateAppointmentStatus(apt, 4, 'تم إكمال الموعد بنجاح');
      }
    });
  }

  cancelAppointment(apt: AppointmentDto): void {
    Swal.fire({
      title: 'إلغاء الموعد',
      text: `هل أنت متأكد من إلغاء موعد "${apt.title}" مع ${apt.clientName}؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، إلغاء الموعد',
      cancelButtonText: 'تراجع',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateAppointmentStatus(apt, 3, 'تم إلغاء الموعد');
      }
    });
  }

  private updateAppointmentStatus(apt: AppointmentDto, newStatus: number, successMessage: string): void {
    this.appointmentsService.updateStatus(apt.id, newStatus).subscribe({
      next: () => {
        this.appointments.update(list =>
          list.map(a => a.id === apt.id ? { ...a, status: newStatus } : a)
        );
        this.applyFilters();
        this.notificationService.success(successMessage);
      },
      error: (err) => {
        console.error('Error updating appointment status:', err);
        this.notificationService.error('حدث خطأ أثناء تحديث حالة الموعد');
      }
    });
  }

  deleteAppointment(apt: AppointmentDto): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف موعد "${apt.title}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.appointmentsService.deleteAppointment(apt.id).subscribe({
          next: () => {
            this.appointments.update(list => list.filter(a => a.id !== apt.id));
            this.applyFilters();
            this.notificationService.success('تم حذف الموعد بنجاح');
          },
          error: (err) => {
            console.error('Error deleting appointment:', err);
            this.notificationService.error('حدث خطأ أثناء حذف الموعد');
          }
        });
      }
    });
  }

  getStatusLabel(status: number): string {
    return AppointmentStatusLabels[status] || 'غير معروف';
  }

  getStatusSeverity(status: number): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 1: return 'warning';   // Pending - yellow
      case 2: return 'info';      // Confirmed - blue
      case 3: return 'danger';    // Cancelled - red
      case 4: return 'success';   // Completed - green
      default: return 'secondary';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
