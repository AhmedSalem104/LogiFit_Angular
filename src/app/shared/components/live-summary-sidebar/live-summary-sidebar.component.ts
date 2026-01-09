import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DietSummaryData {
  totalCalories: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
  mealsCount: number;
  foodsCount: number;
}

export interface WorkoutSummaryData {
  totalVolume: number;
  totalSets: number;
  totalExercises: number;
  daysCount: number;
  muscleDistribution: { muscle: string; percentage: number; color: string }[];
}

@Component({
  selector: 'app-live-summary-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="summary-sidebar" [class.collapsed]="collapsed" [class.diet-theme]="type === 'diet'" [class.workout-theme]="type === 'workout'">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-title">
          <i class="pi pi-chart-pie"></i>
          <span>{{ type === 'diet' ? 'ملخص التغذية' : 'ملخص التدريب' }}</span>
        </div>
        <button class="toggle-btn" (click)="toggleCollapse()">
          <i class="pi" [class.pi-chevron-left]="!collapsed" [class.pi-chevron-right]="collapsed"></i>
        </button>
      </div>

      @if (!collapsed) {
        <div class="sidebar-content">
          <!-- Diet Summary -->
          @if (type === 'diet' && dietData) {
            <!-- Calorie Ring -->
            <div class="stat-ring-container">
              <svg class="progress-ring" viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="45" />
                <circle
                  class="ring-progress"
                  cx="50" cy="50" r="45"
                  [style.strokeDasharray]="circumference"
                  [style.strokeDashoffset]="getCalorieOffset()"
                  [class.warning]="getCaloriePercent() > 100"
                />
              </svg>
              <div class="ring-content">
                <span class="ring-value">{{ dietData.totalCalories | number:'1.0-0' }}</span>
                <span class="ring-label">/ {{ dietData.targetCalories }}</span>
                <span class="ring-unit">سعرة</span>
              </div>
            </div>

            <!-- Macro Bars -->
            <div class="macro-bars">
              <div class="macro-bar protein">
                <div class="macro-header">
                  <span class="macro-icon">🥩</span>
                  <span class="macro-name">بروتين</span>
                  <span class="macro-value">{{ dietData.protein | number:'1.0-0' }}g</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="getPercent(dietData.protein, dietData.targetProtein)"></div>
                </div>
                <span class="macro-target">/ {{ dietData.targetProtein }}g</span>
              </div>

              <div class="macro-bar carbs">
                <div class="macro-header">
                  <span class="macro-icon">🍚</span>
                  <span class="macro-name">كربوهيدرات</span>
                  <span class="macro-value">{{ dietData.carbs | number:'1.0-0' }}g</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="getPercent(dietData.carbs, dietData.targetCarbs)"></div>
                </div>
                <span class="macro-target">/ {{ dietData.targetCarbs }}g</span>
              </div>

              <div class="macro-bar fat">
                <div class="macro-header">
                  <span class="macro-icon">🥑</span>
                  <span class="macro-name">دهون</span>
                  <span class="macro-value">{{ dietData.fat | number:'1.0-0' }}g</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="getPercent(dietData.fat, dietData.targetFat)"></div>
                </div>
                <span class="macro-target">/ {{ dietData.targetFat }}g</span>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="quick-stat">
                <i class="pi pi-calendar"></i>
                <span class="stat-value">{{ dietData.mealsCount }}</span>
                <span class="stat-label">وجبات</span>
              </div>
              <div class="quick-stat">
                <i class="pi pi-apple"></i>
                <span class="stat-value">{{ dietData.foodsCount }}</span>
                <span class="stat-label">أطعمة</span>
              </div>
            </div>
          }

          <!-- Workout Summary -->
          @if (type === 'workout' && workoutData) {
            <!-- Volume Display -->
            <div class="volume-display">
              <div class="volume-icon">
                <i class="pi pi-bolt"></i>
              </div>
              <div class="volume-content">
                <span class="volume-value">{{ workoutData.totalVolume | number:'1.0-0' }}</span>
                <span class="volume-unit">كجم حجم كلي</span>
              </div>
            </div>

            <!-- Workout Stats -->
            <div class="workout-stats">
              <div class="workout-stat">
                <div class="stat-icon sets">
                  <i class="pi pi-replay"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ workoutData.totalSets }}</span>
                  <span class="stat-label">مجموعة</span>
                </div>
              </div>

              <div class="workout-stat">
                <div class="stat-icon exercises">
                  <i class="pi pi-list"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ workoutData.totalExercises }}</span>
                  <span class="stat-label">تمرين</span>
                </div>
              </div>

              <div class="workout-stat">
                <div class="stat-icon days">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ workoutData.daysCount }}</span>
                  <span class="stat-label">يوم</span>
                </div>
              </div>
            </div>

            <!-- Muscle Distribution -->
            @if (workoutData.muscleDistribution && workoutData.muscleDistribution.length > 0) {
              <div class="muscle-distribution">
                <h4 class="section-title">
                  <i class="pi pi-chart-bar"></i>
                  توزيع العضلات
                </h4>
                <div class="muscle-bars">
                  @for (muscle of workoutData.muscleDistribution; track muscle.muscle) {
                    <div class="muscle-bar">
                      <div class="muscle-info">
                        <span class="muscle-name">{{ muscle.muscle }}</span>
                        <span class="muscle-percent">{{ muscle.percentage }}%</span>
                      </div>
                      <div class="muscle-track">
                        <div
                          class="muscle-fill"
                          [style.width.%]="muscle.percentage"
                          [style.background]="muscle.color"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      }
    </aside>
  `,
  styles: [`
    .summary-sidebar {
      width: 280px;
      min-width: 280px;
      background: var(--premium-bg-elevated);
      border-radius: var(--premium-radius-xl);
      border: 1px solid var(--premium-border-default);
      display: flex;
      flex-direction: column;
      transition: all var(--transition-base);
      overflow: hidden;

      &.collapsed {
        width: 60px;
        min-width: 60px;
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--premium-border-default);
      background: var(--premium-bg-surface);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--premium-text-primary);
      font-weight: 600;
      font-size: 14px;

      .pi {
        color: var(--theme-primary, var(--diet-primary));
        font-size: 18px;
      }

      .collapsed & {
        display: none;
      }
    }

    .toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: var(--premium-bg-card);
      color: var(--premium-text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--premium-bg-hover);
        color: var(--premium-text-primary);
      }
    }

    .sidebar-content {
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      overflow-y: auto;
      flex: 1;
    }

    // Calorie Ring
    .stat-ring-container {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 0 auto;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: var(--premium-bg-card);
      stroke-width: 8;
    }

    .ring-progress {
      fill: none;
      stroke: var(--theme-primary, var(--diet-primary));
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s ease;

      &.warning {
        stroke: var(--macro-calories);
      }
    }

    .ring-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .ring-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--premium-text-primary);
      line-height: 1;
    }

    .ring-label {
      font-size: 12px;
      color: var(--premium-text-muted);
    }

    .ring-unit {
      font-size: 11px;
      color: var(--premium-text-muted);
    }

    // Macro Bars
    .macro-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .macro-bar {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .macro-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .macro-icon {
      font-size: 14px;
    }

    .macro-name {
      flex: 1;
      font-size: 12px;
      color: var(--premium-text-secondary);
    }

    .macro-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--premium-text-primary);
    }

    .bar-track {
      height: 6px;
      background: var(--premium-bg-card);
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .macro-bar.protein .bar-fill {
      background: var(--macro-protein);
    }

    .macro-bar.carbs .bar-fill {
      background: var(--macro-carbs);
    }

    .macro-bar.fat .bar-fill {
      background: var(--macro-fat);
    }

    .macro-target {
      font-size: 11px;
      color: var(--premium-text-muted);
      text-align: left;
    }

    // Quick Stats
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .quick-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px;
      background: var(--premium-bg-card);
      border-radius: var(--premium-radius-md);
      border: 1px solid var(--premium-border-default);

      .pi {
        font-size: 18px;
        color: var(--theme-primary, var(--diet-primary));
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--premium-text-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--premium-text-muted);
      }
    }

    // Workout Volume
    .volume-display {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, var(--premium-bg-card) 0%, var(--premium-bg-surface) 100%);
      border-radius: var(--premium-radius-lg);
      border: 1px solid var(--premium-border-default);
    }

    .volume-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: var(--premium-gradient-workout);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px var(--workout-primary-glow);

      .pi {
        font-size: 24px;
        color: white;
      }
    }

    .volume-content {
      display: flex;
      flex-direction: column;
    }

    .volume-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--premium-text-primary);
      line-height: 1;
    }

    .volume-unit {
      font-size: 12px;
      color: var(--premium-text-muted);
      margin-top: 4px;
    }

    // Workout Stats
    .workout-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .workout-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--premium-bg-card);
      border-radius: var(--premium-radius-md);
      border: 1px solid var(--premium-border-default);
    }

    .stat-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      .pi {
        font-size: 16px;
        color: white;
      }

      &.sets {
        background: var(--sets-color);
      }

      &.exercises {
        background: var(--reps-color);
      }

      &.days {
        background: var(--weight-color);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--premium-text-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--premium-text-muted);
      }
    }

    // Muscle Distribution
    .muscle-distribution {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--premium-text-secondary);

      .pi {
        color: var(--theme-primary, var(--workout-primary));
      }
    }

    .muscle-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .muscle-bar {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .muscle-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .muscle-name {
      font-size: 12px;
      color: var(--premium-text-secondary);
    }

    .muscle-percent {
      font-size: 12px;
      font-weight: 600;
      color: var(--premium-text-primary);
    }

    .muscle-track {
      height: 4px;
      background: var(--premium-bg-darkest);
      border-radius: 2px;
      overflow: hidden;
    }

    .muscle-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.5s ease;
    }

    // Theme Colors
    .diet-theme {
      --theme-primary: var(--diet-primary);
      --theme-glow: var(--diet-primary-glow);
    }

    .workout-theme {
      --theme-primary: var(--workout-primary);
      --theme-glow: var(--workout-primary-glow);
    }

    // Responsive
    @media (max-width: 1200px) {
      .summary-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1000;
        border-radius: 0;
        transform: translateX(-100%);

        &:not(.collapsed) {
          transform: translateX(0);
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
        }
      }
    }
  `]
})
export class LiveSummarySidebarComponent {
  @Input() type: 'diet' | 'workout' = 'diet';
  @Input() dietData: DietSummaryData | null = null;
  @Input() workoutData: WorkoutSummaryData | null = null;
  @Input() collapsed: boolean = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  circumference = 2 * Math.PI * 45; // r = 45

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  getCaloriePercent(): number {
    if (!this.dietData || !this.dietData.targetCalories) return 0;
    return (this.dietData.totalCalories / this.dietData.targetCalories) * 100;
  }

  getCalorieOffset(): number {
    const percent = Math.min(this.getCaloriePercent(), 100);
    return this.circumference - (percent / 100) * this.circumference;
  }

  getPercent(value: number, target: number): number {
    if (!target) return 0;
    return Math.min((value / target) * 100, 100);
  }
}
