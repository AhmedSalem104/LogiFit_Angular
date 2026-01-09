import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ReportsService } from '../services/reports.service';
import {
  DashboardReport,
  FinancialReport,
  ClientsReport,
  SubscriptionsReport
} from '../../../shared/models/api.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxChartsModule,
    PageHeaderComponent,
    StatCardComponent,
    ChartCardComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <app-page-header
        title="لوحة التحكم"
        subtitle="نظرة شاملة على أداء الصالة"
      ></app-page-header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <app-stat-card
          title="إجمالي العملاء"
          [value]="dashboard()?.totalClients ?? 0"
          icon="pi-users"
          color="primary"
          [loading]="loadingDashboard()"
        ></app-stat-card>

        <app-stat-card
          title="العملاء النشطين"
          [value]="dashboard()?.activeClients ?? 0"
          icon="pi-user-plus"
          color="success"
          [loading]="loadingDashboard()"
        ></app-stat-card>

        <app-stat-card
          title="الاشتراكات النشطة"
          [value]="dashboard()?.activeSubscriptions ?? 0"
          icon="pi-credit-card"
          color="info"
          [loading]="loadingDashboard()"
        ></app-stat-card>

        <app-stat-card
          title="إيرادات هذا الشهر"
          [value]="dashboard()?.revenueThisMonth ?? 0"
          icon="pi-wallet"
          color="warning"
          [isCurrency]="true"
          [trend]="revenueGrowth()"
          trendLabel="عن الشهر الماضي"
          [loading]="loadingDashboard()"
        ></app-stat-card>
      </div>

      <!-- Charts Row 1 -->
      <div class="charts-grid">
        <!-- Revenue Chart -->
        <app-chart-card
          title="الإيرادات الشهرية"
          [height]="300"
          [loading]="loadingFinancial()"
          [error]="financialError()"
          [isEmpty]="!revenueChartData().length"
          (refresh)="loadFinancialReport()"
        >
          <ngx-charts-line-chart
            [results]="revenueChartData()"
            [scheme]="revenueColorScheme"
            [xAxis]="true"
            [yAxis]="true"
            [showXAxisLabel]="false"
            [showYAxisLabel]="false"
            [autoScale]="true"
            [timeline]="false"
            [gradient]="true"
            [animations]="true"
          ></ngx-charts-line-chart>
        </app-chart-card>

        <!-- Client Growth Chart -->
        <app-chart-card
          title="نمو العملاء"
          [height]="300"
          [loading]="loadingClients()"
          [error]="clientsError()"
          [isEmpty]="!clientGrowthData().length"
          (refresh)="loadClientsReport()"
        >
          <ngx-charts-bar-vertical-2d
            [results]="clientGrowthData()"
            [scheme]="clientColorScheme"
            [xAxis]="true"
            [yAxis]="true"
            [showXAxisLabel]="false"
            [showYAxisLabel]="false"
            [groupPadding]="16"
            [barPadding]="4"
            [animations]="true"
          ></ngx-charts-bar-vertical-2d>
        </app-chart-card>
      </div>

      <!-- Charts Row 2 -->
      <div class="charts-grid">
        <!-- Subscription Plans Pie -->
        <app-chart-card
          title="توزيع خطط الاشتراك"
          [height]="300"
          [loading]="loadingSubscriptions()"
          [error]="subscriptionsError()"
          [isEmpty]="!subscriptionPieData().length"
          (refresh)="loadSubscriptionsReport()"
        >
          <ngx-charts-pie-chart
            [results]="subscriptionPieData()"
            [scheme]="pieColorScheme"
            [legend]="true"
            [legendPosition]="legendPosition"
            [legendTitle]="''"
            [labels]="false"
            [doughnut]="true"
            [arcWidth]="0.4"
            [animations]="true"
          ></ngx-charts-pie-chart>
        </app-chart-card>

        <!-- Quick Stats -->
        <div class="quick-stats-card card">
          <h3 class="card-title">إحصائيات سريعة</h3>

          <div class="quick-stat">
            <div class="quick-stat__icon warning">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="quick-stat__content">
              <span class="quick-stat__value">{{ dashboard()?.expiringSubscriptions ?? 0 }}</span>
              <span class="quick-stat__label">اشتراكات تنتهي قريباً</span>
            </div>
            <a routerLink="/owner/subscriptions" class="quick-stat__link">
              <i class="pi pi-arrow-left"></i>
            </a>
          </div>

          <div class="quick-stat">
            <div class="quick-stat__icon success">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="quick-stat__content">
              <span class="quick-stat__value">{{ dashboard()?.workoutsThisMonth ?? 0 }}</span>
              <span class="quick-stat__label">جلسات تمرين هذا الشهر</span>
            </div>
          </div>

          <div class="quick-stat">
            <div class="quick-stat__icon info">
              <i class="pi pi-apple"></i>
            </div>
            <div class="quick-stat__content">
              <span class="quick-stat__value">{{ dashboard()?.activeDietPlans ?? 0 }}</span>
              <span class="quick-stat__label">خطط غذائية نشطة</span>
            </div>
          </div>

          <div class="quick-stat">
            <div class="quick-stat__icon primary">
              <i class="pi pi-user"></i>
            </div>
            <div class="quick-stat__content">
              <span class="quick-stat__value">{{ dashboard()?.totalCoaches ?? 0 }}</span>
              <span class="quick-stat__label">مدربين</span>
            </div>
            <a routerLink="/owner/coaches" class="quick-stat__link">
              <i class="pi pi-arrow-left"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Payment Methods Chart -->
      <div class="full-width-chart">
        <app-chart-card
          title="طرق الدفع"
          [height]="250"
          [loading]="loadingFinancial()"
          [isEmpty]="!paymentMethodsData().length"
          (refresh)="loadFinancialReport()"
        >
          <ngx-charts-bar-horizontal
            [results]="paymentMethodsData()"
            [scheme]="paymentColorScheme"
            [xAxis]="true"
            [yAxis]="true"
            [showXAxisLabel]="false"
            [showYAxisLabel]="false"
            [animations]="true"
          ></ngx-charts-bar-horizontal>
        </app-chart-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .full-width-chart {
      margin-bottom: 1.5rem;
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1.25rem;
    }

    .quick-stats-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quick-stat {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-tertiary);
      }
    }

    .quick-stat__icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.1rem;
        color: white;
      }

      &.primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
      &.success { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      &.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      &.info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
    }

    .quick-stat__content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .quick-stat__value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .quick-stat__label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .quick-stat__link {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        background: #3b82f6;
        color: white;
      }
    }

    :host-context([dir="ltr"]) .quick-stat__link i {
      transform: rotate(180deg);
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid,
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OwnerDashboardComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // Data signals
  dashboard = signal<DashboardReport | null>(null);
  financial = signal<FinancialReport | null>(null);
  clients = signal<ClientsReport | null>(null);
  subscriptions = signal<SubscriptionsReport | null>(null);

  // Loading signals
  loadingDashboard = signal(true);
  loadingFinancial = signal(true);
  loadingClients = signal(true);
  loadingSubscriptions = signal(true);

  // Error signals
  financialError = signal<string | undefined>(undefined);
  clientsError = signal<string | undefined>(undefined);
  subscriptionsError = signal<string | undefined>(undefined);

  // Chart color schemes
  revenueColorScheme: Color = {
    name: 'revenue',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6']
  };

  clientColorScheme: Color = {
    name: 'clients',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#22c55e', '#ef4444']
  };

  pieColorScheme: Color = {
    name: 'pie',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6']
  };

  paymentColorScheme: Color = {
    name: 'payment',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#22c55e', '#f59e0b']
  };

  legendPosition: LegendPosition = LegendPosition.Below;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadDashboardReport();
    this.loadFinancialReport();
    this.loadClientsReport();
    this.loadSubscriptionsReport();
  }

  loadDashboardReport(): void {
    this.loadingDashboard.set(true);
    this.reportsService.getDashboardReport().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loadingDashboard.set(false);
      },
      error: () => {
        this.loadingDashboard.set(false);
      }
    });
  }

  loadFinancialReport(): void {
    this.loadingFinancial.set(true);
    this.financialError.set(undefined);
    this.reportsService.getFinancialReport().subscribe({
      next: (data) => {
        this.financial.set(data);
        this.loadingFinancial.set(false);
      },
      error: (err) => {
        this.loadingFinancial.set(false);
        this.financialError.set(err.translatedMessage || 'خطأ في تحميل البيانات');
      }
    });
  }

  loadClientsReport(): void {
    this.loadingClients.set(true);
    this.clientsError.set(undefined);
    this.reportsService.getClientsReport().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loadingClients.set(false);
      },
      error: (err) => {
        this.loadingClients.set(false);
        this.clientsError.set(err.translatedMessage || 'خطأ في تحميل البيانات');
      }
    });
  }

  loadSubscriptionsReport(): void {
    this.loadingSubscriptions.set(true);
    this.subscriptionsError.set(undefined);
    this.reportsService.getSubscriptionsReport().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loadingSubscriptions.set(false);
      },
      error: (err) => {
        this.loadingSubscriptions.set(false);
        this.subscriptionsError.set(err.translatedMessage || 'خطأ في تحميل البيانات');
      }
    });
  }

  // Computed chart data
  revenueGrowth(): number | undefined {
    const data = this.dashboard();
    if (!data || data.revenueLastMonth === 0) return undefined;
    return ((data.revenueThisMonth - data.revenueLastMonth) / data.revenueLastMonth) * 100;
  }

  revenueChartData() {
    const data = this.financial();
    if (!data?.monthlyBreakdown?.length) return [];

    return [{
      name: 'الإيرادات',
      series: data.monthlyBreakdown.map(item => ({
        name: this.formatMonth(item.month),
        value: item.revenue
      }))
    }];
  }

  clientGrowthData() {
    const data = this.clients();
    if (!data?.monthlyTrend?.length) return [];

    return data.monthlyTrend.map(item => ({
      name: this.formatMonth(item.month),
      series: [
        { name: 'عملاء جدد', value: item.newClients || 0 },
        { name: 'مغادرين', value: item.churnedClients || 0 }
      ]
    }));
  }

  subscriptionPieData() {
    const data = this.subscriptions();
    if (!data?.planStatistics?.length) return [];

    return data.planStatistics.map(plan => ({
      name: plan.planName,
      value: plan.activeCount
    }));
  }

  paymentMethodsData() {
    const data = this.financial();
    if (!data?.paymentMethodStats?.length) return [];

    return data.paymentMethodStats.map(method => ({
      name: method.method,
      value: method.total
    }));
  }

  private formatMonth(month: string): string {
    try {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('ar-EG', { month: 'short' });
    } catch {
      return month;
    }
  }
}
