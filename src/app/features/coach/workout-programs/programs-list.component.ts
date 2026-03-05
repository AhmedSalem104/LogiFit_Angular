import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, WorkoutProgram, Exercise } from '../services/coach.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-programs-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    TableModule,
    TooltipModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="programs-page">
      <app-page-header
        title="برامج التمرين"
        subtitle="إنشاء وإدارة برامج التمرين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'برامج التمرين'}]"
      >
        <a routerLink="/coach/workout-programs/create" class="btn btn-primary">
          <i class="pi pi-plus"></i>
          <span>برنامج جديد</span>
        </a>
      </app-page-header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card purple">
          <div class="stat-icon"><i class="pi pi-list"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ programs().length }}</span>
            <span class="stat-label">إجمالي البرامج</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ activePrograms() }}</span>
            <span class="stat-label">برامج نشطة</span>
          </div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ totalAssignedTrainees() }}</span>
            <span class="stat-label">متدرب مسجل</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <app-loading-skeleton type="stats"></app-loading-skeleton>
      } @else {
        <!-- Professional Table -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              <i class="pi pi-list"></i>
              <span>قائمة البرامج</span>
            </div>
            <div class="table-filters">
              <span class="p-input-icon-right search-box">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="searchTerm"
                  placeholder="البحث..."
                  (input)="filterPrograms()"
                />
              </span>
              <p-dropdown
                [options]="difficultyOptions"
                [(ngModel)]="selectedDifficulty"
                placeholder="المستوى"
                (onChange)="filterPrograms()"
                [showClear]="true"
                styleClass="filter-dropdown"
              ></p-dropdown>
            </div>
          </div>

          <p-table
            [value]="filteredPrograms()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 20]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} برنامج"
            [globalFilterFields]="['name', 'description', 'goal']"
            styleClass="custom-table"
            [tableStyle]="{'min-width': '60rem'}"
            responsiveLayout="scroll"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="name" style="width: 25%">
                  البرنامج
                  <p-sortIcon field="name"></p-sortIcon>
                </th>
                <th pSortableColumn="difficulty" style="width: 12%">
                  المستوى
                  <p-sortIcon field="difficulty"></p-sortIcon>
                </th>
                <th pSortableColumn="durationWeeks" style="width: 12%">
                  المدة
                  <p-sortIcon field="durationWeeks"></p-sortIcon>
                </th>
                <th pSortableColumn="daysPerWeek" style="width: 12%">
                  أيام/أسبوع
                  <p-sortIcon field="daysPerWeek"></p-sortIcon>
                </th>
                <th pSortableColumn="goal" style="width: 15%">
                  الهدف
                  <p-sortIcon field="goal"></p-sortIcon>
                </th>
                <th pSortableColumn="assignedTraineesCount" style="width: 12%">
                  المتدربين
                  <p-sortIcon field="assignedTraineesCount"></p-sortIcon>
                </th>
                <th style="width: 12%">الإجراءات</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-program>
              <tr [class.inactive-row]="!program.isActive">
                <td>
                  <div class="program-cell">
                    <div class="program-icon">
                      <i class="pi pi-list"></i>
                    </div>
                    <div class="program-info">
                      <span class="program-name">{{ program.name }}</span>
                      <span class="program-desc" *ngIf="program.description">{{ program.description | slice:0:50 }}{{ program.description.length > 50 ? '...' : '' }}</span>
                    </div>
                    <span class="status-indicator" [class.active]="program.isActive" [pTooltip]="program.isActive ? 'نشط' : 'غير نشط'"></span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="getDifficultyLabel(program.difficulty)"
                    [severity]="getDifficultySeverity(program.difficulty)"
                    [rounded]="true"
                  ></p-tag>
                </td>
                <td>
                  <div class="meta-cell">
                    <i class="pi pi-calendar"></i>
                    <span>{{ program.durationWeeks ?? calculateDurationWeeks(program) }} أسبوع</span>
                  </div>
                </td>
                <td>
                  <div class="meta-cell">
                    <i class="pi pi-clock"></i>
                    <span>{{ program.daysPerWeek ?? program.routines?.length ?? 0 }} أيام</span>
                  </div>
                </td>
                <td>
                  <span class="goal-badge">{{ program.goal || 'غير محدد' }}</span>
                </td>
                <td>
                  <div class="trainees-cell">
                    <i class="pi pi-users"></i>
                    <span>{{ program.assignedTraineesCount ?? 0 }}</span>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn print" (click)="printProgram(program)" pTooltip="طباعة">
                      <i class="pi pi-print"></i>
                    </button>
                    <a [routerLink]="['/coach/workout-programs', program.id, 'edit']" class="action-btn edit" pTooltip="تعديل">
                      <i class="pi pi-pencil"></i>
                    </a>
                    <button class="action-btn copy" (click)="duplicateProgram(program)" pTooltip="نسخ">
                      <i class="pi pi-copy"></i>
                    </button>
                    <button class="action-btn toggle" (click)="toggleProgram(program)" [pTooltip]="program.isActive ? 'إخفاء' : 'تفعيل'">
                      <i [class]="program.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    </button>
                    <button class="action-btn delete" (click)="deleteProgram(program)" pTooltip="حذف">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7">
                  <div class="empty-table">
                    <i class="pi pi-list"></i>
                    <h3>لا توجد برامج تمرين</h3>
                    <p>ابدأ بإنشاء برنامج تمرين جديد</p>
                    <a routerLink="/coach/workout-programs/create" class="btn btn-primary">
                      <i class="pi pi-plus"></i>
                      إنشاء برنامج
                    </a>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>

    <!-- Print Dialog removed - using standalone preview window like builder -->
  `,
  styles: [`
    .programs-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      &.purple .stat-icon {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      &.green .stat-icon {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      &.blue .stat-icon {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    /* Table Container */
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 16px;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #8b5cf6;
        font-size: 1.2rem;
      }
    }

    .table-filters {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-box {
      input {
        padding: 10px 36px 10px 14px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-primary);
        width: 220px;
        font-size: 0.9rem;

        &:focus {
          border-color: #8b5cf6;
          outline: none;
        }
      }

      i {
        right: 12px;
        color: var(--text-muted);
      }
    }

    :host ::ng-deep .filter-dropdown {
      .p-dropdown {
        border-radius: 10px;
        min-width: 140px;
      }
    }

    /* Custom Table Styles */
    :host ::ng-deep .custom-table {
      .p-datatable-header {
        background: transparent;
        border: none;
        padding: 0;
      }

      .p-datatable-thead > tr > th {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-color);
        border-top: none;
        white-space: nowrap;
      }

      .p-datatable-tbody > tr {
        background: var(--bg-card);
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }

        &.inactive-row {
          opacity: 0.6;
        }

        > td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
      }

      .p-paginator {
        background: var(--bg-card);
        border: none;
        border-top: 1px solid var(--border-color);
        padding: 16px;
      }

      .p-sortable-column-icon {
        color: var(--text-muted);
        font-size: 0.75rem;
      }
    }

    /* Program Cell */
    .program-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .program-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        color: white;
        font-size: 1.1rem;
      }
    }

    .program-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .program-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .program-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #dc2626;
      flex-shrink: 0;

      &.active {
        background: #22c55e;
      }
    }

    /* Meta Cell */
    .meta-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    /* Goal Badge */
    .goal-badge {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Trainees Cell */
    .trainees-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 8px;
      color: #3b82f6;
      font-weight: 600;
      width: fit-content;

      i {
        font-size: 0.9rem;
      }
    }

    /* Actions Cell */
    .actions-cell {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-secondary);
      text-decoration: none;

      &:hover {
        transform: scale(1.1);
      }

      &.edit:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &.copy:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.toggle:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
        color: #f59e0b;
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }

      &.print:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
        color: #6366f1;
      }
    }

    /* Empty Table */
    .empty-table {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 16px;
        opacity: 0.3;
        color: #8b5cf6;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      p {
        margin-bottom: 20px;
      }
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
      font-size: 0.9rem;

      &.btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        align-items: stretch;
      }

      .table-filters {
        flex-direction: column;

        .search-box input {
          width: 100%;
        }
      }
    }
  `]
})
export class ProgramsListComponent implements OnInit {
  private coachService = inject(CoachService);
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  programs = signal<WorkoutProgram[]>([]);
  filteredPrograms = signal<WorkoutProgram[]>([]);

  searchTerm = '';
  selectedDifficulty: string | null = null;

  difficultyOptions = [
    { label: 'مبتدئ', value: 'beginner' },
    { label: 'متوسط', value: 'intermediate' },
    { label: 'متقدم', value: 'advanced' }
  ];

  // Print-related properties
  exercises = signal<Exercise[]>([]);
  today = new Date();
  coachName = '';
  coachPhone = '';

  dayNames: Record<number, string> = {
    0: 'الأحد',
    1: 'الاثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت'
  };

  activePrograms(): number {
    return this.programs().filter(p => p.isActive !== false).length;
  }

  totalAssignedTrainees(): number {
    return this.programs().reduce((sum, p) => sum + (p.assignedTraineesCount ?? 0), 0);
  }

  // Calculate duration from startDate and endDate if durationWeeks is not provided
  calculateDurationWeeks(program: WorkoutProgram): number {
    if (program.startDate && program.endDate) {
      const start = new Date(program.startDate);
      const end = new Date(program.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.ceil(diffDays / 7);
    }
    return 0;
  }

  ngOnInit(): void {
    this.loadPrograms();
    this.loadCoachProfile();
    this.loadExercises();
  }

  loadCoachProfile(): void {
    this.coachService.getProfile().subscribe({
      next: (profile) => {
        this.coachName = profile.profile?.fullName || '';
        this.coachPhone = profile.phoneNumber || '';
      },
      error: () => {
        this.coachName = '';
      }
    });
  }

  loadExercises(): void {
    this.coachService.getExercises().subscribe({
      next: (data) => this.exercises.set(data),
      error: () => {}
    });
  }

  loadPrograms(): void {
    this.loading.set(true);

    this.coachService.getWorkoutPrograms().subscribe({
      next: (data) => {
        this.programs.set(data);
        this.filteredPrograms.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading programs:', err);
        this.notificationService.error('حدث خطأ في تحميل البيانات');
        this.programs.set([]);
        this.filteredPrograms.set([]);
        this.loading.set(false);
      }
    });
  }

  filterPrograms(): void {
    let result = this.programs();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term))
      );
    }

    if (this.selectedDifficulty) {
      result = result.filter(p => p.difficulty === this.selectedDifficulty);
    }

    this.filteredPrograms.set(result);
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم'
    };
    return labels[difficulty] || difficulty;
  }

  getDifficultySeverity(difficulty: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return severities[difficulty] || 'info';
  }

  duplicateProgram(program: WorkoutProgram): void {
    if (confirm(`هل تريد نسخ برنامج "${program.name}"؟`)) {
      this.coachService.duplicateWorkoutProgram(program.id, { newName: `نسخة من ${program.name}` }).subscribe({
        next: () => {
          this.loadPrograms();
        },
        error: (err) => {
          console.error('Error duplicating program:', err);
          alert('فشل في نسخ البرنامج');
        }
      });
    }
  }

  toggleProgram(program: WorkoutProgram): void {
    const newActiveState = !program.isActive;
    this.coachService.updateWorkoutProgram(program.id, { isActive: newActiveState }).subscribe({
      next: () => {
        // Update local state
        const updatedPrograms = this.programs().map(p =>
          p.id === program.id ? { ...p, isActive: newActiveState } : p
        );
        this.programs.set(updatedPrograms);
        this.filterPrograms();
      },
      error: (err) => {
        console.error('Error toggling program:', err);
        alert('فشل في تحديث حالة البرنامج');
      }
    });
  }

  deleteProgram(program: WorkoutProgram): void {
    if (confirm(`هل أنت متأكد من حذف برنامج "${program.name}"؟`)) {
      this.coachService.deleteWorkoutProgram(program.id).subscribe({
        next: () => {
          // Remove from local state
          const updatedPrograms = this.programs().filter(p => p.id !== program.id);
          this.programs.set(updatedPrograms);
          this.filterPrograms();
        },
        error: (err) => {
          console.error('Error deleting program:', err);
          alert('فشل في حذف البرنامج');
        }
      });
    }
  }

  // Print methods
  printProgram(program: WorkoutProgram): void {
    this.coachService.getWorkoutProgramById(program.id).subscribe({
      next: (fullProgram) => this.openPreviewWindow(fullProgram),
      error: () => this.openPreviewWindow(program)
    });
  }

  getDayName(dayOfWeek: number): string {
    return this.dayNames[dayOfWeek] || `يوم ${dayOfWeek}`;
  }

  private openPreviewWindow(program: WorkoutProgram): void {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    const user = this.authService.user();
    const cName = program.coachName || this.coachName || user?.fullName || 'المدرب';
    const cPhone = user?.phoneNumber || this.coachPhone || '';
    const clientName = program.clientName || 'المتدرب';
    const clientPhone = program.clientPhone || '';
    const clientEmail = program.clientEmail || '';
    const startDate = program.startDate ? new Date(program.startDate).toLocaleDateString('ar-EG') : '-';
    const endDate = program.endDate ? new Date(program.endDate).toLocaleDateString('ar-EG') : '-';
    const today = new Date().toLocaleDateString('ar-EG');
    const durationWeeks = program.durationWeeks ?? this.calculateDurationWeeks(program);
    const goalLabel = program.goal || 'غير محدد';
    const diffLabel = this.getDifficultyLabel(program.difficulty || '');
    const totalDays = program.routines?.length || 0;
    const totalExercises = program.routines?.reduce((sum, r) => sum + (r.exercises?.length || 0), 0) || 0;

    const daysHtml = (program.routines || []).map((routine, i) => {
      const exercisesHtml = (routine.exercises || []).map((ex, j) => {
        const fullEx = this.exercises().find(e => e.id === ex.exerciseId || e.id?.toString() === ex.exerciseId?.toString());
        const instructions = fullEx?.instructionsAr?.length ? fullEx.instructionsAr : fullEx?.instructions || [];
        const tips = fullEx?.tipsAr?.length ? fullEx.tipsAr : fullEx?.tips || [];
        const mistakes = fullEx?.commonMistakesAr?.length ? fullEx.commonMistakesAr : fullEx?.commonMistakes || [];
        const hasDetails = instructions.length > 0 || tips.length > 0 || mistakes.length > 0;

        const instructionsHtml = instructions.length > 0 ? `
          <div class="ex-detail-section">
            <span class="ex-detail-title">📋 خطوات التنفيذ:</span>
            <ol class="ex-detail-list">${instructions.map((s: string) => `<li>${s}</li>`).join('')}</ol>
          </div>` : '';
        const tipsHtml = tips.length > 0 ? `
          <div class="ex-detail-section">
            <span class="ex-detail-title tips">💡 نصائح:</span>
            <ul class="ex-detail-list tips-list">${tips.map((t: string) => `<li>${t}</li>`).join('')}</ul>
          </div>` : '';
        const mistakesHtml = mistakes.length > 0 ? `
          <div class="ex-detail-section">
            <span class="ex-detail-title mistakes">⚠️ أخطاء شائعة:</span>
            <ul class="ex-detail-list mistakes-list">${mistakes.map((m: string) => `<li>${m}</li>`).join('')}</ul>
          </div>` : '';

        const detailsRow = hasDetails ? `
          <tr class="details-row">
            <td colspan="6">
              <div class="ex-details-container">${instructionsHtml}${tipsHtml}${mistakesHtml}</div>
            </td>
          </tr>` : '';

        return `
          <tr>
            <td class="num">${j + 1}</td>
            <td class="exercise-name">${ex.exerciseName || fullEx?.nameAr || fullEx?.name || 'تمرين ' + (j + 1)}</td>
            <td class="muscle">${fullEx?.targetMuscleName || fullEx?.muscleGroupName || '-'}</td>
            <td class="sets">${ex.sets}</td>
            <td class="reps">${ex.repsMin}${ex.repsMax && ex.repsMax !== ex.repsMin ? '-' + ex.repsMax : ''}</td>
            <td class="rest">${ex.restSec || ex.restSeconds || 0}ث</td>
          </tr>${detailsRow}`;
      }).join('');

      return `
        <div class="day-card">
          <div class="day-header">
            <div class="day-title">
              <span class="day-icon">💪</span>
              <span class="day-name">${routine.name || this.getDayName(routine.dayOfWeek)}</span>
            </div>
            <div class="day-badge">${routine.exercises?.length || 0} تمرين</div>
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
        </div>`;
    }).join('');

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
          .page { max-width: 950px; margin: 0 auto; padding: 40px; }

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
            top: -50%; right: -50%;
            width: 100%; height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          }
          .brand {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 25px; position: relative;
          }
          .brand-logo {
            width: 50px; height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px;
          }
          .brand-text { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
          .document-title {
            font-size: 32px; font-weight: 800;
            margin-bottom: 10px; position: relative;
          }
          .document-subtitle {
            font-size: 16px; opacity: 0.85;
            position: relative;
          }

          .info-section {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 20px; margin-bottom: 30px;
          }
          .info-card {
            background: white; border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            overflow: hidden; border: 1px solid #e2e8f0;
          }
          .info-card-title {
            padding: 14px 20px; font-weight: 700; font-size: 15px;
            color: white;
          }
          .info-card:first-child .info-card-title {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
          }
          .info-card:last-child .info-card-title {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
          }
          .info-row {
            display: flex; justify-content: space-between;
            padding: 10px 20px;
            border-bottom: 1px solid #f1f5f9;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; font-size: 13px; }
          .info-value { font-weight: 600; color: #1e293b; }
          .coach-name { color: #7c3aed; font-weight: 700; }
          .client-name { color: #3b82f6; font-weight: 700; }

          .stats-grid {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 16px; margin-bottom: 30px;
          }
          .stat-card {
            background: white; border-radius: 16px;
            padding: 24px 16px; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 2px solid transparent;
          }
          .stat-card:nth-child(1) { border-color: #a78bfa; background: linear-gradient(135deg, #f5f3ff, white); }
          .stat-card:nth-child(2) { border-color: #60a5fa; background: linear-gradient(135deg, #eff6ff, white); }
          .stat-card:nth-child(3) { border-color: #4ade80; background: linear-gradient(135deg, #f0fdf4, white); }
          .stat-card:nth-child(4) { border-color: #fbbf24; background: linear-gradient(135deg, #fffbeb, white); }
          .stat-value { font-size: 32px; font-weight: 800; color: #1e293b; display: block; }
          .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; display: block; }

          .days-section-title {
            font-size: 22px; font-weight: 700; color: #1e293b;
            margin-bottom: 20px; padding-bottom: 12px;
            border-bottom: 3px solid #7c3aed;
          }
          .day-card {
            background: white; border-radius: 16px;
            margin-bottom: 24px; overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
          }
          .day-header {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 18px 24px;
            display: flex; align-items: center; justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
          }
          .day-title { display: flex; align-items: center; gap: 12px; }
          .day-icon { font-size: 28px; }
          .day-name { font-size: 20px; font-weight: 700; color: #1e293b; }
          .day-badge {
            background: #7c3aed; color: white;
            padding: 8px 18px; border-radius: 25px;
            font-size: 14px; font-weight: 600;
          }

          .exercises-table { width: 100%; border-collapse: collapse; }
          .exercises-table th {
            background: #f8fafc; padding: 14px 20px;
            text-align: right; font-size: 13px; font-weight: 600;
            color: #475569; text-transform: uppercase; letter-spacing: 0.5px;
          }
          .exercises-table td {
            padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px;
          }
          .exercises-table tr:last-child td { border-bottom: none; }
          .exercises-table tr:hover { background: #fafafa; }
          .exercises-table .num { font-weight: 700; color: #7c3aed; text-align: center; }
          .exercises-table .exercise-name { font-weight: 600; color: #1e293b; }
          .exercises-table .muscle { color: #64748b; font-size: 13px; }
          .exercises-table .sets, .exercises-table .reps {
            font-weight: 700; color: #2563eb; text-align: center;
          }
          .exercises-table .rest { color: #16a34a; font-weight: 600; text-align: center; }

          .details-row td { padding: 0 20px 16px !important; border-bottom: 2px solid #e2e8f0 !important; }
          .details-row:hover { background: transparent !important; }
          .ex-details-container {
            display: flex; flex-wrap: wrap; gap: 16px;
            padding: 12px 16px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 12px; border: 1px solid #e2e8f0;
          }
          .ex-detail-section { flex: 1; min-width: 200px; }
          .ex-detail-title {
            font-size: 12px; font-weight: 700; color: #7c3aed;
            display: block; margin-bottom: 6px;
          }
          .ex-detail-title.tips { color: #16a34a; }
          .ex-detail-title.mistakes { color: #dc2626; }
          .ex-detail-list { margin: 0; padding-right: 18px; padding-left: 0; }
          .ex-detail-list li { font-size: 12px; color: #334155; padding: 2px 0; line-height: 1.6; }
          .ex-detail-list.tips-list li::marker { color: #16a34a; }
          .ex-detail-list.mistakes-list li::marker { color: #dc2626; }

          .document-footer {
            margin-top: 40px; padding-top: 30px;
            border-top: 2px dashed #e2e8f0; text-align: center;
          }
          .footer-note { font-size: 14px; color: #64748b; margin-bottom: 15px; }
          .footer-brand { font-size: 18px; font-weight: 700; color: #7c3aed; }
          .footer-date { font-size: 12px; color: #94a3b8; margin-top: 10px; }

          .actions {
            text-align: center; margin-top: 40px; padding: 20px;
            background: white; border-radius: 16px;
          }
          .btn {
            padding: 14px 40px; border: none; border-radius: 12px;
            font-size: 16px; font-weight: 600; cursor: pointer;
            margin: 0 10px; font-family: 'Cairo', sans-serif; transition: all 0.3s;
          }
          .btn-print {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white;
          }
          .btn-print:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
          .btn-close { background: #f1f5f9; color: #475569; }
          .btn-close:hover { background: #e2e8f0; }

          @media print {
            body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { padding: 20px; max-width: 100%; }
            .document-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .actions { display: none !important; }
            .day-card { break-inside: avoid; page-break-inside: avoid; }
            .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="document-header">
            <div class="brand">
              <div class="brand-logo">🏋️</div>
              <div class="brand-text">LogicFit</div>
            </div>
            <h1 class="document-title">💪 ${program.name || 'برنامج التمرين'}</h1>
            <p class="document-subtitle">${program.description || 'برنامج تمرين مخصص لتحقيق أهدافك الرياضية'}</p>
          </div>

          <div class="info-section">
            <div class="info-card">
              <div class="info-card-title">معلومات المدرب</div>
              <div class="info-row">
                <span class="info-label">الاسم</span>
                <span class="info-value coach-name">${cName}</span>
              </div>
              ${cPhone ? `<div class="info-row">
                <span class="info-label">رقم الهاتف</span>
                <span class="info-value">${cPhone}</span>
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
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">${durationWeeks}</span>
              <span class="stat-label">أسبوع</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${totalDays}</span>
              <span class="stat-label">أيام التمرين</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${totalExercises}</span>
              <span class="stat-label">تمرين</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${diffLabel}</span>
              <span class="stat-label">المستوى</span>
            </div>
          </div>

          <div class="days-section-title">📋 جدول التمارين الأسبوعي</div>
          ${daysHtml}

          <div class="document-footer">
            <p class="footer-note">💡 احرص على الإحماء قبل التمرين والتمدد بعده. استشر مدربك لأي تعديلات.</p>
            <div class="footer-brand">LogicFit - نظامك الرياضي الذكي</div>
            <p class="footer-date">تم إنشاء هذا المستند في ${today}</p>
          </div>

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
}
