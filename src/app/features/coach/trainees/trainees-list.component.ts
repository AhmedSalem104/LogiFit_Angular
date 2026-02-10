import { Component, signal, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputMaskModule } from 'primeng/inputmask';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Trainee } from '../services/coach.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-trainees-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    ProgressBarModule,
    DialogModule,
    CalendarModule,
    InputMaskModule,
    ToastModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast position="top-left" dir="rtl"></p-toast>
    <p-confirmDialog styleClass="modern-confirm-dialog" [style]="{width: '450px'}" acceptLabel="نعم، حذف" rejectLabel="إلغاء" acceptButtonStyleClass="p-button-danger" rejectButtonStyleClass="p-button-secondary"></p-confirmDialog>

    <div class="trainees-page">
      <app-page-header
        title="المتدربين"
        subtitle="إدارة ومتابعة المتدربين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'المتدربين'}]"
      >
        <button class="btn btn-primary" (click)="openAddDialog()">
          <i class="pi pi-plus"></i>
          <span>إضافة متدرب</span>
        </button>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card blue">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ trainees().length }}</span>
            <span class="stat-label">إجمالي المتدربين</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ activeTraineesCount() }}</span>
            <span class="stat-label">نشط</span>
          </div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ expiredTraineesCount() }}</span>
            <span class="stat-label">منتهي</span>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon"><i class="pi pi-chart-line"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ averageProgress() }}%</span>
            <span class="stat-label">متوسط التقدم</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading()">
        <!-- Table Header -->
        <div class="table-header">
          <div class="table-title">
            <i class="pi pi-users"></i>
            <span>قائمة المتدربين</span>
            <span class="count-badge">{{ filteredTrainees().length }}</span>
          </div>
          <div class="table-actions">
            <span class="p-input-icon-right search-box">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchTerm"
                placeholder="بحث بالاسم أو الهاتف..."
                (input)="filterTrainees()"
              />
            </span>
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="selectedStatus"
              placeholder="الحالة"
              (onChange)="filterTrainees()"
              [showClear]="true"
              [style]="{'min-width': '140px'}"
            ></p-dropdown>
          </div>
        </div>

        <!-- PrimeNG Table -->
        <p-table
          [value]="filteredTrainees()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} متدرب"
          [sortField]="'clientName'"
          [sortOrder]="1"
          styleClass="p-datatable-striped"
          [tableStyle]="{'min-width': '70rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 5%">#</th>
              <th pSortableColumn="clientName" style="width: 20%">
                المتدرب
                <p-sortIcon field="clientName"></p-sortIcon>
              </th>
              <th style="width: 14%">التواصل</th>
              <th pSortableColumn="hasActiveSubscription" style="width: 9%">
                الحالة
                <p-sortIcon field="hasActiveSubscription"></p-sortIcon>
              </th>
              <th style="width: 15%">البرامج</th>
              <th pSortableColumn="progressPercentage" style="width: 10%">
                التقدم
                <p-sortIcon field="progressPercentage"></p-sortIcon>
              </th>
              <th pSortableColumn="lastActivityDate" style="width: 10%">
                آخر نشاط
                <p-sortIcon field="lastActivityDate"></p-sortIcon>
              </th>
              <th style="width: 17%">الإجراءات</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-trainee let-rowIndex="rowIndex">
            <tr [class.inactive-row]="!trainee.isActive && !trainee.hasActiveSubscription">
              <!-- Row Index with Name -->
              <td>
                <div class="index-cell">
                  <span class="row-index">{{ rowIndex + 1 }}</span>
                </div>
              </td>
              <!-- Trainee Name & Avatar -->
              <td>
                <div class="trainee-cell">
                  <div class="trainee-avatar">
                    @if (trainee.profileImageUrl) {
                      <img [src]="trainee.profileImageUrl" [alt]="trainee.clientName || trainee.fullName" />
                    } @else {
                      {{ getInitials(trainee.clientName || trainee.fullName) }}
                    }
                  </div>
                  <div class="trainee-details">
                    <span class="trainee-name">{{ trainee.clientName || trainee.fullName || 'بدون اسم' }}</span>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td>
                <div class="contact-cell">
                  <div class="contact-item">
                    <i class="pi pi-phone"></i>
                    <span>{{ trainee.clientPhone || trainee.phoneNumber }}</span>
                  </div>
                  <div class="contact-item" *ngIf="trainee.clientEmail || trainee.email">
                    <i class="pi pi-envelope"></i>
                    <span>{{ (trainee.clientEmail || trainee.email) | slice:0:20 }}{{ (trainee.clientEmail || trainee.email)?.length > 20 ? '...' : '' }}</span>
                  </div>
                </div>
              </td>

              <!-- Status -->
              <td>
                <p-tag
                  [value]="trainee.hasActiveSubscription ? 'مشترك' : (trainee.isActive ? 'نشط' : 'غير نشط')"
                  [severity]="trainee.hasActiveSubscription ? 'success' : (trainee.isActive ? 'info' : 'danger')"
                  [rounded]="true"
                ></p-tag>
              </td>

              <!-- Programs -->
              <td>
                <div class="programs-cell">
                  <div class="program-badge workout" pTooltip="برامج التمرين" tooltipPosition="top">
                    <i class="pi pi-list"></i>
                    <span>{{ trainee.workoutProgramsCount || 0 }}</span>
                  </div>
                  <div class="program-badge diet" pTooltip="خطط التغذية" tooltipPosition="top">
                    <i class="pi pi-apple"></i>
                    <span>{{ trainee.dietPlansCount || 0 }}</span>
                  </div>
                  <div class="program-badge sessions" pTooltip="الجلسات" tooltipPosition="top">
                    <i class="pi pi-check-circle"></i>
                    <span>{{ trainee.workoutSessionsCount || trainee.sessionsCompleted || 0 }}</span>
                  </div>
                </div>
              </td>

              <!-- Progress -->
              <td>
                <div class="progress-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="trainee.progressPercentage || 0"></div>
                  </div>
                  <span class="progress-value">{{ trainee.progressPercentage || 0 }}%</span>
                </div>
              </td>

              <!-- Last Activity -->
              <td>
                <div class="date-cell">
                  <i class="pi pi-clock"></i>
                  <span>{{ (trainee.lastSessionDate || trainee.lastActivityDate) ? formatDate(trainee.lastSessionDate || trainee.lastActivityDate) : '-' }}</span>
                </div>
              </td>

              <!-- Actions -->
              <td>
                <div class="actions-cell">
                  <a
                    [routerLink]="['/coach/trainees', trainee.clientId || trainee.id]"
                    class="action-icon view"
                    pTooltip="عرض التفاصيل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-eye"></i>
                  </a>
                  <button
                    class="action-icon edit"
                    (click)="openEditDialog(trainee)"
                    pTooltip="تعديل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-icon assign"
                    (click)="assignProgram(trainee)"
                    pTooltip="تعيين برنامج"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-plus"></i>
                  </button>
                  <button
                    class="action-icon message"
                    (click)="messageTrainee(trainee)"
                    pTooltip="إرسال رسالة"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-send"></i>
                  </button>
                  <button
                    class="action-icon delete"
                    (click)="confirmDelete(trainee)"
                    pTooltip="حذف"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <h3>لا يوجد متدربين</h3>
                  <p>لم يتم تعيين أي متدربين لك بعد</p>
                  <button class="btn btn-primary" (click)="openAddDialog()">
                    <i class="pi pi-plus"></i>
                    إضافة متدرب
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Add/Edit Trainee Dialog -->
    <p-dialog
      [(visible)]="showAddDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{width: '550px'}"
      styleClass="modern-dialog"
    >
      <ng-template pTemplate="header">
        <div class="dialog-header-custom">
          <div class="header-icon" [class.primary]="!editingTrainee" [class.edit]="editingTrainee">
            <i [class]="editingTrainee ? 'pi pi-user-edit' : 'pi pi-user-plus'"></i>
          </div>
          <div class="header-text">
            <span class="header-title">{{ editingTrainee ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد' }}</span>
            <span class="header-subtitle">{{ editingTrainee ? 'عدل بيانات المتدرب' : 'أدخل بيانات المتدرب' }}</span>
          </div>
        </div>
      </ng-template>

      <form [formGroup]="traineeForm" class="trainee-form">
        <div class="form-grid">
          <!-- Full Name -->
          <div class="form-field full-width">
            <label>
              <i class="pi pi-user"></i>
              الاسم الكامل <span class="required">*</span>
            </label>
            <input
              type="text"
              pInputText
              formControlName="fullName"
              placeholder="أدخل الاسم الكامل"
              class="modern-input"
            />
            @if (traineeForm.get('fullName')?.invalid && traineeForm.get('fullName')?.touched) {
              <small class="error-text">
                <i class="pi pi-exclamation-circle"></i>
                الاسم الكامل مطلوب
              </small>
            }
          </div>

          <!-- Phone Number -->
          <div class="form-field">
            <label>
              <i class="pi pi-phone"></i>
              رقم الهاتف <span class="required">*</span>
            </label>
            <input
              type="text"
              pInputText
              formControlName="phoneNumber"
              placeholder="01xxxxxxxxx"
              class="modern-input"
              dir="ltr"
            />
            @if (traineeForm.get('phoneNumber')?.invalid && traineeForm.get('phoneNumber')?.touched) {
              <small class="error-text">
                <i class="pi pi-exclamation-circle"></i>
                @if (traineeForm.get('phoneNumber')?.errors?.['required']) {
                  رقم الهاتف مطلوب
                } @else if (traineeForm.get('phoneNumber')?.errors?.['pattern']) {
                  رقم الهاتف غير صحيح
                }
              </small>
            }
          </div>

          <!-- Email -->
          <div class="form-field">
            <label>
              <i class="pi pi-envelope"></i>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              pInputText
              formControlName="email"
              placeholder="example@email.com"
              class="modern-input"
              dir="ltr"
            />
            @if (traineeForm.get('email')?.invalid && traineeForm.get('email')?.touched) {
              <small class="error-text">
                <i class="pi pi-exclamation-circle"></i>
                البريد الإلكتروني غير صحيح
              </small>
            }
          </div>

          <!-- Gender -->
          <div class="form-field">
            <label>
              <i class="pi pi-users"></i>
              النوع
            </label>
            <p-dropdown
              [options]="genderOptions"
              formControlName="gender"
              placeholder="اختر النوع"
              styleClass="w-full modern-dropdown"
            ></p-dropdown>
          </div>

          <!-- Birth Date -->
          <div class="form-field">
            <label>
              <i class="pi pi-calendar"></i>
              تاريخ الميلاد
            </label>
            <p-calendar
              formControlName="birthDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
              placeholder="اختر تاريخ الميلاد"
            ></p-calendar>
          </div>

          <!-- Height -->
          <div class="form-field">
            <label>
              <i class="pi pi-arrows-v"></i>
              الطول (سم)
            </label>
            <input
              type="number"
              pInputText
              formControlName="heightCm"
              placeholder="175"
              class="modern-input"
              dir="ltr"
            />
          </div>

          <!-- Weight -->
          <div class="form-field">
            <label>
              <i class="pi pi-chart-line"></i>
              الوزن (كجم)
            </label>
            <input
              type="number"
              pInputText
              formControlName="weightKg"
              placeholder="75"
              class="modern-input"
              dir="ltr"
            />
          </div>

          <!-- Activity Level -->
          <div class="form-field">
            <label>
              <i class="pi pi-bolt"></i>
              مستوى النشاط
            </label>
            <p-dropdown
              [options]="activityLevelOptions"
              formControlName="activityLevel"
              placeholder="اختر مستوى النشاط"
              styleClass="w-full modern-dropdown"
            ></p-dropdown>
          </div>

          <!-- Fitness Goal -->
          <div class="form-field">
            <label>
              <i class="pi pi-flag"></i>
              الهدف
            </label>
            <p-dropdown
              [options]="fitnessGoalOptions"
              formControlName="fitnessGoal"
              placeholder="اختر الهدف"
              styleClass="w-full modern-dropdown"
            ></p-dropdown>
          </div>

          <!-- Medical History -->
          <div class="form-field full-width">
            <label>
              <i class="pi pi-file-edit"></i>
              التاريخ الطبي
            </label>
            <textarea
              pInputText
              formControlName="medicalHistory"
              placeholder="أي معلومات طبية مهمة..."
              class="modern-input"
              rows="3"
            ></textarea>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="closeDialog()"
          >
            إلغاء
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="saveTrainee()"
            [disabled]="traineeForm.invalid || saving()"
          >
            @if (saving()) {
              <i class="pi pi-spinner pi-spin"></i>
              جاري الحفظ...
            } @else {
              <i class="pi pi-check"></i>
              {{ editingTrainee ? 'حفظ التعديلات' : 'حفظ المتدرب' }}
            }
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .trainees-page {
      max-width: 1600px;
    }

    /* Stats Row - Unified Design */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-color);
      }
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .stat-card.blue .stat-icon {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
      color: #3b82f6;
    }

    .stat-card.green .stat-icon {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15));
      color: #22c55e;
    }

    .stat-card.red .stat-icon {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
      color: #ef4444;
    }

    .stat-card.purple .stat-icon {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.15));
      color: #8b5cf6;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Table Container - Unified Design */
    .table-container {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #3b82f6;
        font-size: 1.25rem;
      }

      .count-badge {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }
    }

    .table-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .search-box {
      input {
        border-radius: 10px;
        background: var(--bg-primary);
        border-color: var(--border-color);

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }
    }

    /* Table Cells */
    .trainee-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .trainee-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      flex-shrink: 0;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .trainee-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .trainee-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .trainee-email {
      font-size: 0.8rem;
      color: var(--text-secondary);
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);

      i {
        color: var(--text-muted);
        font-size: 0.8rem;
        width: 14px;
      }
    }

    .programs-cell {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .program-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;

      i {
        font-size: 0.7rem;
      }

      &.workout {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
      }

      &.diet {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.sessions {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      min-width: 60px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: #22c55e;
      min-width: 35px;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);

      i {
        color: var(--text-muted);
        font-size: 0.85rem;
      }
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      text-decoration: none;

      &:hover {
        transform: scale(1.08);
      }

      &.view:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &.assign:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.message:hover {
        background: rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
        color: #22c55e;
      }

      &.edit:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
        color: #f59e0b;
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }
    }

    .index-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .row-index {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .header-icon.edit {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      color: #f59e0b;
    }

    .inactive-row {
      opacity: 0.6;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
        color: #3b82f6;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
      }

      p {
        margin-bottom: 1.5rem;
      }
    }

    /* Button */
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
      text-decoration: none;

      &.btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;

        &:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      }
    }

    /* PrimeNG Table Overrides */
    :host ::ng-deep {
      .p-datatable {
        .p-datatable-header {
          background: transparent;
          border: none;
          padding: 0;
        }

        .p-datatable-thead > tr > th {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 1rem;
          border-color: var(--border-color);
        }

        .p-datatable-tbody > tr > td {
          padding: 1rem;
          border-color: var(--border-color);
          vertical-align: middle;
        }

        .p-datatable-tbody > tr:hover {
          background: var(--bg-secondary) !important;
        }

        .p-paginator {
          background: var(--bg-secondary);
          border: none;
          border-top: 1px solid var(--border-color);
          padding: 1rem;
        }
      }

      .p-dropdown {
        background: var(--bg-primary);
        border-color: var(--border-color);
        border-radius: 10px;

        &:not(.p-disabled):hover {
          border-color: #3b82f6;
        }

        &:not(.p-disabled).p-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }

      .p-tag {
        font-size: 0.8rem;
        padding: 0.35rem 0.75rem;
      }

      .p-sortable-column:not(.p-highlight):hover {
        background: var(--bg-secondary);
      }

      .p-sortable-column.p-highlight {
        background: var(--bg-secondary);
        color: #3b82f6;
      }
    }

    /* Responsive */
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
        gap: 1rem;
        align-items: stretch;
      }

      .table-actions {
        flex-direction: column;

        .search-box {
          width: 100%;

          input {
            width: 100%;
          }
        }
      }
    }

    /* Form Styles */
    .trainee-form {
      padding: 0.5rem 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .form-field {
      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 0.5rem;

        i {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .required {
          color: #dc2626;
          font-weight: 600;
        }
      }
    }

    .modern-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      background: var(--input-bg);
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-muted);
      }

      &:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 4px var(--input-focus-ring);
      }
    }

    textarea.modern-input {
      resize: vertical;
      min-height: 80px;
    }

    .error-text {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #dc2626;
      font-size: 0.8rem;
      margin-top: 6px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
      }

      &-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover:not(:disabled) {
          background: var(--bg-secondary);
          border-color: var(--text-muted);
        }
      }
    }
  `]
})
export class TraineesListComponent implements OnInit {
  private coachService = inject(CoachService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(true);
  saving = signal(false);
  trainees = signal<Trainee[]>([]);
  filteredTrainees = signal<Trainee[]>([]);

  searchTerm = '';
  selectedStatus: string | null = null;
  showAddDialog = false;
  editingTrainee: Trainee | null = null;

  statusOptions = [
    { label: 'نشط', value: 'active' },
    { label: 'منتهي', value: 'expired' },
    { label: 'معلق', value: 'pending' }
  ];

  subscriptionPlanOptions = [
    { label: 'شهري - 500 جنيه', value: '1' },
    { label: 'ربع سنوي - 1200 جنيه', value: '2' },
    { label: 'نصف سنوي - 2000 جنيه', value: '3' },
    { label: 'سنوي - 3500 جنيه', value: '4' }
  ];

  genderOptions = [
    { label: 'ذكر', value: 0 },
    { label: 'أنثى', value: 1 }
  ];

  activityLevelOptions = [
    { label: 'خامل', value: 'Sedentary' },
    { label: 'نشاط خفيف', value: 'Light' },
    { label: 'نشاط متوسط', value: 'Moderate' },
    { label: 'نشاط عالي', value: 'Active' },
    { label: 'نشاط مكثف', value: 'VeryActive' }
  ];

  fitnessGoalOptions = [
    { label: 'خسارة الوزن', value: 'WeightLoss' },
    { label: 'بناء العضلات', value: 'MuscleGain' },
    { label: 'الحفاظ على الوزن', value: 'Maintenance' },
    { label: 'زيادة القوة', value: 'Strength' },
    { label: 'تحسين اللياقة', value: 'Fitness' }
  ];

  traineeForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    email: ['', Validators.email],
    gender: [0],
    birthDate: [null],
    heightCm: [null],
    weightKg: [null],
    activityLevel: ['Moderate'],
    fitnessGoal: [''],
    medicalHistory: ['']
  });

  activeTraineesCount = computed(() =>
    this.trainees().filter(t => t.hasActiveSubscription || t.subscriptionStatus === 'active' || t.isActive).length
  );

  expiredTraineesCount = computed(() =>
    this.trainees().filter(t => t.subscriptionStatus === 'expired' || (!t.hasActiveSubscription && !t.isActive)).length
  );

  averageProgress = computed(() => {
    const trainees = this.trainees();
    if (trainees.length === 0) return 0;
    const total = trainees.reduce((sum, t) => sum + (t.progressPercentage || 0), 0);
    return Math.round(total / trainees.length);
  });

  ngOnInit(): void {
    this.loadTrainees();
  }

  loadTrainees(): void {
    this.loading.set(true);

    this.coachService.getTrainees().subscribe({
      next: (data) => {
        console.log('Trainees data from API:', data); // Debug log
        // API returns: id, coachId, coachName, clientId, clientName, clientPhone, assignedAt, isActive
        const mappedData = data.map((t: any) => ({
          ...t,
          // Ensure both field naming conventions work
          fullName: t.clientName || t.fullName || '',
          phoneNumber: t.clientPhone || t.phoneNumber || '',
          email: t.clientEmail || t.email || ''
        }));
        this.trainees.set(mappedData);
        this.filteredTrainees.set(mappedData);
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        const mockData: Trainee[] = [
          {
            id: '1',
            clientId: '1',
            clientName: 'أحمد محمد علي',
            clientPhone: '01012345678',
            fullName: 'أحمد محمد علي',
            phoneNumber: '01012345678',
            email: 'ahmed@email.com',
            isActive: true,
            subscriptionStatus: 'active',
            hasActiveSubscription: true,
            currentWorkoutProgramId: 'prog1',
            currentDietPlanId: 'diet1',
            workoutProgramsCount: 2,
            dietPlansCount: 1,
            startDate: '2024-01-01',
            lastActivityDate: '2024-01-15',
            progressPercentage: 85,
            sessionsCompleted: 24,
            totalSessions: 28
          },
          {
            id: '2',
            clientId: '2',
            clientName: 'خالد أحمد حسن',
            clientPhone: '01123456789',
            fullName: 'خالد أحمد حسن',
            phoneNumber: '01123456789',
            email: 'khaled@email.com',
            isActive: true,
            subscriptionStatus: 'active',
            hasActiveSubscription: true,
            currentWorkoutProgramId: 'prog2',
            workoutProgramsCount: 1,
            dietPlansCount: 0,
            startDate: '2024-01-05',
            lastActivityDate: '2024-01-14',
            progressPercentage: 72,
            sessionsCompleted: 18,
            totalSessions: 25
          },
          {
            id: '3',
            clientId: '3',
            clientName: 'محمود السيد',
            clientPhone: '01234567890',
            fullName: 'محمود السيد',
            phoneNumber: '01234567890',
            email: 'mahmoud@email.com',
            isActive: false,
            subscriptionStatus: 'expired',
            hasActiveSubscription: false,
            workoutProgramsCount: 0,
            dietPlansCount: 1,
            startDate: '2023-10-01',
            lastActivityDate: '2023-12-28',
            progressPercentage: 100,
            sessionsCompleted: 30,
            totalSessions: 30
          },
          {
            id: '4',
            clientId: '4',
            clientName: 'عمر إبراهيم',
            clientPhone: '01098765432',
            fullName: 'عمر إبراهيم',
            phoneNumber: '01098765432',
            email: 'omar@email.com',
            isActive: true,
            subscriptionStatus: 'active',
            hasActiveSubscription: true,
            currentDietPlanId: 'diet2',
            workoutProgramsCount: 0,
            dietPlansCount: 1,
            startDate: '2024-01-10',
            progressPercentage: 35,
            sessionsCompleted: 8,
            totalSessions: 24
          },
          {
            id: '5',
            clientId: '5',
            clientName: 'يوسف محمد',
            clientPhone: '01187654321',
            fullName: 'يوسف محمد',
            phoneNumber: '01187654321',
            email: 'youssef@email.com',
            isActive: true,
            subscriptionStatus: 'pending',
            hasActiveSubscription: false,
            workoutProgramsCount: 0,
            dietPlansCount: 0,
            startDate: '2024-01-14',
            progressPercentage: 0,
            sessionsCompleted: 0,
            totalSessions: 20
          }
        ];
        this.trainees.set(mockData);
        this.filteredTrainees.set(mockData);
        this.loading.set(false);
      }
    });
  }

  filterTrainees(): void {
    let result = this.trainees();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t => {
        const name = (t.clientName || t.fullName || '').toLowerCase();
        const phone = t.clientPhone || t.phoneNumber || '';
        return name.includes(term) || phone.includes(term);
      });
    }

    if (this.selectedStatus) {
      result = result.filter(t => t.subscriptionStatus === this.selectedStatus);
    }

    this.filteredTrainees.set(result);
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      expired: 'منتهي',
      pending: 'معلق'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      active: 'success',
      expired: 'danger',
      pending: 'warning'
    };
    return severities[status] || 'info';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  assignProgram(trainee: Trainee): void {
    // Navigate to program builder with trainee pre-selected
    console.log('Assign program to trainee', trainee);
  }

  messageTrainee(trainee: Trainee): void {
    // Open messaging dialog or navigate to messages
    console.log('Message trainee', trainee);
  }

  openAddDialog(): void {
    this.editingTrainee = null;
    this.traineeForm.reset({
      fullName: '',
      phoneNumber: '',
      email: '',
      gender: 0,
      birthDate: null,
      heightCm: null,
      weightKg: null,
      activityLevel: 'Moderate',
      fitnessGoal: '',
      medicalHistory: ''
    });
    this.showAddDialog = true;
  }

  openEditDialog(trainee: Trainee): void {
    this.editingTrainee = trainee;
    // Note: Edit dialog only shows basic info since API only allows updating isActive/newCoachId
    this.traineeForm.patchValue({
      fullName: trainee.clientName || trainee.fullName || '',
      phoneNumber: trainee.clientPhone || trainee.phoneNumber || '',
      email: trainee.clientEmail || trainee.email || '',
      gender: trainee.gender || 0,
      birthDate: trainee.birthDate ? new Date(trainee.birthDate) : null,
      heightCm: trainee.heightCm || null,
      weightKg: trainee.weightKg || null,
      activityLevel: trainee.activityLevel || 'Moderate',
      fitnessGoal: trainee.fitnessGoal || '',
      medicalHistory: trainee.medicalHistory || ''
    });
    this.showAddDialog = true;
  }

  closeDialog(): void {
    this.showAddDialog = false;
    this.editingTrainee = null;
    this.traineeForm.reset();
  }

  toggleTraineeStatus(trainee: Trainee): void {
    const traineeId = trainee.id || trainee.clientId || '';
    if (!traineeId) return;
    const newStatus = !trainee.isActive;

    this.coachService.updateTrainee(traineeId, { isActive: newStatus }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'تم بنجاح',
          detail: newStatus ? 'تم تفعيل المتدرب' : 'تم تعطيل المتدرب'
        });
        this.loadTrainees();
      },
      error: (err: any) => {
        console.error('Error toggling trainee status:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'حدث خطأ أثناء تحديث حالة المتدرب'
        });
      }
    });
  }

  saveTrainee(): void {
    if (this.traineeForm.invalid) {
      this.traineeForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.traineeForm.value;

    if (this.editingTrainee) {
      // For editing, API only allows updating isActive or transferring to another coach
      // We can only toggle status here
      const traineeId = this.editingTrainee.id || this.editingTrainee.clientId || '';
      if (!traineeId) {
        this.saving.set(false);
        return;
      }
      this.coachService.updateTrainee(traineeId, { isActive: true }).subscribe({
        next: () => {
          this.saving.set(false);
          this.showAddDialog = false;
          this.editingTrainee = null;
          this.traineeForm.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم تحديث بيانات المتدرب بنجاح'
          });
          this.loadTrainees();
        },
        error: (err: any) => {
          this.saving.set(false);
          console.error('Error updating trainee:', err);
          const errorMessage = err?.translatedMessage || err?.error?.message || err?.message || 'حدث خطأ أثناء تعديل المتدرب';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    } else {
      // Create new trainee - field names must match backend AddTraineeCommand
      const traineeData = {
        clientPhone: formValue.phoneNumber,
        clientName: formValue.fullName || '',
        clientEmail: formValue.email || undefined,
        gender: formValue.gender,
        birthDate: formValue.birthDate ? this.formatDateForApi(formValue.birthDate) : undefined,
        heightCm: formValue.heightCm || undefined,
        activityLevel: formValue.activityLevel || undefined,
        medicalHistory: formValue.medicalHistory || undefined
      };

      console.log('Creating trainee with data:', JSON.stringify(traineeData, null, 2));

      this.coachService.createTrainee(traineeData).subscribe({
        next: (clientId: string) => {
          this.saving.set(false);
          this.showAddDialog = false;
          this.traineeForm.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم إضافة المتدرب بنجاح'
          });
          this.loadTrainees();
        },
        error: (err: any) => {
          this.saving.set(false);
          console.error('Error creating trainee:', err);
          console.error('Error details:', JSON.stringify(err?.error, null, 2));
          console.error('Error status:', err?.status);
          const errorMessage = err?.translatedMessage || err?.error?.message || err?.error?.title || err?.message || 'حدث خطأ أثناء إضافة المتدرب';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    }
  }

  confirmDelete(trainee: Trainee): void {
    const traineeName = trainee.clientName || trainee.fullName || 'هذا المتدرب';
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف "${traineeName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، حذف',
      rejectLabel: 'إلغاء',
      accept: () => {
        this.deleteTrainee(trainee);
      }
    });
  }

  deleteTrainee(trainee: Trainee): void {
    // Use clientId for DELETE as per API documentation
    const traineeId = trainee.clientId || trainee.id;
    this.coachService.deleteTrainee(traineeId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'تم بنجاح',
          detail: 'تم إلغاء ربط المتدرب بنجاح'
        });
        this.loadTrainees();
      },
      error: (err: any) => {
        console.error('Error deleting trainee:', err);
        const errorMessage = err?.translatedMessage || err?.error?.message || err?.message || 'حدث خطأ أثناء حذف المتدرب';
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: errorMessage
        });
      }
    });
  }

  formatDateForApi(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
