import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, WorkoutProgram, WorkoutDay, ProgramRoutine } from '../services/client.service';

@Component({
  selector: 'app-my-program',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProgressBarModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-program-page">
      <app-page-header
        title="برنامجي التدريبي"
        [subtitle]="program()?.name || 'برنامج التمرين الخاص بك'"
        [breadcrumbs]="[{label: 'برنامجي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <!-- No Program State -->
      <div class="no-program" *ngIf="!loading() && !program()">
        <div class="no-program-content">
          <i class="pi pi-list"></i>
          <h2>لا يوجد برنامج تمرين</h2>
          <p>لم يتم تعيين برنامج تمرين لك بعد. تواصل مع مدربك لإضافة برنامج.</p>
        </div>
      </div>

      <!-- Program Content -->
      <div class="program-content" *ngIf="!loading() && program()">
        <!-- Program Overview -->
        <div class="program-overview card">
          <div class="program-header">
            <div class="program-info">
              <h2>{{ program()?.name }}</h2>
              <p>{{ program()?.description }}</p>
              <div class="coach-info">
                <i class="pi pi-user"></i>
                <span>المدرب: {{ program()?.coachName }}</span>
              </div>
            </div>
            <div class="program-goal">
              <span class="goal-badge">{{ program()?.goal }}</span>
            </div>
          </div>

          <div class="program-stats">
            <div class="stat">
              <span class="stat-value">{{ program()?.durationWeeks }}</span>
              <span class="stat-label">أسبوع</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ program()?.currentWeek }}</span>
              <span class="stat-label">الأسبوع الحالي</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ program()?.daysPerWeek }}</span>
              <span class="stat-label">أيام/أسبوع</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ completedDays() }}</span>
              <span class="stat-label">أيام مكتملة</span>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span>التقدم الأسبوعي</span>
              <span>{{ weekProgress() }}%</span>
            </div>
            <p-progressBar [value]="weekProgress()" [showValue]="false"></p-progressBar>
          </div>
        </div>

        <!-- Workout Days -->
        <div class="days-section">
          <h3>أيام التمرين</h3>
          <div class="days-grid">
            @for (day of program()?.workoutDays; track day.id) {
              <div
                class="day-card"
                [class.today]="day.isToday"
                [class.completed]="day.isCompleted"
              >
                <div class="day-header">
                  <span class="day-number">اليوم {{ day.dayNumber }}</span>
                  @if (day.isToday) {
                    <span class="today-badge">اليوم</span>
                  }
                  @if (day.isCompleted) {
                    <i class="pi pi-check-circle completed-icon"></i>
                  }
                </div>

                <h4 class="day-name">{{ day.name }}</h4>

                <div class="exercises-preview">
                  <span class="exercises-count">
                    <i class="pi pi-list"></i>
                    {{ day.exercises.length }} تمرين
                  </span>
                  <div class="muscle-groups">
                    @for (muscle of getUniqueMuscles(day); track muscle) {
                      <span class="muscle-tag">{{ muscle }}</span>
                    }
                  </div>
                </div>

                <div class="day-actions">
                  @if (day.isToday && !day.isCompleted) {
                    <a routerLink="/client/workout-session" [queryParams]="{routineId: day.id}" class="btn btn-primary">
                      <i class="pi pi-play"></i>
                      ابدأ التمرين
                    </a>
                  } @else if (day.isCompleted) {
                    <button class="btn btn-outline" disabled>
                      <i class="pi pi-check"></i>
                      مكتمل
                    </button>
                  } @else {
                    <button class="btn btn-outline" (click)="viewDay(day)">
                      <i class="pi pi-eye"></i>
                      عرض
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-program-page {
      max-width: 1200px;
      padding-bottom: 2rem;
    }

    .no-program {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .no-program-content {
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

    .program-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .program-info {
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
      }
    }

    .coach-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .goal-badge {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      color: white;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .program-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat {
      text-align: center;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;

      .stat-value {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .progress-section {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .days-section {
      h3 {
        margin: 0 0 1.25rem;
        font-size: 1.1rem;
        color: var(--text-primary);
      }
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .day-card {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 8px 25px var(--shadow-color);
        transform: translateY(-2px);
      }

      &.today {
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      &.completed {
        opacity: 0.8;
        background: var(--bg-secondary);
      }
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .day-number {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .today-badge {
      padding: 0.2rem 0.6rem;
      background: #3b82f6;
      color: white;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .completed-icon {
      color: #22c55e;
      font-size: 1.25rem;
      margin-right: auto;
    }

    :host-context([dir="ltr"]) .completed-icon {
      margin-right: 0;
      margin-left: auto;
    }

    .day-name {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .exercises-preview {
      margin-bottom: 1rem;
    }

    .exercises-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
    }

    .muscle-groups {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .muscle-tag {
      padding: 0.2rem 0.5rem;
      background: #ede9fe;
      color: #7c3aed;
      border-radius: 8px;
      font-size: 0.7rem;
    }

    .day-actions {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;

      &.btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;

        &:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }

    @media (max-width: 768px) {
      .program-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .program-header {
        flex-direction: column;
        gap: 1rem;
      }

      .days-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyProgramComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  program = signal<WorkoutProgram | null>(null);

  completedDays(): number {
    return this.program()?.workoutDays?.filter(d => d.isCompleted).length || 0;
  }

  weekProgress(): number {
    const days = this.program()?.workoutDays || [];
    if (days.length === 0) return 0;
    return Math.round((this.completedDays() / days.length) * 100);
  }

  ngOnInit(): void {
    this.loadProgram();
  }

  loadProgram(): void {
    this.loading.set(true);

    this.clientService.getMyWorkoutProgram().subscribe({
      next: (data) => {
        // API returns array, get first program
        const programs = Array.isArray(data) ? data : [data];
        if (programs.length > 0) {
          const mappedProgram = this.mapProgramFromApi(programs[0]);
          this.program.set(mappedProgram);
        } else {
          this.program.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        // Mock data for development
        this.program.set({
          id: '1',
          name: 'برنامج بناء العضلات',
          description: 'برنامج مصمم لبناء الكتلة العضلية وزيادة القوة',
          coachName: 'أحمد المدرب',
          durationWeeks: 8,
          currentWeek: 3,
          daysPerWeek: 4,
          goal: 'بناء العضلات',
          workoutDays: [
            {
              id: '1',
              dayNumber: 1,
              name: 'صدر وترايسبس',
              isCompleted: true,
              isToday: false,
              exercises: [
                { id: '1', exerciseId: '1', exerciseName: 'بنش برس', muscleGroup: 'صدر', sets: 4, reps: 12, restSeconds: 90, isCompleted: true, completedSets: [] },
                { id: '2', exerciseId: '2', exerciseName: 'بنش مائل', muscleGroup: 'صدر', sets: 3, reps: 12, restSeconds: 90, isCompleted: true, completedSets: [] },
                { id: '3', exerciseId: '3', exerciseName: 'فلاي', muscleGroup: 'صدر', sets: 3, reps: 15, restSeconds: 60, isCompleted: true, completedSets: [] },
                { id: '4', exerciseId: '4', exerciseName: 'ترايسبس بوش داون', muscleGroup: 'ترايسبس', sets: 3, reps: 12, restSeconds: 60, isCompleted: true, completedSets: [] }
              ]
            },
            {
              id: '2',
              dayNumber: 2,
              name: 'ظهر وبايسبس',
              isCompleted: true,
              isToday: false,
              exercises: [
                { id: '5', exerciseId: '5', exerciseName: 'لات بول داون', muscleGroup: 'ظهر', sets: 4, reps: 12, restSeconds: 90, isCompleted: true, completedSets: [] },
                { id: '6', exerciseId: '6', exerciseName: 'رو بالكيبل', muscleGroup: 'ظهر', sets: 3, reps: 12, restSeconds: 90, isCompleted: true, completedSets: [] },
                { id: '7', exerciseId: '7', exerciseName: 'بايسبس كيرل', muscleGroup: 'بايسبس', sets: 3, reps: 12, restSeconds: 60, isCompleted: true, completedSets: [] }
              ]
            },
            {
              id: '3',
              dayNumber: 3,
              name: 'أكتاف وترابيس',
              isCompleted: false,
              isToday: true,
              exercises: [
                { id: '8', exerciseId: '8', exerciseName: 'شولدر برس', muscleGroup: 'أكتاف', sets: 4, reps: 12, restSeconds: 90, isCompleted: false, completedSets: [] },
                { id: '9', exerciseId: '9', exerciseName: 'لاترال ريز', muscleGroup: 'أكتاف', sets: 3, reps: 15, restSeconds: 60, isCompleted: false, completedSets: [] },
                { id: '10', exerciseId: '10', exerciseName: 'شراجز', muscleGroup: 'ترابيس', sets: 3, reps: 15, restSeconds: 60, isCompleted: false, completedSets: [] }
              ]
            },
            {
              id: '4',
              dayNumber: 4,
              name: 'أرجل',
              isCompleted: false,
              isToday: false,
              exercises: [
                { id: '11', exerciseId: '11', exerciseName: 'سكوات', muscleGroup: 'أرجل', sets: 4, reps: 12, restSeconds: 120, isCompleted: false, completedSets: [] },
                { id: '12', exerciseId: '12', exerciseName: 'ليج برس', muscleGroup: 'أرجل', sets: 3, reps: 15, restSeconds: 90, isCompleted: false, completedSets: [] },
                { id: '13', exerciseId: '13', exerciseName: 'ليج كيرل', muscleGroup: 'أرجل', sets: 3, reps: 12, restSeconds: 60, isCompleted: false, completedSets: [] }
              ]
            }
          ]
        });
        this.loading.set(false);
      }
    });
  }

  getUniqueMuscles(day: WorkoutDay): string[] {
    const muscles = new Set(day.exercises.map(e => e.muscleGroup));
    return Array.from(muscles).slice(0, 3);
  }

  viewDay(day: WorkoutDay): void {
    console.log('View day', day);
  }

  /**
   * Map API WorkoutProgramDto to component format
   * API returns routines[] with dayOfWeek, but component expects workoutDays[]
   */
  private mapProgramFromApi(program: WorkoutProgram): WorkoutProgram {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date().getDay();

    // If workoutDays already exists, return as-is (legacy format or already mapped)
    if (program.workoutDays && program.workoutDays.length > 0) {
      return program;
    }

    // Map routines to workoutDays
    const workoutDays: WorkoutDay[] = (program.routines || []).map((routine, index) => {
      const dayOfWeek = routine.dayOfWeek ?? index;
      return {
        id: routine.id,
        dayNumber: index + 1,
        name: routine.name || `${dayNames[dayOfWeek]} - تمرين`,
        isCompleted: false, // Would need session data to determine
        isToday: dayOfWeek === today,
        exercises: (routine.exercises || []).map(ex => ({
          id: ex.id,
          exerciseId: ex.exerciseId.toString(),
          exerciseName: ex.exerciseName || '',
          muscleGroup: '', // Not provided by API, would need exercise details
          sets: ex.sets,
          reps: ex.repsMax || ex.repsMin,
          restSeconds: ex.restSec,
          isCompleted: false,
          completedSets: []
        }))
      };
    });

    // Calculate program duration if dates provided
    let durationWeeks: number | undefined;
    if (program.startDate && program.endDate) {
      const start = new Date(program.startDate);
      const end = new Date(program.endDate);
      durationWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    }

    // Calculate current week
    let currentWeek: number | undefined;
    if (program.startDate) {
      const start = new Date(program.startDate);
      const now = new Date();
      currentWeek = Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    }

    return {
      ...program,
      workoutDays,
      durationWeeks: program.durationWeeks ?? durationWeeks,
      currentWeek: program.currentWeek ?? currentWeek ?? 1,
      daysPerWeek: program.daysPerWeek ?? workoutDays.length
    };
  }
}
