import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ExportMenuComponent, ExportFormat } from '../../../shared/components/export-menu/export-menu.component';
import { ExportService } from '../../../core/services/export.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnerService, Coach } from '../services/owner.service';
import Swal from 'sweetalert2';

// Display interface for table
interface CoachDisplay {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  traineesCount: number;
  activePrograms: number;
}

@Component({
  selector: 'app-coaches-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    ExportMenuComponent
  ],
  template: `
    <div class="coaches-page">
      <app-page-header
        title="المدربين"
        subtitle="إدارة مدربين الصالة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'المدربين'}]"
      >
        <div class="header-actions">
          <app-export-menu
            buttonLabel="تصدير"
            (export)="onExport($event)"
          ></app-export-menu>
          <button class="btn btn-primary" (click)="openAddDialog()">
            <i class="pi pi-plus"></i>
            <span>إضافة مدرب</span>
          </button>
        </div>
      </app-page-header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="mini-stat">
          <span class="mini-stat__value">{{ coaches().length }}</span>
          <span class="mini-stat__label">إجمالي المدربين</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat__value">{{ activeCoachesCount() }}</span>
          <span class="mini-stat__label">مدربين نشطين</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat__value">{{ totalTrainees() }}</span>
          <span class="mini-stat__label">إجمالي المتدربين</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card card">
        <div class="filters-row">
          <div class="search-wrapper">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="searchTerm"
              placeholder="بحث بالاسم أو الهاتف..."
            />
          </div>
          <div class="filter-buttons">
            <button
              class="filter-btn"
              [class.active]="statusFilter === 'all'"
              (click)="setStatusFilter('all')"
            >
              الكل
            </button>
            <button
              class="filter-btn"
              [class.active]="statusFilter === 'active'"
              (click)="setStatusFilter('active')"
            >
              نشط
            </button>
            <button
              class="filter-btn"
              [class.active]="statusFilter === 'inactive'"
              (click)="setStatusFilter('inactive')"
            >
              غير نشط
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Table -->
      <div class="table-card card" *ngIf="!loading()">
        <p-table
          [value]="filteredCoaches()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} مدرب"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>المدرب</th>
              <th>رقم الهاتف</th>
              <th>الحالة</th>
              <th>المتدربين</th>
              <th>البرامج النشطة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-coach>
            <tr>
              <td>
                <div class="coach-info">
                  <div class="coach-avatar">
                    {{ getInitials(coach.fullName) }}
                  </div>
                  <div class="coach-details">
                    <span class="coach-name">{{ coach.fullName }}</span>
                    <span class="coach-email">{{ coach.email || '-' }}</span>
                  </div>
                </div>
              </td>
              <td>{{ coach.phoneNumber }}</td>
              <td>
                <p-tag
                  [value]="coach.isActive ? 'نشط' : 'غير نشط'"
                  [severity]="coach.isActive ? 'success' : 'danger'"
                ></p-tag>
              </td>
              <td>
                <span class="badge">{{ coach.traineesCount }} متدرب</span>
              </td>
              <td>
                <span class="badge">{{ coach.activePrograms }} برنامج</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    pButton
                    icon="pi pi-eye"
                    class="p-button-text p-button-sm"
                    (click)="viewCoach(coach)"
                    pTooltip="عرض"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    (click)="editCoach(coach)"
                    pTooltip="تعديل"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    (click)="deleteCoach(coach)"
                    pTooltip="حذف"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <i class="pi pi-user"></i>
                  <p>لا يوجد مدربين</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .coaches-page {
      max-width: 1400px;
    }

    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .mini-stat {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }

    .mini-stat__value {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: #22c55e;
    }

    .mini-stat__label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .filters-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 400px;

      i {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      input {
        width: 100%;
        padding-right: 2.75rem;
      }
    }

    :host-context([dir="ltr"]) .search-wrapper {
      i {
        right: auto;
        left: 1rem;
      }

      input {
        padding-right: 1rem;
        padding-left: 2.75rem;
      }
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        background: var(--bg-secondary);
      }

      &.active {
        background: #22c55e;
        color: white;
        border-color: #22c55e;
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .coach-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .coach-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .coach-details {
      display: flex;
      flex-direction: column;
    }

    .coach-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .coach-email {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .badge {
      background: var(--bg-secondary);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    @media (max-width: 768px) {
      .stats-row {
        flex-direction: column;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-wrapper {
        max-width: none;
      }

      .filter-buttons {
        justify-content: center;
      }
    }
  `]
})
export class CoachesListComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private exportService = inject(ExportService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = signal(true);
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  coaches = signal<CoachDisplay[]>([]);

  ngOnInit(): void {
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.loading.set(true);

    this.ownerService.getCoaches().subscribe({
      next: (data) => {
        const mappedCoaches = this.mapCoachesForDisplay(data);
        this.coaches.set(mappedCoaches);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading coaches:', err);
        // Fallback to mock data for development
        this.coaches.set([
          { id: '1', fullName: 'أحمد المدرب', phoneNumber: '01011111111', email: 'ahmed.coach@email.com', isActive: true, traineesCount: 15, activePrograms: 12 },
          { id: '2', fullName: 'محمد المدرب', phoneNumber: '01022222222', email: 'mohamed.coach@email.com', isActive: true, traineesCount: 8, activePrograms: 6 },
          { id: '3', fullName: 'خالد المدرب', phoneNumber: '01033333333', email: 'khaled.coach@email.com', isActive: false, traineesCount: 0, activePrograms: 0 },
        ]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Map API response to display format
   */
  private mapCoachesForDisplay(coaches: Coach[]): CoachDisplay[] {
    return coaches.map(coach => ({
      id: coach.id,
      fullName: coach.profile?.fullName || coach.fullName || 'غير محدد',
      phoneNumber: coach.phoneNumber || '',
      email: coach.email || '',
      isActive: coach.isActive ?? true,
      traineesCount: coach.traineesCount ?? 0,
      activePrograms: coach.activePrograms ?? 0
    }));
  }

  // Computed stats
  activeCoachesCount(): number {
    return this.coaches().filter(c => c.isActive).length;
  }

  totalTrainees(): number {
    return this.coaches().reduce((sum, c) => sum + c.traineesCount, 0);
  }

  filteredCoaches(): CoachDisplay[] {
    let filtered = this.coaches();

    // Filter by status
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    // Filter by search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.fullName.toLowerCase().includes(term) ||
        c.phoneNumber.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = filter;
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  openAddDialog(): void {
    // TODO: Implement add coach dialog or navigate to add page
    this.notificationService.info('سيتم إضافة هذه الميزة قريباً');
  }

  viewCoach(coach: CoachDisplay): void {
    // Navigate to coach details
    this.router.navigate(['/owner/coaches', coach.id]);
  }

  editCoach(coach: CoachDisplay): void {
    // TODO: Implement edit coach dialog
    this.notificationService.info('سيتم إضافة هذه الميزة قريباً');
  }

  deleteCoach(coach: CoachDisplay): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف المدرب "${coach.fullName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownerService.deleteCoach(coach.id).subscribe({
          next: () => {
            this.coaches.update(coaches => coaches.filter(c => c.id !== coach.id));
            this.notificationService.success('تم حذف المدرب بنجاح');
          },
          error: (err) => {
            console.error('Error deleting coach:', err);
            this.notificationService.error('حدث خطأ أثناء حذف المدرب');
          }
        });
      }
    });
  }

  async onExport(format: ExportFormat): Promise<void> {
    const coaches = this.filteredCoaches();
    const exportConfig = {
      title: 'قائمة المدربين',
      fileName: 'coaches-list',
      columns: [
        { header: 'الاسم', field: 'fullName' },
        { header: 'رقم الهاتف', field: 'phoneNumber' },
        { header: 'البريد الإلكتروني', field: 'email' },
        { header: 'الحالة', field: 'status' },
        { header: 'عدد المتدربين', field: 'traineesCount' },
        { header: 'البرامج النشطة', field: 'activePrograms' }
      ],
      data: coaches.map(c => ({
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email || '-',
        status: c.isActive ? 'نشط' : 'غير نشط',
        traineesCount: c.traineesCount.toString(),
        activePrograms: c.activePrograms.toString()
      }))
    };

    switch (format) {
      case 'pdf':
        await this.exportService.exportToPDF(exportConfig);
        break;
      case 'word':
        await this.exportService.exportToWord(exportConfig);
        break;
      case 'text':
        this.exportService.exportToText(exportConfig);
        break;
      case 'csv':
        this.exportService.exportToCSV(exportConfig);
        break;
      case 'preview':
        this.exportService.printPreview(exportConfig);
        break;
      case 'print':
        this.exportService.print(exportConfig);
        break;
    }
  }
}
