import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Muscle } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-muscles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    ToastModule,
    TagModule,
    InputTextareaModule,
    InputNumberModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="muscles-page">
      <app-page-header
        title="العضلات"
        subtitle="إدارة العضلات ومجموعاتها"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'العضلات'}]"
      >
        <button class="btn btn-primary" (click)="openAddDialog()">
          <i class="pi pi-plus"></i>
          <span>إضافة عضلة</span>
        </button>
      </app-page-header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon total-icon">
            <i class="pi pi-list"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ muscles().length }}</span>
            <span class="mini-stat__label">إجمالي العضلات</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon upper-icon">
            <i class="pi pi-arrow-up"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ upperBodyCount() }}</span>
            <span class="mini-stat__label">الجزء العلوي</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon lower-icon">
            <i class="pi pi-arrow-down"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ lowerBodyCount() }}</span>
            <span class="mini-stat__label">الجزء السفلي</span>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon core-icon">
            <i class="pi pi-circle"></i>
          </div>
          <div class="mini-stat__content">
            <span class="mini-stat__value">{{ coreCount() }}</span>
            <span class="mini-stat__label">الجذع</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Muscles Table -->
      <div class="table-card card" *ngIf="!loading()">
        <!-- Search & Filter Header -->
        <div class="table-toolbar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="searchQuery"
              placeholder="البحث باسم العضلة..."
            />
            <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="filter-chips">
            <button
              class="chip"
              [class.active]="selectedBodyPart === ''"
              (click)="filterByBodyPart('')"
            >
              الكل
            </button>
            <button
              class="chip upper-chip"
              [class.active]="selectedBodyPart === 'Upper Body'"
              (click)="filterByBodyPart('Upper Body')"
            >
              <i class="pi pi-arrow-up"></i>
              الجزء العلوي
            </button>
            <button
              class="chip lower-chip"
              [class.active]="selectedBodyPart === 'Lower Body'"
              (click)="filterByBodyPart('Lower Body')"
            >
              <i class="pi pi-arrow-down"></i>
              الجزء السفلي
            </button>
            <button
              class="chip core-chip"
              [class.active]="selectedBodyPart === 'Core'"
              (click)="filterByBodyPart('Core')"
            >
              <i class="pi pi-circle"></i>
              الجذع
            </button>
            <button
              class="chip arms-chip"
              [class.active]="selectedBodyPart === 'Arms'"
              (click)="filterByBodyPart('Arms')"
            >
              <i class="pi pi-user"></i>
              الذراعين
            </button>
          </div>
        </div>

        <p-table
          [value]="filteredMuscles()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} عضلة"
          styleClass="muscles-table"
          [tableStyle]="{'min-width': '50rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 60px">الأيقونة</th>
              <th pSortableColumn="name" style="width: 25%">
                <div class="th-content">
                  العضلة
                  <p-sortIcon field="name"></p-sortIcon>
                </div>
              </th>
              <th pSortableColumn="bodyPart" style="width: 15%">
                <div class="th-content">
                  الجزء
                  <p-sortIcon field="bodyPart"></p-sortIcon>
                </div>
              </th>
              <th style="width: 35%">الوصف</th>
              <th style="width: 10%">الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-muscle>
            <tr class="muscle-row">
              <td>
                <div class="muscle-icon" [style.background]="getBodyPartColor(muscle.bodyPart) + '15'">
                  <span *ngIf="muscle.icon">{{ muscle.icon }}</span>
                  <i *ngIf="!muscle.icon" class="pi pi-heart" [style.color]="getBodyPartColor(muscle.bodyPart)"></i>
                </div>
              </td>
              <td>
                <div class="muscle-info">
                  <span class="muscle-name">{{ muscle.nameAr || muscle.name }}</span>
                  <span class="muscle-name-en" *ngIf="muscle.nameAr && muscle.name">{{ muscle.name }}</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getBodyPartLabel(muscle.bodyPart)"
                  [severity]="getBodyPartSeverity(muscle.bodyPart)"
                ></p-tag>
              </td>
              <td>
                <span class="muscle-description">{{ muscle.descriptionAr || muscle.description || '-' }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="action-btn edit-btn"
                    (click)="editMuscle(muscle)"
                    title="تعديل"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    (click)="deleteMuscle(muscle)"
                    title="حذف"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <i class="pi pi-search"></i>
                  <h4>لا توجد نتائج</h4>
                  <p>لم يتم العثور على عضلات مطابقة لبحثك</p>
                  <button class="btn btn-outline" (click)="clearSearch()">مسح البحث</button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingMuscle ? 'تعديل العضلة' : 'إضافة عضلة جديدة'"
        [modal]="true"
        [style]="{width: '550px'}"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="form-row">
            <div class="form-group">
              <label>الاسم (بالإنجليزية) *</label>
              <input type="text" pInputText [(ngModel)]="muscleForm.name" placeholder="مثال: Biceps" />
            </div>
            <div class="form-group">
              <label>الاسم (بالعربية)</label>
              <input type="text" pInputText [(ngModel)]="muscleForm.nameAr" placeholder="مثال: العضلة ذات الرأسين" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>الجزء من الجسم *</label>
              <p-dropdown
                [options]="bodyPartOptions"
                [(ngModel)]="muscleForm.bodyPart"
                placeholder="اختر الجزء"
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
            <div class="form-group">
              <label>الترتيب (Index)</label>
              <p-inputNumber [(ngModel)]="muscleForm.index" [min]="0" [max]="100" placeholder="0"></p-inputNumber>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>الأيقونة (Emoji)</label>
              <input type="text" pInputText [(ngModel)]="muscleForm.icon" placeholder="مثال: 💪" />
            </div>
          </div>

          <div class="form-group">
            <label>الوصف (بالإنجليزية)</label>
            <textarea pInputTextarea [(ngModel)]="muscleForm.description" rows="2" placeholder="وصف العضلة بالإنجليزية..."></textarea>
          </div>

          <div class="form-group">
            <label>الوصف (بالعربية)</label>
            <textarea pInputTextarea [(ngModel)]="muscleForm.descriptionAr" rows="2" placeholder="وصف العضلة بالعربية..."></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveMuscle()">حفظ</button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .muscles-page {
      max-width: 1400px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
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
      &.upper-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      &.lower-icon {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.core-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
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

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-box {
      position: relative;
      max-width: 400px;

      i.pi-search {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.9rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        &::placeholder {
          color: var(--text-muted);
        }
      }

      .clear-btn {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
      }
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

      i {
        font-size: 0.75rem;
      }

      &:hover {
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.active {
        background: #8b5cf6;
        border-color: #8b5cf6;
        color: white;
      }

      &.upper-chip {
        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        &.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-color: #3b82f6;
        }
      }

      &.lower-chip {
        &:hover {
          border-color: #22c55e;
          color: #22c55e;
        }
        &.active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #22c55e;
        }
      }

      &.core-chip {
        &:hover {
          border-color: #f59e0b;
          color: #f59e0b;
        }
        &.active {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-color: #f59e0b;
        }
      }

      &.arms-chip {
        &:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        &.active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #ef4444;
        }
      }
    }

    :host ::ng-deep .muscles-table {
      .p-datatable-thead > tr > th {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 1rem;
        border: none;
        border-bottom: 1px solid var(--border-color);
      }

      .p-datatable-tbody > tr {
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }

        > td {
          padding: 0.875rem 1rem;
          border: none;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
      }

      .p-paginator {
        padding: 1rem;
        border: none;
        background: transparent;
      }

      .p-sortable-column:hover {
        background: var(--bg-secondary) !important;
      }
    }

    .th-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .muscle-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .muscle-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .muscle-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .muscle-name-en {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .muscle-description {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

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

      &.edit-btn {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;

        &:hover {
          background: #3b82f6;
          color: white;
        }
      }

      &.delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;

        &:hover {
          background: #ef4444;
          color: white;
        }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 3.5rem;
        margin-bottom: 1rem;
        opacity: 0.3;
        color: #8b5cf6;
      }

      h4 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
        font-size: 1.1rem;
      }

      p {
        margin: 0 0 1.5rem;
        font-size: 0.9rem;
      }
    }

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

      input, textarea {
        width: 100%;
      }

      textarea {
        resize: vertical;
      }
    }

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

      &.btn-primary {
        background: #8b5cf6;
        color: white;

        &:hover {
          background: #7c3aed;
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-chips {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 0.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MusclesListComponent implements OnInit {
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  muscles = signal<Muscle[]>([]);

  // Search and Filter
  searchQuery = '';
  selectedBodyPart = '';

  dialogVisible = false;
  editingMuscle: Muscle | null = null;
  muscleForm = {
    name: '',
    nameAr: '',
    bodyPart: '',
    description: '',
    descriptionAr: '',
    icon: '',
    index: 0
  };

  bodyPartOptions = [
    { label: 'الجزء العلوي (Upper Body)', value: 'Upper Body' },
    { label: 'الجزء السفلي (Lower Body)', value: 'Lower Body' },
    { label: 'الجذع (Core)', value: 'Core' },
    { label: 'الذراعين (Arms)', value: 'Arms' }
  ];

  // Computed stats
  upperBodyCount = computed(() => this.muscles().filter(m => m.bodyPart === 'Upper Body').length);
  lowerBodyCount = computed(() => this.muscles().filter(m => m.bodyPart === 'Lower Body').length);
  coreCount = computed(() => this.muscles().filter(m => m.bodyPart === 'Core').length);
  armsCount = computed(() => this.muscles().filter(m => m.bodyPart === 'Arms').length);

  filteredMuscles(): Muscle[] {
    let result = this.muscles();

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        (m.nameAr && m.nameAr.toLowerCase().includes(query)) ||
        (m.description && m.description.toLowerCase().includes(query)) ||
        (m.descriptionAr && m.descriptionAr.includes(query))
      );
    }

    // Filter by body part
    if (this.selectedBodyPart) {
      result = result.filter(m => m.bodyPart === this.selectedBodyPart);
    }

    return result;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedBodyPart = '';
  }

  filterByBodyPart(bodyPart: string): void {
    this.selectedBodyPart = bodyPart;
  }

  getBodyPartColor(bodyPart: string): string {
    const colors: Record<string, string> = {
      'Upper Body': '#3b82f6',
      'Lower Body': '#22c55e',
      'Core': '#f59e0b',
      'Arms': '#ef4444'
    };
    return colors[bodyPart] || '#8b5cf6';
  }

  getBodyPartLabel(bodyPart: string): string {
    const labels: Record<string, string> = {
      'Upper Body': 'الجزء العلوي',
      'Lower Body': 'الجزء السفلي',
      'Core': 'الجذع',
      'Arms': 'الذراعين'
    };
    return labels[bodyPart] || bodyPart;
  }

  getBodyPartSeverity(bodyPart: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'Upper Body': 'info',
      'Lower Body': 'success',
      'Core': 'warning',
      'Arms': 'danger'
    };
    return severities[bodyPart] || 'secondary';
  }

  ngOnInit(): void {
    this.loadMuscles();
  }

  loadMuscles(): void {
    this.loading.set(true);

    this.coachService.getMuscles().subscribe({
      next: (data) => {
        this.muscles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading muscles:', err);
        this.notificationService.error('حدث خطأ أثناء تحميل العضلات');
        // Use mock data as fallback
        const mockData: Muscle[] = [
          { id: 1, name: 'Chest', nameAr: 'الصدر', bodyPart: 'Upper Body', description: 'Pectoralis major and minor', icon: '💪' },
          { id: 2, name: 'Back', nameAr: 'الظهر', bodyPart: 'Upper Body', description: 'Latissimus dorsi, trapezius, rhomboids', icon: '🔙' },
          { id: 3, name: 'Shoulders', nameAr: 'الأكتاف', bodyPart: 'Upper Body', description: 'Deltoids (anterior, lateral, posterior)', icon: '🦾' },
          { id: 4, name: 'Biceps', nameAr: 'العضلة ذات الرأسين', bodyPart: 'Arms', description: 'Biceps brachii', icon: '💪' },
          { id: 5, name: 'Triceps', nameAr: 'العضلة ثلاثية الرؤوس', bodyPart: 'Arms', description: 'Triceps brachii', icon: '💪' },
          { id: 6, name: 'Quadriceps', nameAr: 'عضلات الفخذ الأمامية', bodyPart: 'Lower Body', description: 'Rectus femoris, vastus muscles', icon: '🦵' },
          { id: 7, name: 'Hamstrings', nameAr: 'عضلات الفخذ الخلفية', bodyPart: 'Lower Body', description: 'Biceps femoris, semitendinosus', icon: '🦵' },
          { id: 8, name: 'Glutes', nameAr: 'عضلات الأرداف', bodyPart: 'Lower Body', description: 'Gluteus maximus, medius, minimus', icon: '🍑' },
          { id: 9, name: 'Calves', nameAr: 'عضلات الساق', bodyPart: 'Lower Body', description: 'Gastrocnemius, soleus', icon: '🦵' },
          { id: 10, name: 'Abs', nameAr: 'عضلات البطن', bodyPart: 'Core', description: 'Rectus abdominis, obliques', icon: '🎯' },
        ];
        this.muscles.set(mockData);
        this.loading.set(false);
      }
    });
  }

  openAddDialog(): void {
    this.editingMuscle = null;
    this.muscleForm = {
      name: '',
      nameAr: '',
      bodyPart: '',
      description: '',
      descriptionAr: '',
      icon: '',
      index: this.muscles().length // Set next index
    };
    this.dialogVisible = true;
  }

  editMuscle(muscle: Muscle): void {
    this.editingMuscle = muscle;
    this.muscleForm = {
      name: muscle.name,
      nameAr: muscle.nameAr || '',
      bodyPart: muscle.bodyPart,
      description: muscle.description || '',
      descriptionAr: muscle.descriptionAr || '',
      icon: muscle.icon || '',
      index: muscle.index ?? 0
    };
    this.dialogVisible = true;
  }

  deleteMuscle(muscle: Muscle): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف "${muscle.nameAr || muscle.name}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.coachService.deleteMuscle(muscle.id).subscribe({
          next: () => {
            this.muscles.update(muscles => muscles.filter(m => m.id !== muscle.id));
            this.notificationService.success('تم حذف العضلة بنجاح');
          },
          error: (err) => {
            console.error('Error deleting muscle:', err);
            this.notificationService.error('حدث خطأ أثناء حذف العضلة');
          }
        });
      }
    });
  }

  saveMuscle(): void {
    if (!this.muscleForm.name || !this.muscleForm.bodyPart) {
      this.notificationService.warn('يرجى إدخال اسم العضلة والجزء من الجسم');
      return;
    }

    const muscleData = {
      name: this.muscleForm.name,
      nameAr: this.muscleForm.nameAr || undefined,
      bodyPart: this.muscleForm.bodyPart,
      description: this.muscleForm.description || undefined,
      descriptionAr: this.muscleForm.descriptionAr || undefined,
      icon: this.muscleForm.icon || undefined,
      index: this.muscleForm.index ?? 0
    };

    if (this.editingMuscle) {
      this.coachService.updateMuscle(this.editingMuscle.id, muscleData).subscribe({
        next: () => {
          this.muscles.update(muscles =>
            muscles.map(m => m.id === this.editingMuscle!.id ? {
              ...m,
              ...muscleData
            } : m)
          );
          this.dialogVisible = false;
          this.notificationService.success('تم تحديث العضلة بنجاح');
        },
        error: (err) => {
          console.error('Error updating muscle:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث العضلة');
        }
      });
    } else {
      this.coachService.createMuscle(muscleData).subscribe({
        next: (newId) => {
          const createdMuscle: Muscle = {
            id: newId,
            name: this.muscleForm.name,
            nameAr: this.muscleForm.nameAr || undefined,
            bodyPart: this.muscleForm.bodyPart,
            description: this.muscleForm.description || undefined,
            descriptionAr: this.muscleForm.descriptionAr || undefined,
            icon: this.muscleForm.icon || undefined,
            index: this.muscleForm.index ?? 0
          };
          this.muscles.update(muscles => [...muscles, createdMuscle]);
          this.dialogVisible = false;
          this.notificationService.success('تم إضافة العضلة بنجاح');
        },
        error: (err) => {
          console.error('Error creating muscle:', err);
          this.notificationService.error('حدث خطأ أثناء إضافة العضلة');
        }
      });
    }
  }
}
