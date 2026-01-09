import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Food } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-foods-database',
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
    ToastModule,
    TooltipModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="foods-page">
      <app-page-header
        title="قاعدة بيانات الأطعمة"
        subtitle="إدارة الأطعمة والقيم الغذائية"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'قاعدة بيانات الأطعمة'}]"
      >
        <button class="btn btn-primary" (click)="openAddDialog()">
          <i class="pi pi-plus"></i>
          <span>إضافة طعام</span>
        </button>
      </app-page-header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon calories-icon">
            <i class="pi pi-list"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ foods().length }}</span>
            <span class="mini-stat__label">إجمالي الأطعمة</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon global-icon">
            <i class="pi pi-globe"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ globalFoodsCount() }}</span>
            <span class="mini-stat__label">أطعمة عامة</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon custom-icon">
            <i class="pi pi-user"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ customFoodsCount() }}</span>
            <span class="mini-stat__label">أطعمة مخصصة</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Foods Table -->
      <div class="table-card card" *ngIf="!loading()">
        <!-- Search & Filter Header -->
        <div class="table-toolbar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="searchQuery"
              (input)="onSearch($event)"
              placeholder="البحث باسم الطعام أو الفئة..."
            />
            <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="filter-chips">
            <button
              class="chip"
              [class.active]="selectedMacroFilter === ''"
              (click)="filterByMacro('')"
            >
              الكل
            </button>
            <button
              class="chip protein-chip"
              [class.active]="selectedMacroFilter === 'protein'"
              (click)="filterByMacro('protein')"
            >
              <i class="pi pi-star-fill"></i>
              عالي البروتين
            </button>
            <button
              class="chip carbs-chip"
              [class.active]="selectedMacroFilter === 'carbs'"
              (click)="filterByMacro('carbs')"
            >
              <i class="pi pi-stop-circle"></i>
              عالي الكربوهيدرات
            </button>
            <button
              class="chip fat-chip"
              [class.active]="selectedMacroFilter === 'fat'"
              (click)="filterByMacro('fat')"
            >
              <i class="pi pi-circle-fill"></i>
              عالي الدهون
            </button>
          </div>
        </div>

        <p-table
          [value]="filteredFoods()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} طعام"
          styleClass="foods-table"
          [tableStyle]="{'min-width': '60rem'}"
          #dt
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name" style="width: 25%">
                <div class="th-content">
                  الطعام
                  <p-sortIcon field="name"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="category" style="width: 12%">
                <div class="th-content">
                  الفئة
                  <p-sortIcon field="category"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="caloriesPer100g" style="width: 12%">
                <div class="th-content">
                  السعرات
                  <p-sortIcon field="caloriesPer100g"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="proteinPer100g" style="width: 12%">
                <div class="th-content">
                  البروتين
                  <p-sortIcon field="proteinPer100g"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="carbsPer100g" style="width: 12%">
                <div class="th-content">
                  الكربوهيدرات
                  <p-sortIcon field="carbsPer100g"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="fatsPer100g" style="width: 9%">
                <div class="th-content">
                  الدهون
                  <p-sortIcon field="fatsPer100g"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="fiberPer100g" style="width: 9%">
                <div class="th-content">
                  الألياف
                  <p-sortIcon field="fiberPer100g"></p-sortIcon>
                </div>
              </th>
              <th style="width: 10%">الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-food>
            <tr class="food-row">
              <td>
                <div class="food-info">
                  <div class="food-avatar" [style.background]="getCategoryColor(food.category)">
                    {{ (food.nameAr || food.name)?.charAt(0) }}
                  </div>
                  <div class="food-details" [pTooltip]="getExtraInfo(food)" tooltipPosition="top">
                    <span class="food-name">{{ food.nameAr || food.name }}</span>
                    <span class="food-name-en" *ngIf="food.nameAr && food.name">{{ food.name }}</span>
                    <span class="food-serving">{{ food.servingSize || 100 }} {{ getUnitLabel(food.servingUnit) }}</span>
                  </div>
                  <span class="global-badge" *ngIf="food.isVerified || food.isGlobal">
                    <i class="pi pi-verified"></i>
                    {{ food.isVerified ? 'موثق' : 'عام' }}
                  </span>
                </div>
              </td>
              <td>
                <span class="category-chip" [style.background]="getCategoryColor(food.category) + '20'" [style.color]="getCategoryColor(food.category)">
                  {{ food.category || '-' }}
                </span>
              </td>
              <td>
                <div class="macro-cell">
                  <div class="macro-bar calories-bar">
                    <div class="macro-fill" [style.width.%]="getMacroPercent(food.caloriesPer100g, 500)"></div>
                  </div>
                  <span class="macro-value calories">{{ food.caloriesPer100g }} <small>kcal</small></span>
                </div>
              </td>
              <td>
                <div class="macro-cell">
                  <div class="macro-bar protein-bar">
                    <div class="macro-fill" [style.width.%]="getMacroPercent(food.proteinPer100g, 50)"></div>
                  </div>
                  <span class="macro-value protein">{{ food.proteinPer100g }}g</span>
                </div>
              </td>
              <td>
                <div class="macro-cell">
                  <div class="macro-bar carbs-bar">
                    <div class="macro-fill" [style.width.%]="getMacroPercent(food.carbsPer100g, 100)"></div>
                  </div>
                  <span class="macro-value carbs">{{ food.carbsPer100g }}g</span>
                </div>
              </td>
              <td>
                <div class="macro-cell">
                  <div class="macro-bar fat-bar">
                    <div class="macro-fill" [style.width.%]="getMacroPercent(food.fatsPer100g ?? food.fatPer100g, 50)"></div>
                  </div>
                  <span class="macro-value fat">{{ food.fatsPer100g ?? food.fatPer100g ?? 0 }}g</span>
                </div>
              </td>
              <td>
                <div class="macro-cell">
                  <div class="macro-bar fiber-bar">
                    <div class="macro-fill" [style.width.%]="getMacroPercent(food.fiberPer100g, 30)"></div>
                  </div>
                  <span class="macro-value fiber">{{ food.fiberPer100g || 0 }}g</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="action-btn edit-btn"
                    (click)="editFood(food)"
                    [disabled]="food.isVerified || food.isGlobal"
                    [title]="(food.isVerified || food.isGlobal) ? 'لا يمكن تعديل الأطعمة الموثقة' : 'تعديل'"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    (click)="deleteFood(food)"
                    [disabled]="food.isVerified || food.isGlobal"
                    [title]="(food.isVerified || food.isGlobal) ? 'لا يمكن حذف الأطعمة الموثقة' : 'حذف'"
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
                  <i class="pi pi-search"></i>
                  <h4>لا توجد نتائج</h4>
                  <p>لم يتم العثور على أطعمة مطابقة لبحثك</p>
                  <button class="btn btn-outline" (click)="clearSearch()">مسح البحث</button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingFood ? 'تعديل الطعام' : 'إضافة طعام جديد'"
        [modal]="true"
        [style]="{width: '650px'}"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="form-row">
            <div class="form-group">
              <label>اسم الطعام (بالإنجليزية) *</label>
              <input type="text" pInputText [(ngModel)]="foodForm.name" placeholder="e.g., Chicken Breast" />
            </div>
            <div class="form-group">
              <label>اسم الطعام (بالعربية)</label>
              <input type="text" pInputText [(ngModel)]="foodForm.nameAr" placeholder="مثال: صدر دجاج" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>الفئة *</label>
              <p-dropdown
                [options]="categoryOptions"
                [(ngModel)]="foodForm.category"
                placeholder="اختر الفئة"
                [filter]="true"
                filterPlaceholder="بحث..."
                [style]="{width: '100%'}"
                [editable]="true"
              ></p-dropdown>
            </div>
            <div class="form-group">
              <label>مجموعة البدائل</label>
              <p-dropdown
                [options]="alternativeGroupOptions"
                [(ngModel)]="foodForm.alternativeGroupId"
                placeholder="اختر المجموعة"
                [style]="{width: '100%'}"
                [editable]="true"
                [showClear]="true"
              ></p-dropdown>
            </div>
          </div>

          <div class="macros-section">
            <h4>القيم الغذائية الأساسية (لكل 100 جرام)</h4>
            <div class="macros-grid">
              <div class="form-group">
                <label>السعرات الحرارية *</label>
                <p-inputNumber [(ngModel)]="foodForm.caloriesPer100g" suffix=" kcal" [min]="0"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>البروتين *</label>
                <p-inputNumber [(ngModel)]="foodForm.proteinPer100g" suffix=" g" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الكربوهيدرات *</label>
                <p-inputNumber [(ngModel)]="foodForm.carbsPer100g" suffix=" g" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الدهون *</label>
                <p-inputNumber [(ngModel)]="foodForm.fatPer100g" suffix=" g" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
            </div>
          </div>

          <div class="macros-section secondary">
            <h4>القيم الغذائية الإضافية</h4>
            <div class="macros-grid">
              <div class="form-group">
                <label>الألياف</label>
                <p-inputNumber [(ngModel)]="foodForm.fiberPer100g" suffix=" g" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>السكر</label>
                <p-inputNumber [(ngModel)]="foodForm.sugarPer100g" suffix=" g" [min]="0" [maxFractionDigits]="1"></p-inputNumber>
              </div>
              <div class="form-group">
                <label>الصوديوم</label>
                <p-inputNumber [(ngModel)]="foodForm.sodiumPer100g" suffix=" mg" [min]="0" [maxFractionDigits]="0"></p-inputNumber>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>حجم الحصة</label>
              <p-inputNumber [(ngModel)]="foodForm.servingSize" [min]="1"></p-inputNumber>
            </div>
            <div class="form-group">
              <label>وحدة القياس</label>
              <p-dropdown
                [options]="unitOptions"
                [(ngModel)]="foodForm.servingUnit"
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveFood()">
            <i class="pi pi-save"></i>
            حفظ
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .foods-page {
      max-width: 1400px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

      &.calories-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      &.global-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      &.custom-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
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

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-box {
      position: relative;
      max-width: 400px;

      i.pi-search {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.9rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        &::placeholder {
          color: var(--text-muted);
        }
      }

      .clear-btn {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
      }
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chip {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      i {
        font-size: 0.75rem;
      }

      &:hover {
        border-color: #f59e0b;
        color: #f59e0b;
      }

      &.active {
        background: #f59e0b;
        border-color: #f59e0b;
        color: white;
      }

      &.protein-chip {
        &:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        &.active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #ef4444;
        }
      }

      &.carbs-chip {
        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        &.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-color: #3b82f6;
        }
      }

      &.fat-chip {
        &:hover {
          border-color: #22c55e;
          color: #22c55e;
        }
        &.active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #22c55e;
        }
      }
    }

    :host ::ng-deep .foods-table {
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

    .food-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .food-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
    }

    .food-details {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .food-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .food-name-en {
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .food-serving {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .global-badge {
      margin-right: auto;
      padding: 0.2rem 0.5rem;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;

      i {
        font-size: 0.65rem;
      }
    }

    .category-chip {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .macro-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .macro-bar {
      height: 4px;
      background: var(--bg-secondary);
      border-radius: 2px;
      overflow: hidden;

      .macro-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      &.calories-bar .macro-fill { background: #f59e0b; }
      &.protein-bar .macro-fill { background: #ef4444; }
      &.carbs-bar .macro-fill { background: #3b82f6; }
      &.fat-bar .macro-fill { background: #22c55e; }
      &.fiber-bar .macro-fill { background: #8b5cf6; }
    }

    .macro-value {
      font-weight: 600;
      font-size: 0.85rem;

      small {
        font-weight: 400;
        opacity: 0.7;
      }

      &.calories { color: #f59e0b; }
      &.protein { color: #ef4444; }
      &.carbs { color: #3b82f6; }
      &.fat { color: #22c55e; }
      &.fiber { color: #8b5cf6; }
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

      &.edit-btn {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;

        &:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }
      }

      &.delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;

        &:hover:not(:disabled) {
          background: #ef4444;
          color: white;
        }
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
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
        color: #f59e0b;
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
        font-size: 0.9rem;
      }

      input {
        width: 100%;
      }
    }

    .macros-section {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;

      h4 {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        color: var(--text-primary);
      }

      &.secondary {
        background: rgba(139, 92, 246, 0.05);
        border: 1px dashed rgba(139, 92, 246, 0.2);

        h4 {
          color: var(--text-secondary);
        }
      }
    }

    .macros-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
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
        background: #f59e0b;
        color: white;

        &:hover {
          background: #d97706;
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #f59e0b;
          color: #f59e0b;
        }
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .filter-chips {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 0.5rem;
      }

      .form-row,
      .macros-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FoodsDatabaseComponent implements OnInit {
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  foods = signal<Food[]>([]);

  // Search and Filter
  searchQuery = '';
  selectedCategory = '';
  selectedMacroFilter = '';

  dialogVisible = false;
  editingFood: Food | null = null;
  foodForm = {
    name: '',
    nameAr: '',
    category: '',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    fiberPer100g: 0,
    sugarPer100g: 0,
    sodiumPer100g: 0,
    servingSize: 100,
    servingUnit: 'g',
    alternativeGroupId: ''
  };

  categoryColors: Record<string, string> = {
    'لحوم': '#ef4444',
    'دواجن': '#f59e0b',
    'أسماك': '#3b82f6',
    'ألبان': '#8b5cf6',
    'بيض': '#eab308',
    'حبوب': '#84cc16',
    'خضروات': '#22c55e',
    'فواكه': '#ec4899',
    'مكسرات': '#a16207',
    'زيوت': '#06b6d4',
    'بروتين': '#ef4444',
    'كربوهيدرات': '#3b82f6'
  };

  categoryOptions = [
    { label: 'بروتين (Protein)', value: 'Protein' },
    { label: 'كربوهيدرات (Carbs)', value: 'Carbs' },
    { label: 'دهون (Fats)', value: 'Fats' },
    { label: 'خضروات (Vegetables)', value: 'Vegetables' },
    { label: 'فواكه (Fruits)', value: 'Fruits' },
    { label: 'ألبان (Dairy)', value: 'Dairy' },
    { label: 'مشروبات (Beverages)', value: 'Beverages' },
    { label: 'وجبات خفيفة (Snacks)', value: 'Snacks' }
  ];

  alternativeGroupOptions = [
    { label: 'بروتين خالي الدهون (lean-protein)', value: 'lean-protein' },
    { label: 'بروتين دهني (fatty-protein)', value: 'fatty-protein' },
    { label: 'حبوب (grains)', value: 'grains' },
    { label: 'خضروات ورقية (leafy-greens)', value: 'leafy-greens' },
    { label: 'خضروات نشوية (starchy-vegetables)', value: 'starchy-vegetables' },
    { label: 'فواكه (fruits)', value: 'fruits' },
    { label: 'ألبان (dairy)', value: 'dairy' },
    { label: 'مكسرات وبذور (nuts-seeds)', value: 'nuts-seeds' },
    { label: 'زيوت صحية (healthy-oils)', value: 'healthy-oils' }
  ];

  unitOptions = [
    { label: 'جرام (g)', value: 'g' },
    { label: 'مل (ml)', value: 'ml' },
    { label: 'قطعة (piece)', value: 'piece' },
    { label: 'كوب (cup)', value: 'cup' },
    { label: 'ملعقة كبيرة (tbsp)', value: 'tbsp' },
    { label: 'ملعقة صغيرة (tsp)', value: 'tsp' }
  ];

  globalFoodsCount(): number {
    return this.foods().filter(f => f.isVerified || f.isGlobal).length;
  }

  customFoodsCount(): number {
    return this.foods().filter(f => !f.isVerified && !f.isGlobal).length;
  }

  filteredFoods(): Food[] {
    let result = this.foods();

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(query) ||
        (f.nameAr && f.nameAr.toLowerCase().includes(query)) ||
        (f.category && f.category.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      result = result.filter(f => f.category === this.selectedCategory);
    }

    // Filter by macro (high protein, high carbs, high fat)
    if (this.selectedMacroFilter) {
      switch (this.selectedMacroFilter) {
        case 'protein':
          // High protein: >= 20g per 100g
          result = result.filter(f => f.proteinPer100g >= 20);
          break;
        case 'carbs':
          // High carbs: >= 40g per 100g
          result = result.filter(f => f.carbsPer100g >= 40);
          break;
        case 'fat':
          // High fat: >= 15g per 100g
          result = result.filter(f => (f.fatPer100g || f.fatsPer100g || 0) >= 15);
          break;
      }
    }

    return result;
  }

  onSearch(event: Event): void {
    // The search is handled reactively via filteredFoods()
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedMacroFilter = '';
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
  }

  filterByMacro(macro: string): void {
    this.selectedMacroFilter = macro;
  }

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || '#6b7280';
  }

  getUnitLabel(unit: string): string {
    const units: Record<string, string> = {
      'g': 'جرام',
      'piece': 'قطعة',
      'cup': 'كوب',
      'tbsp': 'م.ك',
      'tsp': 'م.ص'
    };
    return units[unit] || unit || 'جرام';
  }

  getExtraInfo(food: Food): string {
    const info: string[] = [];
    if (food.sugarPer100g !== undefined && food.sugarPer100g !== null) {
      info.push(`السكر: ${food.sugarPer100g}g`);
    }
    if (food.sodiumPer100g !== undefined && food.sodiumPer100g !== null) {
      info.push(`الصوديوم: ${food.sodiumPer100g}mg`);
    }
    return info.length > 0 ? info.join(' | ') : '';
  }

  getMacroPercent(value: number, max: number): number {
    if (!value || !max) return 0;
    return Math.min((value / max) * 100, 100);
  }

  ngOnInit(): void {
    this.loadFoods();
  }

  loadFoods(): void {
    this.loading.set(true);

    this.coachService.getFoods().subscribe({
      next: (data) => {
        // Map API response to component format
        // For now, allow editing all foods - the API will handle permissions
        // isGlobal badge is just for display, not for disabling actions
        const mappedFoods = data.map(f => ({
          ...f,
          fatPer100g: f.fatsPer100g || f.fatPer100g || 0, // Map fatsPer100g to fatPer100g for display
          servingSize: f.servingSize || 100,
          servingUnit: f.servingUnit || 'g',
          isGlobal: false // Allow editing all foods, API handles permissions
        }));
        this.foods.set(mappedFoods);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading foods:', err);
        this.notificationService.error('حدث خطأ أثناء تحميل الأطعمة');
        // Use mock data as fallback
        const mockData: Food[] = [
          { id: 1, name: 'صدر دجاج مشوي', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, fatPer100g: 3.6, category: 'دواجن', servingSize: 100, servingUnit: 'g', isGlobal: true },
          { id: 2, name: 'أرز أبيض مطبوخ', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, fatPer100g: 0.3, category: 'حبوب', servingSize: 100, servingUnit: 'g', isGlobal: true },
          { id: 3, name: 'بيض مسلوق', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, fatPer100g: 11, category: 'بيض', servingSize: 50, servingUnit: 'piece', isGlobal: true },
          { id: 4, name: 'شوفان', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatsPer100g: 6.9, fatPer100g: 6.9, category: 'حبوب', servingSize: 40, servingUnit: 'g', isGlobal: true },
          { id: 5, name: 'سلمون مشوي', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, fatPer100g: 13, category: 'أسماك', servingSize: 100, servingUnit: 'g', isGlobal: true },
        ];
        this.foods.set(mockData);
        this.loading.set(false);
      }
    });
  }

  openAddDialog(): void {
    this.editingFood = null;
    this.foodForm = {
      name: '',
      nameAr: '',
      category: '',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      sugarPer100g: 0,
      sodiumPer100g: 0,
      servingSize: 100,
      servingUnit: 'g',
      alternativeGroupId: ''
    };
    this.dialogVisible = true;
  }

  editFood(food: Food): void {
    this.editingFood = food;
    this.foodForm = {
      name: food.name,
      nameAr: food.nameAr || '',
      category: food.category || '',
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g || food.fatsPer100g || 0,
      fiberPer100g: food.fiberPer100g || 0,
      sugarPer100g: food.sugarPer100g || 0,
      sodiumPer100g: food.sodiumPer100g || 0,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingUnit || 'g',
      alternativeGroupId: food.alternativeGroupId || ''
    };
    this.dialogVisible = true;
  }

  deleteFood(food: Food): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف "${food.name}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.coachService.deleteFood(String(food.id)).subscribe({
          next: () => {
            this.foods.update(foods => foods.filter(f => f.id !== food.id));
            this.notificationService.success('تم حذف الطعام بنجاح');
          },
          error: (err) => {
            console.error('Error deleting food:', err);
            this.notificationService.error('حدث خطأ أثناء حذف الطعام');
          }
        });
      }
    });
  }

  saveFood(): void {
    if (!this.foodForm.name || !this.foodForm.category) {
      this.notificationService.warn('يرجى إدخال اسم الطعام والفئة');
      return;
    }

    // Build food data matching API expectations
    const foodData: Partial<Food> = {
      name: this.foodForm.name,
      nameAr: this.foodForm.nameAr || undefined,
      category: this.foodForm.category,
      caloriesPer100g: this.foodForm.caloriesPer100g,
      proteinPer100g: this.foodForm.proteinPer100g,
      carbsPer100g: this.foodForm.carbsPer100g,
      fatsPer100g: this.foodForm.fatPer100g, // API expects fatsPer100g
      fiberPer100g: this.foodForm.fiberPer100g || undefined,
      sugarPer100g: this.foodForm.sugarPer100g || undefined,
      sodiumPer100g: this.foodForm.sodiumPer100g || undefined,
      servingSize: this.foodForm.servingSize,
      servingUnit: this.foodForm.servingUnit,
      alternativeGroupId: this.foodForm.alternativeGroupId || undefined
    };

    if (this.editingFood) {
      this.coachService.updateFood(String(this.editingFood.id), foodData).subscribe({
        next: () => {
          this.foods.update(foods =>
            foods.map(f => f.id === this.editingFood!.id ? {
              ...f,
              ...foodData,
              fatPer100g: this.foodForm.fatPer100g
            } : f)
          );
          this.dialogVisible = false;
          this.notificationService.success('تم تحديث الطعام بنجاح');
        },
        error: (err) => {
          console.error('Error updating food:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث الطعام');
        }
      });
    } else {
      this.coachService.createFood(foodData).subscribe({
        next: (response) => {
          // API returns food ID (number)
          const newId = typeof response === 'number' ? response : (response as any);
          const createdFood: Food = {
            id: newId,
            name: this.foodForm.name,
            nameAr: this.foodForm.nameAr,
            category: this.foodForm.category,
            caloriesPer100g: this.foodForm.caloriesPer100g,
            proteinPer100g: this.foodForm.proteinPer100g,
            carbsPer100g: this.foodForm.carbsPer100g,
            fatsPer100g: this.foodForm.fatPer100g,
            fatPer100g: this.foodForm.fatPer100g,
            fiberPer100g: this.foodForm.fiberPer100g,
            sugarPer100g: this.foodForm.sugarPer100g,
            sodiumPer100g: this.foodForm.sodiumPer100g,
            servingSize: this.foodForm.servingSize,
            servingUnit: this.foodForm.servingUnit,
            alternativeGroupId: this.foodForm.alternativeGroupId,
            isGlobal: false
          };
          this.foods.update(foods => [...foods, createdFood]);
          this.dialogVisible = false;
          this.notificationService.success('تم إضافة الطعام بنجاح');
        },
        error: (err) => {
          console.error('Error creating food:', err);
          this.notificationService.error('حدث خطأ أثناء إضافة الطعام');
        }
      });
    }
  }
}
