import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CoachService, Exercise, WorkoutProgram, Trainee } from '../services/coach.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { forkJoin, from, switchMap, concatMap, of, lastValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { trigger, transition, style, animate } from '@angular/animations';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WizardStepperComponent, WizardStep } from '../../../shared/components/wizard-stepper/wizard-stepper.component';
import { LiveSummarySidebarComponent, WorkoutSummaryData } from '../../../shared/components/live-summary-sidebar/live-summary-sidebar.component';

interface DayExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
}

interface WorkoutDay {
  name: string;
  exercises: DayExercise[];
}

@Component({
  selector: 'app-program-builder',
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
    PageHeaderComponent,
    ToastModule,
    DragDropModule,
    WizardStepperComponent,
    LiveSummarySidebarComponent
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

    <div class="workout-builder-wizard">
      <!-- Wizard Header -->
      <div class="wizard-header">
        <div class="header-content">
          <a routerLink="/coach/workout-programs" class="back-btn">
            <i class="pi pi-arrow-right"></i>
          </a>
          <div class="header-title">
            <h1>{{ isEditMode ? 'تعديل برنامج التمرين' : 'إنشاء برنامج تمرين جديد' }}</h1>
            <p>{{ getStepDescription() }}</p>
          </div>
        </div>
        <app-wizard-stepper
          [steps]="wizardSteps"
          [currentStep]="currentStep"
          [theme]="'workout'"
          [allowStepClick]="true"
          (stepChange)="goToStep($event)"
        ></app-wizard-stepper>
        <div class="header-actions">
          <button type="button" class="action-btn secondary" (click)="previewProgram()" pTooltip="معاينة">
            <i class="pi pi-eye"></i>
          </button>
          <button
            type="button"
            class="action-btn primary"
            (click)="onSubmit()"
            [disabled]="!canSave() || saving()"
          >
            @if (saving()) {
              <i class="pi pi-spin pi-spinner"></i>
            } @else {
              <i class="pi pi-check"></i>
            }
            <span>{{ isEditMode ? 'حفظ التعديلات' : 'حفظ البرنامج' }}</span>
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="wizard-body">
        <form [formGroup]="form">
          <!-- Main Content -->
          <div class="wizard-main" [class.with-sidebar]="currentStep === 1">

            <!-- Step 1: Basic Info -->
            @if (currentStep === 0) {
              <div class="step-content" @fadeSlide>
                <div class="info-grid">
                  <!-- Trainee Selection Card -->
                  <div class="info-card trainee-card">
                    <div class="card-header">
                      <div class="card-icon">
                        <i class="pi pi-user"></i>
                      </div>
                      <h3>اختيار المتدرب</h3>
                    </div>
                    <div class="card-body">
                      <p-dropdown
                        [options]="traineeOptions"
                        formControlName="clientId"
                        placeholder="اختر المتدرب..."
                        [filter]="true"
                        filterPlaceholder="بحث..."
                        [showClear]="true"
                        [style]="{width: '100%'}"
                        appendTo="body"
                        styleClass="premium-dropdown"
                      >
                        <ng-template pTemplate="selectedItem" let-item>
                          <div class="selected-trainee">
                            <span class="avatar">{{ getInitials(item.label) }}</span>
                            <span>{{ item.label }}</span>
                          </div>
                        </ng-template>
                        <ng-template pTemplate="item" let-item>
                          <div class="dropdown-trainee">
                            <span class="avatar">{{ getInitials(item.label) }}</span>
                            <span>{{ item.label }}</span>
                          </div>
                        </ng-template>
                      </p-dropdown>
                    </div>
                  </div>

                  <!-- Program Info Card -->
                  <div class="info-card program-card">
                    <div class="card-header">
                      <div class="card-icon">
                        <i class="pi pi-bookmark"></i>
                      </div>
                      <h3>معلومات البرنامج</h3>
                    </div>
                    <div class="card-body">
                      <div class="form-group">
                        <label>اسم البرنامج</label>
                        <input
                          type="text"
                          pInputText
                          formControlName="name"
                          placeholder="مثال: برنامج بناء العضلات للمبتدئين"
                        />
                      </div>
                      <div class="form-group">
                        <label>الوصف (اختياري)</label>
                        <textarea
                          pInputTextarea
                          formControlName="description"
                          rows="3"
                          placeholder="وصف مختصر للبرنامج..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Duration Card -->
                  <div class="info-card duration-card">
                    <div class="card-header">
                      <div class="card-icon">
                        <i class="pi pi-calendar"></i>
                      </div>
                      <h3>مدة البرنامج</h3>
                    </div>
                    <div class="card-body">
                      <!-- Quick Duration Buttons -->
                      <div class="quick-duration-btns">
                        <button type="button" class="quick-btn" [class.active]="form.get('durationWeeks')?.value === 4" (click)="setDuration(4)">
                          4 أسابيع
                        </button>
                        <button type="button" class="quick-btn" [class.active]="form.get('durationWeeks')?.value === 8" (click)="setDuration(8)">
                          8 أسابيع
                        </button>
                        <button type="button" class="quick-btn" [class.active]="form.get('durationWeeks')?.value === 12" (click)="setDuration(12)">
                          12 أسبوع
                        </button>
                      </div>
                      <div class="duration-control">
                        <button type="button" class="ctrl-btn" (click)="decrementWeeks()" [disabled]="form.get('durationWeeks')?.value <= 1">
                          <i class="pi pi-minus"></i>
                        </button>
                        <div class="duration-display">
                          <span class="value">{{ form.get('durationWeeks')?.value }}</span>
                          <span class="label">أسبوع</span>
                          <span class="days-info">≈ {{ form.get('durationWeeks')?.value * 7 }} يوم</span>
                        </div>
                        <button type="button" class="ctrl-btn" (click)="incrementWeeks()">
                          <i class="pi pi-plus"></i>
                        </button>
                      </div>
                      <div class="date-field">
                        <label>تاريخ البدء</label>
                        <p-calendar
                          formControlName="startDate"
                          [showIcon]="true"
                          dateFormat="yy-mm-dd"
                          placeholder="اختر تاريخ البدء"
                          [style]="{width: '100%'}"
                          appendTo="body"
                        ></p-calendar>
                      </div>
                    </div>
                  </div>

                  <!-- Goal Card -->
                  <div class="info-card goal-card">
                    <div class="card-header">
                      <div class="card-icon">
                        <i class="pi pi-flag"></i>
                      </div>
                      <h3>هدف البرنامج</h3>
                    </div>
                    <div class="card-body">
                      <div class="goal-options">
                        @for (goal of goalOptions; track goal.value) {
                          <button
                            type="button"
                            class="goal-btn"
                            [class.active]="form.get('goal')?.value === goal.value"
                            (click)="setGoal(goal.value)"
                          >
                            <i [class]="goal.icon"></i>
                            <span>{{ goal.label }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Difficulty Card -->
                  <div class="info-card difficulty-card">
                    <div class="card-header">
                      <div class="card-icon">
                        <i class="pi pi-sliders-h"></i>
                      </div>
                      <h3>مستوى الصعوبة</h3>
                    </div>
                    <div class="card-body">
                      <div class="difficulty-options">
                        @for (diff of difficultyOptions; track diff.value) {
                          <button
                            type="button"
                            class="difficulty-btn"
                            [class.active]="form.get('difficulty')?.value === diff.value"
                            [attr.data-level]="diff.value"
                            (click)="setDifficulty(diff.value)"
                          >
                            {{ diff.label }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Step 2: Build Workout Days -->
            @if (currentStep === 1) {
              <div class="step-content builder-step" @fadeSlide>
                <!-- Days Timeline Header -->
                <div class="days-timeline">
                  <div class="timeline-tabs" cdkDropList cdkDropListOrientation="horizontal" (cdkDropListDropped)="onDayDrop($event)">
                    @for (day of daysArray.controls; track $index; let i = $index) {
                      <div
                        class="timeline-tab"
                        [class.active]="expandedDay === i"
                        (click)="expandedDay = i"
                        cdkDrag
                      >
                        <div class="tab-drag-handle" cdkDragHandle>
                          <i class="pi pi-bars"></i>
                        </div>
                        <span class="tab-num">{{ i + 1 }}</span>
                        <span class="tab-name">{{ day.get('name')?.value || 'يوم ' + (i + 1) }}</span>
                        <span class="tab-badge">{{ getExercisesArray(i).length }}</span>
                      </div>
                    }
                    <button type="button" class="add-day-btn" (click)="addDay()">
                      <i class="pi pi-plus"></i>
                      <span>إضافة يوم</span>
                    </button>
                  </div>
                </div>

                <!-- Active Day Content -->
                <div class="day-builder" formArrayName="days">
                  @for (dayIdx of [expandedDay]; track dayIdx) {
                    @if (dayIdx !== null && daysArray.at(dayIdx)) {
                      <div [formGroupName]="dayIdx" @fadeSlide>
                      <!-- Day Header -->
                      <div class="day-header">
                        <input
                          type="text"
                          pInputText
                          formControlName="name"
                          [placeholder]="'اليوم ' + (dayIdx + 1) + ' - مثال: صدر وترايسبس'"
                          class="day-name-input"
                        />
                        <div class="day-stats">
                          <div class="stat">
                            <i class="pi pi-list"></i>
                            <span>{{ getExercisesArray(dayIdx).length }} تمرين</span>
                          </div>
                          <div class="stat">
                            <i class="pi pi-refresh"></i>
                            <span>{{ getTotalSetsForDay(dayIdx) }} مجموعة</span>
                          </div>
                          <div class="stat volume">
                            <i class="pi pi-chart-bar"></i>
                            <span>{{ getDayTotalVolume(dayIdx) | number:'1.0-0' }} kg</span>
                          </div>
                        </div>
                        @if (daysArray.length > 1) {
                          <button type="button" class="delete-day-btn" (click)="removeDay(dayIdx)">
                            <i class="pi pi-trash"></i>
                          </button>
                        }
                      </div>

                      <!-- Exercises List -->
                      <div
                        class="exercises-container"
                        formArrayName="exercises"
                        cdkDropList
                        (cdkDropListDropped)="onExerciseDrop($event, dayIdx)"
                      >
                        @for (exercise of getExercisesArray(dayIdx).controls; track $index; let j = $index) {
                          <div class="exercise-card" [formGroupName]="j" cdkDrag @fadeSlide>
                            <div class="exercise-drag-placeholder" *cdkDragPlaceholder></div>

                            <!-- Exercise Header -->
                            <div class="exercise-header">
                              <div class="exercise-order" cdkDragHandle>
                                <span class="order-num">{{ j + 1 }}</span>
                                <i class="pi pi-arrows-v drag-icon"></i>
                              </div>
                              <div class="exercise-select">
                                <p-dropdown
                                  [options]="exerciseOptions"
                                  formControlName="exerciseId"
                                  placeholder="اختر التمرين..."
                                  [filter]="true"
                                  filterPlaceholder="بحث..."
                                  [showClear]="true"
                                  [style]="{width: '100%'}"
                                  appendTo="body"
                                  styleClass="exercise-dropdown"
                                  (onChange)="onExerciseSelect($event, dayIdx, j)"
                                >
                                  <ng-template pTemplate="selectedItem" let-item>
                                    <div class="selected-exercise">
                                      <i class="pi pi-bolt"></i>
                                      <span>{{ item?.label }}</span>
                                    </div>
                                  </ng-template>
                                </p-dropdown>
                              </div>
                              <button type="button" class="remove-exercise-btn" (click)="removeExercise(dayIdx, j)">
                                <i class="pi pi-trash"></i>
                              </button>
                            </div>

                            <!-- Exercise Controls -->
                            <div class="exercise-controls">
                              <!-- Sets -->
                              <div class="control-group">
                                <label><i class="pi pi-th-large"></i> المجموعات</label>
                                <div class="stepper">
                                  <button type="button" class="stepper-btn minus" (click)="decrementSets(dayIdx, j)">-</button>
                                  <span class="stepper-value">{{ getExercisesArray(dayIdx).at(j).get('sets')?.value }}</span>
                                  <button type="button" class="stepper-btn plus" (click)="incrementSets(dayIdx, j)">+</button>
                                </div>
                              </div>

                              <!-- Reps -->
                              <div class="control-group">
                                <label><i class="pi pi-replay"></i> التكرارات</label>
                                <div class="stepper">
                                  <button type="button" class="stepper-btn minus" (click)="decrementReps(dayIdx, j)">-</button>
                                  <span class="stepper-value">{{ getExercisesArray(dayIdx).at(j).get('reps')?.value }}</span>
                                  <button type="button" class="stepper-btn plus" (click)="incrementReps(dayIdx, j)">+</button>
                                </div>
                              </div>

                              <!-- Weight -->
                              <div class="control-group weight">
                                <label><i class="pi pi-chart-line"></i> الوزن (kg)</label>
                                <div class="stepper">
                                  <button type="button" class="stepper-btn minus" (click)="decrementWeight(dayIdx, j)">-</button>
                                  <span class="stepper-value">{{ getExercisesArray(dayIdx).at(j).get('weight')?.value }}</span>
                                  <button type="button" class="stepper-btn plus" (click)="incrementWeight(dayIdx, j)">+</button>
                                </div>
                              </div>

                              <!-- Rest -->
                              <div class="control-group rest">
                                <label><i class="pi pi-clock"></i> الراحة</label>
                                <div class="rest-input">
                                  <input type="number" pInputText formControlName="restSeconds" min="0" max="300" />
                                  <span>ث</span>
                                </div>
                              </div>
                            </div>

                            <!-- Volume Display -->
                            <div class="exercise-volume">
                              <div class="volume-formula">
                                {{ getExercisesArray(dayIdx).at(j).get('sets')?.value }} ×
                                {{ getExercisesArray(dayIdx).at(j).get('reps')?.value }} ×
                                {{ getExercisesArray(dayIdx).at(j).get('weight')?.value }}kg
                              </div>
                              <div class="volume-result">
                                <i class="pi pi-bolt"></i>
                                <span>{{ getExerciseVolume(dayIdx, j) | number:'1.0-0' }} kg</span>
                              </div>
                            </div>
                          </div>
                        }

                        @if (getExercisesArray(dayIdx).length === 0) {
                          <div class="empty-exercises">
                            <div class="empty-icon">
                              <i class="pi pi-box"></i>
                            </div>
                            <h4>لا توجد تمارين</h4>
                            <p>ابدأ بإضافة التمارين لهذا اليوم</p>
                          </div>
                        }

                        <button type="button" class="add-exercise-btn" (click)="addExercise(dayIdx)">
                          <i class="pi pi-plus"></i>
                          <span>إضافة تمرين جديد</span>
                        </button>
                      </div>

                      <!-- Muscle Distribution -->
                      @if (getExercisesArray(dayIdx).length > 0) {
                        <div class="muscle-distribution">
                          <h5><i class="pi pi-chart-pie"></i> توزيع العضلات</h5>
                          <div class="muscle-bars">
                            @for (muscle of getDayMuscleDistribution(dayIdx); track muscle.muscleName) {
                              <div class="muscle-row">
                                <span class="muscle-name">{{ muscle.muscleName }}</span>
                                <div class="muscle-bar">
                                  <div class="bar-fill" [style.width.%]="muscle.percentageOfTotal"></div>
                                </div>
                                <span class="muscle-pct">{{ muscle.percentageOfTotal }}%</span>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    }
                  }
                  @if (expandedDay === null) {
                    <div class="no-day-selected">
                      <i class="pi pi-calendar-plus"></i>
                      <p>اختر يوم أو أضف يوم جديد</p>
                      <button type="button" class="add-first-day-btn" (click)="addDay()">
                        <i class="pi pi-plus"></i>
                        إضافة يوم تمرين
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Step 3: Review & Save -->
            @if (currentStep === 2) {
              <div class="step-content review-step" @fadeSlide>
                <div class="review-grid">
                  <!-- Program Summary Card -->
                  <div class="review-card summary-card">
                    <div class="card-header">
                      <i class="pi pi-info-circle"></i>
                      <h3>ملخص البرنامج</h3>
                    </div>
                    <div class="card-body">
                      <div class="summary-row">
                        <span class="label">المتدرب:</span>
                        <span class="value">{{ getSelectedTraineeName() }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">اسم البرنامج:</span>
                        <span class="value">{{ form.get('name')?.value }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">المدة:</span>
                        <span class="value">{{ form.get('durationWeeks')?.value }} أسبوع</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">الهدف:</span>
                        <span class="value">{{ getGoalLabel() }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">المستوى:</span>
                        <span class="value">{{ getDifficultyLabel() }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Stats Card -->
                  <div class="review-card stats-card">
                    <div class="card-header">
                      <i class="pi pi-chart-bar"></i>
                      <h3>إحصائيات البرنامج</h3>
                    </div>
                    <div class="card-body">
                      <div class="stats-grid">
                        <div class="stat-box">
                          <span class="stat-value">{{ daysArray.length }}</span>
                          <span class="stat-label">أيام التمرين</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-value">{{ getTotalExercises() }}</span>
                          <span class="stat-label">إجمالي التمارين</span>
                        </div>
                        <div class="stat-box highlight">
                          <span class="stat-value">{{ getProgramTotalVolume() | number:'1.0-0' }}</span>
                          <span class="stat-label">kg إجمالي الحجم</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Days Overview -->
                  <div class="review-card days-card full-width">
                    <div class="card-header">
                      <i class="pi pi-calendar"></i>
                      <h3>نظرة عامة على الأيام</h3>
                    </div>
                    <div class="card-body">
                      <div class="days-overview">
                        @for (day of daysArray.controls; track $index; let i = $index) {
                          <div class="day-overview-item">
                            <div class="day-overview-header">
                              <span class="day-num">{{ i + 1 }}</span>
                              <span class="day-name">{{ day.get('name')?.value || 'يوم ' + (i + 1) }}</span>
                            </div>
                            <div class="day-overview-stats">
                              <span>{{ getExercisesArray(i).length }} تمرين</span>
                              <span>{{ getDayTotalVolume(i) | number:'1.0-0' }} kg</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Muscle Volume Card -->
                  @if (getTotalExercises() > 0) {
                    <div class="review-card muscle-card full-width">
                      <div class="card-header">
                        <i class="pi pi-chart-pie"></i>
                        <h3>توزيع الحجم على العضلات</h3>
                      </div>
                      <div class="card-body">
                        <div class="muscle-volume-grid">
                          @for (item of getMuscleVolumeArray(); track item.muscle) {
                            <div class="muscle-volume-item">
                              <span class="muscle-name">{{ item.muscle }}</span>
                              <span class="muscle-volume">{{ item.volume | number:'1.0-0' }} kg</span>
                              <span class="muscle-exercises">{{ item.exercises.length }} تمرين</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Live Summary Sidebar (Step 2 only) -->
          @if (currentStep === 1) {
            @if (!sidebarCollapsed) {
              <div class="sidebar-backdrop" (click)="sidebarCollapsed = true"></div>
            }
            <app-live-summary-sidebar
              [type]="'workout'"
              [workoutData]="workoutSummaryData"
              [collapsed]="sidebarCollapsed"
              (collapsedChange)="sidebarCollapsed = $event"
            ></app-live-summary-sidebar>
            @if (sidebarCollapsed) {
              <button class="sidebar-fab" (click)="sidebarCollapsed = false">
                <i class="pi pi-chart-pie"></i>
              </button>
            }
          }
        </form>
      </div>

      <!-- Footer Navigation -->
      <div class="wizard-footer">
        <button
          type="button"
          class="nav-btn prev"
          (click)="previousStep()"
          [disabled]="currentStep === 0"
        >
          <i class="pi pi-arrow-right"></i>
          السابق
        </button>

        <div class="step-indicator">
          <span>الخطوة {{ currentStep + 1 }} من 3</span>
        </div>

        @if (currentStep < 2) {
          <button
            type="button"
            class="nav-btn next"
            (click)="nextStep()"
            [disabled]="!canProceedToNextStep()"
          >
            التالي
            <i class="pi pi-arrow-left"></i>
          </button>
        } @else {
          <button
            type="button"
            class="nav-btn save"
            (click)="onSubmit()"
            [disabled]="!canSave() || saving()"
          >
            @if (saving()) {
              <i class="pi pi-spin pi-spinner"></i>
            } @else {
              <i class="pi pi-check"></i>
            }
            {{ isEditMode ? 'حفظ التعديلات' : 'إنشاء البرنامج' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ========== WORKOUT BUILDER WIZARD STYLES ========== */
    .workout-builder-wizard {
      min-height: 100vh;
      background: var(--premium-bg-base);
      display: flex;
      flex-direction: column;
    }

    /* Wizard Header */
    .wizard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--premium-bg-elevated);
      border-bottom: 1px solid var(--premium-border-default);
      gap: 24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--premium-bg-card);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      color: var(--premium-text-secondary);
      text-decoration: none;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--workout-primary);
        color: var(--workout-primary);
      }
    }

    .header-title {
      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--premium-text-primary);
        margin: 0;
      }

      p {
        font-size: 0.85rem;
        color: var(--premium-text-muted);
        margin: 4px 0 0 0;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: var(--premium-radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);

      &.primary {
        background: var(--workout-gradient);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px var(--workout-primary-glow);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: var(--premium-bg-card);
        border: 1px solid var(--premium-border-default);
        color: var(--premium-text-secondary);

        &:hover {
          border-color: var(--workout-primary);
          color: var(--workout-primary);
        }
      }
    }

    /* Wizard Body */
    .wizard-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;

      form {
        display: flex;
        gap: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }
    }

    .wizard-main {
      flex: 1;

      &.with-sidebar {
        max-width: calc(100% - 320px);
      }
    }

    .step-content {
      animation: fadeSlideIn 0.3s ease-out;
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Step 1: Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .info-card {
      background: var(--premium-bg-card);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      overflow: hidden;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--workout-primary);
        box-shadow: 0 4px 20px var(--workout-primary-glow);
      }

      &.trainee-card, &.program-card {
        grid-column: span 1;
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
      border-bottom: 1px solid var(--premium-border-default);

      .card-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--workout-gradient);
        border-radius: var(--premium-radius-md);
        color: white;
        font-size: 1rem;
      }

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--premium-text-primary);
        margin: 0;
      }
    }

    .card-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--premium-text-secondary);
        margin-bottom: 8px;
      }

      input, textarea {
        width: 100%;
        padding: 12px 16px;
        background: var(--premium-bg-base);
        border: 1px solid var(--premium-border-default);
        border-radius: var(--premium-radius-md);
        font-size: 0.95rem;
        color: var(--premium-text-primary);
        transition: all var(--transition-base);

        &:focus {
          border-color: var(--workout-primary);
          outline: none;
          box-shadow: 0 0 0 3px var(--workout-primary-glow);
        }

        &::placeholder {
          color: var(--premium-text-muted);
        }
      }

      textarea {
        resize: vertical;
        min-height: 80px;
      }
    }

    .selected-trainee, .dropdown-trainee {
      display: flex;
      align-items: center;
      gap: 12px;

      .avatar {
        width: 32px;
        height: 32px;
        background: var(--workout-gradient);
        color: white;
        border-radius: var(--premium-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    /* Quick Duration Buttons */
    .quick-duration-btns {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .quick-btn {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid var(--premium-border-default);
        background: var(--premium-bg-base);
        border-radius: var(--premium-radius-sm);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--premium-text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--workout-primary);
          color: var(--workout-primary);
        }

        &.active {
          background: linear-gradient(135deg, var(--workout-primary), var(--workout-primary-dark, #ea580c));
          border-color: var(--workout-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }
      }
    }

    /* Duration Control */
    .duration-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 20px;
      background: var(--premium-bg-base);
      border-radius: var(--premium-radius-md);
      margin-bottom: 16px;

      .ctrl-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: var(--premium-bg-card);
        border-radius: var(--premium-radius-md);
        color: var(--premium-text-secondary);
        font-size: 1.25rem;
        cursor: pointer;
        transition: all var(--transition-base);

        &:hover:not(:disabled) {
          background: var(--workout-primary);
          color: white;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .duration-display {
        text-align: center;
        min-width: 100px;

        .value {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--workout-primary);
          line-height: 1;
        }

        .label {
          font-size: 0.85rem;
          color: var(--premium-text-muted);
        }

        .days-info {
          display: block;
          font-size: 0.75rem;
          color: var(--premium-text-muted);
          margin-top: 4px;
          opacity: 0.7;
        }
      }
    }

    .date-field {
      label {
        display: block;
        font-size: 0.85rem;
        color: var(--premium-text-secondary);
        margin-bottom: 8px;
      }
    }

    /* Goal Options */
    .goal-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .goal-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: var(--premium-bg-base);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      font-size: 0.9rem;
      color: var(--premium-text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);

      i {
        font-size: 1rem;
        color: var(--workout-primary);
      }

      &:hover {
        border-color: var(--workout-primary);
      }

      &.active {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
        border-color: var(--workout-primary);
        color: var(--workout-primary);
      }
    }

    /* Difficulty Options */
    .difficulty-options {
      display: flex;
      gap: 10px;
    }

    .difficulty-btn {
      flex: 1;
      padding: 14px;
      background: var(--premium-bg-base);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      font-size: 0.9rem;
      color: var(--premium-text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--premium-text-muted);
      }

      &.active {
        &[data-level="beginner"] {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
          color: #22c55e;
        }

        &[data-level="intermediate"] {
          background: rgba(245, 158, 11, 0.1);
          border-color: #f59e0b;
          color: #f59e0b;
        }

        &[data-level="advanced"] {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: #ef4444;
        }
      }
    }

    /* Step 2: Builder Step */
    .builder-step {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Days Timeline */
    .days-timeline {
      background: var(--premium-bg-card);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      padding: 16px;
    }

    .timeline-tabs {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .timeline-tab {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: var(--premium-bg-base);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      cursor: pointer;
      transition: all var(--transition-base);

      .tab-drag-handle {
        color: var(--premium-text-muted);
        cursor: grab;
        opacity: 0.5;

        &:hover {
          opacity: 1;
          color: var(--workout-primary);
        }
      }

      .tab-num {
        width: 28px;
        height: 28px;
        background: var(--premium-bg-card);
        border-radius: var(--premium-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--premium-text-secondary);
      }

      .tab-name {
        font-size: 0.9rem;
        color: var(--premium-text-primary);
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tab-badge {
        background: rgba(139, 92, 246, 0.1);
        color: var(--workout-primary);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      &:hover {
        border-color: var(--workout-primary);
      }

      &.active {
        background: var(--workout-gradient);
        border-color: transparent;

        .tab-num {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .tab-name {
          color: white;
        }

        .tab-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .tab-drag-handle {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .add-day-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: transparent;
      border: 2px dashed var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      color: var(--premium-text-muted);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--workout-primary);
        color: var(--workout-primary);
      }
    }

    /* Day Builder */
    .day-builder {
      background: var(--premium-bg-card);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      padding: 20px;
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--premium-border-default);
      margin-bottom: 20px;

      .day-name-input {
        flex: 1;
        padding: 12px 16px;
        background: var(--premium-bg-base);
        border: 1px solid var(--premium-border-default);
        border-radius: var(--premium-radius-md);
        font-size: 1rem;
        font-weight: 600;
        color: var(--premium-text-primary);

        &:focus {
          border-color: var(--workout-primary);
          outline: none;
        }
      }

      .day-stats {
        display: flex;
        gap: 16px;

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--premium-text-muted);

          i {
            color: var(--workout-primary);
          }

          &.volume {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.08));
            padding: 8px 14px;
            border-radius: var(--premium-radius-md);
            color: #22c55e;
            font-weight: 600;
          }
        }
      }

      .delete-day-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(239, 68, 68, 0.1);
        border-radius: var(--premium-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        cursor: pointer;
        transition: all var(--transition-base);

        &:hover {
          background: #ef4444;
          color: white;
        }
      }
    }

    /* Exercises Container */
    .exercises-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .exercise-card {
      background: var(--premium-bg-base);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      overflow: hidden;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--workout-primary);
        box-shadow: 0 4px 20px var(--workout-primary-glow);
      }
    }

    .exercise-drag-placeholder {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05));
      border: 2px dashed var(--workout-primary);
      border-radius: var(--premium-radius-lg);
      min-height: 120px;
    }

    .exercise-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.03));
      border-bottom: 1px solid var(--premium-border-default);

      .exercise-order {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .order-num {
          width: 36px;
          height: 36px;
          background: var(--workout-gradient);
          color: white;
          border-radius: var(--premium-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .drag-icon {
          font-size: 0.8rem;
          color: var(--premium-text-muted);
          cursor: grab;
        }
      }

      .exercise-select {
        flex: 1;

        .selected-exercise {
          display: flex;
          align-items: center;
          gap: 8px;

          i {
            color: var(--workout-primary);
          }
        }
      }

      .remove-exercise-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(239, 68, 68, 0.1);
        border-radius: var(--premium-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        cursor: pointer;
        transition: all var(--transition-base);

        &:hover {
          background: #ef4444;
          color: white;
        }
      }
    }

    .exercise-controls {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 16px;

      .control-group {
        label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--premium-text-muted);
          margin-bottom: 10px;

          i {
            color: var(--workout-primary);
          }
        }

        .stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--premium-bg-card);
          border-radius: var(--premium-radius-md);
          padding: 8px;

          .stepper-btn {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: var(--premium-radius-sm);
            font-size: 1.25rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-base);

            &.minus {
              background: rgba(239, 68, 68, 0.1);
              color: #ef4444;

              &:hover {
                background: #ef4444;
                color: white;
              }
            }

            &.plus {
              background: rgba(34, 197, 94, 0.1);
              color: #22c55e;

              &:hover {
                background: #22c55e;
                color: white;
              }
            }
          }

          .stepper-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--premium-text-primary);
          }
        }

        &.weight .stepper-value {
          color: var(--workout-primary);
        }

        &.rest .rest-input {
          display: flex;
          align-items: center;
          gap: 8px;

          input {
            flex: 1;
            padding: 12px;
            text-align: center;
            background: var(--premium-bg-card);
            border: 1px solid var(--premium-border-default);
            border-radius: var(--premium-radius-md);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--premium-text-primary);

            &:focus {
              border-color: var(--workout-primary);
              outline: none;
            }
          }

          span {
            font-size: 0.9rem;
            color: var(--premium-text-muted);
          }
        }
      }
    }

    .exercise-volume {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(16, 185, 129, 0.05));
      border-top: 1px solid rgba(34, 197, 94, 0.2);

      .volume-formula {
        font-size: 0.9rem;
        color: var(--premium-text-muted);
      }

      .volume-result {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        padding: 8px 16px;
        border-radius: var(--premium-radius-md);
        color: white;

        i {
          font-size: 1rem;
        }

        span {
          font-size: 1.1rem;
          font-weight: 700;
        }
      }
    }

    .empty-exercises {
      text-align: center;
      padding: 50px 20px;
      background: var(--premium-bg-base);
      border: 2px dashed var(--premium-border-default);
      border-radius: var(--premium-radius-lg);

      .empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 2.5rem;
          color: var(--workout-primary);
        }
      }

      h4 {
        margin: 0 0 8px;
        font-size: 1.1rem;
        color: var(--premium-text-primary);
      }

      p {
        margin: 0;
        color: var(--premium-text-muted);
      }
    }

    .add-exercise-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      background: transparent;
      border: 2px dashed var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      color: var(--premium-text-muted);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--workout-primary);
        color: var(--workout-primary);
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.02));
      }
    }

    /* Muscle Distribution */
    .muscle-distribution {
      margin-top: 20px;
      padding: 16px;
      background: var(--premium-bg-base);
      border-radius: var(--premium-radius-md);
      border: 1px solid var(--premium-border-default);

      h5 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 0.9rem;
        color: var(--premium-text-secondary);

        i {
          color: var(--workout-primary);
        }
      }
    }

    .muscle-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .muscle-row {
      display: flex;
      align-items: center;
      gap: 12px;

      .muscle-name {
        min-width: 80px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--premium-text-primary);
      }

      .muscle-bar {
        flex: 1;
        height: 10px;
        background: var(--premium-bg-card);
        border-radius: 5px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          background: var(--workout-gradient);
          border-radius: 5px;
          transition: width 0.3s ease;
        }
      }

      .muscle-pct {
        min-width: 40px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--workout-primary);
        text-align: left;
      }
    }

    .no-day-selected {
      text-align: center;
      padding: 60px 20px;
      color: var(--premium-text-muted);

      i {
        font-size: 3rem;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      p {
        margin: 0 0 20px;
      }

      .add-first-day-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: var(--workout-gradient);
        border: none;
        border-radius: var(--premium-radius-md);
        color: white;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-base);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px var(--workout-primary-glow);
        }
      }
    }

    /* Step 3: Review */
    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .review-card {
      background: var(--premium-bg-card);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-lg);
      overflow: hidden;

      &.full-width {
        grid-column: span 2;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
        border-bottom: 1px solid var(--premium-border-default);

        i {
          font-size: 1.25rem;
          color: var(--workout-primary);
        }

        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--premium-text-primary);
          margin: 0;
        }
      }

      .card-body {
        padding: 20px;
      }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--premium-border-default);

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: var(--premium-text-muted);
      }

      .value {
        font-weight: 600;
        color: var(--premium-text-primary);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .stat-box {
      text-align: center;
      padding: 20px;
      background: var(--premium-bg-base);
      border-radius: var(--premium-radius-md);

      .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--workout-primary);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 0.85rem;
        color: var(--premium-text-muted);
      }

      &.highlight {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05));

        .stat-value {
          color: #22c55e;
        }
      }
    }

    .days-overview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .day-overview-item {
      background: var(--premium-bg-base);
      border: 1px solid var(--premium-border-default);
      border-radius: var(--premium-radius-md);
      padding: 16px;

      .day-overview-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;

        .day-num {
          width: 28px;
          height: 28px;
          background: var(--workout-gradient);
          color: white;
          border-radius: var(--premium-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .day-name {
          font-weight: 600;
          color: var(--premium-text-primary);
        }
      }

      .day-overview-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--premium-text-muted);
      }
    }

    .muscle-volume-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .muscle-volume-item {
      background: var(--premium-bg-base);
      padding: 16px;
      border-radius: var(--premium-radius-md);
      border: 1px solid var(--premium-border-default);

      .muscle-name {
        display: block;
        font-weight: 600;
        color: var(--premium-text-primary);
        margin-bottom: 8px;
      }

      .muscle-volume {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: #22c55e;
        margin-bottom: 4px;
      }

      .muscle-exercises {
        font-size: 0.8rem;
        color: var(--premium-text-muted);
      }
    }

    /* Footer Navigation */
    .wizard-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--premium-bg-elevated);
      border-top: 1px solid var(--premium-border-default);
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border: none;
      border-radius: var(--premium-radius-md);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);

      &.prev {
        background: var(--premium-bg-card);
        border: 1px solid var(--premium-border-default);
        color: var(--premium-text-secondary);

        &:hover:not(:disabled) {
          border-color: var(--workout-primary);
          color: var(--workout-primary);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      &.next {
        background: var(--workout-gradient);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px var(--workout-primary-glow);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.save {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .step-indicator {
      font-size: 0.9rem;
      color: var(--premium-text-muted);
    }

    /* PrimeNG Overrides */
    :host ::ng-deep {
      .premium-dropdown, .exercise-dropdown {
        .p-dropdown {
          background: var(--premium-bg-base);
          border-color: var(--premium-border-default);
          border-radius: var(--premium-radius-md);

          .p-dropdown-label {
            color: var(--text-primary);
            font-weight: 500;
            padding: 12px 16px;
          }

          &:not(.p-disabled):hover {
            border-color: var(--workout-primary);
          }

          &:not(.p-disabled).p-focus {
            border-color: var(--workout-primary);
            box-shadow: 0 0 0 3px var(--workout-primary-glow);
          }
        }
      }

      /* Dropdown Panel Overlay Styles */
      .p-dropdown-panel {
        background: var(--bg-primary, #1e1e2d) !important;
        border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

        .p-dropdown-header {
          background: var(--bg-secondary, #151521);
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));
          padding: 12px;

          .p-dropdown-filter {
            background: var(--bg-primary, #1e1e2d);
            border: 1px solid var(--border-color, rgba(255,255,255,0.15));
            color: var(--text-primary, #fff);
            border-radius: 8px;
            padding: 10px 14px;

            &::placeholder {
              color: var(--text-muted, rgba(255,255,255,0.4));
            }

            &:focus {
              border-color: var(--workout-primary, #f97316);
              box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
            }
          }
        }

        .p-dropdown-items-wrapper {
          max-height: 350px;
        }

        .p-dropdown-items {
          padding: 8px;

          .p-dropdown-item {
            color: var(--text-primary, #fff);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 4px;
            font-size: 0.95rem;
            transition: all 0.2s ease;

            &:hover {
              background: rgba(249, 115, 22, 0.15);
              color: #f97316;
            }

            &.p-highlight {
              background: linear-gradient(135deg, #f97316, #ea580c);
              color: white;
              font-weight: 600;
            }
          }

          .p-dropdown-empty-message {
            color: var(--text-muted, rgba(255,255,255,0.5));
            padding: 20px;
            text-align: center;
          }
        }
      }

      .p-calendar {
        width: 100%;

        .p-inputtext {
          background: var(--premium-bg-base);
          border-color: var(--premium-border-default);
          border-radius: var(--premium-radius-md);
          padding: 12px 16px;

          &:focus {
            border-color: var(--workout-primary);
            box-shadow: 0 0 0 3px var(--workout-primary-glow);
          }
        }
      }
    }

    .sidebar-backdrop {
      display: none;
    }

    .sidebar-fab {
      display: none;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }

      .sidebar-fab {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        bottom: 80px;
        left: 16px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: var(--premium-gradient-workout);
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 998;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s ease;

        &:active {
          transform: scale(0.9);
        }
      }

      .wizard-main.with-sidebar {
        max-width: 100%;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .review-card.full-width {
        grid-column: span 1;
      }
    }

    @media (max-width: 768px) {
      .wizard-header {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .exercise-controls {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .day-header {
        flex-wrap: wrap;

        .day-name-input {
          width: 100%;
        }

        .day-stats {
          width: 100%;
          flex-wrap: wrap;
        }
      }
    }

    @media (max-width: 480px) {
      .wizard-body {
        padding: 16px;
      }

      .exercise-controls {
        grid-template-columns: 1fr;
      }

      .timeline-tabs {
        flex-direction: column;
        align-items: stretch;
      }

      .timeline-tab {
        width: 100%;
      }
    }

    /* CDK Drag & Drop */
    .cdk-drag-preview {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      border-radius: var(--premium-radius-lg);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-dragging .exercise-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class ProgramBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coachService = inject(CoachService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  isEditMode = false;
  programId: string | null = null;
  saving = signal(false);
  exercises = signal<Exercise[]>([]);
  trainees = signal<Trainee[]>([]);
  expandedDay: number | null = 0;
  showSummary = false;

  // Wizard state
  sidebarCollapsed = window.innerWidth < 1200;
  currentStep = 0;
  wizardSteps: WizardStep[] = [
    { label: 'المعلومات الأساسية', icon: 'pi-info-circle' },
    { label: 'بناء التمارين', icon: 'pi-list' },
    { label: 'المراجعة والحفظ', icon: 'pi-check-circle' }
  ];

  dayColors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  traineeOptions: { label: string; value: string; trainee?: Trainee }[] = [];

  goalOptions = [
    { label: 'بناء العضلات', value: 'muscle_building', icon: 'pi pi-star-fill' },
    { label: 'زيادة القوة', value: 'strength', icon: 'pi pi-bolt' },
    { label: 'حرق الدهون', value: 'fat_loss', icon: 'pi pi-heart-fill' },
    { label: 'لياقة عامة', value: 'general_fitness', icon: 'pi pi-check-circle' },
    { label: 'تحمل', value: 'endurance', icon: 'pi pi-clock' }
  ];

  difficultyOptions = [
    { label: 'مبتدئ', value: 'beginner' },
    { label: 'متوسط', value: 'intermediate' },
    { label: 'متقدم', value: 'advanced' }
  ];

  exerciseOptions: { label: string; value: number | string }[] = [];

  form: FormGroup = this.fb.group({
    clientId: ['', Validators.required],
    startDate: [new Date(), Validators.required],
    name: ['', Validators.required],
    description: [''],
    goal: ['muscle_building', Validators.required],
    difficulty: ['intermediate', Validators.required],
    durationWeeks: [8, [Validators.required, Validators.min(1)]],
    daysPerWeek: [4, [Validators.required, Validators.min(1), Validators.max(7)]],
    days: this.fb.array([])
  });

  get daysArray(): FormArray {
    return this.form.get('days') as FormArray;
  }

  getExercisesArray(dayIndex: number): FormArray {
    return this.daysArray.at(dayIndex).get('exercises') as FormArray;
  }

  getTotalSessions(): number {
    const weeks = this.form.get('durationWeeks')?.value || 0;
    const daysPerWeek = this.form.get('daysPerWeek')?.value || 0;
    return weeks * daysPerWeek;
  }

  getTotalExercises(): number {
    let total = 0;
    for (let i = 0; i < this.daysArray.length; i++) {
      total += this.getExercisesArray(i).length;
    }
    return total;
  }

  // Workout Summary Data for Sidebar
  get workoutSummaryData(): WorkoutSummaryData {
    const muscleColors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    const muscleMap = new Map<string, number>();

    // Calculate total sets per muscle
    for (let d = 0; d < this.daysArray.length; d++) {
      const exercises = this.getExercisesArray(d);
      for (let e = 0; e < exercises.length; e++) {
        const exerciseId = exercises.at(e).get('exerciseId')?.value;
        const sets = exercises.at(e).get('sets')?.value || 0;
        const exercise = this.exercises().find(ex => ex.id === exerciseId);
        if (exercise) {
          const muscleName = exercise.targetMuscleName || exercise.muscleGroupName || 'غير محدد';
          muscleMap.set(muscleName, (muscleMap.get(muscleName) || 0) + sets);
        }
      }
    }

    const totalSets = Array.from(muscleMap.values()).reduce((sum, s) => sum + s, 0);
    const muscleDistribution = Array.from(muscleMap.entries())
      .map(([muscle, sets], i) => ({
        muscle,
        percentage: totalSets > 0 ? Math.round((sets / totalSets) * 100) : 0,
        color: muscleColors[i % muscleColors.length]
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalVolume: this.getProgramTotalVolume(),
      totalSets: this.getTotalSetsForProgram(),
      totalExercises: this.getTotalExercises(),
      daysCount: this.daysArray.length,
      muscleDistribution
    };
  }

  getTotalSetsForProgram(): number {
    let total = 0;
    for (let d = 0; d < this.daysArray.length; d++) {
      total += this.getTotalSetsForDay(d);
    }
    return total;
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
      if (step <= this.currentStep || this.canProceedToStep(step)) {
        this.currentStep = step;
      }
    }
  }

  canProceedToStep(step: number): boolean {
    for (let i = 0; i < step; i++) {
      if (!this.isStepValid(i)) {
        return false;
      }
    }
    return true;
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return !!(this.form.get('clientId')?.value && this.form.get('name')?.value);
      case 1:
        return this.daysArray.length > 0 && this.getTotalExercises() > 0;
      default:
        return true;
    }
  }

  canProceedToNextStep(): boolean {
    return this.isStepValid(this.currentStep);
  }

  canSave(): boolean {
    return this.form.get('clientId')?.value &&
           this.form.get('name')?.value &&
           this.daysArray.length > 0 &&
           this.getTotalExercises() > 0;
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case 0:
        return 'أدخل المعلومات الأساسية للبرنامج';
      case 1:
        return 'أضف الأيام والتمارين';
      case 2:
        return 'راجع البرنامج قبل الحفظ';
      default:
        return '';
    }
  }

  getSelectedTraineeName(): string {
    const clientId = this.form.get('clientId')?.value;
    const trainee = this.traineeOptions.find(t => t.value === clientId);
    return trainee?.label || 'غير محدد';
  }

  getGoalLabel(): string {
    const goal = this.form.get('goal')?.value;
    return this.goalOptions.find(g => g.value === goal)?.label || goal || 'غير محدد';
  }

  getDifficultyLabel(): string {
    const difficulty = this.form.get('difficulty')?.value;
    return this.difficultyOptions.find(d => d.value === difficulty)?.label || difficulty || 'غير محدد';
  }

  onDayDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    // Get the control to move
    const controlToMove = this.daysArray.at(event.previousIndex);

    // Remove from original position
    this.daysArray.removeAt(event.previousIndex);

    // Insert at new position
    this.daysArray.insert(event.currentIndex, controlToMove);

    // Update expanded day index to follow the moved day
    if (this.expandedDay === event.previousIndex) {
      this.expandedDay = event.currentIndex;
    } else if (this.expandedDay !== null) {
      if (event.previousIndex < this.expandedDay && event.currentIndex >= this.expandedDay) {
        this.expandedDay--;
      } else if (event.previousIndex > this.expandedDay && event.currentIndex <= this.expandedDay) {
        this.expandedDay++;
      }
    }
  }

  onExerciseDrop(event: CdkDragDrop<any[]>, dayIndex: number): void {
    if (event.previousIndex === event.currentIndex) return;

    const exercisesArray = this.getExercisesArray(dayIndex);

    // Get the control to move
    const controlToMove = exercisesArray.at(event.previousIndex);

    // Remove from original position
    exercisesArray.removeAt(event.previousIndex);

    // Insert at new position
    exercisesArray.insert(event.currentIndex, controlToMove);
  }

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.programId;

    // Load exercises and trainees first, then load program if in edit mode
    forkJoin({
      exercises: this.coachService.getExercises(),
      trainees: this.coachService.getTrainees()
    }).subscribe({
      next: ({ exercises, trainees }) => {
        // Set exercises
        this.exercises.set(exercises);
        this.exerciseOptions = exercises.map(e => ({
          label: `${e.nameAr || e.name} (${e.targetMuscleName || e.muscleGroupName || 'غير محدد'})`,
          value: e.id
        }));

        // Set trainees
        this.trainees.set(trainees);
        this.traineeOptions = trainees.map(t => ({
          label: t.clientName || t.fullName || t.profile?.fullName || '',
          value: t.clientId || t.id,
          trainee: t
        }));

        // Now load program if in edit mode
        if (this.isEditMode && this.programId) {
          this.loadProgram(this.programId);
        } else {
          // Add default days
          this.addDay('يوم الصدر والترايسبس');
          this.addDay('يوم الظهر والبايسبس');
          this.addDay('يوم الأكتاف');
          this.addDay('يوم الأرجل');
        }
      },
      error: () => {
        // Fallback - load with mock data
        this.loadExercises();
        this.loadTrainees();

        if (this.isEditMode && this.programId) {
          setTimeout(() => this.loadProgram(this.programId!), 500);
        } else {
          this.addDay('يوم الصدر والترايسبس');
          this.addDay('يوم الظهر والبايسبس');
          this.addDay('يوم الأكتاف');
          this.addDay('يوم الأرجل');
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
        // Fallback mock data
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

  loadExercises(): void {
    this.coachService.getExercises().subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.exerciseOptions = data.map(e => ({
          label: `${e.nameAr || e.name} (${e.targetMuscleName || e.muscleGroupName || 'غير محدد'})`,
          value: e.id
        }));
      },
      error: () => {
        // Fallback mock data
        const mockExercises: Exercise[] = [
          { id: '1', name: 'بنش برس', description: '', muscleGroupId: '1', muscleGroupName: 'صدر', equipmentType: 'بار', isGlobal: true },
          { id: '2', name: 'بنش برس مائل', description: '', muscleGroupId: '1', muscleGroupName: 'صدر', equipmentType: 'بار', isGlobal: true },
          { id: '3', name: 'فراشة', description: '', muscleGroupId: '1', muscleGroupName: 'صدر', equipmentType: 'كابل', isGlobal: true },
          { id: '4', name: 'ديد ليفت', description: '', muscleGroupId: '2', muscleGroupName: 'ظهر', equipmentType: 'بار', isGlobal: true },
          { id: '5', name: 'سحب علوي', description: '', muscleGroupId: '2', muscleGroupName: 'ظهر', equipmentType: 'كابل', isGlobal: true },
          { id: '6', name: 'رو', description: '', muscleGroupId: '2', muscleGroupName: 'ظهر', equipmentType: 'بار', isGlobal: true },
          { id: '7', name: 'سكوات', description: '', muscleGroupId: '3', muscleGroupName: 'أرجل', equipmentType: 'بار', isGlobal: true },
          { id: '8', name: 'ليج برس', description: '', muscleGroupId: '3', muscleGroupName: 'أرجل', equipmentType: 'جهاز', isGlobal: true },
          { id: '9', name: 'شولدر برس', description: '', muscleGroupId: '4', muscleGroupName: 'أكتاف', equipmentType: 'دمبل', isGlobal: true },
          { id: '10', name: 'رفع جانبي', description: '', muscleGroupId: '4', muscleGroupName: 'أكتاف', equipmentType: 'دمبل', isGlobal: true },
          { id: '11', name: 'بايسبس كيرل', description: '', muscleGroupId: '5', muscleGroupName: 'ذراع', equipmentType: 'بار', isGlobal: true },
          { id: '12', name: 'ترايسبس بوش داون', description: '', muscleGroupId: '5', muscleGroupName: 'ذراع', equipmentType: 'كابل', isGlobal: true }
        ];
        this.exercises.set(mockExercises);
        this.exerciseOptions = mockExercises.map(e => ({
          label: `${e.name} (${e.muscleGroupName})`,  // Mock data already in Arabic
          value: e.id
        }));
      }
    });
  }

  loadProgram(id: string): void {
    this.coachService.getWorkoutProgramById(id).subscribe({
      next: (program: any) => {
        console.log('=== Workout Program API Response ===');
        console.log('Full program:', program);
        console.log('Routines count:', program.routines?.length ?? 0);
        if (program.routines && program.routines.length > 0) {
          program.routines.forEach((routine: any, i: number) => {
            console.log(`Routine ${i + 1}:`, routine.name, '- Day:', routine.dayOfWeek, '- Exercises:', routine.exercises?.length ?? 0);
            if (routine.exercises) {
              routine.exercises.forEach((ex: any, j: number) => {
                console.log(`  Exercise ${j + 1}:`, ex.exerciseName, '- Sets:', ex.sets, '- Reps:', ex.repsMin, '-', ex.repsMax);
              });
            }
          });
        }
        console.log('====================================');

        // Parse start date if it's a string
        let startDate = program.startDate;
        if (typeof startDate === 'string') {
          startDate = new Date(startDate);
        }

        this.form.patchValue({
          clientId: program.clientId || '',
          startDate: startDate || new Date(),
          name: program.name,
          description: program.description,
          goal: program.goal || 'muscle_building',
          difficulty: program.difficulty || 'intermediate',
          durationWeeks: program.durationWeeks,
          daysPerWeek: program.routines?.length ?? program.daysPerWeek ?? 4
        });

        // Clear existing days first
        while (this.daysArray.length > 0) {
          this.daysArray.removeAt(0);
        }

        // Load routines/days if available (Backend uses 'routines', Frontend uses 'days')
        const routines = program.routines || program.days || [];
        if (Array.isArray(routines) && routines.length > 0) {
          routines.forEach((routine: any) => {
            this.addDayWithData(routine);
          });
        } else {
          this.addDay('اليوم 1');
        }
      },
      error: (err) => {
        console.error('Error loading workout program:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تحميل البرنامج'
        });
      }
    });
  }

  setGoal(goal: string): void {
    this.form.patchValue({ goal });
  }

  setDifficulty(difficulty: string): void {
    this.form.patchValue({ difficulty });
  }

  setDaysPerWeek(days: number): void {
    this.form.patchValue({ daysPerWeek: days });
  }

  incrementWeeks(): void {
    const current = this.form.get('durationWeeks')?.value || 0;
    if (current < 52) {
      this.form.patchValue({ durationWeeks: current + 1 });
    }
  }

  decrementWeeks(): void {
    const current = this.form.get('durationWeeks')?.value || 0;
    if (current > 1) {
      this.form.patchValue({ durationWeeks: current - 1 });
    }
  }

  setDuration(weeks: number): void {
    this.form.patchValue({ durationWeeks: weeks });
  }

  toggleDay(index: number): void {
    this.expandedDay = this.expandedDay === index ? null : index;
  }

  addDay(name: string = ''): void {
    const dayGroup = this.fb.group({
      name: [name],
      exercises: this.fb.array([])
    });
    this.daysArray.push(dayGroup);
    this.expandedDay = this.daysArray.length - 1;
  }

  addDayWithData(dayData: any): void {
    // Map Backend field names: routines use 'name' directly
    const dayGroup = this.fb.group({
      id: [dayData.id || ''],
      name: [dayData.name || ''],
      dayOfWeek: [dayData.dayOfWeek ?? 0],
      exercises: this.fb.array([])
    });

    // Backend returns 'exercises' array
    const exercises = dayData.exercises || [];
    if (Array.isArray(exercises)) {
      exercises.forEach((ex: any) => {
        // Map Backend field names: repsMin/repsMax → reps, restSec → restSeconds
        const reps = ex.repsMin && ex.repsMax
          ? (ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`)
          : (ex.reps || 12);

        // Ensure exerciseId type matches options (keep as number for consistency with API)
        const exerciseIdValue = ex.exerciseId !== undefined && ex.exerciseId !== null
          ? (typeof ex.exerciseId === 'string' ? parseInt(ex.exerciseId, 10) : ex.exerciseId)
          : '';

        const exerciseGroup = this.fb.group({
          id: [ex.id || ''],
          exerciseId: [exerciseIdValue, Validators.required],
          sets: [ex.sets || 3, Validators.required],
          reps: [reps, Validators.required],
          weight: [ex.weight || 20],
          restSeconds: [ex.restSec ?? ex.restSeconds ?? 60],
          supersetGroupId: [ex.supersetGroupId || '']
        });
        (dayGroup.get('exercises') as FormArray).push(exerciseGroup);
      });
    }

    this.daysArray.push(dayGroup);
  }

  removeDay(index: number): void {
    this.daysArray.removeAt(index);
    if (this.expandedDay === index) {
      this.expandedDay = null;
    } else if (this.expandedDay !== null && this.expandedDay > index) {
      this.expandedDay--;
    }
  }

  addExercise(dayIndex: number): void {
    const exerciseGroup = this.fb.group({
      exerciseId: ['', Validators.required],
      sets: [3, Validators.required],
      reps: [12, Validators.required],
      weight: [20, Validators.required],
      restSeconds: ['60']
    });
    this.getExercisesArray(dayIndex).push(exerciseGroup);
  }

  removeExercise(dayIndex: number, exerciseIndex: number): void {
    this.getExercisesArray(dayIndex).removeAt(exerciseIndex);
  }

  onExerciseSelect(event: any, dayIndex: number, exerciseIndex: number): void {
    // Can be used for additional logic when exercise is selected
  }

  incrementSets(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('sets');
    if (control) {
      control.setValue((control.value || 0) + 1);
    }
  }

  decrementSets(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('sets');
    if (control && control.value > 1) {
      control.setValue(control.value - 1);
    }
  }

  incrementReps(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('reps');
    if (control) {
      control.setValue((control.value || 0) + 1);
    }
  }

  decrementReps(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('reps');
    if (control && control.value > 1) {
      control.setValue(control.value - 1);
    }
  }

  incrementWeight(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('weight');
    if (control) {
      control.setValue((control.value || 0) + 2.5);
    }
  }

  decrementWeight(dayIndex: number, exerciseIndex: number): void {
    const control = this.getExercisesArray(dayIndex).at(exerciseIndex).get('weight');
    if (control && control.value > 0) {
      control.setValue(Math.max(0, control.value - 2.5));
    }
  }

  // Calculate Volume for a single exercise: Sets × Reps × Weight
  getExerciseVolume(dayIndex: number, exerciseIndex: number): number {
    const exercise = this.getExercisesArray(dayIndex).at(exerciseIndex);
    const sets = exercise.get('sets')?.value || 0;
    const reps = exercise.get('reps')?.value || 0;
    const weight = exercise.get('weight')?.value || 0;
    return sets * reps * weight;
  }

  // Get previous exercise volume (for comparison)
  getPreviousExerciseVolume(dayIndex: number, exerciseIndex: number): number {
    if (exerciseIndex === 0) return 0;
    return this.getExerciseVolume(dayIndex, exerciseIndex - 1);
  }

  // Calculate volume difference between current and previous exercise
  getVolumeDifference(dayIndex: number, exerciseIndex: number): number {
    const currentVolume = this.getExerciseVolume(dayIndex, exerciseIndex);
    const previousVolume = this.getPreviousExerciseVolume(dayIndex, exerciseIndex);
    return currentVolume - previousVolume;
  }

  // Get intensity indicator: 'increase', 'decrease', 'stable', 'first'
  getIntensityIndicator(dayIndex: number, exerciseIndex: number): 'increase' | 'decrease' | 'stable' | 'first' {
    if (exerciseIndex === 0) return 'first';
    const diff = this.getVolumeDifference(dayIndex, exerciseIndex);
    if (diff > 0) return 'increase';
    if (diff < 0) return 'decrease';
    return 'stable';
  }

  // Get percentage change
  getVolumeChangePercent(dayIndex: number, exerciseIndex: number): number {
    if (exerciseIndex === 0) return 0;
    const previousVolume = this.getPreviousExerciseVolume(dayIndex, exerciseIndex);
    if (previousVolume === 0) return 100;
    const diff = this.getVolumeDifference(dayIndex, exerciseIndex);
    return Math.round((diff / previousVolume) * 100);
  }

  // Get total volume for a day
  getDayTotalVolume(dayIndex: number): number {
    const exercises = this.getExercisesArray(dayIndex);
    let total = 0;
    for (let i = 0; i < exercises.length; i++) {
      total += this.getExerciseVolume(dayIndex, i);
    }
    return total;
  }

  // Get total sets for a day
  getTotalSetsForDay(dayIndex: number): number {
    const exercises = this.getExercisesArray(dayIndex);
    let total = 0;
    for (let i = 0; i < exercises.length; i++) {
      total += exercises.at(i).get('sets')?.value || 0;
    }
    return total;
  }

  // Get total volume for the entire program
  getProgramTotalVolume(): number {
    let total = 0;
    for (let d = 0; d < this.daysArray.length; d++) {
      total += this.getDayTotalVolume(d);
    }
    return total;
  }

  // Get muscle distribution for a day (considering secondary muscles)
  getDayMuscleDistribution(dayIndex: number): { muscleName: string; totalSets: number; percentageOfTotal: number }[] {
    const exercisesArray = this.getExercisesArray(dayIndex);
    const muscleMap = new Map<string, { totalSets: number; muscleName: string }>();

    for (let i = 0; i < exercisesArray.length; i++) {
      const exerciseId = exercisesArray.at(i).get('exerciseId')?.value;
      const sets = exercisesArray.at(i).get('sets')?.value || 0;

      const exercise = this.exercises().find(e => e.id === exerciseId);
      if (!exercise) continue;

      // Get primary muscle contribution
      const primaryPercent = exercise.primaryMuscleContributionPercent ?? 100;
      const primarySets = sets * (primaryPercent / 100);

      const primaryName = exercise.targetMuscleName || exercise.muscleGroupName || 'غير محدد';
      const existing = muscleMap.get(primaryName);
      if (existing) {
        existing.totalSets += primarySets;
      } else {
        muscleMap.set(primaryName, { muscleName: primaryName, totalSets: primarySets });
      }

      // Add secondary muscles if available
      if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
        for (const secondary of exercise.secondaryMuscles) {
          const secondarySets = sets * (secondary.contributionPercent / 100);
          const secondaryExisting = muscleMap.get(secondary.muscleName);
          if (secondaryExisting) {
            secondaryExisting.totalSets += secondarySets;
          } else {
            muscleMap.set(secondary.muscleName, { muscleName: secondary.muscleName, totalSets: secondarySets });
          }
        }
      }
    }

    // Calculate percentages and sort
    const totalSets = Array.from(muscleMap.values()).reduce((sum, m) => sum + m.totalSets, 0);
    return Array.from(muscleMap.values())
      .map(m => ({
        muscleName: m.muscleName,
        totalSets: m.totalSets,
        percentageOfTotal: totalSets > 0 ? Math.round((m.totalSets / totalSets) * 100) : 0
      }))
      .sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
  }

  // Calculate volume per muscle for a single exercise
  getExerciseMuscleVolumes(dayIndex: number, exerciseIndex: number): { muscle: string; volume: number; percent: number; isPrimary: boolean }[] {
    const exerciseControl = this.getExercisesArray(dayIndex).at(exerciseIndex);
    if (!exerciseControl) return [];

    const exerciseId = exerciseControl.get('exerciseId')?.value;
    const exercise = this.exercises().find(e => e.id === exerciseId);

    if (!exercise) return [];

    const totalVolume = this.getExerciseVolume(dayIndex, exerciseIndex);
    if (totalVolume === 0) return [];

    const results: { muscle: string; volume: number; percent: number; isPrimary: boolean }[] = [];

    // Get primary muscle contribution
    const primaryPercent = exercise.primaryMuscleContributionPercent ?? 100;
    results.push({
      muscle: exercise.targetMuscleName || exercise.muscleGroupName || 'غير محدد',
      volume: Math.round(totalVolume * primaryPercent / 100),
      percent: primaryPercent,
      isPrimary: true
    });

    // Add secondary muscles if available
    if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
      for (const secondary of exercise.secondaryMuscles) {
        results.push({
          muscle: secondary.muscleName,
          volume: Math.round(totalVolume * secondary.contributionPercent / 100),
          percent: secondary.contributionPercent,
          isPrimary: false
        });
      }
    }

    return results;
  }

  // Get total volume for all muscles across the program
  getTotalMuscleVolumeBreakdown(): Map<string, { volume: number; exercises: string[] }> {
    const muscleVolumes = new Map<string, { volume: number; exercises: string[] }>();

    for (let d = 0; d < this.daysArray.length; d++) {
      const exercises = this.getExercisesArray(d);
      for (let e = 0; e < exercises.length; e++) {
        const muscleContributions = this.getExerciseMuscleVolumes(d, e);
        const exerciseId = exercises.at(e).get('exerciseId')?.value;
        const exerciseName = this.exercises().find(ex => ex.id === exerciseId)?.name || '';

        muscleContributions.forEach(mc => {
          const current = muscleVolumes.get(mc.muscle) || { volume: 0, exercises: [] };
          current.volume += mc.volume;
          if (exerciseName && !current.exercises.includes(exerciseName)) {
            current.exercises.push(exerciseName);
          }
          muscleVolumes.set(mc.muscle, current);
        });
      }
    }

    return muscleVolumes;
  }

  // Convert Map to array for template iteration
  getMuscleVolumeArray(): { muscle: string; volume: number; exercises: string[] }[] {
    const map = this.getTotalMuscleVolumeBreakdown();
    return Array.from(map.entries())
      .map(([muscle, data]) => ({
        muscle,
        volume: data.volume,
        exercises: data.exercises
      }))
      .sort((a, b) => b.volume - a.volume);
  }

  // Math helper for template
  Math = Math;

  previewProgram(): void {
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
    const endDate = this.calculateEndDate(formValue.startDate, formValue.durationWeeks);
    const today = new Date().toLocaleDateString('ar-EG');

    const goalLabel = this.goalOptions.find(g => g.value === formValue.goal)?.label || formValue.goal;
    const diffLabel = this.difficultyOptions.find(d => d.value === formValue.difficulty)?.label || formValue.difficulty;

    const daysHtml = formValue.days.map((day: any, i: number) => {
      const exercisesHtml = day.exercises.map((ex: any, j: number) => {
        const exercise = this.exercises().find(e => e.id === ex.exerciseId);
        const muscleGroup = exercise?.muscleGroupName || exercise?.targetMuscleName || '-';
        return `
          <tr>
            <td class="num">${j + 1}</td>
            <td class="exercise-name">${exercise?.name || '-'}</td>
            <td class="muscle">${muscleGroup}</td>
            <td class="sets">${ex.sets}</td>
            <td class="reps">${ex.reps}</td>
            <td class="rest">${ex.restSeconds}ث</td>
          </tr>
        `;
      }).join('');

      const totalExercises = day.exercises?.length || 0;

      return `
        <div class="day-card">
          <div class="day-header">
            <div class="day-title">
              <span class="day-icon">💪</span>
              <span class="day-name">${day.name || 'اليوم ' + (i + 1)}</span>
            </div>
            <div class="day-badge">${totalExercises} تمرين</div>
          </div>
          <table class="exercises-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>التمرين</th>
                <th>العضلة</th>
                <th style="width: 80px;">مجموعات</th>
                <th style="width: 80px;">تكرارات</th>
                <th style="width: 70px;">راحة</th>
              </tr>
            </thead>
            <tbody>
              ${exercisesHtml || '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">لا توجد تمارين</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const totalDays = formValue.days?.length || 0;
    const totalExercises = formValue.days?.reduce((sum: number, day: any) => sum + (day.exercises?.length || 0), 0) || 0;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>برنامج التمرين - ${clientName}</title>
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
            max-width: 950px;
            margin: 0 auto;
            padding: 40px;
          }

          /* Header Section */
          .document-header {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
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
            color: #7c3aed;
            font-weight: 700;
          }

          .client-name {
            color: #3b82f6;
            font-weight: 700;
          }

          /* Stats Section */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }

          .stat-card {
            background: white;
            border-radius: 16px;
            padding: 24px 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 2px solid transparent;
          }

          .stat-card:nth-child(1) { border-color: #a78bfa; background: linear-gradient(135deg, #f5f3ff 0%, white 100%); }
          .stat-card:nth-child(2) { border-color: #60a5fa; background: linear-gradient(135deg, #eff6ff 0%, white 100%); }
          .stat-card:nth-child(3) { border-color: #4ade80; background: linear-gradient(135deg, #f0fdf4 0%, white 100%); }
          .stat-card:nth-child(4) { border-color: #fbbf24; background: linear-gradient(135deg, #fffbeb 0%, white 100%); }

          .stat-value {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 4px;
          }

          .stat-card:nth-child(1) .stat-value { color: #7c3aed; }
          .stat-card:nth-child(2) .stat-value { color: #2563eb; }
          .stat-card:nth-child(3) .stat-value { color: #16a34a; }
          .stat-card:nth-child(4) .stat-value { color: #d97706; }

          .stat-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }

          /* Day Cards */
          .days-section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .day-card {
            background: white;
            border-radius: 16px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .day-header {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 18px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
          }

          .day-title {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .day-icon {
            font-size: 28px;
          }

          .day-name {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
          }

          .day-badge {
            background: #7c3aed;
            color: white;
            padding: 8px 18px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
          }

          .exercises-table {
            width: 100%;
            border-collapse: collapse;
          }

          .exercises-table th {
            background: #f8fafc;
            padding: 14px 20px;
            text-align: right;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .exercises-table td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }

          .exercises-table tr:last-child td {
            border-bottom: none;
          }

          .exercises-table tr:hover {
            background: #fafafa;
          }

          .exercises-table .num {
            font-weight: 700;
            color: #7c3aed;
            text-align: center;
          }

          .exercises-table .exercise-name {
            font-weight: 600;
            color: #1e293b;
          }

          .exercises-table .muscle {
            color: #64748b;
            font-size: 13px;
          }

          .exercises-table .sets,
          .exercises-table .reps {
            font-weight: 700;
            color: #2563eb;
            text-align: center;
          }

          .exercises-table .rest {
            color: #16a34a;
            font-weight: 600;
            text-align: center;
          }

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
            color: #7c3aed;
          }

          .footer-date {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 10px;
          }

          /* Actions */
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

            .day-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .stat-card {
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
              <div class="brand-logo">🏋️</div>
              <div class="brand-text">LogicFit</div>
            </div>
            <h1 class="document-title">💪 ${formValue.name || 'برنامج التمرين'}</h1>
            <p class="document-subtitle">${formValue.description || 'برنامج تمرين مخصص لتحقيق أهدافك الرياضية'}</p>
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
                <span class="info-label">الهدف</span>
                <span class="info-value">${goalLabel}</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ الإنشاء</span>
                <span class="info-value">${today}</span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${formValue.durationWeeks || 0}</div>
              <div class="stat-label">أسبوع</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${totalDays}</div>
              <div class="stat-label">أيام التمرين</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${totalExercises}</div>
              <div class="stat-label">تمرين</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${diffLabel}</div>
              <div class="stat-label">المستوى</div>
            </div>
          </div>

          <!-- Days -->
          <div class="days-section-title">📋 جدول التمارين الأسبوعي</div>
          ${daysHtml}

          <!-- Footer -->
          <div class="document-footer">
            <p class="footer-note">💡 احرص على الإحماء قبل التمرين والتمدد بعده. استشر مدربك لأي تعديلات.</p>
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

  calculateEndDate(startDate: Date | string, weeks: number): string {
    if (!startDate || !weeks) return '-';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7));
    return end.toLocaleDateString('ar-EG');
  }

  printProgram(): void {
    this.previewProgram();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;

    // Format start date as ISO string
    const startDate = formValue.startDate instanceof Date
      ? formValue.startDate
      : new Date(formValue.startDate);
    const startDateFormatted = startDate.toISOString().split('T')[0];

    // Calculate end date from start date + duration weeks
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (formValue.durationWeeks * 7));
    const endDateFormatted = endDate.toISOString().split('T')[0];

    // Helper to parse reps (could be "12" or "8-12")
    const parseReps = (reps: any): { repsMin: number; repsMax: number } => {
      if (typeof reps === 'string' && reps.includes('-')) {
        const [min, max] = reps.split('-').map((n: string) => parseInt(n.trim()));
        return { repsMin: min || 12, repsMax: max || min || 12 };
      }
      const repsNum = parseInt(reps) || 12;
      return { repsMin: repsNum, repsMax: repsNum };
    };

    if (this.isEditMode && this.programId) {
      // Update mode - update basic program info first
      const updateData = {
        clientId: formValue.clientId,
        name: formValue.name,
        description: formValue.description,
        startDate: startDateFormatted,
        endDate: endDateFormatted
      };

      this.coachService.updateWorkoutProgram(this.programId, updateData).pipe(
        // After updating program, handle routines
        switchMap(() => this.updateRoutinesSequentially(formValue.days, parseReps))
      ).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم تحديث البرنامج بنجاح'
          });
          setTimeout(() => {
            this.router.navigate(['/coach/workout-programs']);
          }, 1000);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error updating workout program:', err);
          const errorMessage = err?.translatedMessage || err?.error?.message || 'فشل في تحديث البرنامج';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    } else {
      // Create mode - use sequential API calls
      const programData = {
        clientId: formValue.clientId,
        name: formValue.name,
        startDate: startDateFormatted,
        endDate: endDateFormatted
      };

      // Step 1: Create the program
      this.coachService.createWorkoutProgram(programData).pipe(
        switchMap((response: any) => {
          // Get the program ID from response
          const programId = response?.id || response;
          if (!programId) {
            throw new Error('لم يتم استلام معرف البرنامج');
          }

          // Step 2: Add routines sequentially
          const days = formValue.days || [];
          if (days.length === 0) {
            return of(null);
          }

          return from(days).pipe(
            concatMap((day: any, index: number) => {
              const routineData = {
                name: day.name || `اليوم ${index + 1}`,
                dayOfWeek: day.dayOfWeek ?? index
              };

              return this.coachService.addRoutineToProgram(programId, routineData).pipe(
                switchMap((routineResponse: any) => {
                  const routineId = routineResponse?.id || routineResponse;
                  const exercises = day.exercises || [];

                  if (exercises.length === 0 || !routineId) {
                    return of(null);
                  }

                  // Step 3: Add exercises to this routine sequentially
                  return from(exercises).pipe(
                    concatMap((ex: any) => {
                      const { repsMin, repsMax } = parseReps(ex.reps);
                      const exerciseData = {
                        exerciseId: typeof ex.exerciseId === 'string' ? parseInt(ex.exerciseId, 10) : ex.exerciseId,
                        sets: ex.sets || 3,
                        repsMin,
                        repsMax,
                        restSec: parseInt(ex.restSeconds) || 60,
                        supersetGroupId: ex.supersetGroupId || undefined
                      };
                      return this.coachService.addExerciseToRoutine(routineId, exerciseData);
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
            detail: 'تم إنشاء البرنامج بنجاح'
          });
          setTimeout(() => {
            this.router.navigate(['/coach/workout-programs']);
          }, 1000);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error creating workout program:', err);
          const errorMessage = err?.translatedMessage || err?.error?.message || 'فشل في إنشاء البرنامج';
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: errorMessage
          });
        }
      });
    }
  }

  // Helper method to update routines sequentially in edit mode
  private updateRoutinesSequentially(days: any[], parseReps: (reps: any) => { repsMin: number; repsMax: number }) {
    if (!days || days.length === 0) {
      return of(null);
    }

    return from(days).pipe(
      concatMap((day: any, index: number) => {
        // If routine has an ID, update it; otherwise, add new routine
        if (day.id) {
          // Update existing routine
          const routineData = {
            name: day.name || `اليوم ${index + 1}`,
            dayOfWeek: day.dayOfWeek ?? index
          };

          return this.coachService.updateRoutine(day.id, routineData).pipe(
            switchMap(() => this.updateExercisesSequentially(day.id, day.exercises || [], parseReps))
          );
        } else if (this.programId) {
          // Add new routine to existing program
          const routineData = {
            name: day.name || `اليوم ${index + 1}`,
            dayOfWeek: day.dayOfWeek ?? index
          };

          return this.coachService.addRoutineToProgram(this.programId, routineData).pipe(
            switchMap((routineResponse: any) => {
              const routineId = routineResponse?.id || routineResponse;
              if (!routineId) return of(null);
              return this.addExercisesToRoutine(routineId, day.exercises || [], parseReps);
            })
          );
        }
        return of(null);
      })
    );
  }

  // Helper method to update exercises sequentially
  private updateExercisesSequentially(routineId: string, exercises: any[], parseReps: (reps: any) => { repsMin: number; repsMax: number }) {
    if (!exercises || exercises.length === 0) {
      return of(null);
    }

    return from(exercises).pipe(
      concatMap((ex: any) => {
        const { repsMin, repsMax } = parseReps(ex.reps);

        if (ex.id) {
          // Update existing exercise
          const exerciseData = {
            sets: ex.sets || 3,
            repsMin,
            repsMax,
            restSec: parseInt(ex.restSeconds) || 60,
            supersetGroupId: ex.supersetGroupId || undefined
          };
          return this.coachService.updateRoutineExercise(ex.id, exerciseData);
        } else {
          // Add new exercise
          const exerciseData = {
            exerciseId: typeof ex.exerciseId === 'string' ? parseInt(ex.exerciseId, 10) : ex.exerciseId,
            sets: ex.sets || 3,
            repsMin,
            repsMax,
            restSec: parseInt(ex.restSeconds) || 60,
            supersetGroupId: ex.supersetGroupId || undefined
          };
          return this.coachService.addExerciseToRoutine(routineId, exerciseData);
        }
      })
    );
  }

  // Helper method to add exercises to a routine
  private addExercisesToRoutine(routineId: string, exercises: any[], parseReps: (reps: any) => { repsMin: number; repsMax: number }) {
    if (!exercises || exercises.length === 0) {
      return of(null);
    }

    return from(exercises).pipe(
      concatMap((ex: any) => {
        const { repsMin, repsMax } = parseReps(ex.reps);
        const exerciseData = {
          exerciseId: typeof ex.exerciseId === 'string' ? parseInt(ex.exerciseId, 10) : ex.exerciseId,
          sets: ex.sets || 3,
          repsMin,
          repsMax,
          restSec: parseInt(ex.restSeconds) || 60,
          supersetGroupId: ex.supersetGroupId || undefined
        };
        return this.coachService.addExerciseToRoutine(routineId, exerciseData);
      })
    );
  }
}
