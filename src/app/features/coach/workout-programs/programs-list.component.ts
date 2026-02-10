import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, WorkoutProgram } from '../services/coach.service';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-programs-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    TableModule,
    TooltipModule,
    DialogModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="programs-page">
      <app-page-header
        title="برامج التمرين"
        subtitle="إنشاء وإدارة برامج التمرين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'برامج التمرين'}]"
      >
        <a routerLink="/coach/workout-programs/create" class="btn btn-primary">
          <i class="pi pi-plus"></i>
          <span>برنامج جديد</span>
        </a>
      </app-page-header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card purple">
          <div class="stat-icon"><i class="pi pi-list"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ programs().length }}</span>
            <span class="stat-label">إجمالي البرامج</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ activePrograms() }}</span>
            <span class="stat-label">برامج نشطة</span>
          </div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ totalAssignedTrainees() }}</span>
            <span class="stat-label">متدرب مسجل</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <app-loading-skeleton type="stats"></app-loading-skeleton>
      } @else {
        <!-- Professional Table -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              <i class="pi pi-list"></i>
              <span>قائمة البرامج</span>
            </div>
            <div class="table-filters">
              <span class="p-input-icon-right search-box">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="searchTerm"
                  placeholder="البحث..."
                  (input)="filterPrograms()"
                />
              </span>
              <p-dropdown
                [options]="difficultyOptions"
                [(ngModel)]="selectedDifficulty"
                placeholder="المستوى"
                (onChange)="filterPrograms()"
                [showClear]="true"
                styleClass="filter-dropdown"
              ></p-dropdown>
            </div>
          </div>

          <p-table
            [value]="filteredPrograms()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 20]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} برنامج"
            [globalFilterFields]="['name', 'description', 'goal']"
            styleClass="custom-table"
            [tableStyle]="{'min-width': '60rem'}"
            responsiveLayout="scroll"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="name" style="width: 25%">
                  البرنامج
                  <p-sortIcon field="name"></p-sortIcon>
                </th>
                <th pSortableColumn="difficulty" style="width: 12%">
                  المستوى
                  <p-sortIcon field="difficulty"></p-sortIcon>
                </th>
                <th pSortableColumn="durationWeeks" style="width: 12%">
                  المدة
                  <p-sortIcon field="durationWeeks"></p-sortIcon>
                </th>
                <th pSortableColumn="daysPerWeek" style="width: 12%">
                  أيام/أسبوع
                  <p-sortIcon field="daysPerWeek"></p-sortIcon>
                </th>
                <th pSortableColumn="goal" style="width: 15%">
                  الهدف
                  <p-sortIcon field="goal"></p-sortIcon>
                </th>
                <th pSortableColumn="assignedTraineesCount" style="width: 12%">
                  المتدربين
                  <p-sortIcon field="assignedTraineesCount"></p-sortIcon>
                </th>
                <th style="width: 12%">الإجراءات</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-program>
              <tr [class.inactive-row]="!program.isActive">
                <td>
                  <div class="program-cell">
                    <div class="program-icon">
                      <i class="pi pi-list"></i>
                    </div>
                    <div class="program-info">
                      <span class="program-name">{{ program.name }}</span>
                      <span class="program-desc" *ngIf="program.description">{{ program.description | slice:0:50 }}{{ program.description.length > 50 ? '...' : '' }}</span>
                    </div>
                    <span class="status-indicator" [class.active]="program.isActive" [pTooltip]="program.isActive ? 'نشط' : 'غير نشط'"></span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="getDifficultyLabel(program.difficulty)"
                    [severity]="getDifficultySeverity(program.difficulty)"
                    [rounded]="true"
                  ></p-tag>
                </td>
                <td>
                  <div class="meta-cell">
                    <i class="pi pi-calendar"></i>
                    <span>{{ program.durationWeeks ?? calculateDurationWeeks(program) }} أسبوع</span>
                  </div>
                </td>
                <td>
                  <div class="meta-cell">
                    <i class="pi pi-clock"></i>
                    <span>{{ program.daysPerWeek ?? program.routines?.length ?? 0 }} أيام</span>
                  </div>
                </td>
                <td>
                  <span class="goal-badge">{{ program.goal || 'غير محدد' }}</span>
                </td>
                <td>
                  <div class="trainees-cell">
                    <i class="pi pi-users"></i>
                    <span>{{ program.assignedTraineesCount ?? 0 }}</span>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn print" (click)="printProgram(program)" pTooltip="طباعة">
                      <i class="pi pi-print"></i>
                    </button>
                    <a [routerLink]="['/coach/workout-programs', program.id, 'edit']" class="action-btn edit" pTooltip="تعديل">
                      <i class="pi pi-pencil"></i>
                    </a>
                    <button class="action-btn copy" (click)="duplicateProgram(program)" pTooltip="نسخ">
                      <i class="pi pi-copy"></i>
                    </button>
                    <button class="action-btn toggle" (click)="toggleProgram(program)" [pTooltip]="program.isActive ? 'إخفاء' : 'تفعيل'">
                      <i [class]="program.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    </button>
                    <button class="action-btn delete" (click)="deleteProgram(program)" pTooltip="حذف">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7">
                  <div class="empty-table">
                    <i class="pi pi-list"></i>
                    <h3>لا توجد برامج تمرين</h3>
                    <p>ابدأ بإنشاء برنامج تمرين جديد</p>
                    <a routerLink="/coach/workout-programs/create" class="btn btn-primary">
                      <i class="pi pi-plus"></i>
                      إنشاء برنامج
                    </a>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>

    <!-- Print Dialog -->
    <p-dialog
      [(visible)]="showPrintDialog"
      [modal]="true"
      [style]="{width: '90vw', maxWidth: '900px'}"
      [draggable]="false"
      [resizable]="false"
      styleClass="print-dialog"
    >
      <ng-template pTemplate="header">
        <div class="print-dialog-header">
          <i class="pi pi-print"></i>
          <span>معاينة الطباعة - {{ printingProgram?.name }}</span>
        </div>
      </ng-template>

      <div class="print-content" id="printArea">
        @if (printingProgram) {
          <!-- Header -->
          <div class="print-header">
            <div class="print-logo">
              <i class="pi pi-bolt"></i>
              <span>LogicFit</span>
            </div>
            <div class="print-title">
              <h1>برنامج التمرين</h1>
              <h2>{{ printingProgram.name }}</h2>
            </div>
            <div class="print-date">
              <span>تاريخ الطباعة: {{ today | date:'yyyy/MM/dd' }}</span>
            </div>
          </div>

          <!-- Coach & Trainee Info -->
          <div class="print-info-section">
            <div class="info-card coach">
              <div class="info-header">
                <i class="pi pi-user"></i>
                <span>بيانات المدرب</span>
              </div>
              <div class="info-body">
                <div class="info-row">
                  <span class="info-label">الاسم:</span>
                  <span class="info-value">{{ printingProgram.coachName || coachName || 'غير محدد' }}</span>
                </div>
                @if (authService.user()?.phoneNumber) {
                  <div class="info-row">
                    <span class="info-label">الهاتف:</span>
                    <span class="info-value">{{ authService.user()?.phoneNumber }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="info-card trainee">
              <div class="info-header">
                <i class="pi pi-users"></i>
                <span>بيانات المتدرب</span>
              </div>
              <div class="info-body">
                <div class="info-row">
                  <span class="info-label">الاسم:</span>
                  <span class="info-value">{{ printingProgram.clientName || 'غير محدد' }}</span>
                </div>
                @if (printingProgram.clientPhone) {
                  <div class="info-row">
                    <span class="info-label">الهاتف:</span>
                    <span class="info-value">{{ printingProgram.clientPhone }}</span>
                  </div>
                }
                @if (printingProgram.clientEmail) {
                  <div class="info-row">
                    <span class="info-label">البريد:</span>
                    <span class="info-value">{{ printingProgram.clientEmail }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Program Details -->
          <div class="print-program-details">
            <div class="detail-item">
              <i class="pi pi-calendar"></i>
              <span>المدة: {{ printingProgram.durationWeeks ?? calculateDurationWeeks(printingProgram) }} أسبوع</span>
            </div>
            <div class="detail-item">
              <i class="pi pi-clock"></i>
              <span>الأيام: {{ printingProgram.daysPerWeek ?? printingProgram.routines?.length ?? 0 }} أيام/أسبوع</span>
            </div>
            <div class="detail-item">
              <i class="pi pi-flag"></i>
              <span>الهدف: {{ printingProgram.goal || 'غير محدد' }}</span>
            </div>
            <div class="detail-item">
              <i class="pi pi-chart-line"></i>
              <span>المستوى: {{ getDifficultyLabel(printingProgram.difficulty || '') }}</span>
            </div>
          </div>

          @if (printingProgram.description) {
            <div class="print-description">
              <strong>الوصف:</strong> {{ printingProgram.description }}
            </div>
          }

          <!-- Routines/Days -->
          @if (printingProgram.routines?.length) {
            <div class="print-routines">
              <h3>تفاصيل التمارين</h3>
              @for (routine of printingProgram.routines; track routine.id; let i = $index) {
                <div class="routine-card">
                  <div class="routine-header">
                    <span class="routine-number">{{ i + 1 }}</span>
                    <span class="routine-name">{{ routine.name || getDayName(routine.dayOfWeek) }}</span>
                    <span class="routine-day">{{ getDayName(routine.dayOfWeek) }}</span>
                  </div>
                  @if (routine.exercises?.length) {
                    <table class="exercises-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>التمرين</th>
                          <th>المجموعات</th>
                          <th>التكرارات</th>
                          <th>الراحة</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (exercise of routine.exercises; track exercise.id; let j = $index) {
                          <tr>
                            <td>{{ j + 1 }}</td>
                            <td>{{ exercise.exerciseName || 'تمرين ' + (j + 1) }}</td>
                            <td>{{ exercise.sets }}</td>
                            <td>{{ exercise.repsMin }}-{{ exercise.repsMax }}</td>
                            <td>{{ exercise.restSec }}ث</td>
                            <td>{{ exercise.notes || '-' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  } @else {
                    <p class="no-exercises">لا توجد تمارين</p>
                  }
                </div>
              }
            </div>
          }

          <!-- Footer -->
          <div class="print-footer">
            <p>تم إنشاء هذا البرنامج بواسطة LogicFit</p>
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <button class="btn btn-secondary" (click)="showPrintDialog = false">إغلاق</button>
        <button class="btn btn-primary" (click)="executePrint()">
          <i class="pi pi-print"></i>
          طباعة
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .programs-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      &.purple .stat-icon {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      &.green .stat-icon {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      &.blue .stat-icon {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    /* Table Container */
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 16px;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #8b5cf6;
        font-size: 1.2rem;
      }
    }

    .table-filters {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-box {
      input {
        padding: 10px 36px 10px 14px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-primary);
        width: 220px;
        font-size: 0.9rem;

        &:focus {
          border-color: #8b5cf6;
          outline: none;
        }
      }

      i {
        right: 12px;
        color: var(--text-muted);
      }
    }

    :host ::ng-deep .filter-dropdown {
      .p-dropdown {
        border-radius: 10px;
        min-width: 140px;
      }
    }

    /* Custom Table Styles */
    :host ::ng-deep .custom-table {
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
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-color);
        border-top: none;
        white-space: nowrap;
      }

      .p-datatable-tbody > tr {
        background: var(--bg-card);
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }

        &.inactive-row {
          opacity: 0.6;
        }

        > td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
      }

      .p-paginator {
        background: var(--bg-card);
        border: none;
        border-top: 1px solid var(--border-color);
        padding: 16px;
      }

      .p-sortable-column-icon {
        color: var(--text-muted);
        font-size: 0.75rem;
      }
    }

    /* Program Cell */
    .program-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .program-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        color: white;
        font-size: 1.1rem;
      }
    }

    .program-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .program-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .program-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #dc2626;
      flex-shrink: 0;

      &.active {
        background: #22c55e;
      }
    }

    /* Meta Cell */
    .meta-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    /* Goal Badge */
    .goal-badge {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Trainees Cell */
    .trainees-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 8px;
      color: #3b82f6;
      font-weight: 600;
      width: fit-content;

      i {
        font-size: 0.9rem;
      }
    }

    /* Actions Cell */
    .actions-cell {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-secondary);
      text-decoration: none;

      &:hover {
        transform: scale(1.1);
      }

      &.edit:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &.copy:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.toggle:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
        color: #f59e0b;
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }

      &.print:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
        color: #6366f1;
      }
    }

    /* Print Dialog Styles */
    .print-dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #8b5cf6;
      }
    }

    .print-content {
      direction: rtl;
      padding: 20px;
      background: white;
      color: #1a1a2e;
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #8b5cf6;
      margin-bottom: 20px;
    }

    .print-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #8b5cf6;

      i {
        font-size: 2rem;
      }
    }

    .print-title {
      text-align: center;

      h1 {
        font-size: 1.25rem;
        color: #666;
        margin: 0;
        font-weight: 500;
      }

      h2 {
        font-size: 1.5rem;
        color: #1a1a2e;
        margin: 5px 0 0;
      }
    }

    .print-date {
      font-size: 0.85rem;
      color: #666;
    }

    .print-info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-card {
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      overflow: hidden;

      .info-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 15px;
        font-weight: 600;
        color: white;

        i {
          font-size: 1rem;
        }
      }

      &.coach .info-header {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }

      &.trainee .info-header {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      .info-body {
        padding: 15px;
      }

      .info-row {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .info-label {
        font-weight: 600;
        color: #666;
        min-width: 60px;
      }

      .info-value {
        color: #1a1a2e;
      }
    }

    .print-program-details {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      margin-bottom: 20px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 15px;
        background: white;
        border-radius: 8px;
        font-size: 0.9rem;

        i {
          color: #8b5cf6;
        }
      }
    }

    .print-description {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .print-routines {
      h3 {
        font-size: 1.1rem;
        color: #1a1a2e;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e0e0e0;
      }
    }

    .routine-card {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }

    .routine-header {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 15px;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;

      .routine-number {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .routine-name {
        flex: 1;
        font-weight: 600;
      }

      .routine-day {
        font-size: 0.85rem;
        opacity: 0.9;
      }
    }

    .exercises-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 10px 12px;
        text-align: right;
        border-bottom: 1px solid #e0e0e0;
      }

      th {
        background: #f8f9fa;
        font-weight: 600;
        color: #666;
        font-size: 0.85rem;
      }

      td {
        font-size: 0.9rem;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background: #f8f9fa;
      }
    }

    .no-exercises {
      padding: 20px;
      text-align: center;
      color: #666;
    }

    .print-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.85rem;
    }

    /* Empty Table */
    .empty-table {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 16px;
        opacity: 0.3;
        color: #8b5cf6;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      p {
        margin-bottom: 20px;
      }
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
      font-size: 0.9rem;

      &.btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        align-items: stretch;
      }

      .table-filters {
        flex-direction: column;

        .search-box input {
          width: 100%;
        }
      }
    }
  `]
})
export class ProgramsListComponent implements OnInit {
  private coachService = inject(CoachService);
  authService = inject(AuthService);

  loading = signal(true);
  programs = signal<WorkoutProgram[]>([]);
  filteredPrograms = signal<WorkoutProgram[]>([]);

  searchTerm = '';
  selectedDifficulty: string | null = null;

  difficultyOptions = [
    { label: 'مبتدئ', value: 'beginner' },
    { label: 'متوسط', value: 'intermediate' },
    { label: 'متقدم', value: 'advanced' }
  ];

  // Print-related properties
  showPrintDialog = false;
  printingProgram: WorkoutProgram | null = null;
  today = new Date();
  coachName = '';

  dayNames: Record<number, string> = {
    0: 'الأحد',
    1: 'الاثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت'
  };

  activePrograms(): number {
    return this.programs().filter(p => p.isActive !== false).length;
  }

  totalAssignedTrainees(): number {
    return this.programs().reduce((sum, p) => sum + (p.assignedTraineesCount ?? 0), 0);
  }

  // Calculate duration from startDate and endDate if durationWeeks is not provided
  calculateDurationWeeks(program: WorkoutProgram): number {
    if (program.startDate && program.endDate) {
      const start = new Date(program.startDate);
      const end = new Date(program.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.ceil(diffDays / 7);
    }
    return 0;
  }

  ngOnInit(): void {
    this.loadPrograms();
    this.loadCoachProfile();
  }

  loadCoachProfile(): void {
    this.coachService.getProfile().subscribe({
      next: (profile) => {
        this.coachName = profile.profile?.fullName || '';
      },
      error: () => {
        // Fallback
        this.coachName = '';
      }
    });
  }

  loadPrograms(): void {
    this.loading.set(true);

    this.coachService.getWorkoutPrograms().subscribe({
      next: (data) => {
        this.programs.set(data);
        this.filteredPrograms.set(data);
        this.loading.set(false);
      },
      error: () => {
        const mockData: WorkoutProgram[] = [
          {
            id: '1',
            name: 'برنامج بناء العضلات - مبتدئ',
            description: 'برنامج مصمم للمبتدئين لبناء أساس قوي من القوة والعضلات',
            durationWeeks: 8,
            daysPerWeek: 3,
            difficulty: 'beginner',
            goal: 'بناء العضلات',
            isActive: true,
            assignedTraineesCount: 12,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'برنامج القوة المتوسط',
            description: 'برنامج لزيادة القوة والتحمل للمستوى المتوسط',
            durationWeeks: 12,
            daysPerWeek: 4,
            difficulty: 'intermediate',
            goal: 'زيادة القوة',
            isActive: true,
            assignedTraineesCount: 8,
            createdAt: '2024-01-05',
            updatedAt: '2024-01-14'
          },
          {
            id: '3',
            name: 'برنامج التنشيف المتقدم',
            description: 'برنامج مكثف لحرق الدهون والحفاظ على الكتلة العضلية',
            durationWeeks: 10,
            daysPerWeek: 5,
            difficulty: 'advanced',
            goal: 'حرق الدهون',
            isActive: true,
            assignedTraineesCount: 5,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-15'
          },
          {
            id: '4',
            name: 'برنامج اللياقة العامة',
            description: 'برنامج متوازن لتحسين اللياقة البدنية العامة',
            durationWeeks: 6,
            daysPerWeek: 3,
            difficulty: 'beginner',
            goal: 'لياقة عامة',
            isActive: false,
            assignedTraineesCount: 0,
            createdAt: '2023-12-01',
            updatedAt: '2023-12-20'
          }
        ];
        this.programs.set(mockData);
        this.filteredPrograms.set(mockData);
        this.loading.set(false);
      }
    });
  }

  filterPrograms(): void {
    let result = this.programs();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term))
      );
    }

    if (this.selectedDifficulty) {
      result = result.filter(p => p.difficulty === this.selectedDifficulty);
    }

    this.filteredPrograms.set(result);
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم'
    };
    return labels[difficulty] || difficulty;
  }

  getDifficultySeverity(difficulty: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return severities[difficulty] || 'info';
  }

  duplicateProgram(program: WorkoutProgram): void {
    if (confirm(`هل تريد نسخ برنامج "${program.name}"؟`)) {
      this.coachService.duplicateWorkoutProgram(program.id, { newName: `نسخة من ${program.name}` }).subscribe({
        next: () => {
          this.loadPrograms();
        },
        error: (err) => {
          console.error('Error duplicating program:', err);
          alert('فشل في نسخ البرنامج');
        }
      });
    }
  }

  toggleProgram(program: WorkoutProgram): void {
    const newActiveState = !program.isActive;
    this.coachService.updateWorkoutProgram(program.id, { isActive: newActiveState }).subscribe({
      next: () => {
        // Update local state
        const updatedPrograms = this.programs().map(p =>
          p.id === program.id ? { ...p, isActive: newActiveState } : p
        );
        this.programs.set(updatedPrograms);
        this.filterPrograms();
      },
      error: (err) => {
        console.error('Error toggling program:', err);
        alert('فشل في تحديث حالة البرنامج');
      }
    });
  }

  deleteProgram(program: WorkoutProgram): void {
    if (confirm(`هل أنت متأكد من حذف برنامج "${program.name}"؟`)) {
      this.coachService.deleteWorkoutProgram(program.id).subscribe({
        next: () => {
          // Remove from local state
          const updatedPrograms = this.programs().filter(p => p.id !== program.id);
          this.programs.set(updatedPrograms);
          this.filterPrograms();
        },
        error: (err) => {
          console.error('Error deleting program:', err);
          alert('فشل في حذف البرنامج');
        }
      });
    }
  }

  // Print methods
  printProgram(program: WorkoutProgram): void {
    // Fetch full program details
    this.coachService.getWorkoutProgramById(program.id).subscribe({
      next: (fullProgram) => {
        this.printingProgram = fullProgram;
        this.showPrintDialog = true;
      },
      error: () => {
        // Use the program from list if API fails
        this.printingProgram = program;
        this.showPrintDialog = true;
      }
    });
  }

  getDayName(dayOfWeek: number): string {
    return this.dayNames[dayOfWeek] || `يوم ${dayOfWeek}`;
  }

  executePrint(): void {
    const printContent = document.getElementById('printArea');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة برنامج التمرين - ${this.printingProgram?.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            color: #1a1a2e;
            background: white;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #8b5cf6;
            margin-bottom: 25px;
          }
          .print-logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #8b5cf6;
          }
          .print-title {
            text-align: center;
          }
          .print-title h1 {
            font-size: 1.2rem;
            color: #666;
            font-weight: 500;
          }
          .print-title h2 {
            font-size: 1.6rem;
            color: #1a1a2e;
            margin-top: 5px;
          }
          .print-date {
            font-size: 0.85rem;
            color: #666;
          }
          .print-info-section {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
          }
          .info-card {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
          }
          .info-header {
            padding: 10px 15px;
            font-weight: 600;
            color: white;
          }
          .info-card.coach .info-header {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          }
          .info-card.trainee .info-header {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
          }
          .info-body {
            padding: 15px;
          }
          .info-row {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #666;
          }
          .print-program-details {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 25px;
          }
          .detail-item {
            padding: 8px 15px;
            background: white;
            border-radius: 8px;
            font-size: 0.9rem;
          }
          .print-description {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 25px;
            line-height: 1.6;
          }
          .print-routines h3 {
            font-size: 1.1rem;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
          }
          .routine-card {
            margin-bottom: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .routine-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px 15px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
          }
          .routine-number {
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }
          .routine-name {
            flex: 1;
            font-weight: 600;
          }
          .routine-day {
            font-size: 0.85rem;
            opacity: 0.9;
          }
          .exercises-table {
            width: 100%;
            border-collapse: collapse;
          }
          .exercises-table th, .exercises-table td {
            padding: 10px 12px;
            text-align: right;
            border-bottom: 1px solid #e0e0e0;
          }
          .exercises-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
            font-size: 0.85rem;
          }
          .exercises-table td {
            font-size: 0.9rem;
          }
          .exercises-table tr:last-child td {
            border-bottom: none;
          }
          .no-exercises {
            padding: 20px;
            text-align: center;
            color: #666;
          }
          .print-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 0.85rem;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .routine-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
