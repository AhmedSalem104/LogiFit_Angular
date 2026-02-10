import { Component, signal, OnInit, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { WizardStepperComponent, WizardStep } from '../../../shared/components/wizard-stepper/wizard-stepper.component';
import { LiveSummarySidebarComponent, DietSummaryData } from '../../../shared/components/live-summary-sidebar/live-summary-sidebar.component';
import { CoachService, Food, DietPlan, Trainee, BodyMeasurement } from '../services/coach.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { forkJoin, from, switchMap, concatMap, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import Swal from 'sweetalert2';

interface MealFood {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  time: string;
  foods: MealFood[];
}

@Component({
  selector: 'app-diet-plan-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    ButtonModule,
    TooltipModule,
    CalendarModule,
    SelectButtonModule,
    DragDropModule,
    PageHeaderComponent,
    WizardStepperComponent,
    LiveSummarySidebarComponent,
    ToastModule
  ],
  providers: [MessageService],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <p-toast position="top-left" dir="rtl"></p-toast>

    <div class="diet-wizard-container">
      <!-- Floating Background Elements -->
      <div class="bg-effects">
        <div class="glow-orb orb-1"></div>
        <div class="glow-orb orb-2"></div>
        <div class="glow-orb orb-3"></div>
      </div>

      <!-- BMR Calculator Modal -->
      @if (showBmrCalculator) {
        <div class="modal-overlay" (click)="showBmrCalculator = false">
          <div class="bmr-modal" (click)="$event.stopPropagation()" @fadeSlide>
            <div class="modal-header">
              <div class="modal-icon">
                <i class="pi pi-calculator"></i>
              </div>
              <div class="modal-title">
                <h3>حاسبة السعرات اليومية</h3>
                <p>احسب احتياجاتك اليومية من السعرات</p>
              </div>
              <button class="close-modal" (click)="showBmrCalculator = false">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="bmr-inputs-grid">
                <div class="bmr-input-card">
                  <label>الوزن</label>
                  <div class="input-with-unit">
                    <p-inputNumber [(ngModel)]="bmrInputs.weight" [ngModelOptions]="{standalone: true}"
                      [min]="30" [max]="300" [step]="0.5" (onInput)="onBmrInputChange()"></p-inputNumber>
                    <span class="unit">كجم</span>
                  </div>
                </div>
                <div class="bmr-input-card">
                  <label>الطول</label>
                  <div class="input-with-unit">
                    <p-inputNumber [(ngModel)]="bmrInputs.height" [ngModelOptions]="{standalone: true}"
                      [min]="100" [max]="250" [step]="1" (onInput)="onBmrInputChange()"></p-inputNumber>
                    <span class="unit">سم</span>
                  </div>
                </div>
                <div class="bmr-input-card">
                  <label>العمر</label>
                  <div class="input-with-unit">
                    <p-inputNumber [(ngModel)]="bmrInputs.age" [ngModelOptions]="{standalone: true}"
                      [min]="10" [max]="100" [step]="1" (onInput)="onBmrInputChange()"></p-inputNumber>
                    <span class="unit">سنة</span>
                  </div>
                </div>
              </div>

              <div class="gender-selector">
                <label>الجنس</label>
                <div class="gender-options">
                  <button type="button" [class.active]="bmrInputs.gender === 'male'"
                    (click)="bmrInputs.gender = 'male'; onBmrInputChange()">
                    <i class="pi pi-mars"></i>
                    <span>ذكر</span>
                  </button>
                  <button type="button" [class.active]="bmrInputs.gender === 'female'"
                    (click)="bmrInputs.gender = 'female'; onBmrInputChange()">
                    <i class="pi pi-venus"></i>
                    <span>أنثى</span>
                  </button>
                </div>
              </div>

              <div class="activity-selector">
                <label>مستوى النشاط</label>
                <div class="activity-grid">
                  @for (level of activityLevels; track level.value) {
                    <button type="button" class="activity-card"
                      [class.active]="bmrInputs.activityLevel === level.value"
                      (click)="bmrInputs.activityLevel = level.value; onBmrInputChange()">
                      <span class="activity-emoji">{{ level.icon }}</span>
                      <span class="activity-name">{{ level.label }}</span>
                    </button>
                  }
                </div>
              </div>

              @if (calculatedTDEE() > 0) {
                <div class="bmr-results">
                  <div class="result-item">
                    <span class="result-label">معدل الأيض الأساسي</span>
                    <span class="result-value">{{ calculatedBMR() }} <small>kcal</small></span>
                  </div>
                  <div class="result-item highlight">
                    <span class="result-label">السعرات اليومية المطلوبة</span>
                    <span class="result-value">{{ calculatedTDEE() }} <small>kcal</small></span>
                  </div>
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn-calc" (click)="calculateBMRAndTDEE()" [disabled]="!canCalculateBMR()">
                  <i class="pi pi-calculator"></i>
                  احسب السعرات
                </button>
                @if (calculatedTDEE() > 0) {
                  <button type="button" class="btn-apply" (click)="applyTDEEToForm(); showBmrCalculator = false">
                    <i class="pi pi-check"></i>
                    تطبيق
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Main Header -->
      <header class="wizard-header">
        <div class="header-row">
          <div class="header-brand">
            <a routerLink="/coach/diet-plans" class="back-link">
              <i class="pi pi-arrow-right"></i>
            </a>
            <div class="brand-icon">
              <i class="pi pi-heart-fill"></i>
            </div>
            <div class="brand-text">
              <h1>{{ isEditMode ? 'تعديل خطة التغذية' : 'إنشاء خطة تغذية' }}</h1>
              <span class="step-label">{{ getStepLabel() }}</span>
            </div>
          </div>

          <div class="header-toolbar">
            <button type="button" class="tool-btn" (click)="showBmrCalculator = true" pTooltip="حاسبة السعرات">
              <i class="pi pi-calculator"></i>
            </button>
            <button type="button" class="tool-btn" (click)="previewPlan()" pTooltip="معاينة">
              <i class="pi pi-eye"></i>
            </button>
            <button type="button" class="save-btn" (click)="onSubmit()" [disabled]="!canSave() || saving()">
              @if (saving()) {
                <i class="pi pi-spin pi-spinner"></i>
              } @else {
                <i class="pi pi-check"></i>
              }
              <span>{{ isEditMode ? 'حفظ' : 'إنشاء' }}</span>
            </button>
          </div>
        </div>

        <!-- Wizard Steps -->
        <div class="wizard-steps">
          @for (step of wizardSteps; track $index; let i = $index) {
            <div class="wizard-step" [class.active]="currentStep === i" [class.completed]="currentStep > i"
              (click)="goToStep(i)">
              <div class="step-circle">
                @if (currentStep > i) {
                  <i class="pi pi-check"></i>
                } @else {
                  <span>{{ i + 1 }}</span>
                }
              </div>
              <span class="step-name">{{ step.label }}</span>
              @if (i < wizardSteps.length - 1) {
                <div class="step-connector" [class.filled]="currentStep > i"></div>
              }
            </div>
          }
        </div>
      </header>

      <!-- Content Area -->
      <div class="wizard-body">
        <form [formGroup]="form">
          <div class="content-wrapper" [class.with-sidebar]="currentStep === 1 && !sidebarCollapsed">

            <!-- Step 1: Basic Info -->
            @if (currentStep === 0) {
              <div class="step-panel" @fadeSlide>
                <div class="panel-header">
                  <div class="panel-icon calories-icon">
                    <i class="pi pi-info-circle"></i>
                  </div>
                  <div class="panel-title">
                    <h2>المعلومات الأساسية</h2>
                    <p>أدخل بيانات خطة التغذية</p>
                  </div>
                </div>

                <div class="info-cards">
                  <!-- Row 1 -->
                  <div class="info-row">
                    <div class="info-card wide">
                      <div class="card-label">
                        <i class="pi pi-bookmark"></i>
                        <span>اسم الخطة</span>
                      </div>
                      <input type="text" pInputText formControlName="name"
                        placeholder="مثال: خطة بناء العضلات - 2500 سعرة" />
                    </div>
                  </div>

                  <!-- Row 2 -->
                  <div class="info-row two-cols">
                    <div class="info-card">
                      <div class="card-label">
                        <i class="pi pi-user"></i>
                        <span>المتدرب</span>
                      </div>
                      <p-dropdown [options]="traineeOptions" formControlName="clientId"
                        placeholder="اختر المتدرب..." [filter]="true" filterPlaceholder="بحث..."
                        [showClear]="true" appendTo="body" (onChange)="onTraineeSelect($event)">
                        <ng-template pTemplate="selectedItem" let-item>
                          <div class="trainee-item">
                            <span class="trainee-avatar">{{ getInitials(item.label) }}</span>
                            <span>{{ item.label }}</span>
                          </div>
                        </ng-template>
                        <ng-template pTemplate="item" let-item>
                          <div class="trainee-item">
                            <span class="trainee-avatar">{{ getInitials(item.label) }}</span>
                            <span>{{ item.label }}</span>
                          </div>
                        </ng-template>
                      </p-dropdown>
                    </div>

                    <div class="info-card">
                      <div class="card-label">
                        <i class="pi pi-calendar"></i>
                        <span>تاريخ البدء</span>
                      </div>
                      <p-calendar formControlName="startDate" [showIcon]="true" dateFormat="yy-mm-dd"
                        placeholder="اختر التاريخ" appendTo="body"></p-calendar>
                    </div>
                  </div>

                  <!-- Meals Count -->
                  <div class="info-row">
                    <div class="info-card">
                      <div class="card-label">
                        <i class="pi pi-th-large"></i>
                        <span>عدد الوجبات اليومية</span>
                      </div>
                      <div class="meals-selector">
                        @for (num of [3, 4, 5, 6]; track num) {
                          <button type="button" class="meal-count-btn"
                            [class.active]="form.get('mealsPerDay')?.value === num"
                            (click)="setMealsPerDay(num)">
                            <span class="count">{{ num }}</span>
                            <span class="label">وجبات</span>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Macros Section -->
                <div class="macros-panel">
                  <div class="panel-header small">
                    <div class="panel-icon">
                      <i class="pi pi-chart-pie"></i>
                    </div>
                    <div class="panel-title">
                      <h3>الأهداف الغذائية</h3>
                      <p>حدد السعرات والماكروز المستهدفة</p>
                    </div>
                  </div>

                  <div class="macros-grid">
                    <!-- Calories -->
                    <div class="macro-card calories-card">
                      <div class="macro-visual">
                        <svg class="macro-ring" viewBox="0 0 36 36">
                          <circle class="ring-bg" cx="18" cy="18" r="16" />
                          <circle class="ring-fill" cx="18" cy="18" r="16"
                            [style.strokeDasharray]="'100, 100'" />
                        </svg>
                        <div class="macro-icon">
                          <i class="pi pi-bolt"></i>
                        </div>
                      </div>
                      <div class="macro-content">
                        <span class="macro-name">السعرات الحرارية</span>
                        <div class="macro-input-wrap">
                          <p-inputNumber formControlName="totalCalories" [min]="0" [max]="10000" [step]="50"
                            [showButtons]="true" buttonLayout="horizontal"
                            incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"></p-inputNumber>
                          <span class="macro-suffix">kcal</span>
                        </div>
                      </div>
                    </div>

                    <!-- Protein -->
                    <div class="macro-card protein-card">
                      <div class="macro-visual">
                        <div class="macro-icon">
                          <i class="pi pi-star-fill"></i>
                        </div>
                      </div>
                      <div class="macro-content">
                        <span class="macro-name">البروتين</span>
                        <div class="macro-input-wrap">
                          <p-inputNumber formControlName="proteinGrams" [min]="0" [max]="500" [step]="5"
                            [showButtons]="true" buttonLayout="horizontal"
                            incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"></p-inputNumber>
                          <span class="macro-suffix pct">{{ proteinPercentage() }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Carbs -->
                    <div class="macro-card carbs-card">
                      <div class="macro-visual">
                        <div class="macro-icon">
                          <i class="pi pi-stop-circle"></i>
                        </div>
                      </div>
                      <div class="macro-content">
                        <span class="macro-name">الكربوهيدرات</span>
                        <div class="macro-input-wrap">
                          <p-inputNumber formControlName="carbsGrams" [min]="0" [max]="700" [step]="5"
                            [showButtons]="true" buttonLayout="horizontal"
                            incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"></p-inputNumber>
                          <span class="macro-suffix pct">{{ carbsPercentage() }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Fat -->
                    <div class="macro-card fat-card">
                      <div class="macro-visual">
                        <div class="macro-icon">
                          <i class="pi pi-circle-fill"></i>
                        </div>
                      </div>
                      <div class="macro-content">
                        <span class="macro-name">الدهون</span>
                        <div class="macro-input-wrap">
                          <p-inputNumber formControlName="fatGrams" [min]="0" [max]="300" [step]="5"
                            [showButtons]="true" buttonLayout="horizontal"
                            incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"></p-inputNumber>
                          <span class="macro-suffix pct">{{ fatPercentage() }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Step 2: Build Meals -->
            @if (currentStep === 1) {
              <div class="step-panel meals-panel" @fadeSlide>
                <div class="panel-header">
                  <div class="panel-icon">
                    <i class="pi pi-list"></i>
                  </div>
                  <div class="panel-title">
                    <h2>بناء الوجبات</h2>
                    <p>أضف الوجبات والأطعمة</p>
                  </div>
                  <button type="button" class="add-meal-btn" (click)="addMeal()">
                    <i class="pi pi-plus"></i>
                    <span>وجبة جديدة</span>
                  </button>
                </div>

                <div class="meals-container" cdkDropList (cdkDropListDropped)="onMealDrop($event)" formArrayName="meals">
                  @for (meal of mealsArray.controls; track $index; let i = $index) {
                    <div class="meal-block" cdkDrag [formGroupName]="i" [class.expanded]="expandedMeal === i">
                      <div class="meal-drag-preview" *cdkDragPlaceholder></div>

                      <div class="meal-header" (click)="toggleMeal(i)">
                        <div class="meal-drag" cdkDragHandle>
                          <i class="pi pi-bars"></i>
                        </div>
                        <div class="meal-badge" [style.background]="mealColors[i % mealColors.length]">
                          {{ i + 1 }}
                        </div>
                        <div class="meal-info">
                          <input type="text" pInputText formControlName="name" [placeholder]="'الوجبة ' + (i + 1)"
                            class="meal-name" (click)="$event.stopPropagation()" />
                          <div class="meal-meta">
                            <span class="meta-time" (click)="$event.stopPropagation()">
                              <i class="pi pi-clock"></i>
                              <input type="text" formControlName="time" placeholder="00:00" />
                            </span>
                            <span class="meta-stat">
                              <i class="pi pi-bolt"></i>
                              {{ getMealCalories(i) }} kcal
                            </span>
                            <span class="meta-stat">
                              <i class="pi pi-apple"></i>
                              {{ getFoodsArray(i).length }}
                            </span>
                          </div>
                        </div>
                        <div class="meal-controls">
                          <button type="button" class="control-btn expand" [class.rotated]="expandedMeal === i">
                            <i class="pi pi-chevron-down"></i>
                          </button>
                          @if (mealsArray.length > 1) {
                            <button type="button" class="control-btn delete" (click)="removeMeal(i); $event.stopPropagation()">
                              <i class="pi pi-trash"></i>
                            </button>
                          }
                        </div>
                      </div>

                      @if (expandedMeal === i) {
                        <div class="meal-content" @expandCollapse>
                          <div class="foods-list" cdkDropList (cdkDropListDropped)="onFoodDrop($event, i)" formArrayName="foods">
                            @for (food of getFoodsArray(i).controls; track $index; let j = $index) {
                              <div class="food-row" cdkDrag [formGroupName]="j">
                                <div class="food-drag" cdkDragHandle>
                                  <i class="pi pi-grip-vertical"></i>
                                </div>
                                <div class="food-index">{{ j + 1 }}</div>
                                <div class="food-select">
                                  <p-dropdown [options]="foodOptions" formControlName="foodId"
                                    placeholder="اختر الطعام..." [filter]="true" filterPlaceholder="ابحث..."
                                    [showClear]="true" (onChange)="onFoodSelect($event, i, j)" appendTo="body">
                                    <ng-template pTemplate="selectedItem" let-item>
                                      <div class="food-item-selected">
                                        <i class="pi pi-apple"></i>
                                        {{ item?.label }}
                                      </div>
                                    </ng-template>
                                    <ng-template pTemplate="item" let-item>
                                      <div class="food-option-item">
                                        <span>{{ item.label }}</span>
                                        <small>{{ getFoodCaloriesFromOption(item.value) }} kcal</small>
                                      </div>
                                    </ng-template>
                                  </p-dropdown>
                                </div>
                                <div class="food-qty">
                                  <button type="button" class="qty-btn" (click)="decrementQuantity(i, j)">-</button>
                                  <div class="qty-display">
                                    <span class="qty-num">{{ getFoodsArray(i).at(j).get('quantity')?.value }}</span>
                                    <span class="qty-unit">{{ getFoodUnit(i, j) }}</span>
                                  </div>
                                  <button type="button" class="qty-btn" (click)="incrementQuantity(i, j)">+</button>
                                </div>
                                <div class="food-macros">
                                  <span class="macro kcal">{{ getFoodCalories(i, j) }}</span>
                                  <span class="macro p">{{ getFoodProtein(i, j) }}g</span>
                                  <span class="macro c">{{ getFoodCarbs(i, j) }}g</span>
                                  <span class="macro f">{{ getFoodFat(i, j) }}g</span>
                                </div>
                                <button type="button" class="food-remove" (click)="removeFood(i, j)">
                                  <i class="pi pi-times"></i>
                                </button>
                              </div>
                            }

                            @if (getFoodsArray(i).length === 0) {
                              <div class="foods-empty">
                                <i class="pi pi-inbox"></i>
                                <span>لا توجد أطعمة</span>
                              </div>
                            }
                          </div>

                          <button type="button" class="add-food-btn" (click)="addFood(i)">
                            <i class="pi pi-plus"></i>
                            إضافة طعام
                          </button>
                        </div>
                      }
                    </div>
                  }

                  @if (mealsArray.length === 0) {
                    <div class="meals-empty">
                      <div class="empty-illustration">
                        <i class="pi pi-calendar-plus"></i>
                      </div>
                      <h3>ابدأ بإضافة الوجبات</h3>
                      <p>أضف وجبتك الأولى لبدء بناء خطة التغذية</p>
                      <button type="button" class="start-btn" (click)="addMeal()">
                        <i class="pi pi-plus"></i>
                        إضافة وجبة
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Step 3: Review -->
            @if (currentStep === 2) {
              <div class="step-panel review-panel" @fadeSlide>
                <div class="panel-header">
                  <div class="panel-icon success">
                    <i class="pi pi-check-circle"></i>
                  </div>
                  <div class="panel-title">
                    <h2>المراجعة النهائية</h2>
                    <p>تأكد من صحة البيانات قبل الحفظ</p>
                  </div>
                </div>

                <div class="review-layout">
                  <!-- Plan Summary -->
                  <div class="review-section">
                    <div class="section-title">
                      <i class="pi pi-info-circle"></i>
                      <span>ملخص الخطة</span>
                      <button type="button" class="edit-link" (click)="goToStep(0)">تعديل</button>
                    </div>
                    <div class="summary-grid">
                      <div class="summary-item">
                        <span class="item-label">اسم الخطة</span>
                        <span class="item-value">{{ form.get('name')?.value || '-' }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="item-label">المتدرب</span>
                        <span class="item-value">{{ getSelectedTraineeName() }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="item-label">تاريخ البدء</span>
                        <span class="item-value">{{ form.get('startDate')?.value | date:'yyyy-MM-dd' }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="item-label">عدد الوجبات</span>
                        <span class="item-value">{{ mealsArray.length }} وجبات</span>
                      </div>
                    </div>
                  </div>

                  <!-- Macros Summary -->
                  <div class="review-section">
                    <div class="section-title">
                      <i class="pi pi-chart-pie"></i>
                      <span>الأهداف الغذائية</span>
                    </div>
                    <div class="macros-summary">
                      <div class="macro-box calories">
                        <i class="pi pi-bolt"></i>
                        <div class="macro-data">
                          <span class="data-value">{{ getTotalMealCalories() }} / {{ form.get('totalCalories')?.value }}</span>
                          <span class="data-label">سعرة</span>
                        </div>
                      </div>
                      <div class="macro-box protein">
                        <i class="pi pi-star-fill"></i>
                        <div class="macro-data">
                          <span class="data-value">{{ getTotalMealProtein() | number:'1.0-0' }} / {{ form.get('proteinGrams')?.value }}</span>
                          <span class="data-label">بروتين (جم)</span>
                        </div>
                      </div>
                      <div class="macro-box carbs">
                        <i class="pi pi-stop-circle"></i>
                        <div class="macro-data">
                          <span class="data-value">{{ getTotalMealCarbs() | number:'1.0-0' }} / {{ form.get('carbsGrams')?.value }}</span>
                          <span class="data-label">كربوهيدرات (جم)</span>
                        </div>
                      </div>
                      <div class="macro-box fat">
                        <i class="pi pi-circle-fill"></i>
                        <div class="macro-data">
                          <span class="data-value">{{ getTotalMealFat() | number:'1.0-0' }} / {{ form.get('fatGrams')?.value }}</span>
                          <span class="data-label">دهون (جم)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Meals Summary -->
                  <div class="review-section full">
                    <div class="section-title">
                      <i class="pi pi-list"></i>
                      <span>الوجبات</span>
                      <button type="button" class="edit-link" (click)="goToStep(1)">تعديل</button>
                    </div>
                    <div class="meals-summary">
                      @for (meal of mealsArray.controls; track $index; let i = $index) {
                        <div class="meal-summary-card">
                          <div class="meal-summary-header" [style.borderColor]="mealColors[i % mealColors.length]">
                            <span class="meal-num" [style.background]="mealColors[i % mealColors.length]">{{ i + 1 }}</span>
                            <span class="meal-title">{{ meal.get('name')?.value || 'الوجبة ' + (i + 1) }}</span>
                            <span class="meal-kcal">{{ getMealCalories(i) }} kcal</span>
                          </div>
                          <div class="meal-summary-foods">
                            @for (food of getFoodsArray(i).controls; track $index; let j = $index) {
                              <div class="food-mini">
                                <span class="food-name">{{ getFoodName(i, j) }}</span>
                                <span class="food-cal">{{ getFoodCalories(i, j) }} kcal</span>
                              </div>
                            }
                            @if (getFoodsArray(i).length === 0) {
                              <span class="no-foods">لا توجد أطعمة</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Sidebar -->
            @if (currentStep === 1) {
              <app-live-summary-sidebar
                [type]="'diet'"
                [dietData]="dietSummaryData"
                [collapsed]="sidebarCollapsed"
                (collapsedChange)="sidebarCollapsed = $event"
              ></app-live-summary-sidebar>
            }
          </div>
        </form>
      </div>

      <!-- Footer Navigation -->
      <footer class="wizard-footer">
        <button type="button" class="nav-btn prev" (click)="previousStep()" [disabled]="currentStep === 0">
          <i class="pi pi-arrow-right"></i>
          <span>السابق</span>
        </button>

        <div class="step-dots">
          @for (step of wizardSteps; track $index; let i = $index) {
            <span class="dot" [class.active]="currentStep === i" [class.completed]="currentStep > i"></span>
          }
        </div>

        @if (currentStep < 2) {
          <button type="button" class="nav-btn next" (click)="nextStep()" [disabled]="!canProceedToNextStep()">
            <span>التالي</span>
            <i class="pi pi-arrow-left"></i>
          </button>
        } @else {
          <button type="button" class="nav-btn save" (click)="onSubmit()" [disabled]="!canSave() || saving()">
            @if (saving()) {
              <i class="pi pi-spin pi-spinner"></i>
            } @else {
              <i class="pi pi-check"></i>
            }
            <span>{{ isEditMode ? 'حفظ التعديلات' : 'إنشاء الخطة' }}</span>
          </button>
        }
      </footer>
    </div>
  `,
  styles: [`
    /* ===== PREMIUM DIET WIZARD - ULTRA MODERN DESIGN ===== */

    /* Container & Background */
    .diet-wizard-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
      position: relative;
      overflow: hidden;
    }

    .bg-effects {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.15;
      animation: float 20s ease-in-out infinite;
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: var(--diet-primary, #10b981);
      top: -200px;
      right: -200px;
    }

    .orb-2 {
      width: 400px;
      height: 400px;
      background: #3b82f6;
      bottom: 10%;
      left: -100px;
      animation-delay: -5s;
    }

    .orb-3 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      top: 50%;
      right: 20%;
      animation-delay: -10s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.05); }
      66% { transform: translate(-20px, 20px) scale(0.95); }
    }

    /* Header */
    .wizard-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 15, 20, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0 24px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-link {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: all 0.3s;

      &:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: var(--diet-primary);
        color: var(--diet-primary);
      }
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--diet-primary) 0%, #059669 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);

      i { font-size: 1.4rem; color: white; }
    }

    .brand-text {
      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        color: white;
      }

      .step-label {
        font-size: 0.85rem;
        color: var(--diet-primary);
      }
    }

    .header-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tool-btn {
      width: 44px;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--diet-primary);
        color: var(--diet-primary);
      }
    }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--diet-primary), #059669);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Wizard Steps */
    .wizard-steps {
      display: flex;
      justify-content: center;
      padding: 20px 0;
      gap: 0;
    }

    .wizard-step {
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover .step-circle {
        border-color: var(--diet-primary);
      }
    }

    .step-circle {
      width: 44px;
      height: 44px;
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.03);
      transition: all 0.3s;

      span { font-size: 1rem; }
      i { font-size: 1rem; }
    }

    .step-name {
      margin: 0 16px;
      font-size: 0.95rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.3s;
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 8px;
      transition: background 0.3s;

      &.filled {
        background: var(--diet-primary);
      }
    }

    .wizard-step.active {
      .step-circle {
        border-color: var(--diet-primary);
        background: var(--diet-primary);
        color: white;
        box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
      }
      .step-name {
        color: var(--diet-primary);
      }
    }

    .wizard-step.completed {
      .step-circle {
        border-color: var(--diet-primary);
        background: rgba(16, 185, 129, 0.15);
        color: var(--diet-primary);
      }
      .step-name {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    /* Wizard Body */
    .wizard-body {
      position: relative;
      z-index: 1;
      padding: 24px;
      padding-bottom: 100px;
    }

    .content-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      gap: 24px;

      &.with-sidebar {
        max-width: 1500px;
      }
    }

    /* Step Panels */
    .step-panel {
      flex: 1;
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      backdrop-filter: blur(10px);

      &.small {
        padding: 16px 20px;
        margin-bottom: 16px;

        h3 { font-size: 1.1rem; }
      }
    }

    .panel-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--diet-primary), #059669);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);

      i { font-size: 1.5rem; color: white; }

      &.success {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
      }

      &.calories-icon {
        background: linear-gradient(135deg, #f97316, #ea580c);
        box-shadow: 0 0 30px rgba(249, 115, 22, 0.3);
      }
    }

    .panel-title {
      flex: 1;

      h2, h3 {
        margin: 0 0 4px;
        font-size: 1.3rem;
        font-weight: 700;
        color: white;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    /* Info Cards */
    .info-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .info-row {
      display: grid;
      gap: 16px;

      &.two-cols {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .info-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s;

      &:hover {
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
      }

      &.wide {
        grid-column: 1 / -1;
      }
    }

    .card-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);

      i {
        color: var(--diet-primary);
        font-size: 1rem;
      }
    }

    .info-card input[type="text"] {
      width: 100%;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      transition: all 0.3s;

      &::placeholder { color: rgba(255, 255, 255, 0.3); }

      &:focus {
        outline: none;
        border-color: var(--diet-primary);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      }
    }

    .trainee-item {
      display: flex;
      align-items: center;
      gap: 12px;

      .trainee-avatar {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, var(--diet-primary), #059669);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    /* Meals Selector */
    .meals-selector {
      display: flex;
      gap: 12px;
    }

    .meal-count-btn {
      flex: 1;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;

      .count {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 4px;
      }

      .label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
      }

      &:hover {
        border-color: var(--diet-primary);

        .count { color: var(--diet-primary); }
      }

      &.active {
        background: rgba(16, 185, 129, 0.15);
        border-color: var(--diet-primary);

        .count { color: var(--diet-primary); }
        .label { color: rgba(16, 185, 129, 0.8); }
      }
    }

    /* Macros Panel */
    .macros-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 24px;
    }

    .macros-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .macro-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s;

      &:hover {
        border-color: var(--macro-color);
        box-shadow: 0 0 25px var(--macro-glow);
      }

      &.calories-card { --macro-color: #f97316; --macro-glow: rgba(249, 115, 22, 0.2); }
      &.protein-card { --macro-color: #ef4444; --macro-glow: rgba(239, 68, 68, 0.2); }
      &.carbs-card { --macro-color: #3b82f6; --macro-glow: rgba(59, 130, 246, 0.2); }
      &.fat-card { --macro-color: #22c55e; --macro-glow: rgba(34, 197, 94, 0.2); }
    }

    .macro-visual {
      margin-bottom: 16px;
    }

    .macro-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--macro-color), transparent);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.3rem;
        color: var(--macro-color);
      }
    }

    .macro-content {
      .macro-name {
        display: block;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 10px;
      }
    }

    .macro-input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;

      .macro-suffix {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--macro-color);

        &.pct {
          padding: 6px 12px;
          background: rgba(var(--macro-color), 0.1);
          border-radius: 8px;
        }
      }
    }

    /* Meals Step */
    .add-meal-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--diet-primary), #059669);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }
    }

    .meals-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .meal-block {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
      }

      &.expanded {
        border-color: var(--diet-primary);
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.15);
      }
    }

    .meal-drag-preview {
      background: rgba(16, 185, 129, 0.1);
      border: 2px dashed var(--diet-primary);
      border-radius: 20px;
      height: 80px;
    }

    .meal-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }
    }

    .meal-drag {
      color: rgba(255, 255, 255, 0.3);
      cursor: grab;

      &:active { cursor: grabbing; }
      &:hover { color: var(--diet-primary); }
    }

    .meal-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .meal-info {
      flex: 1;

      .meal-name {
        width: 100%;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.05rem;
        font-weight: 600;
        padding: 6px 0;

        &:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 8px;
        }

        &::placeholder { color: rgba(255, 255, 255, 0.4); }
      }

      .meal-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 6px;

        .meta-time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.5);

          input {
            width: 50px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            text-align: center;
            font-size: 0.85rem;
          }
        }

        .meta-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);

          i { font-size: 0.8rem; }
        }
      }
    }

    .meal-controls {
      display: flex;
      gap: 8px;

      .control-btn {
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: transparent;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.2s;

        &.expand {
          &:hover {
            background: rgba(255, 255, 255, 0.05);
            color: white;
          }

          &.rotated {
            transform: rotate(180deg);
          }
        }

        &.delete:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          color: #ef4444;
        }
      }
    }

    .meal-content {
      padding: 0 20px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .foods-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 0;
    }

    .food-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      transition: all 0.2s;

      &:hover {
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    .food-drag {
      color: rgba(255, 255, 255, 0.3);
      cursor: grab;
    }

    .food-index {
      width: 28px;
      height: 28px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
    }

    .food-select {
      flex: 1;
      min-width: 200px;
    }

    .food-item-selected {
      display: flex;
      align-items: center;
      gap: 8px;

      i { color: var(--diet-primary); }
    }

    .food-option-item {
      display: flex;
      justify-content: space-between;
      align-items: center;

      small { color: rgba(255, 255, 255, 0.5); }
    }

    .food-qty {
      display: flex;
      align-items: center;
      gap: 8px;

      .qty-btn {
        width: 32px;
        height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        color: white;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--diet-primary);
          border-color: var(--diet-primary);
        }
      }

      .qty-display {
        text-align: center;
        min-width: 60px;

        .qty-num {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .qty-unit {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .food-macros {
      display: flex;
      gap: 10px;

      .macro {
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;

        &.kcal { color: #f97316; }
        &.p { color: #ef4444; }
        &.c { color: #3b82f6; }
        &.f { color: #22c55e; }
      }
    }

    .food-remove {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 8px;
      color: #ef4444;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #ef4444;
        color: white;
      }
    }

    .foods-empty {
      text-align: center;
      padding: 30px;
      color: rgba(255, 255, 255, 0.4);

      i {
        font-size: 2rem;
        margin-bottom: 10px;
        display: block;
      }
    }

    .add-food-btn {
      width: 100%;
      padding: 14px;
      background: transparent;
      border: 2px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:hover {
        border-color: var(--diet-primary);
        color: var(--diet-primary);
        background: rgba(16, 185, 129, 0.05);
      }
    }

    .meals-empty {
      text-align: center;
      padding: 60px 20px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;

      .empty-illustration {
        width: 100px;
        height: 100px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 2.5rem;
          color: var(--diet-primary);
        }
      }

      h3 {
        margin: 0 0 8px;
        font-size: 1.2rem;
        color: white;
      }

      p {
        margin: 0 0 24px;
        color: rgba(255, 255, 255, 0.5);
      }

      .start-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        background: linear-gradient(135deg, var(--diet-primary), #059669);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }
      }
    }

    /* Review Panel */
    .review-layout {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .review-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 24px;

      &.full {
        grid-column: 1 / -1;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      i {
        color: var(--diet-primary);
        font-size: 1.1rem;
      }

      span {
        flex: 1;
        font-size: 1rem;
        font-weight: 600;
        color: white;
      }

      .edit-link {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 6px 14px;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: var(--diet-primary);
          color: var(--diet-primary);
        }
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .summary-item {
      padding: 14px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;

      .item-label {
        display: block;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 6px;
      }

      .item-value {
        font-size: 1rem;
        font-weight: 600;
        color: white;
      }
    }

    .macros-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .macro-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);

      i {
        font-size: 1.3rem;
        &.pi-bolt { color: #f97316; }
        &.pi-star-fill { color: #ef4444; }
        &.pi-stop-circle { color: #3b82f6; }
        &.pi-circle-fill { color: #22c55e; }
      }

      .macro-data {
        .data-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .data-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .meals-summary {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .meal-summary-card {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 14px;
      overflow: hidden;
    }

    .meal-summary-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-right: 3px solid;

      .meal-num {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
      }

      .meal-title {
        flex: 1;
        font-weight: 600;
        color: white;
      }

      .meal-kcal {
        font-size: 0.85rem;
        color: #f97316;
        font-weight: 600;
      }
    }

    .meal-summary-foods {
      padding: 12px 16px;

      .food-mini {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &:last-child { border-bottom: none; }

        .food-name {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .food-cal {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }
      }

      .no-foods {
        display: block;
        text-align: center;
        padding: 16px;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9rem;
      }
    }

    /* Footer */
    .wizard-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: rgba(15, 15, 20, 0.95);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;

      &.prev {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }

      &.next {
        background: linear-gradient(135deg, var(--diet-primary), #059669);
        border: none;
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.save {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: none;
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .step-dots {
      display: flex;
      gap: 10px;

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s;

        &.active {
          background: var(--diet-primary);
          box-shadow: 0 0 10px var(--diet-primary);
        }

        &.completed {
          background: rgba(16, 185, 129, 0.5);
        }
      }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .bmr-modal {
      width: 100%;
      max-width: 600px;
      background: #1a1a22;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .modal-icon {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;

        i { font-size: 1.4rem; color: white; }
      }

      .modal-title {
        flex: 1;

        h3 {
          margin: 0 0 4px;
          font-size: 1.2rem;
          color: white;
        }

        p {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .close-modal {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: transparent;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: #ef4444;
        }
      }
    }

    .modal-body {
      padding: 24px;
    }

    .bmr-inputs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .bmr-input-card {
      label {
        display: block;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 10px;
      }

      .input-with-unit {
        display: flex;
        align-items: center;
        gap: 8px;

        .unit {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
        }
      }
    }

    .gender-selector {
      margin-bottom: 24px;

      label {
        display: block;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 12px;
      }

      .gender-options {
        display: flex;
        gap: 12px;

        button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;

          i { font-size: 1.2rem; }

          &:hover {
            border-color: #8b5cf6;
          }

          &.active {
            background: rgba(139, 92, 246, 0.15);
            border-color: #8b5cf6;
            color: #8b5cf6;
          }
        }
      }
    }

    .activity-selector {
      margin-bottom: 24px;

      label {
        display: block;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 12px;
      }

      .activity-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;

        .activity-card {
          padding: 14px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;

          .activity-emoji {
            display: block;
            font-size: 1.5rem;
            margin-bottom: 6px;
          }

          .activity-name {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
          }

          &:hover {
            border-color: #8b5cf6;
          }

          &.active {
            background: rgba(139, 92, 246, 0.15);
            border-color: #8b5cf6;

            .activity-name { color: #8b5cf6; }
          }
        }
      }
    }

    .bmr-results {
      padding: 20px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
      margin-bottom: 20px;

      .result-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &:last-child { border-bottom: none; }

        .result-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .result-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: white;

          small {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            margin-right: 4px;
          }
        }

        &.highlight .result-value {
          color: #22c55e;
          font-size: 1.4rem;
        }
      }
    }

    .modal-actions {
      display: flex;
      gap: 12px;

      .btn-calc {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-apply {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }
      }
    }

    /* PrimeNG Overrides */
    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;

        .p-dropdown-label {
          color: white;
          padding: 12px 16px;
          font-weight: 500;
        }

        &:not(.p-disabled):hover {
          border-color: var(--diet-primary);
        }

        &:not(.p-disabled).p-focus {
          border-color: var(--diet-primary);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
      }

      /* Dropdown Panel Overlay Styles */
      .p-dropdown-panel {
        background: #1a1a2e !important;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);

        .p-dropdown-header {
          background: #151525;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px;

          .p-dropdown-filter {
            background: #1a1a2e;
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #fff;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 0.9rem;

            &::placeholder {
              color: rgba(255, 255, 255, 0.4);
            }

            &:focus {
              border-color: #10b981;
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
            }
          }
        }

        .p-dropdown-items-wrapper {
          max-height: 350px;
        }

        .p-dropdown-items {
          padding: 8px;

          .p-dropdown-item {
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 4px;
            font-size: 0.95rem;
            transition: all 0.2s ease;

            &:hover {
              background: rgba(16, 185, 129, 0.15);
              color: #10b981;
            }

            &.p-highlight {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              font-weight: 600;
            }
          }

          .p-dropdown-empty-message {
            color: rgba(255, 255, 255, 0.5);
            padding: 20px;
            text-align: center;
          }
        }
      }

      .p-calendar {
        width: 100%;

        .p-inputtext {
          width: 100%;
          padding: 14px 18px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: white;

          &:focus {
            border-color: var(--diet-primary);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          }
        }
      }

      .p-inputnumber {
        .p-inputtext {
          width: 80px;
          padding: 10px;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          border-radius: 10px;
        }

        .p-button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);

          &:hover {
            background: var(--diet-primary);
            border-color: var(--diet-primary);
            color: white;
          }
        }
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .macros-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .macros-summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 900px) {
      .wizard-header {
        padding: 0 16px;
      }

      .wizard-steps {
        overflow-x: auto;
        justify-content: flex-start;
        padding: 16px 0;
        gap: 0;
      }

      .step-connector {
        width: 30px;
      }

      .step-name {
        font-size: 0.85rem;
        margin: 0 10px;
      }

      .info-row.two-cols {
        grid-template-columns: 1fr;
      }

      .content-wrapper {
        flex-direction: column;

        &.with-sidebar {
          max-width: 100%;
        }
      }

      .review-layout {
        grid-template-columns: 1fr;
      }

      .review-section.full {
        grid-column: auto;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .food-row {
        flex-wrap: wrap;
        gap: 10px;

        .food-select {
          width: 100%;
          order: 1;
        }

        .food-index {
          order: 0;
        }

        .food-drag {
          order: 0;
        }

        .food-qty {
          order: 2;
        }

        .food-macros {
          order: 3;
          flex-wrap: wrap;
          justify-content: center;
        }

        .food-remove {
          order: 4;
        }
      }
    }

    @media (max-width: 600px) {
      .wizard-body {
        padding: 16px;
      }

      .panel-header {
        flex-wrap: wrap;
        gap: 12px;

        .panel-icon {
          width: 48px;
          height: 48px;
        }
      }

      .macros-grid {
        grid-template-columns: 1fr;
      }

      .meals-selector {
        flex-wrap: wrap;

        .meal-count-btn {
          flex: 1 1 45%;
        }
      }

      .header-row {
        flex-wrap: wrap;
        gap: 16px;
      }

      .header-toolbar {
        width: 100%;
        justify-content: flex-end;
      }

      .wizard-steps {
        display: none;
      }

      .step-dots {
        display: flex;
      }

      .meal-info .meal-meta {
        flex-wrap: wrap;
        gap: 10px;
      }

      .bmr-inputs-grid {
        grid-template-columns: 1fr;
      }

      .activity-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }

      .nav-btn {
        padding: 12px 20px;
        font-size: 0.9rem;

        span {
          display: none;
        }
      }

      .nav-btn.save span {
        display: inline;
      }
    }

    /* CDK Drag & Drop */
    .cdk-drag-preview {
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border-radius: 20px;
      background: #1a1a22;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-dragging .meal-block:not(.cdk-drag-placeholder),
    .cdk-drop-list-dragging .food-row:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class DietPlanBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coachService = inject(CoachService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  isEditMode = false;
  planId: string | null = null;
  saving = signal(false);
  foods = signal<Food[]>([]);
  trainees = signal<Trainee[]>([]);
  expandedMeal: number | null = 0;
  showBmrCalculator = false;
  sidebarCollapsed = false;

  // Wizard State
  currentStep = 0;
  wizardSteps: WizardStep[] = [
    { label: 'المعلومات الأساسية', icon: 'pi-info-circle' },
    { label: 'بناء الوجبات', icon: 'pi-list' },
    { label: 'المراجعة والحفظ', icon: 'pi-check-circle' }
  ];

  mealColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Live Summary Data for Sidebar
  get dietSummaryData(): DietSummaryData {
    return {
      totalCalories: this.getTotalMealCalories(),
      targetCalories: this.form.get('totalCalories')?.value || 0,
      protein: this.getTotalMealProtein(),
      targetProtein: this.form.get('proteinGrams')?.value || 0,
      carbs: this.getTotalMealCarbs(),
      targetCarbs: this.form.get('carbsGrams')?.value || 0,
      fat: this.getTotalMealFat(),
      targetFat: this.form.get('fatGrams')?.value || 0,
      mealsCount: this.mealsArray.length,
      foodsCount: this.getTotalFoodsCount()
    };
  }

  getTotalFoodsCount(): number {
    let count = 0;
    for (let i = 0; i < this.mealsArray.length; i++) {
      count += this.getFoodsArray(i).length;
    }
    return count;
  }

  foodOptions: { label: string; value: string | number; data?: Food }[] = [];
  traineeOptions: { label: string; value: string; trainee?: Trainee }[] = [];
  selectedTraineeMeasurements = signal<BodyMeasurement[]>([]);

  // BMR Calculator State
  bmrInputs = {
    weight: 0,
    height: 0,
    age: 25,
    gender: 'male' as 'male' | 'female',
    activityLevel: 1.55
  };

  calculatedBMR = signal(0);
  calculatedTDEE = signal(0);
  limitAlertShown = false;

  // Activity Level Options
  activityLevels = [
    { value: 1.2, label: 'خامل', description: 'قليل أو لا تمارين', icon: '🛋️' },
    { value: 1.375, label: 'نشاط خفيف', description: '1-3 أيام/أسبوع', icon: '🚶' },
    { value: 1.55, label: 'نشاط متوسط', description: '3-5 أيام/أسبوع', icon: '🏃' },
    { value: 1.725, label: 'نشاط عالي', description: '6-7 أيام/أسبوع', icon: '🏋️' },
    { value: 1.9, label: 'نشاط عالي جداً', description: 'عمل بدني شاق', icon: '💪' }
  ];

  // For template Math usage
  Math = Math;

  form: FormGroup = this.fb.group({
    clientId: ['', Validators.required],
    startDate: [new Date(), Validators.required],
    endDate: [null],
    status: [0], // 0=Active, 1=Draft, 2=Archived
    name: ['', Validators.required],
    description: [''],
    totalCalories: [2500, Validators.required],
    proteinGrams: [180, Validators.required],
    carbsGrams: [250, Validators.required],
    fatGrams: [80, Validators.required],
    mealsPerDay: [4, [Validators.required, Validators.min(1)]],
    meals: this.fb.array([])
  });

  statusOptions = [
    { label: 'Active', value: 0 },
    { label: 'Draft', value: 1 },
    { label: 'Archived', value: 2 }
  ];

  get mealsArray(): FormArray {
    return this.form.get('meals') as FormArray;
  }

  getFoodsArray(mealIndex: number): FormArray {
    return this.mealsArray.at(mealIndex).get('foods') as FormArray;
  }

  calculatedCalories(): number {
    const protein = this.form.get('proteinGrams')?.value || 0;
    const carbs = this.form.get('carbsGrams')?.value || 0;
    const fat = this.form.get('fatGrams')?.value || 0;
    return (protein * 4) + (carbs * 4) + (fat * 9);
  }

  proteinPercentage(): number {
    const total = this.calculatedCalories();
    if (total === 0) return 0;
    const protein = this.form.get('proteinGrams')?.value || 0;
    return Math.round((protein * 4 / total) * 100);
  }

  carbsPercentage(): number {
    const total = this.calculatedCalories();
    if (total === 0) return 0;
    const carbs = this.form.get('carbsGrams')?.value || 0;
    return Math.round((carbs * 4 / total) * 100);
  }

  fatPercentage(): number {
    const total = this.calculatedCalories();
    if (total === 0) return 0;
    const fat = this.form.get('fatGrams')?.value || 0;
    return Math.round((fat * 9 / total) * 100);
  }

  getMealCalories(mealIndex: number): number {
    const foods = this.getFoodsArray(mealIndex);
    let total = 0;
    for (let i = 0; i < foods.length; i++) {
      total += this.getFoodCalories(mealIndex, i);
    }
    return total;
  }

  // BMR Calculator Methods
  canCalculateBMR(): boolean {
    return this.bmrInputs.weight > 0 && this.bmrInputs.height > 0 && this.bmrInputs.age > 0;
  }

  onBmrInputChange(): void {
    // Auto-calculate if all inputs are valid
    if (this.canCalculateBMR()) {
      this.calculateBMRAndTDEE();
    }
  }

  calculateBMRAndTDEE(): void {
    const { weight, height, age, gender, activityLevel } = this.bmrInputs;

    // Mifflin-St Jeor Formula
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    this.calculatedBMR.set(Math.round(bmr));

    // Calculate TDEE
    const tdee = bmr * activityLevel;
    this.calculatedTDEE.set(Math.round(tdee));
  }

  applyTDEEToForm(): void {
    const tdee = this.calculatedTDEE();
    if (tdee > 0) {
      this.form.patchValue({ totalCalories: tdee });

      // Auto-calculate macros based on standard ratios (30% protein, 40% carbs, 30% fat)
      const proteinCalories = tdee * 0.3;
      const carbsCalories = tdee * 0.4;
      const fatCalories = tdee * 0.3;

      this.form.patchValue({
        proteinGrams: Math.round(proteinCalories / 4),
        carbsGrams: Math.round(carbsCalories / 4),
        fatGrams: Math.round(fatCalories / 9)
      });

      this.messageService.add({
        severity: 'success',
        summary: 'تم التطبيق',
        detail: `تم تطبيق ${tdee} سعرة حرارية كهدف يومي`
      });
    }
  }

  // Calorie Tracker Methods
  getTotalMealCalories(): number {
    let total = 0;
    for (let i = 0; i < this.mealsArray.length; i++) {
      total += this.getMealCalories(i);
    }
    return total;
  }

  getRemainingCalories(): number {
    const target = this.form.get('totalCalories')?.value || 0;
    return target - this.getTotalMealCalories();
  }

  getCalorieProgressPercent(): number {
    const target = this.form.get('totalCalories')?.value || 0;
    if (target === 0) return 0;
    const consumed = this.getTotalMealCalories();
    return Math.min(Math.round((consumed / target) * 100), 100);
  }

  isCalorieLimitReached(): boolean {
    return this.getRemainingCalories() <= 0 && this.form.get('totalCalories')?.value > 0;
  }

  isCalorieWarning(): boolean {
    return this.getCalorieProgressPercent() >= 70 && this.getCalorieProgressPercent() < 95;
  }

  // Macro Tracker Methods
  getTotalMealProtein(): number {
    let total = 0;
    for (let i = 0; i < this.mealsArray.length; i++) {
      total += this.getMealProtein(i);
    }
    return total;
  }

  getTotalMealCarbs(): number {
    let total = 0;
    for (let i = 0; i < this.mealsArray.length; i++) {
      total += this.getMealCarbs(i);
    }
    return total;
  }

  getTotalMealFat(): number {
    let total = 0;
    for (let i = 0; i < this.mealsArray.length; i++) {
      total += this.getMealFat(i);
    }
    return total;
  }

  getMealProtein(mealIndex: number): number {
    const foods = this.getFoodsArray(mealIndex);
    let total = 0;
    for (let i = 0; i < foods.length; i++) {
      total += this.getFoodProtein(mealIndex, i);
    }
    return total;
  }

  getMealCarbs(mealIndex: number): number {
    const foods = this.getFoodsArray(mealIndex);
    let total = 0;
    for (let i = 0; i < foods.length; i++) {
      total += this.getFoodCarbs(mealIndex, i);
    }
    return total;
  }

  getMealFat(mealIndex: number): number {
    const foods = this.getFoodsArray(mealIndex);
    let total = 0;
    for (let i = 0; i < foods.length; i++) {
      total += this.getFoodFat(mealIndex, i);
    }
    return total;
  }

  getFoodProtein(mealIndex: number, foodIndex: number): number {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const foodId = foodControl.get('foodId')?.value;
    const quantity = foodControl.get('quantity')?.value || 0;
    const food = this.foods().find(f => f.id === foodId);
    if (!food) return 0;
    return Math.round((food.proteinPer100g * quantity) / 100);
  }

  getFoodCarbs(mealIndex: number, foodIndex: number): number {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const foodId = foodControl.get('foodId')?.value;
    const quantity = foodControl.get('quantity')?.value || 0;
    const food = this.foods().find(f => f.id === foodId);
    if (!food) return 0;
    return Math.round((food.carbsPer100g * quantity) / 100);
  }

  getFoodFat(mealIndex: number, foodIndex: number): number {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const foodId = foodControl.get('foodId')?.value;
    const quantity = foodControl.get('quantity')?.value || 0;
    const food = this.foods().find(f => f.id === foodId);
    if (!food) return 0;
    return Math.round(((food.fatPer100g || food.fatsPer100g || 0) * quantity) / 100);
  }

  getRemainingProtein(): number {
    const target = this.form.get('proteinGrams')?.value || 0;
    return target - this.getTotalMealProtein();
  }

  getRemainingCarbs(): number {
    const target = this.form.get('carbsGrams')?.value || 0;
    return target - this.getTotalMealCarbs();
  }

  getRemainingFat(): number {
    const target = this.form.get('fatGrams')?.value || 0;
    return target - this.getTotalMealFat();
  }

  getMacroProgressPercent(macro: 'protein' | 'carbs' | 'fat'): number {
    let target = 0;
    let consumed = 0;

    switch (macro) {
      case 'protein':
        target = this.form.get('proteinGrams')?.value || 0;
        consumed = this.getTotalMealProtein();
        break;
      case 'carbs':
        target = this.form.get('carbsGrams')?.value || 0;
        consumed = this.getTotalMealCarbs();
        break;
      case 'fat':
        target = this.form.get('fatGrams')?.value || 0;
        consumed = this.getTotalMealFat();
        break;
    }

    if (target === 0) return 0;
    return Math.min(Math.round((consumed / target) * 100), 100);
  }

  checkAndAlertCalorieLimit(): void {
    if (this.isCalorieLimitReached() && !this.limitAlertShown) {
      this.limitAlertShown = true;
      Swal.fire({
        title: 'تم الوصول للحد المطلوب!',
        text: 'لقد وصلت السعرات المضافة للحد اليومي المستهدف',
        icon: 'success',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#22c55e'
      });
    }
  }

  showCannotAddFoodAlert(): void {
    Swal.fire({
      title: 'لا يمكن الإضافة',
      text: 'لقد تجاوزت الحد اليومي من السعرات. قم بتعديل الأطعمة الحالية أو زيادة السعرات المستهدفة.',
      icon: 'warning',
      confirmButtonText: 'فهمت',
      confirmButtonColor: '#f59e0b'
    });
  }

  // Load trainee measurements (InBody data)
  onTraineeSelect(event: any): void {
    const traineeId = event.value;
    if (traineeId) {
      this.loadTraineeMeasurements(traineeId);
    }
  }

  loadTraineeMeasurements(traineeId: string): void {
    this.coachService.getMeasurements(traineeId).subscribe({
      next: (measurements) => {
        if (measurements && measurements.length > 0) {
          // Get the most recent measurement
          const latest = measurements[0];
          this.bmrInputs.weight = latest.weight || 0;
          this.bmrInputs.height = latest.height || 0;

          // If InBody has BMR, show notification
          if (this.bmrInputs.weight > 0 || this.bmrInputs.height > 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'بيانات InBody',
              detail: 'تم تحميل بيانات القياسات للمتدرب'
            });
          }

          // Auto-calculate if we have enough data
          if (this.canCalculateBMR()) {
            this.calculateBMRAndTDEE();
          }
        }
      },
      error: () => {
        // Silently fail - user can manually enter data
      }
    });
  }

  ngOnInit(): void {
    this.planId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.planId;

    // Load foods and trainees first, then load plan if in edit mode
    forkJoin({
      foods: this.coachService.getFoods(),
      trainees: this.coachService.getTrainees()
    }).subscribe({
      next: ({ foods, trainees }) => {
        // Set foods
        this.foods.set(foods);
        this.foodOptions = foods.map(f => ({
          label: f.nameAr || f.name,
          value: f.id,
          data: f
        }));

        // Set trainees
        this.trainees.set(trainees);
        this.traineeOptions = trainees.map(t => ({
          label: t.clientName || t.fullName || t.profile?.fullName || '',
          value: t.clientId || t.id,
          trainee: t
        }));

        // Now load plan if in edit mode
        if (this.isEditMode && this.planId) {
          this.loadPlan(this.planId);
        } else {
          // Add default meals
          this.addMeal('الفطور', '08:00');
          this.addMeal('وجبة خفيفة', '11:00');
          this.addMeal('الغداء', '14:00');
          this.addMeal('العشاء', '20:00');
        }
      },
      error: () => {
        // Fallback - load with mock data
        this.loadFoods();
        this.loadTrainees();

        if (this.isEditMode && this.planId) {
          setTimeout(() => this.loadPlan(this.planId!), 500);
        } else {
          this.addMeal('الفطور', '08:00');
          this.addMeal('وجبة خفيفة', '11:00');
          this.addMeal('الغداء', '14:00');
          this.addMeal('العشاء', '20:00');
        }
      }
    });
  }

  loadTrainees(): void {
    this.coachService.getTrainees().subscribe({
      next: (data) => {
        this.trainees.set(data);
        this.traineeOptions = data.map(t => ({
          label: t.clientName || t.fullName || t.profile?.fullName || '',
          value: t.clientId || t.id,
          trainee: t
        }));
      },
      error: () => {
        // Fallback mock data for development
        const mockTrainees: Trainee[] = [
          { id: '1', fullName: 'محمد أحمد', phoneNumber: '01012345678', email: '', subscriptionStatus: 'active', isActive: true, startDate: '', progressPercentage: 0, sessionsCompleted: 0, totalSessions: 0, workoutProgramsCount: 2, dietPlansCount: 1 } as Trainee,
          { id: '2', fullName: 'خالد محمود', phoneNumber: '01123456789', email: '', subscriptionStatus: 'active', isActive: true, startDate: '', progressPercentage: 0, sessionsCompleted: 0, totalSessions: 0, workoutProgramsCount: 1, dietPlansCount: 0 } as Trainee,
          { id: '3', fullName: 'أحمد سمير', phoneNumber: '01234567890', email: '', subscriptionStatus: 'expired', isActive: false, startDate: '', progressPercentage: 0, sessionsCompleted: 0, totalSessions: 0, workoutProgramsCount: 0, dietPlansCount: 1 } as Trainee,
          { id: '4', fullName: 'يوسف كريم', phoneNumber: '01098765432', email: '', subscriptionStatus: 'pending', isActive: true, startDate: '', progressPercentage: 0, sessionsCompleted: 0, totalSessions: 0, workoutProgramsCount: 0, dietPlansCount: 0 } as Trainee
        ];
        this.traineeOptions = mockTrainees.map(t => ({
          label: t.fullName || '',
          value: t.id,
          trainee: t
        }));
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getSelectedTraineeName(): string {
    const clientId = this.form.get('clientId')?.value;
    if (!clientId) return '-';
    const trainee = this.traineeOptions.find(t => t.value === clientId);
    return trainee?.label || '-';
  }

  getStepLabel(): string {
    switch (this.currentStep) {
      case 0: return 'الخطوة 1: المعلومات الأساسية';
      case 1: return 'الخطوة 2: بناء الوجبات';
      case 2: return 'الخطوة 3: المراجعة والحفظ';
      default: return '';
    }
  }

  getFoodName(mealIndex: number, foodIndex: number): string {
    const foodId = this.getFoodsArray(mealIndex).at(foodIndex)?.get('foodId')?.value;
    if (!foodId) return '-';
    const food = this.foods().find(f => f.id === foodId || f.id === parseInt(foodId));
    return food?.name || '-';
  }

  canSave(): boolean {
    // Check if form is valid and has at least one meal with food items
    if (!this.form.valid) return false;
    if (this.mealsArray.length === 0) return false;

    // Check if at least one meal has food items
    for (let i = 0; i < this.mealsArray.length; i++) {
      const foods = this.getFoodsArray(i);
      if (foods.length > 0) return true;
    }
    return false;
  }

  loadFoods(): void {
    this.coachService.getFoods().subscribe({
      next: (data) => {
        this.foods.set(data);
        this.foodOptions = data.map(f => ({
          label: f.nameAr || f.name,
          value: f.id,
          data: f
        }));
      },
      error: () => {
        // Fallback mock data
        const mockFoods: Food[] = [
          { id: 1, name: 'صدر دجاج مشوي', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, fatPer100g: 3.6, category: 'بروتين', servingSize: 150, servingUnit: 'g', isGlobal: true },
          { id: 2, name: 'أرز أبيض مطبوخ', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, fatPer100g: 0.3, category: 'كربوهيدرات', servingSize: 150, servingUnit: 'g', isGlobal: true },
          { id: 3, name: 'بيض مسلوق', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, fatPer100g: 11, category: 'بروتين', servingSize: 50, servingUnit: 'g', isGlobal: true },
          { id: 4, name: 'شوفان', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatsPer100g: 7, fatPer100g: 7, category: 'كربوهيدرات', servingSize: 40, servingUnit: 'g', isGlobal: true },
          { id: 5, name: 'موز', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, fatPer100g: 0.3, category: 'فواكه', servingSize: 120, servingUnit: 'g', isGlobal: true },
          { id: 6, name: 'سلمون مشوي', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, fatPer100g: 13, category: 'بروتين', servingSize: 150, servingUnit: 'g', isGlobal: true },
          { id: 7, name: 'زبادي يوناني', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatsPer100g: 0.7, fatPer100g: 0.7, category: 'ألبان', servingSize: 170, servingUnit: 'g', isGlobal: true },
          { id: 8, name: 'لوز', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, fatPer100g: 50, category: 'مكسرات', servingSize: 30, servingUnit: 'g', isGlobal: true },
          { id: 9, name: 'بطاطا حلوة', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatsPer100g: 0.1, fatPer100g: 0.1, category: 'كربوهيدرات', servingSize: 150, servingUnit: 'g', isGlobal: true },
          { id: 10, name: 'بروكلي', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4, fatPer100g: 0.4, category: 'خضروات', servingSize: 100, servingUnit: 'g', isGlobal: true }
        ];
        this.foods.set(mockFoods);
        this.foodOptions = mockFoods.map(f => ({
          label: f.name,
          value: f.id,
          data: f
        }));
      }
    });
  }

  loadPlan(id: string): void {
    this.coachService.getDietPlanById(id).subscribe({
      next: (plan: any) => {
        console.log('=== Diet Plan API Response ===');
        console.log('Full plan:', plan);
        console.log('Meals count:', plan.meals?.length ?? 0);
        if (plan.meals && plan.meals.length > 0) {
          plan.meals.forEach((meal: any, i: number) => {
            console.log(`Meal ${i + 1}:`, meal.mealName || meal.name, '- Items:', meal.items?.length ?? 0);
            if (meal.items) {
              meal.items.forEach((item: any, j: number) => {
                console.log(`  Item ${j + 1}:`, item.foodName, '- Qty:', item.assignedQuantity);
              });
            }
          });
        }
        console.log('==============================');

        // Map Backend field names to Frontend field names
        this.form.patchValue({
          clientId: plan.clientId || '',
          startDate: plan.startDate ? new Date(plan.startDate) : new Date(),
          endDate: plan.endDate ? new Date(plan.endDate) : null,
          status: plan.status ?? 0,
          name: plan.name,
          description: plan.description,
          totalCalories: plan.targetCalories ?? plan.totalCalories ?? 0,
          proteinGrams: plan.targetProtein ?? plan.proteinGrams ?? 0,
          carbsGrams: plan.targetCarbs ?? plan.carbsGrams ?? 0,
          fatGrams: plan.targetFats ?? plan.fatGrams ?? 0,
          mealsPerDay: plan.meals?.length ?? plan.mealsPerDay ?? 3
        });

        // Clear existing meals first
        while (this.mealsArray.length > 0) {
          this.mealsArray.removeAt(0);
        }

        // Load meals if available and not empty
        if (plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
          console.log('Loading meals:', plan.meals);
          plan.meals.forEach((meal: any) => {
            this.addMealWithData(meal);
          });
        } else {
          console.log('No meals found, adding defaults');
          // Add default meals if none exist
          this.addMeal('الفطور', '08:00');
          this.addMeal('الغداء', '14:00');
          this.addMeal('العشاء', '20:00');
        }
      },
      error: (err) => {
        console.error('Error loading diet plan:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تحميل الخطة'
        });
      }
    });
  }

  setMealsPerDay(num: number): void {
    this.form.patchValue({ mealsPerDay: num });
  }

  toggleMeal(index: number): void {
    this.expandedMeal = this.expandedMeal === index ? null : index;
  }

  addMeal(name: string = '', time: string = ''): void {
    const mealGroup = this.fb.group({
      name: [name],
      time: [time],
      foods: this.fb.array([])
    });
    this.mealsArray.push(mealGroup);
    this.expandedMeal = this.mealsArray.length - 1;
  }

  addMealWithData(mealData: any): void {
    // Map Backend field names: mealName → name, items → foods
    const mealGroup = this.fb.group({
      id: [mealData.id || ''],
      name: [mealData.mealName || mealData.name || ''],
      time: [mealData.time || ''],
      foods: this.fb.array([])
    });

    // Backend uses 'items', Frontend uses 'foods'
    const foodItems = mealData.items || mealData.foods || [];
    if (Array.isArray(foodItems)) {
      foodItems.forEach((food: any) => {
        // Ensure foodId type matches options (convert to number for consistency with API)
        const foodIdValue = food.foodId !== undefined && food.foodId !== null
          ? (typeof food.foodId === 'string' ? parseInt(food.foodId, 10) : food.foodId)
          : '';

        const foodGroup = this.fb.group({
          id: [food.id || ''],
          foodId: [foodIdValue, Validators.required],
          // Backend uses 'assignedQuantity', Frontend uses 'quantity'
          quantity: [food.assignedQuantity ?? food.quantity ?? 100, Validators.required],
          unit: [food.unit || 'g'],
          calories: [food.calcCalories ?? food.calories ?? 0],
          protein: [food.calcProtein ?? food.protein ?? 0],
          carbs: [food.calcCarbs ?? food.carbs ?? 0],
          fat: [food.calcFats ?? food.fats ?? food.fat ?? 0]
        });
        (mealGroup.get('foods') as FormArray).push(foodGroup);
      });
    }

    this.mealsArray.push(mealGroup);
  }

  removeMeal(index: number): void {
    this.mealsArray.removeAt(index);
    if (this.expandedMeal === index) {
      this.expandedMeal = null;
    } else if (this.expandedMeal !== null && this.expandedMeal > index) {
      this.expandedMeal--;
    }
  }

  addFood(mealIndex: number): void {
    // Check calorie limit before adding
    if (this.isCalorieLimitReached()) {
      this.showCannotAddFoodAlert();
      return;
    }

    const foodGroup = this.fb.group({
      foodId: ['', Validators.required],
      quantity: [100, Validators.required],
      unit: ['g'],
      calories: [0],
      protein: [0],
      carbs: [0],
      fat: [0]
    });
    this.getFoodsArray(mealIndex).push(foodGroup);
  }

  removeFood(mealIndex: number, foodIndex: number): void {
    this.getFoodsArray(mealIndex).removeAt(foodIndex);
  }

  onFoodSelect(event: any, mealIndex: number, foodIndex: number): void {
    const foodId = event.value;
    const food = this.foods().find(f => f.id === foodId);
    if (food) {
      const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
      const quantity = foodControl.get('quantity')?.value || 100;
      foodControl.patchValue({
        unit: food.servingUnit || 'g',
        calories: Math.round((food.caloriesPer100g * quantity) / 100),
        protein: Math.round((food.proteinPer100g * quantity) / 100),
        carbs: Math.round((food.carbsPer100g * quantity) / 100),
        fat: Math.round(((food.fatPer100g || food.fatsPer100g || 0) * quantity) / 100)
      });

      // Check if limit reached after selection
      setTimeout(() => this.checkAndAlertCalorieLimit(), 100);
    }
  }

  updateFoodMacros(mealIndex: number, foodIndex: number): void {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const foodId = foodControl.get('foodId')?.value;
    const quantity = foodControl.get('quantity')?.value || 0;
    const food = this.foods().find(f => f.id === foodId);

    if (food) {
      foodControl.patchValue({
        calories: Math.round((food.caloriesPer100g * quantity) / 100),
        protein: Math.round((food.proteinPer100g * quantity) / 100),
        carbs: Math.round((food.carbsPer100g * quantity) / 100),
        fat: Math.round(((food.fatPer100g || food.fatsPer100g || 0) * quantity) / 100)
      });

      // Check if limit reached after update
      setTimeout(() => this.checkAndAlertCalorieLimit(), 100);
    }
  }

  getFoodUnit(mealIndex: number, foodIndex: number): string {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    return foodControl?.get('unit')?.value || 'g';
  }

  getFoodCalories(mealIndex: number, foodIndex: number): number {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const foodId = foodControl?.get('foodId')?.value;
    const quantity = foodControl?.get('quantity')?.value || 0;
    const food = this.foods().find(f => f.id === foodId);
    if (food) {
      return Math.round((food.caloriesPer100g * quantity) / 100);
    }
    return 0;
  }

  getFoodCaloriesFromOption(foodId: string): number {
    const food = this.foods().find(f => f.id === foodId);
    return food ? food.caloriesPer100g : 0;
  }

  getFoodDataFromOption(foodId: string, type: 'protein' | 'carbs' | 'fat'): number {
    const food = this.foods().find(f => f.id === foodId);
    if (!food) return 0;
    switch (type) {
      case 'protein': return Math.round(food.proteinPer100g);
      case 'carbs': return Math.round(food.carbsPer100g);
      case 'fat': return Math.round(food.fatPer100g || food.fatsPer100g || 0);
      default: return 0;
    }
  }

  incrementQuantity(mealIndex: number, foodIndex: number): void {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const currentValue = foodControl.get('quantity')?.value || 0;
    foodControl.patchValue({ quantity: currentValue + 10 });
    this.updateFoodMacros(mealIndex, foodIndex);
  }

  decrementQuantity(mealIndex: number, foodIndex: number): void {
    const foodControl = this.getFoodsArray(mealIndex).at(foodIndex);
    const currentValue = foodControl.get('quantity')?.value || 0;
    if (currentValue > 10) {
      foodControl.patchValue({ quantity: currentValue - 10 });
      this.updateFoodMacros(mealIndex, foodIndex);
    }
  }

  previewPlan(): void {
    // Open preview in new window
    const formValue = this.form.value;
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    // Get coach and client details
    const user = this.authService.user();
    const coachName = user?.fullName || 'المدرب';
    const coachPhone = user?.phoneNumber || '';
    const client = this.trainees().find(t => t.id === formValue.clientId || t.clientId === formValue.clientId);
    const clientName = client?.fullName || client?.clientName || 'المتدرب';
    const clientPhone = client?.phoneNumber || client?.clientPhone || '';
    const clientEmail = client?.email || client?.clientEmail || '';
    const startDate = formValue.startDate ? new Date(formValue.startDate).toLocaleDateString('ar-EG') : '-';
    const endDate = formValue.endDate ? new Date(formValue.endDate).toLocaleDateString('ar-EG') : '-';
    const today = new Date().toLocaleDateString('ar-EG');

    const mealsHtml = formValue.meals.map((meal: any, i: number) => {
      const foodsHtml = meal.foods.map((f: any) => {
        const food = this.foods().find(fd => fd.id === f.foodId);
        const calories = this.getFoodCaloriesForPreview(f.foodId, f.quantity);
        const protein = food ? Math.round((food.proteinPer100g * f.quantity) / 100) : 0;
        const carbs = food ? Math.round((food.carbsPer100g * f.quantity) / 100) : 0;
        const fats = food ? Math.round(((food.fatPer100g || food.fatsPer100g || 0) * f.quantity) / 100) : 0;
        return `
          <tr>
            <td style="font-weight: 500;">${food?.name || '-'}</td>
            <td>${f.quantity} ${f.unit}</td>
            <td class="cal">${calories}</td>
            <td class="prot">${protein}g</td>
            <td class="carb">${carbs}g</td>
            <td class="fat">${fats}g</td>
          </tr>
        `;
      }).join('');

      // Calculate meal totals
      const mealCalories = meal.foods.reduce((sum: number, f: any) => sum + this.getFoodCaloriesForPreview(f.foodId, f.quantity), 0);

      return `
        <div class="meal-card">
          <div class="meal-header">
            <div class="meal-title">
              <span class="meal-icon">🍽️</span>
              <span class="meal-name">${meal.name || 'الوجبة ' + (i + 1)}</span>
            </div>
            <div class="meal-time">${meal.time || '--:--'}</div>
            <div class="meal-calories">${mealCalories} سعرة</div>
          </div>
          <table class="foods-table">
            <thead>
              <tr>
                <th>الطعام</th>
                <th>الكمية</th>
                <th>سعرات</th>
                <th>بروتين</th>
                <th>كارب</th>
                <th>دهون</th>
              </tr>
            </thead>
            <tbody>
              ${foodsHtml || '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">لا توجد أطعمة</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>خطة التغذية - ${clientName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', sans-serif;
            background: #f8fafc;
            padding: 0;
            color: #1e293b;
            line-height: 1.6;
          }

          .page {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
          }

          /* Header Section */
          .document-header {
            background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
            color: white;
            padding: 40px;
            border-radius: 24px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
          }

          .document-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 25px;
            position: relative;
          }

          .brand-logo {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .brand-text {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -1px;
          }

          .document-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
          }

          .document-subtitle {
            font-size: 16px;
            opacity: 0.9;
          }

          /* Info Cards */
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }

          .info-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
          }

          .info-card-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 600;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            color: #64748b;
            font-size: 14px;
          }

          .info-value {
            font-weight: 600;
            color: #1e293b;
          }

          .coach-name {
            color: #059669;
            font-weight: 700;
          }

          .client-name {
            color: #3b82f6;
            font-weight: 700;
          }

          /* Macros Section */
          .macros-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }

          .macro-card {
            background: white;
            border-radius: 16px;
            padding: 24px 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 2px solid transparent;
            transition: all 0.3s;
          }

          .macro-card.calories { border-color: #fbbf24; background: linear-gradient(135deg, #fffbeb 0%, white 100%); }
          .macro-card.protein { border-color: #f87171; background: linear-gradient(135deg, #fef2f2 0%, white 100%); }
          .macro-card.carbs { border-color: #60a5fa; background: linear-gradient(135deg, #eff6ff 0%, white 100%); }
          .macro-card.fat { border-color: #4ade80; background: linear-gradient(135deg, #f0fdf4 0%, white 100%); }

          .macro-value {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 4px;
          }

          .macro-card.calories .macro-value { color: #d97706; }
          .macro-card.protein .macro-value { color: #dc2626; }
          .macro-card.carbs .macro-value { color: #2563eb; }
          .macro-card.fat .macro-value { color: #16a34a; }

          .macro-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }

          /* Meal Cards */
          .meals-section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .meal-card {
            background: white;
            border-radius: 16px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .meal-header {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .meal-title {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
          }

          .meal-icon {
            font-size: 24px;
          }

          .meal-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
          }

          .meal-time {
            background: #059669;
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }

          .meal-calories {
            background: #fef3c7;
            color: #d97706;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
          }

          .foods-table {
            width: 100%;
            border-collapse: collapse;
          }

          .foods-table th {
            background: #f8fafc;
            padding: 14px 20px;
            text-align: right;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .foods-table td {
            padding: 14px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }

          .foods-table tr:last-child td {
            border-bottom: none;
          }

          .foods-table .cal { color: #d97706; font-weight: 600; }
          .foods-table .prot { color: #dc2626; font-weight: 600; }
          .foods-table .carb { color: #2563eb; font-weight: 600; }
          .foods-table .fat { color: #16a34a; font-weight: 600; }

          /* Footer */
          .document-footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px dashed #e2e8f0;
            text-align: center;
          }

          .footer-note {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 15px;
          }

          .footer-brand {
            font-size: 18px;
            font-weight: 700;
            color: #059669;
          }

          .footer-date {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 10px;
          }

          /* Actions - Hidden in Print */
          .actions {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 16px;
          }

          .btn {
            padding: 14px 40px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 0 10px;
            font-family: 'Cairo', sans-serif;
            transition: all 0.3s;
          }

          .btn-print {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
          }

          .btn-print:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
          }

          .btn-close {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-close:hover {
            background: #e2e8f0;
          }

          /* Print Styles */
          @media print {
            body {
              background: white;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page {
              padding: 20px;
              max-width: 100%;
            }

            .document-header {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .actions {
              display: none !important;
            }

            .meal-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .macro-card {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="document-header">
            <div class="brand">
              <div class="brand-logo">💪</div>
              <div class="brand-text">LogicFit</div>
            </div>
            <h1 class="document-title">🥗 ${formValue.name || 'خطة التغذية'}</h1>
            <p class="document-subtitle">${formValue.description || 'خطة تغذية مخصصة لتحقيق أهدافك الصحية'}</p>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-card">
              <div class="info-card-title">معلومات المتدرب</div>
              <div class="info-row">
                <span class="info-label">الاسم</span>
                <span class="info-value client-name">${clientName}</span>
              </div>
              ${clientPhone ? `<div class="info-row">
                <span class="info-label">رقم الهاتف</span>
                <span class="info-value">${clientPhone}</span>
              </div>` : ''}
              ${clientEmail ? `<div class="info-row">
                <span class="info-label">البريد الإلكتروني</span>
                <span class="info-value">${clientEmail}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">تاريخ البداية</span>
                <span class="info-value">${startDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ النهاية</span>
                <span class="info-value">${endDate}</span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-title">معلومات المدرب</div>
              <div class="info-row">
                <span class="info-label">المدرب</span>
                <span class="info-value coach-name">${coachName}</span>
              </div>
              ${coachPhone ? `<div class="info-row">
                <span class="info-label">رقم الهاتف</span>
                <span class="info-value">${coachPhone}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">عدد الوجبات</span>
                <span class="info-value">${formValue.meals?.length || 0} وجبات</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ الإنشاء</span>
                <span class="info-value">${today}</span>
              </div>
            </div>
          </div>

          <!-- Macros -->
          <div class="macros-grid">
            <div class="macro-card calories">
              <div class="macro-value">${formValue.totalCalories || 0}</div>
              <div class="macro-label">سعرة حرارية</div>
            </div>
            <div class="macro-card protein">
              <div class="macro-value">${formValue.proteinGrams || 0}g</div>
              <div class="macro-label">بروتين</div>
            </div>
            <div class="macro-card carbs">
              <div class="macro-value">${formValue.carbsGrams || 0}g</div>
              <div class="macro-label">كربوهيدرات</div>
            </div>
            <div class="macro-card fat">
              <div class="macro-value">${formValue.fatGrams || 0}g</div>
              <div class="macro-label">دهون</div>
            </div>
          </div>

          <!-- Meals -->
          <div class="meals-section-title">📋 جدول الوجبات اليومية</div>
          ${mealsHtml}

          <!-- Footer -->
          <div class="document-footer">
            <p class="footer-note">💡 التزم بهذه الخطة للحصول على أفضل النتائج. استشر مدربك لأي تعديلات.</p>
            <div class="footer-brand">LogicFit - نظامك الرياضي الذكي</div>
            <p class="footer-date">تم إنشاء هذا المستند في ${today}</p>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button class="btn btn-print" onclick="window.print()">🖨️ طباعة</button>
            <button class="btn btn-close" onclick="window.close()">إغلاق</button>
          </div>
        </div>
      </body>
      </html>
    `;

    previewWindow.document.write(html);
    previewWindow.document.close();
  }

  getFoodCaloriesForPreview(foodId: string, quantity: number): number {
    const food = this.foods().find(f => f.id === foodId);
    if (food) {
      return Math.round((food.caloriesPer100g * quantity) / 100);
    }
    return 0;
  }

  printPlan(): void {
    this.previewPlan();
  }

  // Wizard Navigation Methods
  nextStep(): void {
    if (this.currentStep < 2 && this.canProceedToNextStep()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step <= 2) {
      // Allow going back freely, but validate before going forward
      if (step > this.currentStep) {
        if (this.canProceedToNextStep()) {
          this.currentStep = step;
        }
      } else {
        this.currentStep = step;
      }
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 0: // Step 1: Basic Info - need name and client
        return !!(this.form.get('name')?.value && this.form.get('clientId')?.value);
      case 1: // Step 2: Meals - need at least one meal
        return this.mealsArray.length > 0;
      case 2: // Step 3: Review
        return true;
      default:
        return false;
    }
  }

  getStepValidationMessage(): string {
    switch (this.currentStep) {
      case 0:
        if (!this.form.get('name')?.value) return 'يرجى إدخال اسم الخطة';
        if (!this.form.get('clientId')?.value) return 'يرجى اختيار المتدرب';
        return '';
      case 1:
        if (this.mealsArray.length === 0) return 'يرجى إضافة وجبة واحدة على الأقل';
        return '';
      default:
        return '';
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Drag & Drop for meals
  onMealDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mealsArray.controls, event.previousIndex, event.currentIndex);
  }

  // Drag & Drop for foods within a meal
  onFoodDrop(event: CdkDragDrop<any[]>, mealIndex: number): void {
    const foodsArray = this.getFoodsArray(mealIndex);
    moveItemInArray(foodsArray.controls, event.previousIndex, event.currentIndex);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;

    // Format dates as ISO strings
    const startDateFormatted = formValue.startDate instanceof Date
      ? formValue.startDate.toISOString().split('T')[0]
      : formValue.startDate;

    const endDateFormatted = formValue.endDate instanceof Date
      ? formValue.endDate.toISOString().split('T')[0]
      : formValue.endDate;

    if (this.isEditMode && this.planId) {
      // Update mode - update basic plan info first
      const updateData: any = {
        clientId: formValue.clientId,
        name: formValue.name,
        description: formValue.description,
        startDate: startDateFormatted,
        status: formValue.status,
        targetCalories: formValue.totalCalories,
        targetProtein: formValue.proteinGrams,
        targetCarbs: formValue.carbsGrams,
        targetFats: formValue.fatGrams
      };

      if (endDateFormatted) {
        updateData.endDate = endDateFormatted;
      }

      this.coachService.updateDietPlan(this.planId, updateData).pipe(
        // After updating plan, handle meals
        switchMap(() => this.updateMealsSequentially(formValue.meals))
      ).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم تحديث الخطة بنجاح'
          });
          setTimeout(() => {
            this.router.navigate(['/coach/diet-plans']);
          }, 1000);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error updating diet plan:', err);
          const errorMessage = err?.translatedMessage || err?.error?.message || 'فشل في تحديث الخطة';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    } else {
      // Create mode - use sequential API calls
      const planData: any = {
        clientId: formValue.clientId,
        name: formValue.name,
        startDate: startDateFormatted,
        targetCalories: formValue.totalCalories,
        targetProtein: formValue.proteinGrams,
        targetCarbs: formValue.carbsGrams,
        targetFats: formValue.fatGrams
      };

      if (endDateFormatted) {
        planData.endDate = endDateFormatted;
      }

      // Step 1: Create the plan
      this.coachService.createDietPlan(planData).pipe(
        switchMap((response: any) => {
          // Get the plan ID from response
          const planId = response?.id || response;
          if (!planId) {
            throw new Error('لم يتم استلام معرف الخطة');
          }

          // Step 2: Add meals sequentially
          const meals = formValue.meals || [];
          if (meals.length === 0) {
            return of(null);
          }

          return from(meals).pipe(
            concatMap((meal: any, index: number) => {
              const mealData = {
                name: meal.name || `وجبة ${index + 1}`,
                orderIndex: index
              };

              return this.coachService.addMealToPlan(planId, mealData).pipe(
                switchMap((mealResponse: any) => {
                  const mealId = mealResponse?.id || mealResponse;
                  const foods = meal.foods || [];

                  if (foods.length === 0 || !mealId) {
                    return of(null);
                  }

                  // Step 3: Add food items to this meal sequentially
                  return from(foods).pipe(
                    concatMap((food: any) => {
                      const itemData = {
                        foodId: typeof food.foodId === 'string' ? parseInt(food.foodId, 10) : food.foodId,
                        assignedQuantity: food.quantity || 100
                      };
                      return this.coachService.addItemToMeal(mealId, itemData);
                    })
                  );
                })
              );
            })
          );
        })
      ).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم إنشاء الخطة بنجاح'
          });
          setTimeout(() => {
            this.router.navigate(['/coach/diet-plans']);
          }, 1000);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error creating diet plan:', err);
          const errorMessage = err?.translatedMessage || err?.error?.message || 'فشل في إنشاء الخطة';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    }
  }

  // Helper method to update meals sequentially in edit mode
  private updateMealsSequentially(meals: any[]) {
    if (!meals || meals.length === 0) {
      return of(null);
    }

    return from(meals).pipe(
      concatMap((meal: any, index: number) => {
        // If meal has an ID, update it; otherwise, add new meal
        if (meal.id) {
          // Update existing meal
          const mealData = {
            name: meal.name || `وجبة ${index + 1}`,
            orderIndex: index
          };

          return this.coachService.updateMeal(meal.id, mealData).pipe(
            switchMap(() => this.updateFoodItemsSequentially(meal.id, meal.foods || []))
          );
        } else if (this.planId) {
          // Add new meal to existing plan
          const mealData = {
            name: meal.name || `وجبة ${index + 1}`,
            orderIndex: index
          };

          return this.coachService.addMealToPlan(this.planId, mealData).pipe(
            switchMap((mealResponse: any) => {
              const mealId = mealResponse?.id || mealResponse;
              if (!mealId) return of(null);
              return this.addFoodItemsToMeal(mealId, meal.foods || []);
            })
          );
        }
        return of(null);
      })
    );
  }

  // Helper method to update food items sequentially
  private updateFoodItemsSequentially(mealId: string, foods: any[]) {
    if (!foods || foods.length === 0) {
      return of(null);
    }

    return from(foods).pipe(
      concatMap((food: any) => {
        if (food.id) {
          // Update existing food item
          const itemData = {
            assignedQuantity: food.quantity || 100
          };
          return this.coachService.updateMealItem(food.id, itemData);
        } else {
          // Add new food item
          const itemData = {
            foodId: typeof food.foodId === 'string' ? parseInt(food.foodId, 10) : food.foodId,
            assignedQuantity: food.quantity || 100
          };
          return this.coachService.addItemToMeal(mealId, itemData);
        }
      })
    );
  }

  // Helper method to add food items to a meal
  private addFoodItemsToMeal(mealId: string, foods: any[]) {
    if (!foods || foods.length === 0) {
      return of(null);
    }

    return from(foods).pipe(
      concatMap((food: any) => {
        const itemData = {
          foodId: typeof food.foodId === 'string' ? parseInt(food.foodId, 10) : food.foodId,
          assignedQuantity: food.quantity || 100
        };
        return this.coachService.addItemToMeal(mealId, itemData);
      })
    );
  }
}
