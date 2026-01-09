import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import { OwnerService, Client } from '../services/owner.service';
import Swal from 'sweetalert2';

// Display interface for table
interface ClientDisplay {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  assignedCoachName?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-clients-list',
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
    <div class="clients-page">
      <app-page-header
        title="العملاء"
        subtitle="إدارة عملاء الصالة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'العملاء'}]"
      >
        <div class="header-actions">
          <app-export-menu
            buttonLabel="تصدير"
            (export)="onExport($event)"
          ></app-export-menu>
          <button class="btn btn-primary" (click)="openAddDialog()">
            <i class="pi pi-plus"></i>
            <span>إضافة عميل</span>
          </button>
        </div>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <span class="mini-stat__value">{{ clients().length }}</span>
          <span class="mini-stat__label">إجمالي العملاء</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat__value">{{ activeClientsCount() }}</span>
          <span class="mini-stat__label">عملاء نشطين</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat__value">{{ subscribedClientsCount() }}</span>
          <span class="mini-stat__label">مشتركين</span>
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
              (input)="onSearch()"
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
          [value]="filteredClients()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} عميل"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>العميل</th>
              <th>رقم الهاتف</th>
              <th>الحالة</th>
              <th>الاشتراك</th>
              <th>المدرب</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-client>
            <tr>
              <td>
                <div class="client-info">
                  <div class="client-avatar">
                    {{ getInitials(client.fullName) }}
                  </div>
                  <div class="client-details">
                    <span class="client-name">{{ client.fullName }}</span>
                    <span class="client-email">{{ client.email || '-' }}</span>
                  </div>
                </div>
              </td>
              <td>{{ client.phoneNumber }}</td>
              <td>
                <p-tag
                  [value]="client.isActive ? 'نشط' : 'غير نشط'"
                  [severity]="client.isActive ? 'success' : 'danger'"
                ></p-tag>
              </td>
              <td>
                <p-tag
                  *ngIf="client.hasActiveSubscription"
                  value="مشترك"
                  severity="info"
                ></p-tag>
                <span *ngIf="!client.hasActiveSubscription" class="no-subscription">
                  لا يوجد اشتراك
                </span>
              </td>
              <td>{{ client.assignedCoachName || '-' }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    pButton
                    icon="pi pi-eye"
                    class="p-button-text p-button-sm"
                    (click)="viewClient(client)"
                    pTooltip="عرض"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    (click)="editClient(client)"
                    pTooltip="تعديل"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    (click)="deleteClient(client)"
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
                  <i class="pi pi-users"></i>
                  <p>لا يوجد عملاء</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .clients-page {
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
      color: #3b82f6;
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
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .client-details {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .client-email {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .no-subscription {
      color: var(--text-muted);
      font-size: 0.85rem;
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
export class ClientsListComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private exportService = inject(ExportService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = signal(true);
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  clients = signal<ClientDisplay[]>([]);

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);

    this.ownerService.getClients().subscribe({
      next: (data) => {
        const mappedClients = this.mapClientsForDisplay(data);
        this.clients.set(mappedClients);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        // Fallback to mock data for development
        this.clients.set([
          { id: '1', fullName: 'محمد أحمد علي', phoneNumber: '01012345678', email: 'mohamed@email.com', isActive: true, hasActiveSubscription: true, assignedCoachName: 'أحمد المدرب' },
          { id: '2', fullName: 'خالد محمود', phoneNumber: '01098765432', email: 'khaled@email.com', isActive: true, hasActiveSubscription: true, assignedCoachName: 'أحمد المدرب' },
          { id: '3', fullName: 'عمر حسن', phoneNumber: '01155566677', email: 'omar@email.com', isActive: true, hasActiveSubscription: false },
          { id: '4', fullName: 'أحمد سمير', phoneNumber: '01288899900', email: 'ahmed@email.com', isActive: false, hasActiveSubscription: false },
          { id: '5', fullName: 'يوسف كريم', phoneNumber: '01011122233', email: 'youssef@email.com', isActive: true, hasActiveSubscription: true, assignedCoachName: 'محمد المدرب' },
        ]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Map API response to display format
   */
  private mapClientsForDisplay(clients: Client[]): ClientDisplay[] {
    return clients.map(client => ({
      id: client.id,
      fullName: client.profile?.fullName || client.fullName || 'غير محدد',
      phoneNumber: client.phoneNumber || '',
      email: client.email || '',
      isActive: client.isActive ?? true,
      hasActiveSubscription: client.hasActiveSubscription ?? false,
      subscriptionEndDate: client.subscriptionEndDate,
      assignedCoachName: client.assignedCoachName
    }));
  }

  // Computed stats
  activeClientsCount(): number {
    return this.clients().filter(c => c.isActive).length;
  }

  subscribedClientsCount(): number {
    return this.clients().filter(c => c.hasActiveSubscription).length;
  }

  filteredClients(): ClientDisplay[] {
    let filtered = this.clients();

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

  onSearch(): void {
    // Search is reactive through filteredClients()
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = filter;
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  openAddDialog(): void {
    // TODO: Implement add client dialog or navigate to add page
    this.notificationService.info('سيتم إضافة هذه الميزة قريباً');
  }

  viewClient(client: ClientDisplay): void {
    // Navigate to client details
    this.router.navigate(['/owner/clients', client.id]);
  }

  editClient(client: ClientDisplay): void {
    // TODO: Implement edit client dialog
    this.notificationService.info('سيتم إضافة هذه الميزة قريباً');
  }

  deleteClient(client: ClientDisplay): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف العميل "${client.fullName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownerService.deleteClient(client.id).subscribe({
          next: () => {
            this.clients.update(clients => clients.filter(c => c.id !== client.id));
            this.notificationService.success('تم حذف العميل بنجاح');
          },
          error: (err) => {
            console.error('Error deleting client:', err);
            this.notificationService.error('حدث خطأ أثناء حذف العميل');
          }
        });
      }
    });
  }

  async onExport(format: ExportFormat): Promise<void> {
    const clients = this.filteredClients();
    const exportConfig = {
      title: 'قائمة العملاء',
      fileName: 'clients-list',
      columns: [
        { header: 'الاسم', field: 'fullName' },
        { header: 'رقم الهاتف', field: 'phoneNumber' },
        { header: 'البريد الإلكتروني', field: 'email' },
        { header: 'الحالة', field: 'status' },
        { header: 'الاشتراك', field: 'subscription' },
        { header: 'المدرب', field: 'assignedCoachName' }
      ],
      data: clients.map(c => ({
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email || '-',
        status: c.isActive ? 'نشط' : 'غير نشط',
        subscription: c.hasActiveSubscription ? 'مشترك' : 'لا يوجد اشتراك',
        assignedCoachName: c.assignedCoachName || '-'
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
