import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, DietPlan, DietMeal, MealFood } from '../services/client.service';

@Component({
  selector: 'app-my-diet',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProgressBarModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-diet-page">
      <app-page-header
        title="خطتي الغذائية"
        [subtitle]="dietPlan()?.name || 'خطة التغذية الخاصة بك'"
        [breadcrumbs]="[{label: 'خطتي الغذائية'}]"
      >
        <a routerLink="/client/meal-log" class="btn btn-outline">
          <i class="pi pi-calendar"></i>
          سجل الوجبات
        </a>
      </app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <!-- No Plan State -->
      <div class="no-plan" *ngIf="!loading() && !dietPlan()">
        <div class="no-plan-content">
          <i class="pi pi-calendar"></i>
          <h2>لا توجد خطة تغذية</h2>
          <p>لم يتم تعيين خطة تغذية لك بعد. تواصل مع مدربك لإضافة خطة.</p>
        </div>
      </div>

      <!-- Diet Plan Content -->
      <div class="diet-content" *ngIf="!loading() && dietPlan()">
        <!-- Daily Summary -->
        <div class="daily-summary card">
          <div class="summary-header">
            <h3>ملخص اليوم</h3>
            <span class="date">{{ today }}</span>
          </div>

          <div class="macros-progress">
            <!-- Calories -->
            <div class="macro-card calories">
              <div class="macro-header">
                <span class="macro-label">السعرات</span>
                <span class="macro-values">
                  <strong>{{ consumedCalories() }}</strong> / {{ dietPlan()?.totalCalories }}
                </span>
              </div>
              <p-progressBar
                [value]="caloriesProgress()"
                [showValue]="false"
                styleClass="calories-bar"
              ></p-progressBar>
            </div>

            <!-- Protein -->
            <div class="macro-card protein">
              <div class="macro-header">
                <span class="macro-label">البروتين</span>
                <span class="macro-values">
                  <strong>{{ consumedProtein() }}g</strong> / {{ dietPlan()?.proteinGrams }}g
                </span>
              </div>
              <p-progressBar
                [value]="proteinProgress()"
                [showValue]="false"
                styleClass="protein-bar"
              ></p-progressBar>
            </div>

            <!-- Carbs -->
            <div class="macro-card carbs">
              <div class="macro-header">
                <span class="macro-label">الكربوهيدرات</span>
                <span class="macro-values">
                  <strong>{{ consumedCarbs() }}g</strong> / {{ dietPlan()?.carbsGrams }}g
                </span>
              </div>
              <p-progressBar
                [value]="carbsProgress()"
                [showValue]="false"
                styleClass="carbs-bar"
              ></p-progressBar>
            </div>

            <!-- Fat -->
            <div class="macro-card fat">
              <div class="macro-header">
                <span class="macro-label">الدهون</span>
                <span class="macro-values">
                  <strong>{{ consumedFat() }}g</strong> / {{ dietPlan()?.fatGrams }}g
                </span>
              </div>
              <p-progressBar
                [value]="fatProgress()"
                [showValue]="false"
                styleClass="fat-bar"
              ></p-progressBar>
            </div>
          </div>
        </div>

        <!-- Meals List -->
        <div class="meals-section">
          <h3>وجبات اليوم</h3>
          <div class="meals-list">
            @for (meal of dietPlan()?.meals; track meal.id) {
              <div class="meal-card" [class.completed]="meal.isCompleted">
                <div class="meal-header">
                  <div class="meal-info">
                    <span class="meal-time">{{ meal.time }}</span>
                    <h4>{{ meal.name }}</h4>
                  </div>
                  @if (meal.isCompleted) {
                    <div class="meal-status completed">
                      <i class="pi pi-check-circle"></i>
                      تم
                    </div>
                  } @else {
                    <button class="meal-status pending" (click)="completeMeal(meal)">
                      <i class="pi pi-circle"></i>
                      تسجيل
                    </button>
                  }
                </div>

                <div class="foods-list">
                  @for (food of meal.foods; track food.id) {
                    <div class="food-item">
                      <span class="food-name">{{ food.foodName }}</span>
                      <span class="food-quantity">{{ food.quantity }} {{ food.unit }}</span>
                      <span class="food-calories">{{ food.calories }} سعرة</span>
                    </div>
                  }
                </div>

                <div class="meal-macros">
                  <span class="macro">
                    <i class="pi pi-bolt"></i>
                    {{ getMealCalories(meal) }} kcal
                  </span>
                  <span class="macro protein">
                    {{ getMealProtein(meal) }}g بروتين
                  </span>
                  <span class="macro carbs">
                    {{ getMealCarbs(meal) }}g كارب
                  </span>
                  <span class="macro fat">
                    {{ getMealFat(meal) }}g دهون
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Coach Info -->
        <div class="coach-card card">
          <div class="coach-info">
            <i class="pi pi-user"></i>
            <div>
              <span class="label">أعدها لك</span>
              <span class="name">{{ dietPlan()?.coachName }}</span>
            </div>
          </div>
          <p class="plan-description">{{ dietPlan()?.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-diet-page {
      max-width: 800px;
      padding-bottom: 2rem;
    }

    .no-plan {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .no-plan-content {
      text-align: center;
      padding: 3rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      max-width: 400px;

      i {
        font-size: 4rem;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
        opacity: 0.5;
      }

      h2 {
        margin: 0 0 0.75rem;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.6;
      }
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .daily-summary {
      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .date {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      }
    }

    .macros-progress {
      display: grid;
      gap: 1rem;
    }

    .macro-card {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .macro-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;

      .macro-label {
        font-weight: 500;
        color: var(--text-secondary);
      }

      .macro-values {
        font-size: 0.9rem;
        color: var(--text-muted);

        strong {
          color: var(--text-primary);
        }
      }
    }

    ::ng-deep .calories-bar .p-progressbar-value { background: #f59e0b; }
    ::ng-deep .protein-bar .p-progressbar-value { background: #ef4444; }
    ::ng-deep .carbs-bar .p-progressbar-value { background: #3b82f6; }
    ::ng-deep .fat-bar .p-progressbar-value { background: #22c55e; }

    .meals-section {
      h3 {
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }

    .meals-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .meal-card {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      transition: all 0.3s;

      &.completed {
        background: var(--bg-secondary);
        opacity: 0.8;
      }
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .meal-info {
      .meal-time {
        display: block;
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: 0.25rem;
      }

      h4 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
      }
    }

    .meal-status {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      border: none;
      cursor: pointer;

      &.completed {
        background: #dcfce7;
        color: #16a34a;
        cursor: default;
      }

      &.pending {
        background: var(--bg-secondary);
        color: var(--text-secondary);

        &:hover {
          background: #3b82f6;
          color: white;
        }
      }
    }

    .foods-list {
      margin-bottom: 1rem;
    }

    .food-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .food-name {
        flex: 1;
        color: var(--text-primary);
      }

      .food-quantity {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin: 0 1rem;
      }

      .food-calories {
        color: #f59e0b;
        font-weight: 500;
        font-size: 0.85rem;
      }
    }

    .meal-macros {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .macro {
      font-size: 0.8rem;
      color: var(--text-secondary);

      i {
        color: #f59e0b;
      }

      &.protein { color: #ef4444; }
      &.carbs { color: #3b82f6; }
      &.fat { color: #22c55e; }
    }

    .coach-card {
      .coach-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;

        i {
          font-size: 2rem;
          color: var(--text-muted);
        }

        .label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .name {
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .plan-description {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.6;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #22c55e;
          color: #22c55e;
        }
      }
    }
  `]
})
export class MyDietComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  dietPlan = signal<DietPlan | null>(null);

  today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Computed values for consumed nutrients (based on completed meals)
  consumedCalories = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.meals) return 0;
    return plan.meals.filter(m => m.isCompleted).reduce((sum, m) => sum + this.getMealCalories(m), 0);
  });

  consumedProtein = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.meals) return 0;
    return plan.meals.filter(m => m.isCompleted).reduce((sum, m) => sum + this.getMealProtein(m), 0);
  });

  consumedCarbs = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.meals) return 0;
    return plan.meals.filter(m => m.isCompleted).reduce((sum, m) => sum + this.getMealCarbs(m), 0);
  });

  consumedFat = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.meals) return 0;
    return plan.meals.filter(m => m.isCompleted).reduce((sum, m) => sum + this.getMealFat(m), 0);
  });

  caloriesProgress = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.totalCalories || plan.totalCalories === 0) return 0;
    return Math.round((this.consumedCalories() / plan.totalCalories) * 100);
  });

  proteinProgress = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.proteinGrams || plan.proteinGrams === 0) return 0;
    return Math.round((this.consumedProtein() / plan.proteinGrams) * 100);
  });

  carbsProgress = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.carbsGrams || plan.carbsGrams === 0) return 0;
    return Math.round((this.consumedCarbs() / plan.carbsGrams) * 100);
  });

  fatProgress = computed(() => {
    const plan = this.dietPlan();
    if (!plan || !plan.fatGrams || plan.fatGrams === 0) return 0;
    return Math.round((this.consumedFat() / plan.fatGrams) * 100);
  });

  ngOnInit(): void {
    this.loadDietPlan();
  }

  loadDietPlan(): void {
    this.loading.set(true);

    this.clientService.getMyDietPlan().subscribe({
      next: (data) => {
        // API returns array, get first active plan
        const plans = Array.isArray(data) ? data : [data];
        if (plans.length > 0) {
          const plan = this.mapDietPlanToLegacy(plans[0]);
          this.dietPlan.set(plan);
        } else {
          this.dietPlan.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        this.dietPlan.set({
          id: '1',
          name: 'خطة بناء العضلات',
          description: 'خطة غذائية عالية البروتين مصممة لدعم بناء الكتلة العضلية مع الحفاظ على نسبة دهون منخفضة.',
          coachName: 'أحمد المدرب',
          totalCalories: 2800,
          proteinGrams: 180,
          carbsGrams: 320,
          fatGrams: 80,
          meals: [
            {
              id: '1',
              name: 'الإفطار',
              time: '8:00 ص',
              isCompleted: true,
              foods: [
                { id: '1', foodName: 'شوفان', quantity: 100, unit: 'g', calories: 389, protein: 17, carbs: 66, fat: 7 },
                { id: '2', foodName: 'بيض', quantity: 3, unit: 'حبة', calories: 234, protein: 18, carbs: 2, fat: 16 },
                { id: '3', foodName: 'موز', quantity: 1, unit: 'حبة', calories: 105, protein: 1, carbs: 27, fat: 0 }
              ]
            },
            {
              id: '2',
              name: 'وجبة خفيفة',
              time: '11:00 ص',
              isCompleted: true,
              foods: [
                { id: '4', foodName: 'زبادي يوناني', quantity: 200, unit: 'g', calories: 118, protein: 20, carbs: 7, fat: 1 },
                { id: '5', foodName: 'لوز', quantity: 30, unit: 'g', calories: 174, protein: 6, carbs: 7, fat: 15 }
              ]
            },
            {
              id: '3',
              name: 'الغداء',
              time: '2:00 م',
              isCompleted: false,
              foods: [
                { id: '6', foodName: 'صدر دجاج مشوي', quantity: 200, unit: 'g', calories: 330, protein: 62, carbs: 0, fat: 7 },
                { id: '7', foodName: 'أرز', quantity: 200, unit: 'g', calories: 260, protein: 5, carbs: 56, fat: 1 },
                { id: '8', foodName: 'سلطة خضراء', quantity: 150, unit: 'g', calories: 30, protein: 2, carbs: 6, fat: 0 }
              ]
            },
            {
              id: '4',
              name: 'قبل التمرين',
              time: '5:00 م',
              isCompleted: false,
              foods: [
                { id: '9', foodName: 'بطاطا حلوة', quantity: 200, unit: 'g', calories: 172, protein: 3, carbs: 40, fat: 0 },
                { id: '10', foodName: 'واي بروتين', quantity: 30, unit: 'g', calories: 120, protein: 24, carbs: 3, fat: 1 }
              ]
            },
            {
              id: '5',
              name: 'العشاء',
              time: '8:00 م',
              isCompleted: false,
              foods: [
                { id: '11', foodName: 'سلمون مشوي', quantity: 200, unit: 'g', calories: 416, protein: 40, carbs: 0, fat: 26 },
                { id: '12', foodName: 'خضروات مشوية', quantity: 200, unit: 'g', calories: 80, protein: 4, carbs: 16, fat: 1 }
              ]
            }
          ]
        });
        this.loading.set(false);
      }
    });
  }

  getMealCalories(meal: DietMeal): number {
    return meal.foods.reduce((sum, f) => sum + f.calories, 0);
  }

  getMealProtein(meal: DietMeal): number {
    return meal.foods.reduce((sum, f) => sum + f.protein, 0);
  }

  getMealCarbs(meal: DietMeal): number {
    return meal.foods.reduce((sum, f) => sum + f.carbs, 0);
  }

  getMealFat(meal: DietMeal): number {
    return meal.foods.reduce((sum, f) => sum + f.fat, 0);
  }

  completeMeal(meal: DietMeal): void {
    meal.isCompleted = true;
    // Note: completeMeal API endpoint doesn't exist yet - UI only
  }

  /**
   * Map API DietPlan response to legacy format for component compatibility
   */
  private mapDietPlanToLegacy(plan: DietPlan): DietPlan {
    // Map target fields to legacy names
    const mappedPlan: DietPlan = {
      ...plan,
      totalCalories: plan.targetCalories ?? plan.totalCalories,
      proteinGrams: plan.targetProtein ?? plan.proteinGrams,
      carbsGrams: plan.targetCarbs ?? plan.carbsGrams,
      fatGrams: plan.targetFats ?? plan.fatGrams,
    };

    // Meals are already in DietMeal format from service, just ensure they exist
    if (!mappedPlan.meals) {
      mappedPlan.meals = [];
    }

    return mappedPlan;
  }
}
