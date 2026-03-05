import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import {
  ChallengesService,
  ChallengeDto,
  ChallengeStatus,
  ChallengeStatusLabels,
  ChallengeMetrics,
  ChallengeMetricLabels,
  CreateChallengeCommand,
  UpdateChallengeCommand
} from '../../../core/services/challenges.service';
import { CoachService } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    MultiSelectModule,
    TagModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="challenges-page">
      <app-page-header
        title="التحديات"
        subtitle="إنشاء وإدارة التحديات للمتدربين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'التحديات'}]"
      >
        <button class="btn btn-primary" (click)="openCreateDialog()">
          <i class="pi pi-plus"></i>
          <span>إنشاء تحدي</span>
        </button>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon total-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ challenges().length }}</span>
            <span class="mini-stat__label">إجمالي التحديات</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon active-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ activeChallenges() }}</span>
            <span class="mini-stat__label">تحديات نشطة</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon completed-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ completedChallenges() }}</span>
            <span class="mini-stat__label">تحديات مكتملة</span>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <div class="filter-chips">
          <button
            class="chip"
            [class.active]="statusFilter() === null"
            (click)="statusFilter.set(null)"
          >
            الكل
          </button>
          <button
            class="chip active-chip"
            [class.active]="statusFilter() === 1"
            (click)="statusFilter.set(1)"
          >
            <i class="pi pi-bolt"></i>
            نشط
          </button>
          <button
            class="chip completed-chip"
            [class.active]="statusFilter() === 2"
            (click)="statusFilter.set(2)"
          >
            <i class="pi pi-check-circle"></i>
            مكتمل
          </button>
          <button
            class="chip cancelled-chip"
            [class.active]="statusFilter() === 3"
            (click)="statusFilter.set(3)"
          >
            <i class="pi pi-times-circle"></i>
            ملغي
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats" [rows]="3"></app-loading-skeleton>

      <!-- Challenges Grid -->
      <div class="challenges-grid" *ngIf="!loading() && filteredChallenges().length > 0">
        <div class="challenge-card" *ngFor="let challenge of filteredChallenges()">
          <div class="challenge-card__header">
            <div class="challenge-card__title-row">
              <h3 class="challenge-card__title">{{ challenge.title }}</h3>
              <div class="challenge-card__actions">
                <button class="action-btn edit-btn" (click)="editChallenge(challenge)" title="تعديل">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn delete-btn" (click)="deleteChallenge(challenge)" title="حذف">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
            <span
              class="status-badge"
              [class.status-active]="challenge.status === 1"
              [class.status-completed]="challenge.status === 2"
              [class.status-cancelled]="challenge.status === 3"
            >
              {{ getStatusLabel(challenge.status) }}
            </span>
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
          </div>

          <div class="challenge-card__progress">
            <div class="progress-info">
              <span class="progress-label">المشاركون</span>
              <span class="progress-value">{{ challenge.completedCount }} / {{ challenge.participantCount }} أكملوا</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="challenge.participantCount > 0 ? (challenge.completedCount / challenge.participantCount) * 100 : 0"
              ></div>
            </div>
          </div>

          <div class="challenge-card__footer">
            <div class="participants-info">
              <i class="pi pi-users"></i>
              <span>{{ challenge.participantCount }} مشارك</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && filteredChallenges().length === 0">
        <div class="empty-state__icon">
          <i class="pi pi-trophy"></i>
        </div>
        <h3>لا توجد تحديات</h3>
        <p *ngIf="statusFilter() === null">ابدأ بإنشاء تحدي جديد لتحفيز المتدربين</p>
        <p *ngIf="statusFilter() !== null">لا توجد تحديات بهذا الحالة</p>
        <button class="btn btn-primary" (click)="openCreateDialog()" *ngIf="statusFilter() === null">
          <i class="pi pi-plus"></i>
          إنشاء تحدي جديد
        </button>
        <button class="btn btn-outline" (click)="statusFilter.set(null)" *ngIf="statusFilter() !== null">
          عرض الكل
        </button>
      </div>

      <!-- Create/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingChallenge ? 'تعديل التحدي' : 'إنشاء تحدي جديد'"
        [modal]="true"
        [style]="{width: '650px', maxWidth: '95vw'}"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>عنوان التحدي *</label>
            <input type="text" pInputText [(ngModel)]="challengeForm.title" placeholder="مثال: تحدي 30 يوم تمرين" />
          </div>

          <div class="form-group">
            <label>الوصف</label>
            <textarea pInputTextarea [(ngModel)]="challengeForm.description" rows="3" placeholder="وصف التحدي وتفاصيله..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>تاريخ البداية *</label>
              <p-calendar
                [(ngModel)]="challengeForm.startDate"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="اختر تاريخ البداية"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>
            <div class="form-group">
              <label>تاريخ النهاية *</label>
              <p-calendar
                [(ngModel)]="challengeForm.endDate"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="اختر تاريخ النهاية"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>نوع الهدف *</label>
              <p-dropdown
                [options]="metricOptions"
                [(ngModel)]="challengeForm.targetMetric"
                placeholder="اختر نوع الهدف"
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
            <div class="form-group">
              <label>القيمة المستهدفة *</label>
              <p-inputNumber
                [(ngModel)]="challengeForm.targetValue"
                [min]="1"
                placeholder="مثال: 30"
                [style]="{width: '100%'}"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-group" *ngIf="!editingChallenge">
            <label>المشاركون</label>
            <p-multiSelect
              [options]="traineesOptions()"
              [(ngModel)]="challengeForm.clientIds"
              optionLabel="label"
              optionValue="value"
              placeholder="اختر المتدربين"
              [filter]="true"
              filterPlaceHolder="ابحث عن متدرب..."
              [style]="{width: '100%'}"
              [maxSelectedLabels]="3"
              selectedItemsLabel="{0} متدرب محدد"
            ></p-multiSelect>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveChallenge()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            {{ editingChallenge ? 'حفظ التعديلات' : 'إنشاء التحدي' }}
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .challenges-page {
      max-width: 1400px;
    }

    /* ==========================================
       Stats Row
       ========================================== */
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

      &.total-icon {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
      }
      &.active-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.completed-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
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

    /* ==========================================
       Filter Bar
       ========================================== */
    .filter-bar {
      margin-bottom: 1.5rem;
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

      i { font-size: 0.75rem; }

      &:hover {
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.active {
        background: #8b5cf6;
        border-color: #8b5cf6;
        color: white;
      }

      &.active-chip {
        &:hover { border-color: #22c55e; color: #22c55e; }
        &.active { background: linear-gradient(135deg, #22c55e, #16a34a); border-color: #22c55e; }
      }
      &.completed-chip {
        &:hover { border-color: #3b82f6; color: #3b82f6; }
        &.active { background: linear-gradient(135deg, #3b82f6, #2563eb); border-color: #3b82f6; }
      }
      &.cancelled-chip {
        &:hover { border-color: #ef4444; color: #ef4444; }
        &.active { background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #ef4444; }
      }
    }

    /* ==========================================
       Challenges Grid
       ========================================== */
    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
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

      &:hover {
        border-color: rgba(139, 92, 246, 0.3);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
    }

    .challenge-card__header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .challenge-card__title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .challenge-card__title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      flex: 1;
    }

    .challenge-card__actions {
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-flex;
      align-self: flex-start;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.status-active {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.status-completed {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      &.status-cancelled {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
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
       Progress Bar
       ========================================== */
    .challenge-card__progress {
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
      transition: width 0.5s ease;
      min-width: 0;
    }

    .challenge-card__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .participants-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-muted);

      i {
        color: #8b5cf6;
      }
    }

    /* ==========================================
       Action Buttons
       ========================================== */
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

      i { font-size: 0.85rem; }

      &.edit-btn {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        &:hover { background: #3b82f6; color: white; }
      }
      &.delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        &:hover { background: #ef4444; color: white; }
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
       Dialog
       ========================================== */
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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

      input, textarea { width: 100%; }
      textarea { resize: vertical; }
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
    }

    /* ==========================================
       Responsive
       ========================================== */
    @media (max-width: 992px) {
      .challenges-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .challenges-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .filter-chips {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 0.5rem;
      }
    }
  `]
})
export class ChallengesComponent implements OnInit {
  private challengesService = inject(ChallengesService);
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  challenges = signal<ChallengeDto[]>([]);
  traineesOptions = signal<{label: string; value: string}[]>([]);
  statusFilter = signal<number | null>(null);

  dialogVisible = false;
  editingChallenge: ChallengeDto | null = null;

  challengeForm: {
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    targetMetric: string;
    targetValue: number | null;
    clientIds: string[];
  } = {
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    targetMetric: '',
    targetValue: null,
    clientIds: []
  };

  metricOptions = ChallengeMetrics;

  // Computed
  activeChallenges = computed(() => this.challenges().filter(c => c.status === ChallengeStatus.Active).length);
  completedChallenges = computed(() => this.challenges().filter(c => c.status === ChallengeStatus.Completed).length);

  filteredChallenges = computed(() => {
    const filter = this.statusFilter();
    if (filter === null) return this.challenges();
    return this.challenges().filter(c => c.status === filter);
  });

  ngOnInit(): void {
    this.loadChallenges();
    this.loadTrainees();
  }

  loadChallenges(): void {
    this.loading.set(true);
    this.challengesService.getChallenges().subscribe({
      next: (data) => {
        this.challenges.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading challenges:', err);
        this.notificationService.error('حدث خطأ أثناء تحميل التحديات');
        this.challenges.set([]);
        this.loading.set(false);
      }
    });
  }

  loadTrainees(): void {
    this.coachService.getTrainees().subscribe({
      next: (trainees) => {
        this.traineesOptions.set(
          trainees.map((t: any) => ({
            label: t.clientName || t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim(),
            value: t.clientId || t.id
          }))
        );
      },
      error: (err) => {
        console.error('Error loading trainees:', err);
      }
    });
  }

  getStatusLabel(status: number): string {
    return ChallengeStatusLabels[status] || 'غير معروف';
  }

  getMetricLabel(metric: string): string {
    return ChallengeMetricLabels[metric] || metric;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  openCreateDialog(): void {
    this.editingChallenge = null;
    this.challengeForm = {
      title: '',
      description: '',
      startDate: null,
      endDate: null,
      targetMetric: '',
      targetValue: null,
      clientIds: []
    };
    this.dialogVisible = true;
  }

  editChallenge(challenge: ChallengeDto): void {
    this.editingChallenge = challenge;
    this.challengeForm = {
      title: challenge.title,
      description: challenge.description || '',
      startDate: challenge.startDate ? new Date(challenge.startDate) : null,
      endDate: challenge.endDate ? new Date(challenge.endDate) : null,
      targetMetric: challenge.targetMetric,
      targetValue: challenge.targetValue,
      clientIds: []
    };
    this.dialogVisible = true;
  }

  saveChallenge(): void {
    if (!this.challengeForm.title || !this.challengeForm.targetMetric || !this.challengeForm.targetValue) {
      this.notificationService.warn('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!this.challengeForm.startDate || !this.challengeForm.endDate) {
      this.notificationService.warn('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    this.saving.set(true);

    if (this.editingChallenge) {
      const updateCmd: UpdateChallengeCommand = {
        title: this.challengeForm.title,
        description: this.challengeForm.description,
        startDate: this.challengeForm.startDate.toISOString(),
        endDate: this.challengeForm.endDate.toISOString(),
        targetMetric: this.challengeForm.targetMetric,
        targetValue: this.challengeForm.targetValue
      };

      this.challengesService.updateChallenge(this.editingChallenge.id, updateCmd).subscribe({
        next: () => {
          this.challenges.update(list =>
            list.map(c => c.id === this.editingChallenge!.id ? {
              ...c,
              ...updateCmd
            } as ChallengeDto : c)
          );
          this.dialogVisible = false;
          this.saving.set(false);
          this.notificationService.success('تم تحديث التحدي بنجاح');
        },
        error: (err) => {
          console.error('Error updating challenge:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث التحدي');
          this.saving.set(false);
        }
      });
    } else {
      const createCmd: CreateChallengeCommand = {
        title: this.challengeForm.title,
        description: this.challengeForm.description,
        startDate: this.challengeForm.startDate.toISOString(),
        endDate: this.challengeForm.endDate.toISOString(),
        targetMetric: this.challengeForm.targetMetric,
        targetValue: this.challengeForm.targetValue,
        clientIds: this.challengeForm.clientIds
      };

      this.challengesService.createChallenge(createCmd).subscribe({
        next: (newId) => {
          const newChallenge: ChallengeDto = {
            id: newId,
            title: createCmd.title,
            description: createCmd.description,
            startDate: createCmd.startDate,
            endDate: createCmd.endDate,
            targetMetric: createCmd.targetMetric,
            targetValue: createCmd.targetValue,
            status: ChallengeStatus.Active,
            createdByCoachName: '',
            participantCount: createCmd.clientIds.length,
            completedCount: 0
          };
          this.challenges.update(list => [newChallenge, ...list]);
          this.dialogVisible = false;
          this.saving.set(false);
          this.notificationService.success('تم إنشاء التحدي بنجاح');
        },
        error: (err) => {
          console.error('Error creating challenge:', err);
          this.notificationService.error('حدث خطأ أثناء إنشاء التحدي');
          this.saving.set(false);
        }
      });
    }
  }

  deleteChallenge(challenge: ChallengeDto): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف التحدي "${challenge.title}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.challengesService.deleteChallenge(challenge.id).subscribe({
          next: () => {
            this.challenges.update(list => list.filter(c => c.id !== challenge.id));
            this.notificationService.success('تم حذف التحدي بنجاح');
          },
          error: (err) => {
            console.error('Error deleting challenge:', err);
            this.notificationService.error('حدث خطأ أثناء حذف التحدي');
          }
        });
      }
    });
  }
}
