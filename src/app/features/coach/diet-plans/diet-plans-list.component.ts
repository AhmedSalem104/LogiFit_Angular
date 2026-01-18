import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, DietPlan } from '../services/coach.service';

@Component({
  selector: 'app-diet-plans-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    TagModule,
    TableModule,
    TooltipModule,
    DropdownModule,
    DialogModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="diet-plans-page">
      <app-page-header
        title="خطط التغذية"
        subtitle="إنشاء وإدارة خطط التغذية"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'خطط التغذية'}]"
      >
        <a routerLink="/coach/diet-plans/create" class="btn btn-primary">
          <i class="pi pi-plus"></i>
          <span>خطة جديدة</span>
        </a>
      </app-page-header>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card total">
          <div class="stat-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ plans().length }}</span>
            <span class="stat-label">إجمالي الخطط</span>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activePlans() }}</span>
            <span class="stat-label">خطط نشطة</span>
          </div>
        </div>
        <div class="stat-card trainees">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalAssignedTrainees() }}</span>
            <span class="stat-label">متدرب مسجل</span>
          </div>
        </div>
        <div class="stat-card calories">
          <div class="stat-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ avgCalories() | number:'1.0-0' }}</span>
            <span class="stat-label">متوسط السعرات</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading()">
        <!-- Table Header -->
        <div class="table-header">
          <div class="table-title">
            <i class="pi pi-list"></i>
            <span>قائمة خطط التغذية</span>
            <span class="count-badge">{{ filteredPlans().length }}</span>
          </div>
          <div class="table-actions">
            <span class="p-input-icon-right search-box">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchTerm"
                placeholder="بحث..."
                (input)="filterPlans()"
              />
            </span>
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="statusFilter"
              placeholder="الحالة"
              (onChange)="filterPlans()"
              [style]="{'min-width': '140px'}"
            ></p-dropdown>
          </div>
        </div>

        <!-- PrimeNG Table -->
        <p-table
          [value]="filteredPlans()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} خطة"
          [sortField]="'name'"
          [sortOrder]="1"
          styleClass="p-datatable-striped p-datatable-gridlines"
          [tableStyle]="{'min-width': '70rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name" style="width: 25%">
                اسم الخطة
                <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="totalCalories" style="width: 12%">
                السعرات
                <p-sortIcon field="totalCalories"></p-sortIcon>
              </th>
              <th style="width: 20%">الماكروز</th>
              <th pSortableColumn="mealsPerDay" style="width: 10%">
                الوجبات
                <p-sortIcon field="mealsPerDay"></p-sortIcon>
              </th>
              <th pSortableColumn="isActive" style="width: 10%">
                الحالة
                <p-sortIcon field="isActive"></p-sortIcon>
              </th>
              <th pSortableColumn="assignedTraineesCount" style="width: 10%">
                المتدربين
                <p-sortIcon field="assignedTraineesCount"></p-sortIcon>
              </th>
              <th style="width: 13%">الإجراءات</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-plan>
            <tr [class.inactive-row]="!plan.isActive">
              <!-- Plan Name -->
              <td>
                <div class="plan-cell">
                  <div class="plan-icon-mini">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="plan-details">
                    <span class="plan-name">{{ plan.name }}</span>
                    <span class="plan-description" *ngIf="plan.description">{{ plan.description | slice:0:50 }}{{ plan.description.length > 50 ? '...' : '' }}</span>
                  </div>
                </div>
              </td>

              <!-- Calories -->
              <td>
                <div class="calories-cell">
                  <span class="calories-value">{{ (plan.totalCalories ?? plan.targetCalories ?? 0) | number }}</span>
                  <span class="calories-unit">سعرة</span>
                </div>
              </td>

              <!-- Macros -->
              <td>
                <div class="macros-cell">
                  <div class="macro-badge protein" pTooltip="بروتين" tooltipPosition="top">
                    <i class="pi pi-star-fill"></i>
                    <span>{{ plan.proteinGrams ?? plan.targetProtein ?? 0 }}g</span>
                  </div>
                  <div class="macro-badge carbs" pTooltip="كربوهيدرات" tooltipPosition="top">
                    <i class="pi pi-circle-fill"></i>
                    <span>{{ plan.carbsGrams ?? plan.targetCarbs ?? 0 }}g</span>
                  </div>
                  <div class="macro-badge fat" pTooltip="دهون" tooltipPosition="top">
                    <i class="pi pi-moon"></i>
                    <span>{{ plan.fatGrams ?? plan.targetFats ?? 0 }}g</span>
                  </div>
                </div>
              </td>

              <!-- Meals per day -->
              <td>
                <div class="meals-cell">
                  <i class="pi pi-clock"></i>
                  <span>{{ plan.mealsPerDay ?? plan.meals?.length ?? 0 }} وجبات</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <p-tag
                  [value]="plan.isActive ? 'نشط' : 'غير نشط'"
                  [severity]="plan.isActive ? 'success' : 'danger'"
                  [rounded]="true"
                ></p-tag>
              </td>

              <!-- Trainees -->
              <td>
                <div class="trainees-cell">
                  <i class="pi pi-users"></i>
                  <span>{{ plan.assignedTraineesCount ?? 0 }}</span>
                </div>
              </td>

              <!-- Actions -->
              <td>
                <div class="actions-cell">
                  <button
                    class="action-icon print"
                    (click)="printPlan(plan)"
                    pTooltip="طباعة"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-print"></i>
                  </button>
                  <a
                    [routerLink]="['/coach/diet-plans', plan.id, 'edit']"
                    class="action-icon edit"
                    pTooltip="تعديل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-pencil"></i>
                  </a>
                  <button
                    class="action-icon copy"
                    (click)="duplicatePlan(plan)"
                    pTooltip="نسخ"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-copy"></i>
                  </button>
                  <button
                    class="action-icon toggle"
                    (click)="togglePlan(plan)"
                    [pTooltip]="plan.isActive ? 'إيقاف' : 'تفعيل'"
                    tooltipPosition="top"
                  >
                    <i [class]="plan.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                  <button
                    class="action-icon delete"
                    (click)="deletePlan(plan)"
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
              <td colspan="7">
                <div class="empty-state">
                  <i class="pi pi-calendar"></i>
                  <h3>لا توجد خطط تغذية</h3>
                  <p>ابدأ بإنشاء خطة تغذية جديدة</p>
                  <a routerLink="/coach/diet-plans/create" class="btn btn-primary">
                    <i class="pi pi-plus"></i>
                    إنشاء خطة
                  </a>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
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
          <span>معاينة الطباعة - {{ printingPlan?.name }}</span>
        </div>
      </ng-template>

      <div class="print-content" id="printAreaDiet">
        @if (printingPlan) {
          <!-- Header -->
          <div class="print-header">
            <div class="print-logo">
              <i class="pi pi-bolt"></i>
              <span>LogicFit</span>
            </div>
            <div class="print-title">
              <h1>خطة التغذية</h1>
              <h2>{{ printingPlan.name }}</h2>
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
                  <span class="info-value">{{ printingPlan.coachName || coachName || 'غير محدد' }}</span>
                </div>
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
                  <span class="info-value">{{ printingPlan.clientName || 'غير محدد' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nutrition Targets -->
          <div class="print-nutrition-targets">
            <div class="target-item calories">
              <i class="pi pi-bolt"></i>
              <span class="target-value">{{ printingPlan.totalCalories ?? printingPlan.targetCalories ?? 0 }}</span>
              <span class="target-label">سعرة</span>
            </div>
            <div class="target-item protein">
              <i class="pi pi-star-fill"></i>
              <span class="target-value">{{ printingPlan.proteinGrams ?? printingPlan.targetProtein ?? 0 }}g</span>
              <span class="target-label">بروتين</span>
            </div>
            <div class="target-item carbs">
              <i class="pi pi-circle-fill"></i>
              <span class="target-value">{{ printingPlan.carbsGrams ?? printingPlan.targetCarbs ?? 0 }}g</span>
              <span class="target-label">كربوهيدرات</span>
            </div>
            <div class="target-item fats">
              <i class="pi pi-moon"></i>
              <span class="target-value">{{ printingPlan.fatGrams ?? printingPlan.targetFats ?? 0 }}g</span>
              <span class="target-label">دهون</span>
            </div>
          </div>

          @if (printingPlan.description) {
            <div class="print-description">
              <strong>الوصف:</strong> {{ printingPlan.description }}
            </div>
          }

          <!-- Meals -->
          @if (printingPlan.meals?.length) {
            <div class="print-meals">
              <h3>تفاصيل الوجبات</h3>
              @for (meal of printingPlan.meals; track meal.id; let i = $index) {
                <div class="meal-card">
                  <div class="meal-header">
                    <span class="meal-number">{{ i + 1 }}</span>
                    <span class="meal-name">{{ meal.name || meal.mealName || 'وجبة ' + (i + 1) }}</span>
                    @if (meal.time) {
                      <span class="meal-time">{{ meal.time }}</span>
                    }
                  </div>
                  @if (meal.items?.length) {
                    <table class="meals-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>الطعام</th>
                          <th>الكمية</th>
                          <th>السعرات</th>
                          <th>بروتين</th>
                          <th>كربوهيدرات</th>
                          <th>دهون</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of meal.items; track item.id; let j = $index) {
                          <tr>
                            <td>{{ j + 1 }}</td>
                            <td>{{ item.foodName || 'طعام ' + (j + 1) }}</td>
                            <td>{{ item.assignedQuantity }}{{ item.unit || 'g' }}</td>
                            <td>{{ item.calcCalories ?? item.calories ?? 0 }}</td>
                            <td>{{ item.calcProtein ?? item.protein ?? 0 }}g</td>
                            <td>{{ item.calcCarbs ?? item.carbs ?? 0 }}g</td>
                            <td>{{ item.calcFats ?? item.fats ?? 0 }}g</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  } @else {
                    <p class="no-items">لا توجد عناصر في هذه الوجبة</p>
                  }
                </div>
              }
            </div>
          }

          <!-- Footer -->
          <div class="print-footer">
            <p>تم إنشاء هذه الخطة بواسطة LogicFit</p>
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
    .diet-plans-page {
      max-width: 1600px;
    }

    /* Stats Row */
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

    .stat-card.total .stat-icon {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
      color: #6366f1;
    }

    .stat-card.active .stat-icon {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15));
      color: #22c55e;
    }

    .stat-card.trainees .stat-icon {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
      color: #3b82f6;
    }

    .stat-card.calories .stat-icon {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      color: #f59e0b;
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

    /* Table Container */
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
        color: #22c55e;
        font-size: 1.25rem;
      }

      .count-badge {
        background: linear-gradient(135deg, #22c55e, #16a34a);
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
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
        }
      }
    }

    /* Table Cells */
    .plan-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .plan-icon-mini {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        color: white;
        font-size: 1rem;
      }
    }

    .plan-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .plan-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .plan-description {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .calories-cell {
      display: flex;
      flex-direction: column;
      align-items: center;

      .calories-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #f59e0b;
      }

      .calories-unit {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .macros-cell {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .macro-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;

      i {
        font-size: 0.65rem;
      }

      &.protein {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      &.carbs {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.fat {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
    }

    .meals-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: #8b5cf6;
      }
    }

    .trainees-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #3b82f6;
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

      &.edit:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
        color: #6366f1;
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
        color: #22c55e;
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
      border-bottom: 2px solid #22c55e;
      margin-bottom: 20px;
    }

    .print-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #22c55e;

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
        background: linear-gradient(135deg, #22c55e, #16a34a);
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

    .print-nutrition-targets {
      display: flex;
      justify-content: space-around;
      gap: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      margin-bottom: 20px;

      .target-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 15px 25px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);

        i {
          font-size: 1.25rem;
        }

        .target-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .target-label {
          font-size: 0.8rem;
          color: #666;
        }

        &.calories {
          i, .target-value { color: #f59e0b; }
        }

        &.protein {
          i, .target-value { color: #ef4444; }
        }

        &.carbs {
          i, .target-value { color: #3b82f6; }
        }

        &.fats {
          i, .target-value { color: #22c55e; }
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

    .print-meals {
      h3 {
        font-size: 1.1rem;
        color: #1a1a2e;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e0e0e0;
      }
    }

    .meal-card {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }

    .meal-header {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 15px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;

      .meal-number {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .meal-name {
        flex: 1;
        font-weight: 600;
      }

      .meal-time {
        font-size: 0.85rem;
        opacity: 0.9;
      }
    }

    .meals-table {
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

    .no-items {
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
        color: #22c55e;
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
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;

        &:hover {
          background: linear-gradient(135deg, #16a34a, #15803d);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
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
          border-color: #22c55e;
        }

        &:not(.p-disabled).p-focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
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
        color: #22c55e;
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
  `]
})
export class DietPlansListComponent implements OnInit {
  private coachService = inject(CoachService);

  loading = signal(true);
  plans = signal<DietPlan[]>([]);
  filteredPlans = signal<DietPlan[]>([]);

  searchTerm = '';

  // Print-related properties
  showPrintDialog = false;
  printingPlan: DietPlan | null = null;
  today = new Date();
  coachName = '';
  statusFilter: string | null = null;

  statusOptions = [
    { label: 'الكل', value: null },
    { label: 'نشط', value: 'active' },
    { label: 'غير نشط', value: 'inactive' }
  ];

  activePlans(): number {
    return this.plans().filter(p => p.isActive !== false && p.status !== 2).length;
  }

  totalAssignedTrainees(): number {
    return this.plans().reduce((sum, p) => sum + (p.assignedTraineesCount ?? 0), 0);
  }

  avgCalories(): number {
    const allPlans = this.plans();
    if (allPlans.length === 0) return 0;
    return allPlans.reduce((sum, p) => sum + (p.totalCalories ?? p.targetCalories ?? 0), 0) / allPlans.length;
  }

  ngOnInit(): void {
    this.loadPlans();
    this.loadCoachProfile();
  }

  loadCoachProfile(): void {
    this.coachService.getProfile().subscribe({
      next: (profile) => {
        this.coachName = profile.profile?.fullName || '';
      },
      error: () => {
        this.coachName = '';
      }
    });
  }

  // Map Backend response to Frontend format
  private mapPlanFromBackend(plan: any): DietPlan {
    // API status: 0=Draft, 1=Active, 2=Archived
    const isActive = plan.status === 1 || plan.status === 'Active' || plan.isActive === true;

    return {
      ...plan,
      // Map Backend field names to Frontend
      totalCalories: plan.targetCalories ?? plan.totalCalories ?? 0,
      proteinGrams: plan.targetProtein ?? plan.proteinGrams ?? 0,
      carbsGrams: plan.targetCarbs ?? plan.carbsGrams ?? 0,
      fatGrams: plan.targetFats ?? plan.fatGrams ?? 0,
      mealsPerDay: plan.meals?.length ?? plan.mealsPerDay ?? 0,
      isActive,
      assignedTraineesCount: plan.assignedTraineesCount ?? 0,
      createdAt: plan.createdAt ?? new Date().toISOString(),
      updatedAt: plan.updatedAt ?? new Date().toISOString()
    };
  }

  loadPlans(): void {
    this.loading.set(true);

    this.coachService.getDietPlans().subscribe({
      next: (data) => {
        // Map Backend response to Frontend format
        const mappedData = data.map(plan => this.mapPlanFromBackend(plan));
        this.plans.set(mappedData);
        this.filteredPlans.set(mappedData);
        this.loading.set(false);
      },
      error: () => {
        const mockData: DietPlan[] = [
          {
            id: '1',
            name: 'خطة بناء العضلات',
            description: 'خطة غذائية عالية البروتين لبناء الكتلة العضلية',
            totalCalories: 2800,
            proteinGrams: 180,
            carbsGrams: 320,
            fatGrams: 80,
            mealsPerDay: 5,
            isActive: true,
            assignedTraineesCount: 8,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'خطة خسارة الوزن',
            description: 'خطة منخفضة السعرات لحرق الدهون مع الحفاظ على العضلات',
            totalCalories: 1800,
            proteinGrams: 150,
            carbsGrams: 150,
            fatGrams: 60,
            mealsPerDay: 4,
            isActive: true,
            assignedTraineesCount: 12,
            createdAt: '2024-01-05',
            updatedAt: '2024-01-14'
          },
          {
            id: '3',
            name: 'خطة الحفاظ على الوزن',
            description: 'خطة متوازنة للحفاظ على الوزن الحالي',
            totalCalories: 2200,
            proteinGrams: 130,
            carbsGrams: 250,
            fatGrams: 70,
            mealsPerDay: 4,
            isActive: true,
            assignedTraineesCount: 5,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-15'
          },
          {
            id: '4',
            name: 'خطة كيتو',
            description: 'خطة منخفضة الكربوهيدرات عالية الدهون',
            totalCalories: 2000,
            proteinGrams: 120,
            carbsGrams: 30,
            fatGrams: 150,
            mealsPerDay: 3,
            isActive: false,
            assignedTraineesCount: 0,
            createdAt: '2023-12-01',
            updatedAt: '2023-12-20'
          }
        ];
        this.plans.set(mockData);
        this.filteredPlans.set(mockData);
        this.loading.set(false);
      }
    });
  }

  filterPlans(): void {
    let result = this.plans();

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.statusFilter === 'active') {
      result = result.filter(p => p.isActive);
    } else if (this.statusFilter === 'inactive') {
      result = result.filter(p => !p.isActive);
    }

    this.filteredPlans.set(result);
  }

  duplicatePlan(plan: DietPlan): void {
    if (confirm(`هل تريد نسخ خطة "${plan.name}"؟`)) {
      this.coachService.duplicateDietPlan(plan.id, { newName: `نسخة من ${plan.name}` }).subscribe({
        next: () => {
          this.loadPlans();
        },
        error: (err) => {
          console.error('Error duplicating plan:', err);
          alert('فشل في نسخ الخطة');
        }
      });
    }
  }

  togglePlan(plan: DietPlan): void {
    // API status: 0=Draft, 1=Active, 2=Archived
    const newStatus = plan.isActive ? 2 : 1; // Toggle between Active and Archived
    this.coachService.updateDietPlan(plan.id, { status: newStatus }).subscribe({
      next: () => {
        // Update local state
        const updatedPlans = this.plans().map(p =>
          p.id === plan.id ? { ...p, isActive: !p.isActive, status: newStatus } : p
        );
        this.plans.set(updatedPlans);
        this.filterPlans();
      },
      error: (err) => {
        console.error('Error toggling plan:', err);
        alert('فشل في تحديث حالة الخطة');
      }
    });
  }

  deletePlan(plan: DietPlan): void {
    if (confirm(`هل أنت متأكد من حذف خطة "${plan.name}"؟`)) {
      this.coachService.deleteDietPlan(plan.id).subscribe({
        next: () => {
          // Remove from local state
          const updatedPlans = this.plans().filter(p => p.id !== plan.id);
          this.plans.set(updatedPlans);
          this.filterPlans();
        },
        error: (err) => {
          console.error('Error deleting plan:', err);
          alert('فشل في حذف الخطة');
        }
      });
    }
  }

  // Print methods
  printPlan(plan: DietPlan): void {
    // Fetch full plan details
    this.coachService.getDietPlanById(plan.id).subscribe({
      next: (fullPlan) => {
        this.printingPlan = fullPlan;
        this.showPrintDialog = true;
      },
      error: () => {
        // Use the plan from list if API fails
        this.printingPlan = plan;
        this.showPrintDialog = true;
      }
    });
  }

  executePrint(): void {
    const printContent = document.getElementById('printAreaDiet');
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
        <title>طباعة خطة التغذية - ${this.printingPlan?.name}</title>
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
            border-bottom: 3px solid #22c55e;
            margin-bottom: 25px;
          }
          .print-logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #22c55e;
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
            background: linear-gradient(135deg, #22c55e, #16a34a);
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
          .print-nutrition-targets {
            display: flex;
            justify-content: space-around;
            gap: 15px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 25px;
          }
          .target-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            padding: 15px 25px;
            background: white;
            border-radius: 10px;
          }
          .target-value {
            font-size: 1.5rem;
            font-weight: 700;
          }
          .target-label {
            font-size: 0.8rem;
            color: #666;
          }
          .target-item.calories .target-value { color: #f59e0b; }
          .target-item.protein .target-value { color: #ef4444; }
          .target-item.carbs .target-value { color: #3b82f6; }
          .target-item.fats .target-value { color: #22c55e; }
          .print-description {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 25px;
            line-height: 1.6;
          }
          .print-meals h3 {
            font-size: 1.1rem;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
          }
          .meal-card {
            margin-bottom: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .meal-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px 15px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
          }
          .meal-number {
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }
          .meal-name {
            flex: 1;
            font-weight: 600;
          }
          .meal-time {
            font-size: 0.85rem;
            opacity: 0.9;
          }
          .meals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .meals-table th, .meals-table td {
            padding: 10px 12px;
            text-align: right;
            border-bottom: 1px solid #e0e0e0;
          }
          .meals-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
            font-size: 0.85rem;
          }
          .meals-table td {
            font-size: 0.9rem;
          }
          .meals-table tr:last-child td {
            border-bottom: none;
          }
          .no-items {
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
            .meal-card { page-break-inside: avoid; }
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
