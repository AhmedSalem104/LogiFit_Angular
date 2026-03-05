import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import {
  ChallengesService,
  ChallengeDto,
  ClientChallengeDto,
  ChallengeMetricLabels
} from '../../../core/services/challenges.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-challenges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    TagModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-challenges-page">
      <app-page-header
        title="تحدياتي"
        subtitle="شارك في التحديات وتتبع تقدمك"
        [breadcrumbs]="[{label: 'تحدياتي'}]"
      ></app-page-header>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'my'"
          (click)="activeTab.set('my')"
        >
          <i class="pi pi-user"></i>
          تحدياتي
          <span class="tab-badge" *ngIf="myChallenges().length > 0">{{ myChallenges().length }}</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'available'"
          (click)="activeTab.set('available')"
        >
          <i class="pi pi-globe"></i>
          تحديات متاحة
          <span class="tab-badge available-badge" *ngIf="availableChallenges().length > 0">{{ availableChallenges().length }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats" [rows]="3"></app-loading-skeleton>

      <!-- ==========================================
           My Challenges Tab
           ========================================== -->
      <div *ngIf="!loading() && activeTab() === 'my'">
        <div class="challenges-grid" *ngIf="myChallenges().length > 0">
          <div
            class="challenge-card"
            [class.completed-card]="challenge.isCompleted"
            *ngFor="let challenge of myChallenges()"
          >
            <!-- Completed ribbon -->
            <div class="completed-ribbon" *ngIf="challenge.isCompleted">
              <i class="pi pi-check"></i>
              مكتمل
            </div>

            <div class="challenge-card__header">
              <h3 class="challenge-card__title">{{ challenge.challengeTitle }}</h3>
              <span class="metric-badge">{{ getMetricLabel(challenge.targetMetric) }}</span>
            </div>

            <p class="challenge-card__description" *ngIf="challenge.challengeDescription">
              {{ challenge.challengeDescription }}
            </p>

            <!-- Circular Progress -->
            <div class="progress-circle-wrapper">
              <div class="progress-circle">
                <svg viewBox="0 0 100 100">
                  <circle
                    class="progress-circle__bg"
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke-width="8"
                  />
                  <circle
                    class="progress-circle__fill"
                    [class.fill-complete]="challenge.isCompleted"
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke-width="8"
                    stroke-linecap="round"
                    [style.stroke-dasharray]="getCircleDash()"
                    [style.stroke-dashoffset]="getCircleOffset(challenge.progressPercentage)"
                  />
                </svg>
                <div class="progress-circle__text">
                  <span class="progress-circle__value">{{ Math.min(challenge.progressPercentage, 100) }}%</span>
                  <span class="progress-circle__label">تقدم</span>
                </div>
              </div>
            </div>

            <!-- Progress details -->
            <div class="progress-details">
              <div class="progress-detail-item">
                <span class="progress-detail-label">التقدم الحالي</span>
                <span class="progress-detail-value">{{ challenge.currentProgress }}</span>
              </div>
              <div class="progress-detail-divider"></div>
              <div class="progress-detail-item">
                <span class="progress-detail-label">الهدف</span>
                <span class="progress-detail-value">{{ challenge.targetValue }}</span>
              </div>
            </div>

            <div class="challenge-card__details">
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(challenge.startDate) }} - {{ formatDate(challenge.endDate) }}</span>
              </div>
            </div>

            <div class="challenge-card__footer">
              <button
                class="btn btn-primary btn-sm"
                *ngIf="!challenge.isCompleted"
                (click)="openProgressDialog(challenge)"
              >
                <i class="pi pi-chart-line"></i>
                تحديث التقدم
              </button>
              <span class="completed-at" *ngIf="challenge.isCompleted && challenge.completedAt">
                <i class="pi pi-check-circle"></i>
                اكتمل في {{ formatDate(challenge.completedAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State: My Challenges -->
        <div class="empty-state" *ngIf="myChallenges().length === 0">
          <div class="empty-state__icon">
            <i class="pi pi-trophy"></i>
          </div>
          <h3>لم تنضم لأي تحدي بعد</h3>
          <p>تصفح التحديات المتاحة وانضم لبدء رحلتك</p>
          <button class="btn btn-primary" (click)="activeTab.set('available')">
            <i class="pi pi-globe"></i>
            تصفح التحديات
          </button>
        </div>
      </div>

      <!-- ==========================================
           Available Challenges Tab
           ========================================== -->
      <div *ngIf="!loading() && activeTab() === 'available'">
        <div class="challenges-grid" *ngIf="availableChallenges().length > 0">
          <div class="challenge-card available-card" *ngFor="let challenge of availableChallenges()">
            <div class="challenge-card__header">
              <h3 class="challenge-card__title">{{ challenge.title }}</h3>
              <span class="status-badge status-active">نشط</span>
            </div>

            <p class="challenge-card__description">{{ challenge.description }}</p>

            <div class="challenge-card__details">
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(challenge.startDate) }} - {{ formatDate(challenge.endDate) }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-flag"></i>
                <span>{{ getMetricLabel(challenge.targetMetric) }}: {{ challenge.targetValue }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-users"></i>
                <span>{{ challenge.participantCount }} مشارك</span>
              </div>
              <div class="detail-item" *ngIf="challenge.createdByCoachName">
                <i class="pi pi-user"></i>
                <span>المدرب: {{ challenge.createdByCoachName }}</span>
              </div>
            </div>

            <!-- Target visualization -->
            <div class="target-display">
              <div class="target-display__icon">
                <i class="pi pi-bullseye"></i>
              </div>
              <div class="target-display__info">
                <span class="target-display__label">الهدف</span>
                <span class="target-display__value">{{ challenge.targetValue }} {{ getMetricLabel(challenge.targetMetric) }}</span>
              </div>
            </div>

            <div class="challenge-card__footer">
              <button
                class="btn btn-join"
                (click)="joinChallenge(challenge)"
                [disabled]="joiningId() === challenge.id"
              >
                <i class="pi pi-spin pi-spinner" *ngIf="joiningId() === challenge.id"></i>
                <i class="pi pi-sign-in" *ngIf="joiningId() !== challenge.id"></i>
                انضم للتحدي
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State: Available -->
        <div class="empty-state" *ngIf="availableChallenges().length === 0">
          <div class="empty-state__icon">
            <i class="pi pi-globe"></i>
          </div>
          <h3>لا توجد تحديات متاحة حاليا</h3>
          <p>تحقق لاحقا، سيتم إضافة تحديات جديدة قريبا</p>
        </div>
      </div>

      <!-- Update Progress Dialog -->
      <p-dialog
        [(visible)]="progressDialogVisible"
        header="تحديث التقدم"
        [modal]="true"
        [style]="{width: '420px', maxWidth: '95vw'}"
        [closable]="true"
      >
        <div class="progress-dialog-content" *ngIf="selectedChallenge">
          <div class="progress-dialog-info">
            <h4>{{ selectedChallenge.challengeTitle }}</h4>
            <p>الهدف: {{ selectedChallenge.targetValue }} {{ getMetricLabel(selectedChallenge.targetMetric) }}</p>
            <p>التقدم الحالي: {{ selectedChallenge.currentProgress }}</p>
          </div>

          <div class="form-group">
            <label>التقدم الجديد</label>
            <p-inputNumber
              [(ngModel)]="newProgress"
              [min]="0"
              [max]="selectedChallenge.targetValue"
              placeholder="أدخل التقدم الحالي"
              [style]="{width: '100%'}"
            ></p-inputNumber>
          </div>

          <!-- Preview progress bar -->
          <div class="preview-progress" *ngIf="newProgress !== null">
            <div class="progress-info">
              <span class="progress-label">المعاينة</span>
              <span class="progress-value">{{ getPreviewPercentage() }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                [class.complete]="getPreviewPercentage() >= 100"
                [style.width.%]="Math.min(getPreviewPercentage(), 100)"
              ></div>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="progressDialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="updateProgress()" [disabled]="updatingProgress()">
            <i class="pi pi-spin pi-spinner" *ngIf="updatingProgress()"></i>
            تحديث
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .my-challenges-page {
      max-width: 1400px;
    }

    /* ==========================================
       Tabs
       ========================================== */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;

      i { font-size: 0.9rem; }

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        color: #8b5cf6;
        border-bottom-color: #8b5cf6;
      }
    }

    .tab-badge {
      background: #8b5cf6;
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-weight: 600;

      &.available-badge {
        background: #22c55e;
      }
    }

    /* ==========================================
       Challenges Grid
       ========================================== */
    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }

    .challenge-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;

      &:hover {
        border-color: rgba(139, 92, 246, 0.3);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      &.completed-card {
        border-color: rgba(34, 197, 94, 0.3);

        &:hover {
          border-color: rgba(34, 197, 94, 0.5);
        }
      }

      &.available-card {
        border-color: rgba(59, 130, 246, 0.15);

        &:hover {
          border-color: rgba(59, 130, 246, 0.4);
        }
      }
    }

    /* ==========================================
       Completed Ribbon
       ========================================== */
    .completed-ribbon {
      position: absolute;
      top: 12px;
      left: -2px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 0.3rem 1rem 0.3rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 0 8px 8px 0;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);

      i { font-size: 0.7rem; }
    }

    .challenge-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .challenge-card__title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      flex: 1;
    }

    .metric-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-flex;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.status-active {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
    }

    .challenge-card__description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ==========================================
       Circular Progress
       ========================================== */
    .progress-circle-wrapper {
      display: flex;
      justify-content: center;
      padding: 0.5rem 0;
    }

    .progress-circle {
      position: relative;
      width: 120px;
      height: 120px;

      svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }
    }

    .progress-circle__bg {
      stroke: var(--bg-tertiary, rgba(139, 92, 246, 0.08));
    }

    .progress-circle__fill {
      stroke: #8b5cf6;
      transition: stroke-dashoffset 0.6s ease;

      &.fill-complete {
        stroke: #22c55e;
      }
    }

    .progress-circle__text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    .progress-circle__value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .progress-circle__label {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* ==========================================
       Progress Details
       ========================================== */
    .progress-details {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .progress-detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    .progress-detail-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .progress-detail-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .progress-detail-divider {
      width: 1px;
      height: 30px;
      background: var(--border-color);
    }

    .challenge-card__details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);

      i {
        font-size: 0.85rem;
        color: #8b5cf6;
        width: 18px;
        text-align: center;
      }
    }

    /* ==========================================
       Target Display (Available tab)
       ========================================== */
    .target-display {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
      border-radius: 12px;
      border: 1px solid rgba(139, 92, 246, 0.1);
    }

    .target-display__icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(139, 92, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8b5cf6;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .target-display__info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .target-display__label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .target-display__value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* ==========================================
       Footer
       ========================================== */
    .challenge-card__footer {
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: center;
    }

    .completed-at {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: #22c55e;
      font-weight: 500;

      i { font-size: 0.85rem; }
    }

    /* ==========================================
       Progress Dialog
       ========================================== */
    .progress-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .progress-dialog-info {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 12px;

      h4 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
        font-size: 1rem;
      }

      p {
        margin: 0 0 0.25rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
    }

    .preview-progress {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .progress-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .progress-value {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: var(--bg-tertiary, rgba(139, 92, 246, 0.08));
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #6d28d9);
      border-radius: 10px;
      transition: width 0.4s ease;

      &.complete {
        background: linear-gradient(90deg, #22c55e, #16a34a);
      }
    }

    /* ==========================================
       Buttons
       ========================================== */
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
      font-size: 0.9rem;

      &.btn-sm {
        padding: 0.6rem 1.25rem;
        font-size: 0.85rem;
      }

      &.btn-primary {
        background: #8b5cf6;
        color: white;
        &:hover { background: #7c3aed; }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        &:hover { border-color: #8b5cf6; color: #8b5cf6; }
      }

      &.btn-join {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
        width: 100%;
        justify-content: center;
        &:hover { box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }
    }

    /* ==========================================
       Empty State
       ========================================== */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }

    .empty-state__icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      i {
        font-size: 2.5rem;
        color: #8b5cf6;
        opacity: 0.5;
      }
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      color: var(--text-primary);
      font-size: 1.2rem;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    /* ==========================================
       Form
       ========================================== */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    /* ==========================================
       Responsive
       ========================================== */
    @media (max-width: 768px) {
      .challenges-grid {
        grid-template-columns: 1fr;
      }

      .tabs {
        overflow-x: auto;
      }

      .tab-btn {
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      .progress-circle {
        width: 100px;
        height: 100px;
      }

      .progress-circle__value {
        font-size: 1.1rem;
      }
    }
  `]
})
export class MyChallengesComponent implements OnInit {
  private challengesService = inject(ChallengesService);
  private notificationService = inject(NotificationService);

  Math = Math;

  loading = signal(true);
  activeTab = signal<'my' | 'available'>('my');
  myChallenges = signal<ClientChallengeDto[]>([]);
  availableChallenges = signal<ChallengeDto[]>([]);
  joiningId = signal<string | null>(null);
  updatingProgress = signal(false);

  // Progress dialog
  progressDialogVisible = false;
  selectedChallenge: ClientChallengeDto | null = null;
  newProgress: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load my challenges
    this.challengesService.getMyChallenges().subscribe({
      next: (data) => {
        this.myChallenges.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading my challenges:', err);
        this.myChallenges.set([]);
        this.loading.set(false);
      }
    });

    // Load available challenges
    this.challengesService.getChallenges(1).subscribe({
      next: (data) => {
        this.availableChallenges.set(data);
      },
      error: (err) => {
        console.error('Error loading available challenges:', err);
        this.availableChallenges.set([]);
      }
    });
  }

  getMetricLabel(metric: string): string {
    return ChallengeMetricLabels[metric] || metric;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Circle progress helpers
  getCircleDash(): string {
    const circumference = 2 * Math.PI * 42;
    return `${circumference}`;
  }

  getCircleOffset(percentage: number): string {
    const circumference = 2 * Math.PI * 42;
    const clamped = Math.min(percentage, 100);
    return `${circumference - (clamped / 100) * circumference}`;
  }

  joinChallenge(challenge: ChallengeDto): void {
    Swal.fire({
      title: 'الانضمام للتحدي',
      text: `هل تريد الانضمام لتحدي "${challenge.title}"؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، انضم',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.joiningId.set(challenge.id);
        this.challengesService.joinChallenge(challenge.id).subscribe({
          next: (clientChallengeId) => {
            this.notificationService.success('تم الانضمام للتحدي بنجاح');
            // Add to my challenges
            const newClientChallenge: ClientChallengeDto = {
              id: clientChallengeId,
              challengeId: challenge.id,
              challengeTitle: challenge.title,
              challengeDescription: challenge.description,
              clientId: '',
              clientName: '',
              currentProgress: 0,
              targetValue: challenge.targetValue,
              targetMetric: challenge.targetMetric,
              startDate: challenge.startDate,
              endDate: challenge.endDate,
              isCompleted: false,
              completedAt: null,
              progressPercentage: 0,
              participantCount: challenge.participantCount + 1
            };
            this.myChallenges.update(list => [...list, newClientChallenge]);
            // Remove from available
            this.availableChallenges.update(list => list.filter(c => c.id !== challenge.id));
            this.joiningId.set(null);
            this.activeTab.set('my');
          },
          error: (err) => {
            console.error('Error joining challenge:', err);
            this.notificationService.error('حدث خطأ أثناء الانضمام للتحدي');
            this.joiningId.set(null);
          }
        });
      }
    });
  }

  openProgressDialog(challenge: ClientChallengeDto): void {
    this.selectedChallenge = challenge;
    this.newProgress = challenge.currentProgress;
    this.progressDialogVisible = true;
  }

  getPreviewPercentage(): number {
    if (!this.selectedChallenge || this.newProgress === null) return 0;
    return Math.round((this.newProgress / this.selectedChallenge.targetValue) * 100);
  }

  updateProgress(): void {
    if (!this.selectedChallenge || this.newProgress === null) return;

    this.updatingProgress.set(true);

    this.challengesService.updateProgress(this.selectedChallenge.challengeId, this.newProgress).subscribe({
      next: () => {
        const challengeId = this.selectedChallenge!.id;
        const progress = this.newProgress!;
        const target = this.selectedChallenge!.targetValue;
        const percentage = Math.round((progress / target) * 100);
        const isCompleted = percentage >= 100;

        this.myChallenges.update(list =>
          list.map(c => c.id === challengeId ? {
            ...c,
            currentProgress: progress,
            progressPercentage: percentage,
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : c.completedAt
          } : c)
        );

        this.progressDialogVisible = false;
        this.updatingProgress.set(false);
        this.notificationService.success('تم تحديث التقدم بنجاح');
      },
      error: (err) => {
        console.error('Error updating progress:', err);
        this.notificationService.error('حدث خطأ أثناء تحديث التقدم');
        this.updatingProgress.set(false);
      }
    });
  }
}
