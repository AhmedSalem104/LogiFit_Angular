import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ReportsService } from '../services/reports.service';
import {
  DashboardReport,
  FinancialReport,
  ClientsReport,
  SubscriptionsReport
} from '../../../shared/models/api.models';

type TabKey = 'overview' | 'clients' | 'subscriptions' | 'financial';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatCardComponent],
  template: `
    <div class="reports-page">
      <app-page-header
        title="التقارير"
        subtitle="تقارير وتحليلات الصالة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'التقارير'}]"
      ></app-page-header>

      <!-- Tab Buttons -->
      <div class="tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'overview'"
          (click)="switchTab('overview')">
          <i class="pi pi-th-large"></i>
          <span>نظرة عامة</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'clients'"
          (click)="switchTab('clients')">
          <i class="pi pi-users"></i>
          <span>العملاء</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'subscriptions'"
          (click)="switchTab('subscriptions')">
          <i class="pi pi-credit-card"></i>
          <span>الاشتراكات</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'financial'"
          (click)="switchTab('financial')">
          <i class="pi pi-wallet"></i>
          <span>المالية</span>
        </button>
      </div>

      <!-- ==================== Overview Tab ==================== -->
      <div class="tab-content" *ngIf="activeTab() === 'overview'">
        <div class="loading-state" *ngIf="loadingOverview()">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>

        <ng-container *ngIf="!loadingOverview() && dashboardData()">
          <div class="stats-grid">
            <app-stat-card
              title="إجمالي العملاء"
              [value]="dashboardData()!.totalClients"
              icon="pi-users"
              color="primary"
            ></app-stat-card>
            <app-stat-card
              title="العملاء النشطين"
              [value]="dashboardData()!.activeClients"
              icon="pi-user-plus"
              color="success"
            ></app-stat-card>
            <app-stat-card
              title="عملاء جدد هذا الشهر"
              [value]="dashboardData()!.newClientsThisMonth"
              icon="pi-star"
              color="info"
            ></app-stat-card>
            <app-stat-card
              title="إجمالي المدربين"
              [value]="dashboardData()!.totalCoaches"
              icon="pi-id-card"
              color="warning"
            ></app-stat-card>
            <app-stat-card
              title="الاشتراكات النشطة"
              [value]="dashboardData()!.activeSubscriptions"
              icon="pi-credit-card"
              color="success"
            ></app-stat-card>
            <app-stat-card
              title="اشتراكات تنتهي قريباً"
              [value]="dashboardData()!.expiringSubscriptions"
              icon="pi-exclamation-triangle"
              color="danger"
            ></app-stat-card>
            <app-stat-card
              title="إيرادات هذا الشهر"
              [value]="dashboardData()!.revenueThisMonth"
              icon="pi-wallet"
              color="primary"
              [isCurrency]="true"
            ></app-stat-card>
            <app-stat-card
              title="إيرادات الشهر الماضي"
              [value]="dashboardData()!.revenueLastMonth"
              icon="pi-history"
              color="info"
              [isCurrency]="true"
            ></app-stat-card>
          </div>
        </ng-container>

        <div class="error-state" *ngIf="!loadingOverview() && !dashboardData() && overviewError()">
          <i class="pi pi-exclamation-circle"></i>
          <p>{{ overviewError() }}</p>
          <button class="retry-btn" (click)="loadOverview()">إعادة المحاولة</button>
        </div>
      </div>

      <!-- ==================== Clients Tab ==================== -->
      <div class="tab-content" *ngIf="activeTab() === 'clients'">
        <div class="loading-state" *ngIf="loadingClients()">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>

        <ng-container *ngIf="!loadingClients() && clientsData()">
          <div class="stats-grid">
            <app-stat-card
              title="إجمالي العملاء"
              [value]="clientsData()!.totalClients"
              icon="pi-users"
              color="primary"
            ></app-stat-card>
            <app-stat-card
              title="العملاء النشطين"
              [value]="clientsData()!.activeClients"
              icon="pi-user-plus"
              color="success"
            ></app-stat-card>
            <app-stat-card
              title="العملاء غير النشطين"
              [value]="clientsData()!.inactiveClients"
              icon="pi-user-minus"
              color="danger"
            ></app-stat-card>
            <app-stat-card
              title="لديهم اشتراك"
              [value]="clientsData()!.clientsWithActiveSubscription"
              icon="pi-check-circle"
              color="success"
            ></app-stat-card>
            <app-stat-card
              title="بدون اشتراك"
              [value]="clientsData()!.clientsWithoutSubscription"
              icon="pi-times-circle"
              color="warning"
            ></app-stat-card>
          </div>

          <!-- Top Clients by Sessions -->
          <div class="report-card" *ngIf="clientsData()!.topClientsBySessionsCount?.length">
            <h3 class="card-title">
              <i class="pi pi-chart-bar"></i>
              أكثر العملاء حضوراً
            </h3>
            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العميل</th>
                    <th>عدد الجلسات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let client of clientsData()!.topClientsBySessionsCount; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ client.clientName }}</td>
                    <td><span class="badge badge--info">{{ client.sessionsCount ?? 0 }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top Clients by Revenue -->
          <div class="report-card" *ngIf="clientsData()!.topClientsByRevenue?.length">
            <h3 class="card-title">
              <i class="pi pi-dollar"></i>
              أكثر العملاء إيراداً
            </h3>
            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العميل</th>
                    <th>إجمالي الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let client of clientsData()!.topClientsByRevenue; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ client.clientName }}</td>
                    <td><span class="badge badge--success">{{ client.totalRevenue ?? 0 | number:'1.0-0' }} ج.م</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>

        <div class="error-state" *ngIf="!loadingClients() && !clientsData() && clientsError()">
          <i class="pi pi-exclamation-circle"></i>
          <p>{{ clientsError() }}</p>
          <button class="retry-btn" (click)="loadClients()">إعادة المحاولة</button>
        </div>
      </div>

      <!-- ==================== Subscriptions Tab ==================== -->
      <div class="tab-content" *ngIf="activeTab() === 'subscriptions'">
        <div class="loading-state" *ngIf="loadingSubscriptions()">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>

        <ng-container *ngIf="!loadingSubscriptions() && subscriptionsData()">
          <div class="stats-grid">
            <app-stat-card
              title="إجمالي الاشتراكات"
              [value]="subscriptionsData()!.totalSubscriptions"
              icon="pi-list"
              color="primary"
            ></app-stat-card>
            <app-stat-card
              title="الاشتراكات النشطة"
              [value]="subscriptionsData()!.activeSubscriptions"
              icon="pi-check-circle"
              color="success"
            ></app-stat-card>
            <app-stat-card
              title="الاشتراكات المنتهية"
              [value]="subscriptionsData()!.expiredSubscriptions"
              icon="pi-clock"
              color="warning"
            ></app-stat-card>
            <app-stat-card
              title="الاشتراكات الملغاة"
              [value]="subscriptionsData()!.cancelledSubscriptions"
              icon="pi-ban"
              color="danger"
            ></app-stat-card>
            <app-stat-card
              title="تنتهي خلال 7 أيام"
              [value]="subscriptionsData()!.expiringSoon7Days"
              icon="pi-exclamation-triangle"
              color="danger"
            ></app-stat-card>
            <app-stat-card
              title="تنتهي خلال 30 يوم"
              [value]="subscriptionsData()!.expiringSoon30Days"
              icon="pi-calendar"
              color="warning"
            ></app-stat-card>
            <app-stat-card
              title="إجمالي الإيرادات"
              [value]="subscriptionsData()!.totalRevenue"
              icon="pi-wallet"
              color="primary"
              [isCurrency]="true"
            ></app-stat-card>
            <app-stat-card
              title="إيرادات الشهر"
              [value]="subscriptionsData()!.monthlyRevenue"
              icon="pi-chart-line"
              color="info"
              [isCurrency]="true"
            ></app-stat-card>
          </div>

          <!-- Plan Statistics Table -->
          <div class="report-card" *ngIf="subscriptionsData()!.planStatistics?.length">
            <h3 class="card-title">
              <i class="pi pi-box"></i>
              إحصائيات الخطط
            </h3>
            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم الخطة</th>
                    <th>الاشتراكات النشطة</th>
                    <th>إجمالي الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let plan of subscriptionsData()!.planStatistics; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ plan.planName }}</td>
                    <td><span class="badge badge--info">{{ plan.activeCount }}</span></td>
                    <td><span class="badge badge--success">{{ plan.totalRevenue | number:'1.0-0' }} ج.م</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>

        <div class="error-state" *ngIf="!loadingSubscriptions() && !subscriptionsData() && subscriptionsError()">
          <i class="pi pi-exclamation-circle"></i>
          <p>{{ subscriptionsError() }}</p>
          <button class="retry-btn" (click)="loadSubscriptions()">إعادة المحاولة</button>
        </div>
      </div>

      <!-- ==================== Financial Tab ==================== -->
      <div class="tab-content" *ngIf="activeTab() === 'financial'">
        <div class="loading-state" *ngIf="loadingFinancial()">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>

        <ng-container *ngIf="!loadingFinancial() && financialData()">
          <div class="stats-grid">
            <app-stat-card
              title="إجمالي الإيرادات"
              [value]="financialData()!.totalRevenue"
              icon="pi-wallet"
              color="primary"
              [isCurrency]="true"
            ></app-stat-card>
            <app-stat-card
              title="إيرادات الشهر"
              [value]="financialData()!.monthlyRevenue"
              icon="pi-chart-line"
              color="success"
              [isCurrency]="true"
            ></app-stat-card>
            <app-stat-card
              title="نسبة النمو"
              [value]="formatGrowth(financialData()!.growthPercentage)"
              icon="pi-arrow-up-right"
              [color]="financialData()!.growthPercentage >= 0 ? 'success' : 'danger'"
            ></app-stat-card>
            <app-stat-card
              title="متوسط قيمة الاشتراك"
              [value]="financialData()!.averageSubscriptionValue"
              icon="pi-tag"
              color="info"
              [isCurrency]="true"
            ></app-stat-card>
            <app-stat-card
              title="إجمالي أرصدة المحافظ"
              [value]="financialData()!.totalWalletBalances"
              icon="pi-money-bill"
              color="warning"
              [isCurrency]="true"
            ></app-stat-card>
          </div>

          <!-- Payment Methods Table -->
          <div class="report-card" *ngIf="financialData()!.paymentMethodStats?.length">
            <h3 class="card-title">
              <i class="pi pi-credit-card"></i>
              إحصائيات طرق الدفع
            </h3>
            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>طريقة الدفع</th>
                    <th>عدد العمليات</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let method of financialData()!.paymentMethodStats; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ method.method }}</td>
                    <td><span class="badge badge--info">{{ method.count }}</span></td>
                    <td><span class="badge badge--success">{{ method.total | number:'1.0-0' }} ج.م</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Monthly Breakdown Table -->
          <div class="report-card" *ngIf="financialData()!.monthlyBreakdown?.length">
            <h3 class="card-title">
              <i class="pi pi-calendar"></i>
              التفاصيل الشهرية
            </h3>
            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>الإيرادات</th>
                    <th>عملاء جدد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let month of financialData()!.monthlyBreakdown">
                    <td>{{ formatMonth(month.month) }}</td>
                    <td><span class="badge badge--success">{{ month.revenue | number:'1.0-0' }} ج.م</span></td>
                    <td>{{ month.newClients ?? '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>

        <div class="error-state" *ngIf="!loadingFinancial() && !financialData() && financialError()">
          <i class="pi pi-exclamation-circle"></i>
          <p>{{ financialError() }}</p>
          <button class="retry-btn" (click)="loadFinancial()">إعادة المحاولة</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      max-width: 1400px;
    }

    /* ==================== Tabs ==================== */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.5rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
      font-family: inherit;

      i {
        font-size: 1rem;
      }

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      &.active {
        background: var(--gradient-primary);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
    }

    /* ==================== Stats Grid ==================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    /* ==================== Report Card ==================== */
    .report-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: #3b82f6;
        font-size: 1.1rem;
      }
    }

    /* ==================== Table ==================== */
    .table-wrapper {
      overflow-x: auto;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;

      th, td {
        padding: 0.85rem 1rem;
        text-align: right;
        font-size: 0.875rem;
      }

      th {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 600;
        white-space: nowrap;
        border-bottom: 2px solid var(--border-color);

        &:first-child {
          border-radius: 0 8px 8px 0;
        }

        &:last-child {
          border-radius: 8px 0 0 8px;
        }
      }

      td {
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }

      tbody tr {
        transition: background 0.15s;

        &:hover {
          background: var(--bg-secondary);
        }

        &:last-child td {
          border-bottom: none;
        }
      }
    }

    /* ==================== Badges ==================== */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .badge--info {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .badge--success {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }

    .badge--warning {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .badge--danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    /* ==================== Loading & Error States ==================== */
    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      i {
        font-size: 2.5rem;
        color: #3b82f6;
      }
    }

    .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      color: var(--text-secondary);

      i {
        font-size: 3rem;
        color: #ef4444;
        margin-bottom: 1rem;
      }

      p {
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }

    .retry-btn {
      padding: 0.6rem 1.5rem;
      border: none;
      border-radius: 8px;
      background: var(--gradient-primary);
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }

    /* ==================== Responsive ==================== */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .tabs {
        gap: 0.25rem;
        padding: 0.375rem;
      }

      .tab-btn {
        padding: 0.6rem 1rem;
        font-size: 0.8rem;

        span {
          display: none;
        }

        i {
          font-size: 1.2rem;
        }
      }

      .report-table {
        th, td {
          padding: 0.65rem 0.5rem;
          font-size: 0.8rem;
        }
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // Active tab
  activeTab = signal<TabKey>('overview');

  // Data signals
  dashboardData = signal<DashboardReport | null>(null);
  clientsData = signal<ClientsReport | null>(null);
  subscriptionsData = signal<SubscriptionsReport | null>(null);
  financialData = signal<FinancialReport | null>(null);

  // Loading signals
  loadingOverview = signal(false);
  loadingClients = signal(false);
  loadingSubscriptions = signal(false);
  loadingFinancial = signal(false);

  // Error signals
  overviewError = signal<string | null>(null);
  clientsError = signal<string | null>(null);
  subscriptionsError = signal<string | null>(null);
  financialError = signal<string | null>(null);

  // Track which tabs have been loaded
  private loadedTabs = new Set<TabKey>();

  ngOnInit(): void {
    this.loadOverview();
  }

  switchTab(tab: TabKey): void {
    this.activeTab.set(tab);

    if (this.loadedTabs.has(tab)) return;

    switch (tab) {
      case 'overview':
        this.loadOverview();
        break;
      case 'clients':
        this.loadClients();
        break;
      case 'subscriptions':
        this.loadSubscriptions();
        break;
      case 'financial':
        this.loadFinancial();
        break;
    }
  }

  loadOverview(): void {
    this.loadingOverview.set(true);
    this.overviewError.set(null);
    this.reportsService.getDashboardReport().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loadingOverview.set(false);
        this.loadedTabs.add('overview');
      },
      error: (err) => {
        this.loadingOverview.set(false);
        this.overviewError.set(err.translatedMessage || 'حدث خطأ في تحميل البيانات');
      }
    });
  }

  loadClients(): void {
    this.loadingClients.set(true);
    this.clientsError.set(null);
    this.reportsService.getClientsReport().subscribe({
      next: (data) => {
        this.clientsData.set(data);
        this.loadingClients.set(false);
        this.loadedTabs.add('clients');
      },
      error: (err) => {
        this.loadingClients.set(false);
        this.clientsError.set(err.translatedMessage || 'حدث خطأ في تحميل البيانات');
      }
    });
  }

  loadSubscriptions(): void {
    this.loadingSubscriptions.set(true);
    this.subscriptionsError.set(null);
    this.reportsService.getSubscriptionsReport().subscribe({
      next: (data) => {
        this.subscriptionsData.set(data);
        this.loadingSubscriptions.set(false);
        this.loadedTabs.add('subscriptions');
      },
      error: (err) => {
        this.loadingSubscriptions.set(false);
        this.subscriptionsError.set(err.translatedMessage || 'حدث خطأ في تحميل البيانات');
      }
    });
  }

  loadFinancial(): void {
    this.loadingFinancial.set(true);
    this.financialError.set(null);
    this.reportsService.getFinancialReport().subscribe({
      next: (data) => {
        this.financialData.set(data);
        this.loadingFinancial.set(false);
        this.loadedTabs.add('financial');
      },
      error: (err) => {
        this.loadingFinancial.set(false);
        this.financialError.set(err.translatedMessage || 'حدث خطأ في تحميل البيانات');
      }
    });
  }

  formatGrowth(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  formatMonth(month: string): string {
    try {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    } catch {
      return month;
    }
  }
}
