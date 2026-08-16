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
import { ClientSubscription, StatusLabels, SubscriptionStatus } from '../services/owner.service';
import { PersonFormDialogComponent, PersonFormValue, PersonFormInitial } from '../../../shared/components/person-form-dialog/person-form-dialog.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Display interface for table
interface ClientDisplay {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  hasActiveSubscription: boolean;
  subscriptionPlanName?: string;
  subscriptionStatus?: number;
  subscriptionEndDate?: string;
  remainingDays?: number;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
  freezeCount?: number;
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
    ExportMenuComponent,
    PersonFormDialogComponent
  ],
  template: `
    <div class="clients-page">
      <app-page-header
        title="المشتركون"
        subtitle="إدارة الأعضاء والعضويات والمدفوعات والمتابعة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'المشتركون'}]"
      >
        <div class="header-actions">
          <app-export-menu
            buttonLabel="تصدير"
            (export)="onExport($event)"
          ></app-export-menu>
          <button class="btn btn-primary" data-tour="add-client" (click)="openAddDialog()">
            <i class="pi pi-plus"></i>
            <span>إضافة مشترك</span>
          </button>
        </div>
      </app-page-header>

      <section class="member-flow card" aria-label="رحلة المشترك">
        <div class="member-flow__heading">
          <div>
            <span class="eyebrow">رحلة المشترك</span>
            <h2>من التسجيل إلى المتابعة</h2>
            <p>نفّذ الرحلة بالترتيب الموثق؛ كل مرحلة تفتح الشاشة المناسبة وتحافظ على بيانات المرحلة السابقة.</p>
          </div>
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
        </div>
        <ol class="member-flow__steps">
          <li class="active"><span>1</span><strong>إنشاء المشترك والقائمة</strong></li>
          <li><span>2</span><strong>العضوية والاشتراك والدفع</strong></li>
          <li><span>3</span><strong>الملف والنظرة العامة</strong></li>
          <li><span>4</span><strong>التدريب والتنفيذ</strong></li>
          <li><span>5</span><strong>التغذية وتسجيل الوجبات</strong></li>
          <li><span>6</span><strong>القياسات والتقدم</strong></li>
          <li><span>7</span><strong>الجاهزية اليومية والجلسات</strong></li>
          <li><span>8</span><strong>التقارير</strong></li>
        </ol>
      </section>

      <div class="state-card warning-state" *ngIf="!loading() && membershipError()" role="status">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>تفاصيل العضوية غير مكتملة</strong>
          <p>{{ membershipError() }}</p>
          <button type="button" class="btn btn-primary" (click)="loadClients()">إعادة تحميل العضويات</button>
        </div>
      </div>

      <div class="state-card error-state" *ngIf="!loading() && errorMessage()" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <strong>تعذر تحميل العملاء</strong>
          <p>{{ errorMessage() }}</p>
          <button type="button" class="btn btn-primary" (click)="loadClients()">إعادة المحاولة</button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" *ngIf="!errorMessage()">
        <div class="mini-stat">
          <span class="mini-stat__value">{{ clients().length }}</span>
          <span class="mini-stat__label">إجمالي المشتركين</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat__value">{{ activeClientsCount() }}</span>
          <span class="mini-stat__label">مشتركون نشطون</span>
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
      <div class="table-card card" *ngIf="!loading() && !errorMessage()">
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
              <th>العضوية</th>
              <th>الانتهاء</th>
              <th>الحساب</th>
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
                <div class="membership-cell">
                  <strong>{{ client.subscriptionPlanName || 'بدون عضوية' }}</strong>
                  <p-tag
                    [value]="membershipStatusLabel(client)"
                    [severity]="membershipStatusSeverity(client)"
                  ></p-tag>
                  <small *ngIf="client.freezeCount">تجميد: {{ client.freezeCount }}</small>
                </div>
              </td>
              <td>
                <div class="expiry-cell" *ngIf="client.subscriptionEndDate; else noExpiry">
                  <strong>{{ client.subscriptionEndDate | date:'dd/MM/yyyy' }}</strong>
                  <small [class.warning-text]="(client.remainingDays ?? 0) <= 7 && (client.remainingDays ?? 0) >= 0">
                    {{ client.remainingDays !== undefined ? (client.remainingDays + ' يوم') : '—' }}
                  </small>
                </div>
                <ng-template #noExpiry><span class="no-subscription">—</span></ng-template>
              </td>
              <td>
                <div class="account-cell" *ngIf="client.totalAmount !== undefined; else noAccount">
                  <strong>{{ client.amountPaid || 0 | number:'1.0-0' }} / {{ client.totalAmount || 0 | number:'1.0-0' }}</strong>
                  <small *ngIf="(client.remainingAmount || 0) > 0" class="warning-text">متبقي {{ client.remainingAmount | number:'1.0-0' }}</small>
                  <small *ngIf="!(client.remainingAmount || 0)" class="paid-text">مدفوع بالكامل</small>
                </div>
                <ng-template #noAccount><span class="no-subscription">—</span></ng-template>
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
                    icon="pi pi-credit-card"
                    class="p-button-text p-button-sm"
                    (click)="openSubscription(client)"
                    pTooltip="العضوية والدفع"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-bolt"
                    class="p-button-text p-button-sm"
                    (click)="openTraining(client)"
                    pTooltip="التدريب والمتابعة"
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
              <td colspan="8">
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <p>لا يوجد عملاء</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <app-person-form-dialog
        [open]="dialogOpen()"
        [mode]="dialogMode()"
        entityLabel="عميل"
        [initial]="dialogInitial()"
        [saving]="dialogSaving()"
        (save)="onDialogSave($event)"
        (cancel)="closeDialog()"
      ></app-person-form-dialog>
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

    .member-flow {
      margin-bottom: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
      border-color: #bfdbfe;
    }

    .member-flow__heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .member-flow__heading h2 { margin: .3rem 0; font-size: 1.15rem; color: #0f172a; }
    .member-flow__heading p { margin: 0; color: #475569; font-size: .88rem; }
    .member-flow__heading > i { color: #2563eb; font-size: 1.3rem; margin-top: .3rem; }
    .eyebrow { color: #2563eb; font-size: .78rem; font-weight: 700; }

    .member-flow__steps {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: .5rem;
      list-style: none;
      padding: 0;
      margin: 1.25rem 0 0;
    }

    .member-flow__steps li {
      display: grid;
      justify-items: center;
      gap: .35rem;
      text-align: center;
      color: #64748b;
      font-size: .78rem;
    }

    .member-flow__steps li span {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-weight: 700;
    }

    .member-flow__steps li.active { color: #1d4ed8; }
    .member-flow__steps li.active span { background: #2563eb; color: #fff; }

    .membership-cell, .expiry-cell, .account-cell { display: grid; gap: .25rem; }
    .membership-cell strong, .expiry-cell strong, .account-cell strong { color: var(--text-primary); }
    .membership-cell small, .expiry-cell small, .account-cell small { color: var(--text-muted); font-size: .75rem; }
    .warning-text { color: #b45309 !important; font-weight: 600; }
    .paid-text { color: #15803d !important; }

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

    .state-card { display:flex; align-items:center; gap:.75rem; min-height:150px; padding:1.25rem; margin-bottom:1.5rem; border:1px dashed #fecaca; border-radius:16px; color:#991b1b; background:#fff7f7; }
    .state-card i { font-size:1.5rem; color:#dc2626; }
    .state-card p { margin:.35rem 0 .75rem; color:#7f1d1d; }

    @media (max-width: 768px) {
      .stats-row {
        flex-direction: column;
      }

      .member-flow__steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }

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
  errorMessage = signal<string | null>(null);
  membershipError = signal<string | null>(null);
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  clients = signal<ClientDisplay[]>([]);

  // Add/Edit dialog state
  dialogOpen = signal(false);
  dialogMode = signal<'add' | 'edit'>('add');
  dialogSaving = signal(false);
  dialogInitial = signal<PersonFormInitial | null>(null);
  private editingId: string | null = null;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.membershipError.set(null);
    forkJoin({
      clients: this.ownerService.getClients(),
      subscriptions: this.ownerService.getSubscriptions().pipe(
        catchError((err) => {
          this.membershipError.set(err?.translatedMessage || 'تعذر تحميل تفاصيل العضويات والحسابات؛ يمكنك إعادة المحاولة.');
          return of([] as ClientSubscription[]);
        })
      )
    }).subscribe({
      next: ({ clients, subscriptions }) => {
        this.clients.set(this.mapClientsForDisplay(clients, subscriptions));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        const message = err?.translatedMessage || err?.error?.detail || err?.error?.message || 'حدث خطأ في تحميل بيانات العملاء';
        this.errorMessage.set(message);
        this.notificationService.error(message);
        this.clients.set([]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Map API response to display format
   */
  private mapClientsForDisplay(clients: Client[], subscriptions: ClientSubscription[] = []): ClientDisplay[] {
    const membershipByClient = new Map<string, ClientSubscription>();
    for (const subscription of subscriptions) {
      const current = membershipByClient.get(subscription.clientId);
      if (!current || this.subscriptionRank(subscription) > this.subscriptionRank(current)) {
        membershipByClient.set(subscription.clientId, subscription);
      }
    }

    return clients.map(client => ({
      id: client.id,
      fullName: client.profile?.fullName || client.fullName || 'غير محدد',
      phoneNumber: client.phoneNumber || '',
      email: client.email || '',
      isActive: client.isActive ?? true,
      hasActiveSubscription: client.hasActiveSubscription ?? false,
      subscriptionPlanName: membershipByClient.get(client.id)?.planName,
      subscriptionStatus: membershipByClient.get(client.id)?.status,
      subscriptionEndDate: membershipByClient.get(client.id)?.endDate || client.subscriptionEndDate,
      remainingDays: membershipByClient.get(client.id)?.remainingDays,
      totalAmount: membershipByClient.get(client.id)?.totalAmount,
      amountPaid: membershipByClient.get(client.id)?.amountPaid,
      remainingAmount: membershipByClient.get(client.id)?.remainingAmount,
      freezeCount: membershipByClient.get(client.id)?.freezes?.filter(freeze => freeze.isActive !== false).length,
      assignedCoachName: client.assignedCoachName
    }));
  }

  private subscriptionRank(subscription: ClientSubscription): number {
    const statusWeight = subscription.status === SubscriptionStatus.Active ? 3 : subscription.status === SubscriptionStatus.Suspended ? 2 : 1;
    const parsedDate = subscription.endDate ? new Date(subscription.endDate).getTime() : 0;
    const dateWeight = Number.isFinite(parsedDate) ? parsedDate : 0;
    return statusWeight * 10 ** 15 + dateWeight;
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
    this.editingId = null;
    this.dialogMode.set('add');
    this.dialogInitial.set(null);
    this.dialogOpen.set(true);
  }

  viewClient(client: ClientDisplay): void {
    // Navigate to client details
    this.router.navigate(['/owner/clients', client.id]);
  }

  openSubscription(client: ClientDisplay): void {
    this.router.navigate(['/owner/subscriptions'], { queryParams: { clientId: client.id, create: 1 } });
  }

  openTraining(client: ClientDisplay): void {
    this.router.navigate(['/owner/clients', client.id]);
  }

  membershipStatusLabel(client: ClientDisplay): string {
    if (!client.subscriptionStatus) return 'بدون عضوية';
    return StatusLabels[client.subscriptionStatus] || 'غير محدد';
  }

  membershipStatusSeverity(client: ClientDisplay): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (!client.subscriptionStatus) return 'secondary';
    if (client.subscriptionStatus === SubscriptionStatus.Active) return 'success';
    if (client.subscriptionStatus === SubscriptionStatus.Suspended) return 'warning';
    if (client.subscriptionStatus === SubscriptionStatus.Cancelled) return 'danger';
    if (client.subscriptionStatus === SubscriptionStatus.Trial) return 'info';
    return 'secondary';
  }

  editClient(client: ClientDisplay): void {
    this.editingId = client.id;
    this.dialogMode.set('edit');
    // Prefill from the row immediately, then enrich with gender/birthDate.
    this.dialogInitial.set({
      fullName: client.fullName,
      phoneNumber: client.phoneNumber,
      email: client.email || undefined
    });
    this.dialogOpen.set(true);
    this.ownerService.getClientById(client.id).subscribe({
      next: (full) => this.dialogInitial.set({
        fullName: full.profile?.fullName || full.fullName || client.fullName,
        phoneNumber: full.phoneNumber || client.phoneNumber,
        email: full.email || undefined,
        gender: full.profile?.gender,
        birthDate: full.profile?.birthDate
      }),
      error: () => { /* keep the row-based prefill */ }
    });
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.dialogSaving.set(false);
  }

  onDialogSave(value: PersonFormValue): void {
    this.dialogSaving.set(true);
    const done = (msg: string, clientId?: string) => {
      this.dialogSaving.set(false);
      this.dialogOpen.set(false);
      this.notificationService.success(msg);
      this.loadClients();
      if (clientId) this.offerNextMemberStep(clientId);
    };
    const fail = (err: any) => {
      this.dialogSaving.set(false);
      this.notificationService.error(err?.translatedMessage || err?.error?.message || 'تعذّر حفظ البيانات');
    };

    if (this.dialogMode() === 'add') {
      this.onboardWithOptionalMembership(value, done, fail);
      /*
      }).subscribe({ next: () => done('تمت إضافة العميل بنجاح'), error: fail });
      */
    } else if (this.editingId) {
      this.ownerService.updateClient(this.editingId, {
        fullName: value.fullName,
        phoneNumber: value.phoneNumber,
        email: value.email,
        gender: value.gender,
        birthDate: value.birthDate
      }).subscribe({ next: () => done('تم تحديث بيانات العميل بنجاح'), error: fail });
    }
  }

  private onboardWithOptionalMembership(value: PersonFormValue, done: (msg: string, clientId?: string) => void, fail: (err: any) => void): void {
    // The documented journey keeps onboarding separate from membership/payment:
    // create the Member first, then open the membership screen as step two.
    // This also prevents a plan-catalog failure from blocking member creation.
    this.ownerService.onboardClient({ ...value, password: value.password!, membership: null }).subscribe({
      next: (response) => done('تم إنشاء المشترك. الخطوة التالية هي العضوية والدفع.', this.readClientId(response)),
      error: fail
    });
  }

  private readClientId(response: unknown): string | undefined {
    const result = response as { clientId?: string; ClientId?: string } | null;
    return result?.clientId || result?.ClientId;
  }

  private offerNextMemberStep(clientId: string): void {
    Swal.fire({
      title: 'تم إنشاء المشترك',
      text: 'الخطوة التالية في المواصفة هي إضافة العضوية والدفع، ويمكنك فتح الملف لمتابعة التدريب والتغذية.',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'إضافة العضوية والدفع',
      denyButtonText: 'فتح ملف المشترك',
      cancelButtonText: 'البقاء في القائمة',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        this.router.navigate(['/owner/subscriptions'], { queryParams: { clientId, create: 1 } });
      } else if (result.isDenied) {
        this.router.navigate(['/owner/clients', clientId]);
      }
    });
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
