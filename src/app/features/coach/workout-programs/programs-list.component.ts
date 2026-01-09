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
import { CoachService, WorkoutProgram } from '../services/coach.service';

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
  }

  loadPrograms(): void {
    this.loading.set(true);

    this.coachService.getWorkoutPrograms().subscribe({
      next: (data) => {
        this.programs.set(data);
        this.filteredPrograms.set(data);
        this.loading.set(false);
      },
      error: () => {
        const mockData: WorkoutProgram[] = [
          {
            id: '1',
            name: 'برنامج بناء العضلات - مبتدئ',
            description: 'برنامج مصمم للمبتدئين لبناء أساس قوي من القوة والعضلات',
            durationWeeks: 8,
            daysPerWeek: 3,
            difficulty: 'beginner',
            goal: 'بناء العضلات',
            isActive: true,
            assignedTraineesCount: 12,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'برنامج القوة المتوسط',
            description: 'برنامج لزيادة القوة والتحمل للمستوى المتوسط',
            durationWeeks: 12,
            daysPerWeek: 4,
            difficulty: 'intermediate',
            goal: 'زيادة القوة',
            isActive: true,
            assignedTraineesCount: 8,
            createdAt: '2024-01-05',
            updatedAt: '2024-01-14'
          },
          {
            id: '3',
            name: 'برنامج التنشيف المتقدم',
            description: 'برنامج مكثف لحرق الدهون والحفاظ على الكتلة العضلية',
            durationWeeks: 10,
            daysPerWeek: 5,
            difficulty: 'advanced',
            goal: 'حرق الدهون',
            isActive: true,
            assignedTraineesCount: 5,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-15'
          },
          {
            id: '4',
            name: 'برنامج اللياقة العامة',
            description: 'برنامج متوازن لتحسين اللياقة البدنية العامة',
            durationWeeks: 6,
            daysPerWeek: 3,
            difficulty: 'beginner',
            goal: 'لياقة عامة',
            isActive: false,
            assignedTraineesCount: 0,
            createdAt: '2023-12-01',
            updatedAt: '2023-12-20'
          }
        ];
        this.programs.set(mockData);
        this.filteredPrograms.set(mockData);
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
}
