import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnerService, Client } from '../services/owner.service';
import { AttendanceService, AttendanceDto, AttendanceSummaryDto } from '../services/attendance.service';
import Swal from 'sweetalert2';

interface ClientOption {
  label: string;
  value: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    DropdownModule,
    CalendarModule,
    InputTextareaModule,
    ToggleButtonModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="attendance-page">
      <app-page-header
        title="سجل الحضور"
        subtitle="إدارة حضور وانصراف العملاء"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'الحضور'}]"
      ></app-page-header>

      <!-- Summary Cards -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon blue">
            <i class="pi pi-sign-in"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ summary()?.totalCheckIns ?? 0 }}</span>
            <span class="mini-stat__label">إجمالي الحضور</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon green">
            <i class="pi pi-users"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ summary()?.checkedInNow ?? 0 }}</span>
            <span class="mini-stat__label">متواجدون الآن</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon orange">
            <i class="pi pi-clock"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ formatDuration(summary()?.averageDurationMinutes ?? 0) }}</span>
            <span class="mini-stat__label">متوسط المدة</span>
          </div>
        </div>
      </div>

      <!-- Quick Check-in Section -->
      <div class="card checkin-card">
        <h3 class="section-title">
          <i class="pi pi-sign-in"></i>
          تسجيل حضور سريع
        </h3>
        <div class="checkin-form">
          <div class="checkin-form__field">
            <label>العميل</label>
            <p-dropdown
              [options]="clientOptions()"
              [(ngModel)]="selectedClientId"
              placeholder="اختر العميل..."
              [filter]="true"
              filterPlaceholder="بحث..."
              [showClear]="true"
              styleClass="w-full"
              appendTo="body"
            ></p-dropdown>
          </div>
          <div class="checkin-form__field">
            <label>ملاحظات (اختياري)</label>
            <textarea
              pInputTextarea
              [(ngModel)]="checkInNotes"
              placeholder="أي ملاحظات..."
              [rows]="1"
              [autoResize]="true"
            ></textarea>
          </div>
          <div class="checkin-form__action">
            <button
              pButton
              label="تسجيل حضور"
              icon="pi pi-sign-in"
              class="p-button-success"
              [disabled]="!selectedClientId || checkingIn()"
              [loading]="checkingIn()"
              (click)="doCheckIn()"
            ></button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-row">
          <div class="filter-field">
            <label>من تاريخ</label>
            <p-calendar
              [(ngModel)]="fromDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              placeholder="من تاريخ"
              styleClass="w-full"
              appendTo="body"
              (onSelect)="loadAttendance()"
            ></p-calendar>
          </div>
          <div class="filter-field">
            <label>إلى تاريخ</label>
            <p-calendar
              [(ngModel)]="toDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              placeholder="إلى تاريخ"
              styleClass="w-full"
              appendTo="body"
              (onSelect)="loadAttendance()"
            ></p-calendar>
          </div>
          <div class="filter-field">
            <label>العميل</label>
            <p-dropdown
              [options]="clientFilterOptions()"
              [(ngModel)]="filterClientId"
              placeholder="جميع العملاء"
              [filter]="true"
              filterPlaceholder="بحث..."
              [showClear]="true"
              styleClass="w-full"
              appendTo="body"
              (onChange)="loadAttendance()"
            ></p-dropdown>
          </div>
          <div class="filter-field filter-toggle">
            <label>المتواجدون فقط</label>
            <p-toggleButton
              [(ngModel)]="checkedInOnly"
              onLabel="نعم"
              offLabel="لا"
              onIcon="pi pi-check"
              offIcon="pi pi-times"
              (onChange)="loadAttendance()"
            ></p-toggleButton>
          </div>
          <div class="filter-field filter-actions">
            <button
              pButton
              label="بحث"
              icon="pi pi-search"
              class="p-button-primary"
              (click)="loadAttendance()"
            ></button>
            <button
              pButton
              label="مسح"
              icon="pi pi-filter-slash"
              class="p-button-outlined p-button-secondary"
              (click)="clearFilters()"
            ></button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Table -->
      <div class="table-card card" *ngIf="!loading()">
        <p-table
          [value]="attendanceRecords()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} سجل"
          styleClass="p-datatable-striped"
          [globalFilterFields]="['clientName']"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>العميل</th>
              <th>وقت الحضور</th>
              <th>وقت الانصراف</th>
              <th>المدة</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-record>
            <tr>
              <td>
                <div class="client-info">
                  <div class="client-avatar" [class.active]="!record.checkOutTime">
                    {{ getInitials(record.clientName) }}
                  </div>
                  <span class="client-name">{{ record.clientName }}</span>
                </div>
              </td>
              <td>{{ formatDateTime(record.checkInTime) }}</td>
              <td>{{ record.checkOutTime ? formatDateTime(record.checkOutTime) : '-' }}</td>
              <td>{{ record.durationMinutes ? formatDuration(record.durationMinutes) : '-' }}</td>
              <td>
                <p-tag
                  [value]="record.checkOutTime ? 'انصرف' : 'متواجد'"
                  [severity]="record.checkOutTime ? 'secondary' : 'success'"
                  [icon]="record.checkOutTime ? 'pi pi-sign-out' : 'pi pi-check-circle'"
                ></p-tag>
              </td>
              <td>
                <span class="notes-text">{{ record.notes || '-' }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    *ngIf="!record.checkOutTime"
                    pButton
                    icon="pi pi-sign-out"
                    class="p-button-text p-button-warning p-button-sm"
                    (click)="doCheckOut(record)"
                    pTooltip="تسجيل انصراف"
                    [loading]="checkingOutId() === record.id"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    (click)="deleteRecord(record)"
                    pTooltip="حذف"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="pi pi-calendar-times"></i>
                  <p>لا توجد سجلات حضور</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .attendance-page {
      max-width: 1400px;
    }

    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .mini-stat {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
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
      flex-shrink: 0;
    }

    .mini-stat__icon.blue {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
    }

    .mini-stat__icon.green {
      background: rgba(34, 197, 94, 0.12);
      color: #22c55e;
    }

    .mini-stat__icon.orange {
      background: rgba(249, 115, 22, 0.12);
      color: #f97316;
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
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      margin: 0 0 1.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: #3b82f6;
      }
    }

    .checkin-form {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .checkin-form__field {
      flex: 1;
      min-width: 200px;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      textarea {
        width: 100%;
      }
    }

    .checkin-form__action {
      flex-shrink: 0;
      padding-bottom: 2px;
    }

    .filters-card {
      margin-bottom: 1.5rem;
    }

    .filters-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-field {
      flex: 1;
      min-width: 160px;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
      }
    }

    .filter-toggle {
      flex: 0 0 auto;
      min-width: auto;
    }

    .filter-actions {
      display: flex;
      gap: 0.5rem;
      flex: 0 0 auto;
      min-width: auto;
      padding-bottom: 2px;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .client-avatar.active {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    .client-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .notes-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }
    }

    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
      }

      .p-calendar {
        width: 100%;
      }

      .p-togglebutton {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        flex-direction: column;
      }

      .checkin-form {
        flex-direction: column;
        align-items: stretch;
      }

      .checkin-form__field {
        min-width: 100%;
      }

      .checkin-form__action {
        width: 100%;

        button {
          width: 100%;
        }
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-field {
        min-width: 100%;
      }

      .filter-actions {
        flex-direction: row;
        width: 100%;

        button {
          flex: 1;
        }
      }
    }

    @media (max-width: 480px) {
      .mini-stat {
        padding: 1rem;
      }

      .mini-stat__value {
        font-size: 1.25rem;
      }

      .mini-stat__icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private ownerService = inject(OwnerService);
  private notificationService = inject(NotificationService);

  // State signals
  loading = signal(true);
  checkingIn = signal(false);
  checkingOutId = signal<string | null>(null);
  attendanceRecords = signal<AttendanceDto[]>([]);
  summary = signal<AttendanceSummaryDto | null>(null);
  clients = signal<Client[]>([]);

  // Check-in form
  selectedClientId: string | null = null;
  checkInNotes = '';

  // Filters
  fromDate: Date | null = null;
  toDate: Date | null = null;
  filterClientId: string | null = null;
  checkedInOnly = false;

  // Client dropdown options
  clientOptions = computed<ClientOption[]>(() =>
    this.clients().map(c => ({
      label: c.profile?.fullName || c.fullName || c.phoneNumber || 'غير محدد',
      value: c.id
    }))
  );

  clientFilterOptions = computed<ClientOption[]>(() => [
    ...this.clientOptions()
  ]);

  ngOnInit(): void {
    this.loadClients();
    this.loadAttendance();
    this.loadSummary();
  }

  loadClients(): void {
    this.ownerService.getClients({ isActive: true }).subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients:', err)
    });
  }

  loadAttendance(): void {
    this.loading.set(true);
    const params: any = {};

    if (this.filterClientId) {
      params.clientId = this.filterClientId;
    }
    if (this.fromDate) {
      params.fromDate = this.formatDateForApi(this.fromDate);
    }
    if (this.toDate) {
      params.toDate = this.formatDateForApi(this.toDate);
    }
    if (this.checkedInOnly) {
      params.checkedInOnly = true;
    }

    this.attendanceService.getAttendance(params).subscribe({
      next: (data) => {
        this.attendanceRecords.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading attendance:', err);
        this.attendanceRecords.set([]);
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    const fromDate = this.fromDate ? this.formatDateForApi(this.fromDate) : undefined;
    const toDate = this.toDate ? this.formatDateForApi(this.toDate) : undefined;

    this.attendanceService.getSummary(fromDate, toDate).subscribe({
      next: (data) => this.summary.set(data),
      error: (err) => console.error('Error loading summary:', err)
    });
  }

  doCheckIn(): void {
    if (!this.selectedClientId) return;

    this.checkingIn.set(true);

    this.attendanceService.checkIn({
      clientId: this.selectedClientId,
      notes: this.checkInNotes || undefined
    }).subscribe({
      next: () => {
        this.notificationService.success('تم تسجيل الحضور بنجاح');
        this.selectedClientId = null;
        this.checkInNotes = '';
        this.checkingIn.set(false);
        this.loadAttendance();
        this.loadSummary();
      },
      error: (err) => {
        console.error('Error checking in:', err);
        this.notificationService.error('حدث خطأ أثناء تسجيل الحضور');
        this.checkingIn.set(false);
      }
    });
  }

  doCheckOut(record: AttendanceDto): void {
    this.checkingOutId.set(record.id);

    this.attendanceService.checkOut(record.id).subscribe({
      next: () => {
        this.notificationService.success('تم تسجيل الانصراف بنجاح');
        this.checkingOutId.set(null);
        this.loadAttendance();
        this.loadSummary();
      },
      error: (err) => {
        console.error('Error checking out:', err);
        this.notificationService.error('حدث خطأ أثناء تسجيل الانصراف');
        this.checkingOutId.set(null);
      }
    });
  }

  deleteRecord(record: AttendanceDto): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف سجل حضور "${record.clientName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.attendanceService.deleteAttendance(record.id).subscribe({
          next: () => {
            this.attendanceRecords.update(records => records.filter(r => r.id !== record.id));
            this.notificationService.success('تم حذف السجل بنجاح');
            this.loadSummary();
          },
          error: (err) => {
            console.error('Error deleting record:', err);
            this.notificationService.error('حدث خطأ أثناء حذف السجل');
          }
        });
      }
    });
  }

  clearFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.filterClientId = null;
    this.checkedInOnly = false;
    this.loadAttendance();
    this.loadSummary();
  }

  // Utility methods

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return '0 د';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours} س ${mins} د`;
    }
    return `${mins} د`;
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
