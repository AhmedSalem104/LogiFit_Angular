import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ClientService, WorkoutDay, WorkoutExercise, CompletedSet } from '../services/client.service';

@Component({
  selector: 'app-workout-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputNumberModule,
    ButtonModule,
    DialogModule,
    ProgressBarModule
  ],
  template: `
    <div class="workout-session">
      <!-- Header -->
      <div class="session-header">
        <button class="back-btn" (click)="exitSession()">
          <i class="pi pi-arrow-right"></i>
        </button>
        <div class="session-info">
          <h1>{{ currentDay()?.name }}</h1>
          <span class="session-progress">{{ completedExercises() }}/{{ totalExercises() }} تمرين</span>
        </div>
        <div class="timer">
          <i class="pi pi-clock"></i>
          <span>{{ formatTime(sessionTime()) }}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-container">
        <p-progressBar [value]="sessionProgress()" [showValue]="false"></p-progressBar>
      </div>

      <!-- Current Exercise -->
      <div class="current-exercise" *ngIf="currentExercise()">
        <div class="exercise-card">
          <div class="exercise-image">
            @if (currentExercise()?.imageUrl) {
              <img [src]="currentExercise()?.imageUrl" [alt]="currentExercise()?.exerciseName" />
            } @else {
              <div class="placeholder">
                <i class="pi pi-image"></i>
              </div>
            }
            <button class="video-btn" *ngIf="currentExercise()?.videoUrl" (click)="showVideo()">
              <i class="pi pi-play"></i>
              عرض الفيديو
            </button>
          </div>

          <div class="exercise-details">
            <span class="muscle-tag">{{ currentExercise()?.muscleGroup }}</span>
            <h2>{{ currentExercise()?.exerciseName }}</h2>

            <div class="exercise-target">
              <div class="target-item">
                <span class="target-value">{{ currentExercise()?.sets }}</span>
                <span class="target-label">مجموعات</span>
              </div>
              <div class="target-item">
                <span class="target-value">{{ currentExercise()?.reps }}</span>
                <span class="target-label">تكرار</span>
              </div>
              <div class="target-item">
                <span class="target-value">{{ currentExercise()?.restSeconds }}ث</span>
                <span class="target-label">راحة</span>
              </div>
            </div>

            <p class="exercise-notes" *ngIf="currentExercise()?.notes">
              <i class="pi pi-info-circle"></i>
              {{ currentExercise()?.notes }}
            </p>
          </div>
        </div>

        <!-- Sets Tracking -->
        <div class="sets-section">
          <h3>تسجيل المجموعات</h3>
          <div class="sets-grid">
            @for (set of getSetsArray(); track set.number) {
              <div class="set-card" [class.completed]="isSetCompleted(set.number)" [class.current]="set.number === currentSetNumber()">
                <div class="set-header">
                  <span class="set-number">المجموعة {{ set.number }}</span>
                  @if (isSetCompleted(set.number)) {
                    <i class="pi pi-check-circle"></i>
                  }
                </div>
                @if (!isSetCompleted(set.number)) {
                  <div class="set-inputs">
                    <div class="input-group">
                      <label>التكرارات</label>
                      <p-inputNumber
                        [(ngModel)]="set.reps"
                        [min]="1"
                        [showButtons]="true"
                        buttonLayout="horizontal"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                      ></p-inputNumber>
                    </div>
                    <div class="input-group">
                      <label>الوزن (كجم)</label>
                      <p-inputNumber
                        [(ngModel)]="set.weight"
                        [min]="0"
                        [showButtons]="true"
                        buttonLayout="horizontal"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                      ></p-inputNumber>
                    </div>
                  </div>
                  <button class="complete-set-btn" (click)="completeSet(set)">
                    <i class="pi pi-check"></i>
                    إكمال المجموعة
                  </button>
                } @else {
                  <div class="completed-data">
                    <span>{{ set.reps }} تكرار</span>
                    <span>{{ set.weight }} كجم</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Rest Timer -->
        <div class="rest-timer" *ngIf="isResting()">
          <div class="rest-content">
            <h3>وقت الراحة</h3>
            <div class="rest-countdown">{{ restTimeRemaining() }}</div>
            <button class="skip-rest-btn" (click)="skipRest()">تخطي الراحة</button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="session-navigation">
        <button
          class="nav-btn prev"
          (click)="previousExercise()"
          [disabled]="currentExerciseIndex() === 0"
        >
          <i class="pi pi-arrow-right"></i>
          السابق
        </button>

        @if (currentExerciseIndex() < totalExercises() - 1) {
          <button
            class="nav-btn next"
            (click)="nextExercise()"
          >
            التالي
            <i class="pi pi-arrow-left"></i>
          </button>
        } @else {
          <button class="nav-btn complete" (click)="completeSession()">
            <i class="pi pi-check-circle"></i>
            إنهاء التمرين
          </button>
        }
      </div>

      <!-- Completion Dialog -->
      <p-dialog
        [(visible)]="showCompletionDialog"
        [modal]="true"
        [closable]="false"
        [style]="{width: '400px'}"
        styleClass="completion-dialog"
      >
        <div class="completion-content">
          <div class="completion-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2>أحسنت!</h2>
          <p>لقد أكملت تمرين اليوم بنجاح</p>

          <div class="session-summary">
            <div class="summary-item">
              <span class="label">المدة</span>
              <span class="value">{{ formatTime(sessionTime()) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">التمارين</span>
              <span class="value">{{ totalExercises() }} تمرين</span>
            </div>
            <div class="summary-item">
              <span class="label">إجمالي الحجم</span>
              <span class="value">{{ totalVolume() }} كجم</span>
            </div>
          </div>

          <button class="done-btn" (click)="finishSession()">
            العودة للبرنامج
          </button>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .workout-session {
      min-height: 100vh;
      background: var(--bg-secondary);
      padding-bottom: 100px;
    }

    .session-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
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
    }

    .session-info {
      flex: 1;

      h1 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .session-progress {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    .timer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border-radius: 20px;
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-container {
      padding: 0 1.5rem;
      margin-top: -1px;
      background: var(--bg-primary);
    }

    .current-exercise {
      padding: 1.5rem;
    }

    .exercise-card {
      background: var(--bg-primary);
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .exercise-image {
      position: relative;
      height: 200px;
      background: var(--bg-secondary);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 4rem;
          color: var(--text-muted);
          opacity: 0.3;
        }
      }

      .video-btn {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
      }
    }

    .exercise-details {
      padding: 1.5rem;
    }

    .muscle-tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #ede9fe;
      color: #7c3aed;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .exercise-details h2 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      color: var(--text-primary);
    }

    .exercise-target {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .target-item {
      text-align: center;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;

      .target-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .target-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .exercise-notes {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 1rem;
      background: #fef3c7;
      border-radius: 10px;
      margin: 0;
      color: #92400e;
      font-size: 0.9rem;
    }

    .sets-section {
      background: var(--bg-primary);
      border-radius: 20px;
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: var(--text-primary);
      }
    }

    .sets-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .set-card {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 16px;
      padding: 1rem;
      transition: all 0.3s;

      &.current {
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      &.completed {
        background: #dcfce7;
        border-color: #22c55e;
      }
    }

    .set-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .set-number {
        font-weight: 600;
        color: var(--text-primary);
      }

      i {
        color: #22c55e;
        font-size: 1.25rem;
      }
    }

    .set-inputs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .input-group {
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .complete-set-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
    }

    .completed-data {
      display: flex;
      justify-content: center;
      gap: 2rem;
      color: #16a34a;
      font-weight: 600;
    }

    .rest-timer {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .rest-content {
      text-align: center;
      color: white;

      h3 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
      }

      .rest-countdown {
        font-size: 5rem;
        font-weight: 700;
        color: #3b82f6;
        margin-bottom: 2rem;
      }

      .skip-rest-btn {
        padding: 0.75rem 2rem;
        background: transparent;
        border: 2px solid white;
        color: white;
        border-radius: 25px;
        cursor: pointer;
      }
    }

    .session-navigation {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--bg-primary);
      border-top: 1px solid var(--border-color);
    }

    .nav-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.prev {
        background: var(--bg-secondary);
        color: var(--text-secondary);

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.next {
        background: #3b82f6;
        color: white;
      }

      &.complete {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
    }

    .completion-content {
      text-align: center;
      padding: 1rem;

      .completion-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 2.5rem;
          color: white;
        }
      }

      h2 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
      }
    }

    .session-summary {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;

      .label {
        color: var(--text-secondary);
      }

      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .done-btn {
      width: 100%;
      padding: 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class WorkoutSessionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);

  currentDay = signal<WorkoutDay | null>(null);
  currentExerciseIndex = signal(0);
  currentSetNumber = signal(1);
  sessionTime = signal(0);
  isResting = signal(false);
  restTimeRemaining = signal(0);
  showCompletionDialog = false;
  completedSetsData: { [exerciseId: string]: CompletedSet[] } = {};

  private timerInterval: any;
  private restInterval: any;

  currentExercise = computed(() => {
    const day = this.currentDay();
    if (!day) return null;
    return day.exercises[this.currentExerciseIndex()];
  });

  totalExercises = computed(() => this.currentDay()?.exercises.length || 0);

  completedExercises = computed(() => {
    const day = this.currentDay();
    if (!day) return 0;
    return day.exercises.filter(e => e.isCompleted).length;
  });

  sessionProgress = computed(() => {
    if (this.totalExercises() === 0) return 0;
    return Math.round((this.completedExercises() / this.totalExercises()) * 100);
  });

  totalVolume = computed(() => {
    let volume = 0;
    Object.values(this.completedSetsData).forEach(sets => {
      sets.forEach(set => {
        volume += set.reps * set.weight;
      });
    });
    return volume;
  });

  ngOnInit(): void {
    // API uses routineId, but also support legacy dayId for backward compatibility
    const routineId = this.route.snapshot.queryParamMap.get('routineId') ||
                      this.route.snapshot.queryParamMap.get('dayId');
    this.loadDay(routineId);
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.restInterval) clearInterval(this.restInterval);
  }

  loadDay(routineId: string | null): void {
    // Mock data - in real app would fetch routine details from API using routineId
    // and start a workout session via clientService.startWorkoutSession(routineId)
    this.currentDay.set({
      id: routineId || '1',
      dayNumber: 3,
      name: 'أكتاف وترابيس',
      isCompleted: false,
      isToday: true,
      exercises: [
        { id: '8', exerciseId: '8', exerciseName: 'شولدر برس', muscleGroup: 'أكتاف', sets: 4, reps: 12, restSeconds: 90, isCompleted: false, completedSets: [] },
        { id: '9', exerciseId: '9', exerciseName: 'لاترال ريز', muscleGroup: 'أكتاف', sets: 3, reps: 15, restSeconds: 60, isCompleted: false, completedSets: [] },
        { id: '10', exerciseId: '10', exerciseName: 'فرونت ريز', muscleGroup: 'أكتاف', sets: 3, reps: 12, restSeconds: 60, isCompleted: false, completedSets: [] },
        { id: '11', exerciseId: '11', exerciseName: 'شراجز', muscleGroup: 'ترابيس', sets: 3, reps: 15, restSeconds: 60, isCompleted: false, completedSets: [] }
      ]
    });
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.sessionTime.update(t => t + 1);
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getSetsArray(): { number: number; reps: number; weight: number }[] {
    const exercise = this.currentExercise();
    if (!exercise) return [];

    return Array.from({ length: exercise.sets }, (_, i) => ({
      number: i + 1,
      reps: exercise.reps,
      weight: 0
    }));
  }

  isSetCompleted(setNumber: number): boolean {
    const exercise = this.currentExercise();
    if (!exercise) return false;

    const completedSets = this.completedSetsData[exercise.id] || [];
    return completedSets.some(s => s.setNumber === setNumber);
  }

  completeSet(set: { number: number; reps: number; weight: number }): void {
    const exercise = this.currentExercise();
    if (!exercise) return;

    if (!this.completedSetsData[exercise.id]) {
      this.completedSetsData[exercise.id] = [];
    }

    this.completedSetsData[exercise.id].push({
      setNumber: set.number,
      reps: set.reps,
      weight: set.weight
    });

    // Check if all sets completed
    if (this.completedSetsData[exercise.id].length >= exercise.sets) {
      exercise.isCompleted = true;
    } else {
      this.currentSetNumber.update(n => n + 1);
      this.startRestTimer(exercise.restSeconds);
    }
  }

  startRestTimer(seconds: number): void {
    this.isResting.set(true);
    this.restTimeRemaining.set(seconds);

    this.restInterval = setInterval(() => {
      this.restTimeRemaining.update(t => {
        if (t <= 1) {
          this.skipRest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  skipRest(): void {
    if (this.restInterval) clearInterval(this.restInterval);
    this.isResting.set(false);
  }

  previousExercise(): void {
    if (this.currentExerciseIndex() > 0) {
      this.currentExerciseIndex.update(i => i - 1);
      this.currentSetNumber.set(1);
    }
  }

  nextExercise(): void {
    if (this.currentExerciseIndex() < this.totalExercises() - 1) {
      this.currentExerciseIndex.update(i => i + 1);
      this.currentSetNumber.set(1);
    }
  }

  completeSession(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.showCompletionDialog = true;
  }

  finishSession(): void {
    this.router.navigate(['/client/my-program']);
  }

  exitSession(): void {
    if (confirm('هل تريد الخروج من التمرين؟ سيتم فقدان التقدم.')) {
      this.router.navigate(['/client/my-program']);
    }
  }

  showVideo(): void {
    console.log('Show video');
  }
}
