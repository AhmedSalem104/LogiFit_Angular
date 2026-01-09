import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, BodyMeasurement, Trainee } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-measurements-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="measurements-page">
      <app-page-header
        title="قياسات الجسم"
        subtitle="تسجيل ومتابعة قياسات المتدربين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'قياسات الجسم'}]"
      >
        <button class="btn btn-primary" (click)="openAddDialog()">
          <i class="pi pi-plus"></i>
          <span>تسجيل قياسات</span>
        </button>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon total-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ measurements().length }}</span>
            <span class="mini-stat__label">إجمالي القياسات</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon trainees-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ uniqueTraineesCount() }}</span>
            <span class="mini-stat__label">متدرب تم قياسه</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon month-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ thisMonthCount() }}</span>
            <span class="mini-stat__label">قياسات هذا الشهر</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon avg-icon">
            <i class="pi pi-percentage"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ averageBodyFat() }}%</span>
            <span class="mini-stat__label">متوسط نسبة الدهون</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Measurements Table -->
      <div class="table-container" *ngIf="!loading()">
        <div class="table-header">
          <div class="table-title">
            <h3>سجل القياسات</h3>
            <span class="badge">{{ filteredMeasurements().length }}</span>
          </div>
          <div class="table-actions">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                (input)="filterMeasurements()"
                placeholder="بحث..."
              />
            </div>
            <p-dropdown
              [options]="traineeOptions"
              [(ngModel)]="selectedTrainee"
              placeholder="جميع المتدربين"
              (onChange)="filterMeasurements()"
              [showClear]="true"
              [filter]="true"
              filterPlaceholder="بحث..."
              styleClass="trainee-filter"
            ></p-dropdown>
          </div>
        </div>

        <p-table
          [value]="filteredMeasurements()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} قياس"
          styleClass="measurements-table"
          [tableStyle]="{'min-width': '70rem'}"
          [sortField]="'measurementDate'"
          [sortOrder]="-1"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="traineeName" style="width: 18%">
                <div class="th-content">
                  المتدرب
                  <p-sortIcon field="traineeName"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="measurementDate" style="width: 12%">
                <div class="th-content">
                  التاريخ
                  <p-sortIcon field="measurementDate"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="weight" style="width: 10%">
                <div class="th-content">
                  الوزن
                  <p-sortIcon field="weight"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="height" style="width: 10%">
                <div class="th-content">
                  الطول
                  <p-sortIcon field="height"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="bodyFatPercentage" style="width: 12%">
                <div class="th-content">
                  نسبة الدهون
                  <p-sortIcon field="bodyFatPercentage"></p-sortIcon>
                </div>
              </th>
              <th style="width: 10%">الصدر</th>
              <th style="width: 10%">الخصر</th>
              <th style="width: 10%">الوركين</th>
              <th style="width: 8%">الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr class="measurement-row">
              <td>
                <div class="trainee-info">
                  <div class="trainee-avatar">{{ getInitials(m.clientName || m.traineeName || '') }}</div>
                  <span class="trainee-name">{{ m.clientName || m.traineeName }}</span>
                </div>
              </td>
              <td>
                <span class="date-cell">{{ formatDate(m.dateRecorded || m.measurementDate) }}</span>
              </td>
              <td>
                <div class="measurement-value">
                  <span class="value weight">{{ m.weightKg ?? m.weight }}</span>
                  <span class="unit">كجم</span>
                </div>
              </td>
              <td>
                <div class="measurement-value">
                  <span class="value height">{{ m.height }}</span>
                  <span class="unit">سم</span>
                </div>
              </td>
              <td>
                <div class="body-fat-cell" *ngIf="getBodyFatValue(m)">
                  <div class="progress-ring" [class]="getBodyFatClass(getBodyFatValue(m)!)">
                    <span>{{ getBodyFatValue(m) }}%</span>
                  </div>
                </div>
                <span class="na" *ngIf="!getBodyFatValue(m)">-</span>
              </td>
              <td>
                <span class="measurement-cm" *ngIf="m.chest">{{ m.chest }} <small>سم</small></span>
                <span class="na" *ngIf="!m.chest">-</span>
              </td>
              <td>
                <span class="measurement-cm" *ngIf="m.waist">{{ m.waist }} <small>سم</small></span>
                <span class="na" *ngIf="!m.waist">-</span>
              </td>
              <td>
                <span class="measurement-cm" *ngIf="m.hips">{{ m.hips }} <small>سم</small></span>
                <span class="na" *ngIf="!m.hips">-</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="action-btn view-btn"
                    (click)="viewDetails(m)"
                    title="عرض التفاصيل"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  <button
                    class="action-btn edit-btn"
                    (click)="editMeasurement(m)"
                    title="تعديل"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    (click)="deleteMeasurement(m)"
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
              <td colspan="9">
                <div class="empty-state">
                  <i class="pi pi-chart-line"></i>
                  <h4>لا توجد قياسات</h4>
                  <p>لم يتم العثور على قياسات مطابقة</p>
                  <button class="btn btn-outline" (click)="clearFilters()">مسح الفلاتر</button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingMeasurement ? 'تعديل القياسات' : 'تسجيل قياسات جديدة'"
        [modal]="true"
        [style]="{width: '700px'}"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="form-row">
            <div class="form-group">
              <label>المتدرب *</label>
              <p-dropdown
                [options]="traineeOptions"
                [(ngModel)]="measurementForm.traineeId"
                placeholder="اختر المتدرب"
                [filter]="true"
                filterPlaceholder="بحث..."
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
            <div class="form-group">
              <label>التاريخ *</label>
              <p-calendar
                [(ngModel)]="measurementForm.measurementDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>
          </div>

          <div class="section">
            <h4>القياسات الأساسية</h4>
            <div class="form-row three">
              <div class="form-group">
                <label>الوزن (كجم) *</label>
                <p-inputNumber [(ngModel)]="measurementForm.weight" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الطول (سم) *</label>
                <p-inputNumber [(ngModel)]="measurementForm.height" [min]="0"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>نسبة الدهون (%)</label>
                <p-inputNumber [(ngModel)]="measurementForm.bodyFatPercentage" [min]="0" [max]="100" [maxFractionDigits]="1"></p-inputNumber>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>قياسات الجسم (سم)</h4>
            <div class="form-row three">
              <div class="form-group">
                <label>الصدر</label>
                <p-inputNumber [(ngModel)]="measurementForm.chest" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الخصر</label>
                <p-inputNumber [(ngModel)]="measurementForm.waist" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الوركين</label>
                <p-inputNumber [(ngModel)]="measurementForm.hips" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
            </div>
            <div class="form-row four">
              <div class="form-group">
                <label>بايسبس يمين</label>
                <p-inputNumber [(ngModel)]="measurementForm.bicepsRight" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>بايسبس يسار</label>
                <p-inputNumber [(ngModel)]="measurementForm.bicepsLeft" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>فخذ يمين</label>
                <p-inputNumber [(ngModel)]="measurementForm.thighRight" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>فخذ يسار</label>
                <p-inputNumber [(ngModel)]="measurementForm.thighLeft" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>ملاحظات</label>
            <textarea pInputText [(ngModel)]="measurementForm.notes" rows="2"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveMeasurement()">حفظ</button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .measurements-page {
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
      &.trainees-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.month-icon {
        background: rgba(168, 85, 247, 0.1);
        color: #a855f7;
      }
      &.avg-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
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
      flex-wrap: wrap;
      gap: 1rem;
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

    .table-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-box {
      position: relative;

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
        width: 200px;
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

    :host ::ng-deep .trainee-filter {
      .p-dropdown {
        border-radius: 10px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
      }
    }

    :host ::ng-deep .measurements-table {
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

    .trainee-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .trainee-avatar {
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
    }

    .trainee-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .date-cell {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .measurement-value {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;

      .value {
        font-weight: 700;
        font-size: 1rem;

        &.weight { color: #3b82f6; }
        &.height { color: #22c55e; }
      }

      .unit {
        color: var(--text-muted);
        font-size: 0.75rem;
      }
    }

    .body-fat-cell {
      .progress-ring {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;

        &.low {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        &.normal {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        &.high {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        &.very-high {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }
    }

    .measurement-cm {
      font-weight: 600;
      color: var(--text-primary);

      small {
        font-weight: 400;
        color: var(--text-muted);
        margin-right: 0.15rem;
      }
    }

    .na {
      color: var(--text-muted);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
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

      &.view-btn {
        background: rgba(168, 85, 247, 0.1);
        color: #a855f7;

        &:hover {
          background: #a855f7;
          color: white;
        }
      }

      &.edit-btn {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;

        &:hover {
          background: #3b82f6;
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
      gap: 1.5rem;
    }

    .section {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;

      h4 {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        color: var(--text-primary);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      &.three {
        grid-template-columns: repeat(3, 1fr);
      }

      &.four {
        grid-template-columns: repeat(4, 1fr);
        margin-top: 1rem;
      }
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

      .table-header {
        flex-direction: column;
        align-items: stretch;
      }

      .table-actions {
        flex-direction: column;

        .search-box input {
          width: 100%;
        }
      }

      .form-row {
        grid-template-columns: 1fr;

        &.three,
        &.four {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  `]
})
export class MeasurementsListComponent implements OnInit {
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  measurements = signal<BodyMeasurement[]>([]);
  filteredMeasurements = signal<BodyMeasurement[]>([]);
  trainees = signal<Trainee[]>([]);

  selectedTrainee: string | null = null;
  searchQuery = '';
  dialogVisible = false;
  editingMeasurement: BodyMeasurement | null = null;

  measurementForm = {
    traineeId: '',
    measurementDate: new Date(),
    weight: 0,
    height: 0,
    bodyFatPercentage: null as number | null,
    chest: null as number | null,
    waist: null as number | null,
    hips: null as number | null,
    bicepsRight: null as number | null,
    bicepsLeft: null as number | null,
    thighRight: null as number | null,
    thighLeft: null as number | null,
    notes: ''
  };

  traineeOptions: { label: string; value: string }[] = [];

  uniqueTraineesCount(): number {
    const uniqueIds = new Set(this.measurements().map(m => m.traineeId));
    return uniqueIds.size;
  }

  thisMonthCount(): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.measurements().filter(m => {
      const dateStr = m.dateRecorded || m.measurementDate;
      return dateStr && new Date(dateStr) >= startOfMonth;
    }).length;
  }

  averageBodyFat(): number {
    const measurementsWithFat = this.measurements().filter(m => this.getBodyFatValue(m));
    if (measurementsWithFat.length === 0) return 0;
    const sum = measurementsWithFat.reduce((acc, m) => acc + (this.getBodyFatValue(m) || 0), 0);
    return Math.round((sum / measurementsWithFat.length) * 10) / 10;
  }

  getBodyFatValue(m: BodyMeasurement): number | undefined {
    return m.bodyFatPercent ?? m.bodyFatPercentage;
  }

  getBodyFatClass(percentage: number): string {
    if (percentage < 15) return 'low';
    if (percentage < 25) return 'normal';
    if (percentage < 30) return 'high';
    return 'very-high';
  }

  clearFilters(): void {
    this.selectedTrainee = null;
    this.searchQuery = '';
    this.filterMeasurements();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load trainees for dropdown
    this.coachService.getTrainees().subscribe({
      next: (data) => {
        this.trainees.set(data);
        this.traineeOptions = data.map(t => ({
          label: t.clientName || t.fullName || t.profile?.fullName || '',
          value: t.id
        }));
      },
      error: () => {
        this.traineeOptions = [
          { label: 'أحمد محمد', value: '1' },
          { label: 'خالد علي', value: '2' },
          { label: 'محمود حسن', value: '3' }
        ];
      }
    });

    // Load measurements
    this.coachService.getMeasurements().subscribe({
      next: (data) => {
        this.measurements.set(data);
        this.filteredMeasurements.set(data);
        this.loading.set(false);
      },
      error: () => {
        const mockData: BodyMeasurement[] = [
          { id: '1', traineeId: '1', traineeName: 'أحمد محمد', measurementDate: '2024-01-15', weight: 78, height: 175, bodyFatPercentage: 18, chest: 102, waist: 84, hips: 98 },
          { id: '2', traineeId: '1', traineeName: 'أحمد محمد', measurementDate: '2024-01-01', weight: 80, height: 175, bodyFatPercentage: 20, chest: 100, waist: 86, hips: 99 },
          { id: '3', traineeId: '2', traineeName: 'خالد علي', measurementDate: '2024-01-14', weight: 85, height: 180, bodyFatPercentage: 22, chest: 108, waist: 90, hips: 102 },
          { id: '4', traineeId: '3', traineeName: 'محمود حسن', measurementDate: '2024-01-10', weight: 72, height: 170, bodyFatPercentage: 15, chest: 95, waist: 78, hips: 92 },
        ];
        this.measurements.set(mockData);
        this.filteredMeasurements.set(mockData);
        this.loading.set(false);
      }
    });
  }

  filterMeasurements(): void {
    let result = this.measurements();

    // Filter by trainee (handle both API field names)
    if (this.selectedTrainee) {
      result = result.filter(m =>
        (m.clientId || m.traineeId) === this.selectedTrainee
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      result = result.filter(m => {
        const name = m.clientName || m.traineeName || '';
        const dateStr = m.dateRecorded || m.measurementDate || '';
        return name.toLowerCase().includes(query) || dateStr.includes(query);
      });
    }

    this.filteredMeasurements.set(result);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  openAddDialog(): void {
    this.editingMeasurement = null;
    this.measurementForm = {
      traineeId: '',
      measurementDate: new Date(),
      weight: 0,
      height: 0,
      bodyFatPercentage: null,
      chest: null,
      waist: null,
      hips: null,
      bicepsRight: null,
      bicepsLeft: null,
      thighRight: null,
      thighLeft: null,
      notes: ''
    };
    this.dialogVisible = true;
  }

  viewDetails(measurement: BodyMeasurement): void {
    console.log('View details', measurement);
  }

  editMeasurement(measurement: BodyMeasurement): void {
    this.editingMeasurement = measurement;
    // Get the trainee ID and date (handle both API field names)
    const traineeId = measurement.clientId || measurement.traineeId || '';
    const dateStr = measurement.dateRecorded || measurement.measurementDate || '';
    const weight = measurement.weightKg ?? measurement.weight ?? 0;

    this.measurementForm = {
      traineeId: traineeId,
      measurementDate: dateStr ? new Date(dateStr) : new Date(),
      weight: weight,
      height: measurement.height ?? 0,
      bodyFatPercentage: measurement.bodyFatPercent ?? measurement.bodyFatPercentage ?? null,
      chest: measurement.chest ?? null,
      waist: measurement.waist ?? null,
      hips: measurement.hips ?? null,
      bicepsRight: measurement.bicepsRight ?? null,
      bicepsLeft: measurement.bicepsLeft ?? null,
      thighRight: measurement.thighRight ?? null,
      thighLeft: measurement.thighLeft ?? null,
      notes: measurement.notes ?? ''
    };
    this.dialogVisible = true;
  }

  deleteMeasurement(measurement: BodyMeasurement): void {
    const clientName = measurement.clientName || measurement.traineeName || '';
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف قياس ${clientName}؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.coachService.deleteMeasurement(measurement.id).subscribe({
          next: () => {
            this.measurements.update(measurements => measurements.filter(m => m.id !== measurement.id));
            this.filterMeasurements();
            this.notificationService.success('تم حذف القياس بنجاح');
          },
          error: (err) => {
            console.error('Error deleting measurement:', err);
            this.notificationService.error('حدث خطأ أثناء حذف القياس');
          }
        });
      }
    });
  }

  saveMeasurement(): void {
    if (!this.measurementForm.traineeId || !this.measurementForm.weight || !this.measurementForm.height) {
      this.notificationService.warn('يرجى إدخال المتدرب والوزن والطول');
      return;
    }

    // Build measurement data
    const measurementData: Partial<BodyMeasurement> = {
      traineeId: this.measurementForm.traineeId,
      measurementDate: this.measurementForm.measurementDate instanceof Date
        ? this.measurementForm.measurementDate.toISOString().split('T')[0]
        : this.measurementForm.measurementDate,
      weight: this.measurementForm.weight,
      height: this.measurementForm.height,
      bodyFatPercentage: this.measurementForm.bodyFatPercentage || undefined,
      chest: this.measurementForm.chest || undefined,
      waist: this.measurementForm.waist || undefined,
      hips: this.measurementForm.hips || undefined,
      bicepsRight: this.measurementForm.bicepsRight || undefined,
      bicepsLeft: this.measurementForm.bicepsLeft || undefined,
      thighRight: this.measurementForm.thighRight || undefined,
      thighLeft: this.measurementForm.thighLeft || undefined,
      notes: this.measurementForm.notes || undefined
    };

    if (this.editingMeasurement) {
      // Update existing measurement
      this.coachService.updateMeasurement(this.editingMeasurement.id, measurementData).subscribe({
        next: () => {
          const traineeName = this.traineeOptions.find(t => t.value === this.measurementForm.traineeId)?.label || '';
          this.measurements.update(measurements =>
            measurements.map(m => m.id === this.editingMeasurement!.id ? {
              ...m,
              ...measurementData,
              traineeName
            } as BodyMeasurement : m)
          );
          this.filterMeasurements();
          this.dialogVisible = false;
          this.notificationService.success('تم تحديث القياس بنجاح');
        },
        error: (err) => {
          console.error('Error updating measurement:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث القياس');
        }
      });
    } else {
      // Create new measurement
      this.coachService.createMeasurement(measurementData).subscribe({
        next: (response: any) => {
          const newId = typeof response === 'string' ? response : response?.id || String(Date.now());
          const traineeName = this.traineeOptions.find(t => t.value === this.measurementForm.traineeId)?.label || '';
          const newMeasurement: BodyMeasurement = {
            id: newId,
            traineeId: this.measurementForm.traineeId,
            traineeName,
            measurementDate: measurementData.measurementDate as string,
            weight: this.measurementForm.weight,
            height: this.measurementForm.height,
            bodyFatPercentage: this.measurementForm.bodyFatPercentage || undefined,
            chest: this.measurementForm.chest || undefined,
            waist: this.measurementForm.waist || undefined,
            hips: this.measurementForm.hips || undefined,
            bicepsRight: this.measurementForm.bicepsRight || undefined,
            bicepsLeft: this.measurementForm.bicepsLeft || undefined,
            thighRight: this.measurementForm.thighRight || undefined,
            thighLeft: this.measurementForm.thighLeft || undefined,
            notes: this.measurementForm.notes || undefined
          };
          this.measurements.update(measurements => [newMeasurement, ...measurements]);
          this.filterMeasurements();
          this.dialogVisible = false;
          this.notificationService.success('تم إضافة القياس بنجاح');
        },
        error: (err) => {
          console.error('Error creating measurement:', err);
          this.notificationService.error('حدث خطأ أثناء إضافة القياس');
        }
      });
    }
  }
}
