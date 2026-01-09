import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, MealLog } from '../services/client.service';

@Component({
  selector: 'app-meal-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CalendarModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="meal-log-page">
      <app-page-header
        title="سجل الوجبات"
        subtitle="تتبع وجباتك اليومية"
        [breadcrumbs]="[{label: 'خطتي الغذائية', route: '/client/my-diet'}, {label: 'سجل الوجبات'}]"
      ></app-page-header>

      <!-- Date Selector -->
      <div class="date-selector">
        <button class="nav-btn" (click)="previousDay()">
          <i class="pi pi-chevron-right"></i>
        </button>
        <div class="date-display" (click)="showCalendar = true">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(selectedDate) }}</span>
        </div>
        <button class="nav-btn" (click)="nextDay()" [disabled]="isToday()">
          <i class="pi pi-chevron-left"></i>
        </button>
      </div>

      <!-- Calendar Overlay -->
      <div class="calendar-overlay" *ngIf="showCalendar" (click)="showCalendar = false">
        <div class="calendar-container" (click)="$event.stopPropagation()">
          <p-calendar
            [(ngModel)]="selectedDate"
            [inline]="true"
            [maxDate]="today"
            (onSelect)="onDateSelect()"
          ></p-calendar>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <!-- Daily Summary -->
      <div class="daily-summary" *ngIf="!loading()">
        <div class="summary-card">
          <div class="summary-value calories">{{ dailyTotals().calories }}</div>
          <div class="summary-label">سعرة</div>
        </div>
        <div class="summary-card">
          <div class="summary-value protein">{{ dailyTotals().protein }}g</div>
          <div class="summary-label">بروتين</div>
        </div>
        <div class="summary-card">
          <div class="summary-value carbs">{{ dailyTotals().carbs }}g</div>
          <div class="summary-label">كارب</div>
        </div>
        <div class="summary-card">
          <div class="summary-value fat">{{ dailyTotals().fat }}g</div>
          <div class="summary-label">دهون</div>
        </div>
      </div>

      <!-- Meals List -->
      <div class="meals-timeline" *ngIf="!loading()">
        @for (log of mealLogs(); track log.id) {
          <div class="meal-log-card">
            <div class="meal-time">
              <span class="time">{{ getTime(log.date) }}</span>
            </div>
            <div class="meal-content">
              <h4>{{ log.mealName }}</h4>
              <div class="foods-list">
                @for (food of log.foods; track food.foodName) {
                  <div class="food-item">
                    <span class="food-name">{{ food.foodName }}</span>
                    <span class="food-details">{{ food.quantity }} {{ food.unit }}</span>
                    <span class="food-calories">{{ food.calories }} kcal</span>
                  </div>
                }
              </div>
              <div class="meal-totals">
                <span class="total calories">{{ log.totalCalories }} kcal</span>
                <span class="total protein">{{ log.totalProtein }}g بروتين</span>
                <span class="total carbs">{{ log.totalCarbs }}g كارب</span>
                <span class="total fat">{{ log.totalFat }}g دهون</span>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <i class="pi pi-calendar"></i>
            <h3>لا توجد وجبات مسجلة</h3>
            <p>لم تقم بتسجيل أي وجبات في هذا اليوم</p>
            <a routerLink="/client/my-diet" class="btn btn-primary">
              العودة للخطة الغذائية
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .meal-log-page {
      max-width: 800px;
      padding-bottom: 2rem;
    }

    .date-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .date-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: var(--bg-secondary);
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-primary);

      i {
        color: #3b82f6;
      }
    }

    .calendar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .calendar-container {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 1rem;
    }

    .daily-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1rem;
      text-align: center;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;

      &.calories { color: #f59e0b; }
      &.protein { color: #ef4444; }
      &.carbs { color: #3b82f6; }
      &.fat { color: #22c55e; }
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .meals-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .meal-log-card {
      display: flex;
      gap: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
    }

    .meal-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;

      .time {
        font-weight: 600;
        color: #3b82f6;
      }
    }

    .meal-content {
      flex: 1;

      h4 {
        margin: 0 0 0.75rem;
        color: var(--text-primary);
      }
    }

    .foods-list {
      margin-bottom: 0.75rem;
    }

    .food-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px dashed var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .food-name {
        flex: 1;
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .food-details {
        color: var(--text-muted);
        font-size: 0.8rem;
        margin: 0 1rem;
      }

      .food-calories {
        color: #f59e0b;
        font-size: 0.8rem;
        font-weight: 500;
      }
    }

    .meal-totals {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .total {
      font-size: 0.8rem;
      font-weight: 500;

      &.calories { color: #f59e0b; }
      &.protein { color: #ef4444; }
      &.carbs { color: #3b82f6; }
      &.fat { color: #22c55e; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      p {
        margin-bottom: 1.5rem;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;

      &.btn-primary {
        background: #3b82f6;
        color: white;

        &:hover {
          background: #2563eb;
        }
      }
    }

    @media (max-width: 768px) {
      .daily-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .meal-log-card {
        flex-direction: column;
      }

      .meal-time {
        flex-direction: row;
        justify-content: flex-start;
      }
    }
  `]
})
export class MealLogComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  mealLogs = signal<MealLog[]>([]);
  selectedDate = new Date();
  today = new Date();
  showCalendar = false;

  dailyTotals = signal({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  ngOnInit(): void {
    this.loadMealLogs();
  }

  loadMealLogs(): void {
    this.loading.set(true);

    // Note: Meal log API endpoint doesn't exist yet - using mock data
    setTimeout(() => {
      // Mock data
        const mockLogs: MealLog[] = [
          {
            id: '1',
            date: '2024-01-15T08:00:00',
            mealName: 'الإفطار',
            foods: [
              { foodName: 'شوفان', quantity: 100, unit: 'g', calories: 389 },
              { foodName: 'بيض مسلوق', quantity: 3, unit: 'حبة', calories: 234 },
              { foodName: 'موز', quantity: 1, unit: 'حبة', calories: 105 }
            ],
            totalCalories: 728,
            totalProtein: 36,
            totalCarbs: 95,
            totalFat: 23
          },
          {
            id: '2',
            date: '2024-01-15T11:00:00',
            mealName: 'وجبة خفيفة',
            foods: [
              { foodName: 'زبادي يوناني', quantity: 200, unit: 'g', calories: 118 },
              { foodName: 'لوز', quantity: 30, unit: 'g', calories: 174 }
            ],
            totalCalories: 292,
            totalProtein: 26,
            totalCarbs: 14,
            totalFat: 16
          },
          {
            id: '3',
            date: '2024-01-15T14:00:00',
            mealName: 'الغداء',
            foods: [
              { foodName: 'صدر دجاج مشوي', quantity: 200, unit: 'g', calories: 330 },
              { foodName: 'أرز', quantity: 200, unit: 'g', calories: 260 },
              { foodName: 'سلطة خضراء', quantity: 150, unit: 'g', calories: 30 }
            ],
            totalCalories: 620,
            totalProtein: 69,
            totalCarbs: 62,
            totalFat: 8
          }
        ];
        this.mealLogs.set(mockLogs);
        this.calculateTotals(mockLogs);
        this.loading.set(false);
    }, 500);
  }

  calculateTotals(logs: MealLog[]): void {
    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.totalCalories,
        protein: acc.protein + log.totalProtein,
        carbs: acc.carbs + log.totalCarbs,
        fat: acc.fat + log.totalFat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    this.dailyTotals.set(totals);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  previousDay(): void {
    this.selectedDate = new Date(this.selectedDate.getTime() - 24 * 60 * 60 * 1000);
    this.loadMealLogs();
  }

  nextDay(): void {
    this.selectedDate = new Date(this.selectedDate.getTime() + 24 * 60 * 60 * 1000);
    this.loadMealLogs();
  }

  isToday(): boolean {
    return this.selectedDate.toDateString() === this.today.toDateString();
  }

  onDateSelect(): void {
    this.showCalendar = false;
    this.loadMealLogs();
  }
}
