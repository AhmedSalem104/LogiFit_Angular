import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { OperationsReportsService } from '../services/operations-reports.service';
import { OperationsDashboard } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-operations-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressBarModule, PageHeaderComponent, LoadingSkeletonComponent],
  template: `
    <div class="gym-page">
      <app-page-header title="لوحة تحكم التشغيل" subtitle="نظرة شاملة على أداء الجيم في الوقت الفعلي"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'تشغيل'}]">
        <div class="header-actions">
          <span class="live-indicator"><span class="dot"></span> تحديث كل 60 ثانية</span>
          <button class="btn btn-secondary" (click)="load()"><i class="pi pi-refresh"></i><span>تحديث</span></button>
        </div>
      </app-page-header>

      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div *ngIf="!loading() && data()" class="ops-grid">
        <!-- Main KPI Row -->
        <div class="kpi-card kpi--primary">
          <div class="kpi-icon"><i class="pi pi-users"></i></div>
          <span class="kpi-label">أعضاء نشطون</span>
          <span class="kpi-value">{{ data()!.activeMembers | number }}</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="pi pi-sign-in"></i></div>
          <span class="kpi-label">حضور اليوم</span>
          <span class="kpi-value">{{ data()!.todayCheckIns | number }}</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><i class="pi pi-user-plus"></i></div>
          <span class="kpi-label">متواجدون حالياً</span>
          <span class="kpi-value">{{ data()!.currentlyInsideCount | number }}</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
          <span class="kpi-label">منتهية خلال 7 أيام</span>
          <span class="kpi-value">{{ data()!.expiringSubscriptionsIn7Days | number }}</span>
        </div>

        <!-- Financial Row -->
        <div class="kpi-card kpi-wide">
          <h3 class="kpi-section-title"><i class="pi pi-dollar"></i> المالية — هذا الشهر</h3>
          <div class="kpi-tri">
            <div><span>الإيرادات</span><strong class="text-green">{{ data()!.monthRevenue | number:'1.0-0' }}</strong></div>
            <div><span>المصروفات</span><strong class="text-red">{{ data()!.monthExpenses | number:'1.0-0' }}</strong></div>
            <div class="grand"><span>صافي الربح</span>
              <strong [class.text-green]="data()!.monthNetProfit > 0" [class.text-red]="data()!.monthNetProfit < 0">
                {{ data()!.monthNetProfit | number:'1.0-0' }}
              </strong></div>
          </div>
          <div class="kpi-today">
            <span>اليوم: <strong class="text-green">+{{ data()!.todayRevenue | number:'1.0-0' }}</strong></span>
            <span><strong class="text-red">-{{ data()!.todayExpenses | number:'1.0-0' }}</strong></span>
          </div>
        </div>

        <!-- Alerts -->
        <a routerLink="/owner/invoices" class="alert-card">
          <div class="alert-icon orange"><i class="pi pi-file"></i></div>
          <div>
            <span class="alert-label">فواتير غير مدفوعة</span>
            <span class="alert-count">{{ data()!.unpaidInvoicesCount }}</span>
            <span class="alert-sub">{{ data()!.unpaidInvoicesTotal | number }} ج.م</span>
          </div>
        </a>
        <a routerLink="/owner/products" class="alert-card">
          <div class="alert-icon red"><i class="pi pi-box"></i></div>
          <div>
            <span class="alert-label">منتجات منخفضة المخزون</span>
            <span class="alert-count">{{ data()!.lowStockProductsCount }}</span>
          </div>
        </a>
        <a routerLink="/owner/equipment" class="alert-card">
          <div class="alert-icon orange"><i class="pi pi-wrench"></i></div>
          <div>
            <span class="alert-label">أجهزة تحت الصيانة</span>
            <span class="alert-count">{{ data()!.equipmentUnderMaintenanceCount }}</span>
          </div>
        </a>
        <a routerLink="/owner/leaves" class="alert-card">
          <div class="alert-icon blue"><i class="pi pi-calendar-minus"></i></div>
          <div>
            <span class="alert-label">طلبات إجازة معلقة</span>
            <span class="alert-count">{{ data()!.pendingLeaveRequestsCount }}</span>
          </div>
        </a>

        <!-- Branch KPIs -->
        <div class="kpi-card kpi-full" *ngIf="data()!.branchKpis?.length">
          <h3 class="kpi-section-title"><i class="pi pi-building"></i> أداء الفروع</h3>
          <div class="branch-grid">
            <div class="branch-item" *ngFor="let b of data()!.branchKpis">
              <div class="branch-head">
                <strong>{{ b.branchName }}</strong>
                <span class="badge" [class.green]="b.capacityUsagePercent < 60"
                  [class.orange]="b.capacityUsagePercent >= 60 && b.capacityUsagePercent < 85"
                  [class.red]="b.capacityUsagePercent >= 85">{{ b.capacityUsagePercent | number:'1.0-1' }}%</span>
              </div>
              <p-progressBar [value]="b.capacityUsagePercent" [showValue]="false" styleClass="branch-bar"></p-progressBar>
              <div class="branch-stats">
                <div><i class="pi pi-users"></i> {{ b.currentlyInside }} / {{ b.capacity }}</div>
                <div><i class="pi pi-sign-in"></i> {{ b.todayCheckIns }}</div>
                <div><i class="pi pi-id-card"></i> {{ b.activeMembers }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [GYM_PAGE_STYLES + `
    .live-indicator {
      display: flex; align-items: center; gap:.4rem;
      font-size:.75rem; color: var(--text-secondary);
    }
    .live-indicator .dot {
      width:8px; height:8px; background: #10b981; border-radius:50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }

    .ops-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .kpi-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 14px; padding: 1.25rem; display:flex; flex-direction: column; gap:.35rem;
      position: relative; overflow: hidden;
    }
    .kpi-card.kpi--primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white; border: none;
    }
    .kpi-card.kpi--primary .kpi-label, .kpi-card.kpi--primary .kpi-icon { color: rgba(255,255,255,.95); }
    .kpi-card.kpi-wide { grid-column: span 2; }
    .kpi-card.kpi-full  { grid-column: 1 / -1; }
    .kpi-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; background: rgba(59,130,246,.12); color:#3b82f6; }
    .kpi-icon.blue   { background: rgba(59,130,246,.12); color:#3b82f6; }
    .kpi-icon.green  { background: rgba(16,185,129,.12); color:#10b981; }
    .kpi-icon.orange { background: rgba(245,158,11,.12); color:#f59e0b; }
    .kpi-icon.red    { background: rgba(239,68,68,.12); color:#ef4444; }
    .kpi-label { font-size:.8rem; color: var(--text-secondary); }
    .kpi-value { font-size: 1.75rem; font-weight: 700; }

    .kpi-section-title { margin:0 0 .75rem; font-size:1rem; display:flex; gap:.5rem; align-items:center; color: var(--primary-500); }
    .kpi-tri { display:grid; grid-template-columns: repeat(3,1fr); gap:.75rem; }
    .kpi-tri > div { display:flex; flex-direction:column; padding: .5rem; background: var(--bg-secondary); border-radius: 10px; }
    .kpi-tri > div span { font-size:.75rem; color: var(--text-secondary); }
    .kpi-tri > div strong { font-size:1.15rem; }
    .kpi-tri > div.grand { background: linear-gradient(135deg, rgba(59,130,246,.1), rgba(139,92,246,.1)); }
    .text-green { color: #10b981; }
    .text-red { color: #ef4444; }
    .kpi-today { display:flex; gap:1.25rem; padding-top:.5rem; border-top:1px dashed var(--border-color); margin-top:.5rem; font-size:.85rem; color: var(--text-secondary); }

    .alert-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 14px; padding: 1rem; display:flex; align-items: center; gap: .875rem;
      text-decoration:none; color: inherit; transition: all .2s ease;
    }
    .alert-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .alert-icon { width: 44px; height: 44px; border-radius: 12px; display:flex; align-items:center; justify-content: center; flex-shrink: 0; color: white; }
    .alert-icon.orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
    .alert-icon.red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
    .alert-icon.blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
    .alert-icon.green  { background: linear-gradient(135deg,#10b981,#059669); }
    .alert-card > div:last-child { display:flex; flex-direction:column; }
    .alert-label { font-size:.8rem; color: var(--text-secondary); }
    .alert-count { font-size: 1.5rem; font-weight: 700; }
    .alert-sub { font-size:.75rem; color: var(--text-muted); }

    .branch-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: .75rem; }
    .branch-item { padding: .75rem; background: var(--bg-secondary); border-radius: 10px; display:flex; flex-direction:column; gap:.5rem; }
    .branch-head { display:flex; justify-content:space-between; align-items:center; }
    .branch-stats { display:flex; gap:1rem; font-size:.8rem; color: var(--text-secondary); }
    .branch-stats i { margin-left: .25rem; }
  `]
})
export class OperationsDashboardComponent implements OnInit, OnDestroy {
  private svc = inject(OperationsReportsService);
  private toast = inject(NotificationService);
  data = signal<OperationsDashboard | null>(null);
  loading = signal(false);
  private pollSub?: Subscription;

  ngOnInit() {
    this.load();
    this.pollSub = interval(60000).subscribe(() => this.load(true));
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }

  load(silent = false) {
    if (!silent) this.loading.set(true);
    this.svc.operationsDashboard().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); if(!silent) this.toast.error('فشل تحميل لوحة التشغيل'); }
    });
  }
}
