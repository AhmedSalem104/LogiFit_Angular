import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ClientService,
  ClientDashboard,
  MyWorkoutProgramSummary,
  MyDietPlanSummary,
  MySubscriptionSummary,
  MyBodyMeasurementSummary,
  MyCoachInfo
} from '../services/client.service';
import { NotificationsApiService } from '../../../core/services/notifications-api.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">{{ getGreeting() }}{{ dashboard()?.clientName ? '، ' + dashboard()?.clientName : '' }}</h1>
        <p class="welcome-subtitle">ملخص حالتك التدريبية</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error() }}</span>
          <button class="retry-btn" (click)="loadDashboard()">اعادة المحاولة</button>
        </div>
      } @else {
        <!-- Quick Stats Cards -->
        <div class="stats-grid">
          <!-- Subscription Card -->
          <div class="stat-card" [class.warning]="dashboard()?.activeSubscription?.remainingDays !== undefined && dashboard()!.activeSubscription!.remainingDays! <= 7">
            <div class="stat-icon subscription-icon">
              <i class="pi pi-id-card"></i>
            </div>
            <div class="stat-info">
              @if (dashboard()?.activeSubscription) {
                <span class="stat-value">{{ dashboard()!.activeSubscription!.planName }}</span>
                <span class="stat-label">متبقي {{ dashboard()!.activeSubscription!.remainingDays }} يوم</span>
              } @else {
                <span class="stat-value">لا يوجد</span>
                <span class="stat-label">اشتراك نشط</span>
              }
            </div>
          </div>

          <!-- Programs Card -->
          <div class="stat-card">
            <div class="stat-icon program-icon">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard()?.activePrograms?.length || 0 }}</span>
              <span class="stat-label">برنامج تدريبي</span>
            </div>
          </div>

          <!-- Diet Plans Card -->
          <div class="stat-card">
            <div class="stat-icon diet-icon">
              <i class="pi pi-apple"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard()?.activeDietPlans?.length || 0 }}</span>
              <span class="stat-label">خطة غذائية</span>
            </div>
          </div>

          <!-- Notifications Card -->
          <div class="stat-card">
            <div class="stat-icon notif-icon">
              <i class="pi pi-bell"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard()?.unreadNotificationsCount || 0 }}</span>
              <span class="stat-label">اشعار غير مقروء</span>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Coach Card -->
          @if (dashboard()?.coach) {
            <div class="content-card coach-card">
              <div class="card-header">
                <h3><i class="pi pi-user"></i> المدرب</h3>
              </div>
              <div class="card-body">
                <div class="coach-info">
                  <div class="coach-avatar">
                    <span>{{ getCoachInitials() }}</span>
                  </div>
                  <div class="coach-details">
                    <span class="coach-name">{{ dashboard()!.coach!.fullName }}</span>
                    @if (dashboard()!.coach!.phoneNumber) {
                      <a class="coach-phone" [href]="'tel:' + dashboard()!.coach!.phoneNumber">
                        <i class="pi pi-phone"></i>
                        {{ dashboard()!.coach!.phoneNumber }}
                      </a>
                    }
                    @if (dashboard()!.coach!.email) {
                      <a class="coach-email" [href]="'mailto:' + dashboard()!.coach!.email">
                        <i class="pi pi-envelope"></i>
                        {{ dashboard()!.coach!.email }}
                      </a>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Active Subscription -->
          @if (dashboard()?.activeSubscription; as sub) {
            <div class="content-card subscription-card">
              <div class="card-header">
                <h3><i class="pi pi-id-card"></i> الاشتراك الحالي</h3>
                <a routerLink="/client/my-subscriptions" class="card-link">التفاصيل</a>
              </div>
              <div class="card-body">
                <div class="sub-row">
                  <span class="sub-label">الخطة</span>
                  <span class="sub-value">{{ sub.planName }}</span>
                </div>
                <div class="sub-row">
                  <span class="sub-label">تاريخ البداية</span>
                  <span class="sub-value">{{ sub.startDate | date:'yyyy/MM/dd' }}</span>
                </div>
                <div class="sub-row">
                  <span class="sub-label">تاريخ الانتهاء</span>
                  <span class="sub-value">{{ sub.endDate | date:'yyyy/MM/dd' }}</span>
                </div>
                <div class="sub-row">
                  <span class="sub-label">الحالة</span>
                  <span class="status-badge" [class]="'status-' + sub.status">{{ sub.statusName || getStatusLabel(sub.status) }}</span>
                </div>
                @if (sub.remainingDays !== undefined) {
                  <div class="remaining-bar">
                    <div class="remaining-progress" [style.width.%]="getSubscriptionProgress(sub)"></div>
                  </div>
                  <span class="remaining-text">متبقي {{ sub.remainingDays }} يوم</span>
                }
              </div>
            </div>
          }

          <!-- Active Programs -->
          @if (dashboard()?.activePrograms?.length) {
            <div class="content-card">
              <div class="card-header">
                <h3><i class="pi pi-bolt"></i> البرامج التدريبية</h3>
                <a routerLink="/client/my-program" class="card-link">عرض الكل</a>
              </div>
              <div class="card-body">
                @for (program of dashboard()!.activePrograms; track program.id) {
                  <div class="list-item" [routerLink]="['/client/my-program']">
                    <div class="list-item-icon program-bg">
                      <i class="pi pi-bolt"></i>
                    </div>
                    <div class="list-item-info">
                      <span class="list-item-name">{{ program.name }}</span>
                      <span class="list-item-meta">{{ program.coachName }} · {{ program.routinesCount }} تمرين</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Active Diet Plans -->
          @if (dashboard()?.activeDietPlans?.length) {
            <div class="content-card">
              <div class="card-header">
                <h3><i class="pi pi-apple"></i> الخطط الغذائية</h3>
                <a routerLink="/client/my-diet" class="card-link">عرض الكل</a>
              </div>
              <div class="card-body">
                @for (plan of dashboard()!.activeDietPlans; track plan.id) {
                  <div class="list-item" [routerLink]="['/client/my-diet']">
                    <div class="list-item-icon diet-bg">
                      <i class="pi pi-apple"></i>
                    </div>
                    <div class="list-item-info">
                      <span class="list-item-name">{{ plan.name }}</span>
                      <span class="list-item-meta">{{ plan.targetCalories }} سعرة · {{ plan.mealsCount }} وجبات</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Latest Measurements -->
          @if (dashboard()?.latestMeasurements; as m) {
            <div class="content-card">
              <div class="card-header">
                <h3><i class="pi pi-chart-line"></i> اخر القياسات</h3>
                <a routerLink="/client/my-measurements" class="card-link">عرض الكل</a>
              </div>
              <div class="card-body measurements-grid">
                @if (m.weightKg) {
                  <div class="measurement-item">
                    <span class="measurement-value">{{ m.weightKg }}</span>
                    <span class="measurement-label">الوزن (كجم)</span>
                  </div>
                }
                @if (m.bodyFatPercent) {
                  <div class="measurement-item">
                    <span class="measurement-value">{{ m.bodyFatPercent }}%</span>
                    <span class="measurement-label">نسبة الدهون</span>
                  </div>
                }
                @if (m.skeletalMuscleMass) {
                  <div class="measurement-item">
                    <span class="measurement-value">{{ m.skeletalMuscleMass }}</span>
                    <span class="measurement-label">الكتلة العضلية</span>
                  </div>
                }
                @if (m.bmr) {
                  <div class="measurement-item">
                    <span class="measurement-value">{{ m.bmr }}</span>
                    <span class="measurement-label">BMR</span>
                  </div>
                }
                @if (m.dateRecorded) {
                  <div class="measurement-date">اخر تحديث: {{ m.dateRecorded | date:'yyyy/MM/dd' }}</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Quick Links -->
        <div class="quick-links">
          <a routerLink="/client/my-program" class="quick-link">
            <i class="pi pi-bolt"></i>
            <span>برنامجي</span>
          </a>
          <a routerLink="/client/my-diet" class="quick-link">
            <i class="pi pi-apple"></i>
            <span>خطتي الغذائية</span>
          </a>
          <a routerLink="/client/my-measurements" class="quick-link">
            <i class="pi pi-chart-line"></i>
            <span>قياساتي</span>
          </a>
          <a routerLink="/client/my-progress" class="quick-link">
            <i class="pi pi-chart-bar"></i>
            <span>تقدمي</span>
          </a>
          <a routerLink="/client/my-subscriptions" class="quick-link">
            <i class="pi pi-id-card"></i>
            <span>اشتراكاتي</span>
          </a>
          <a routerLink="/client/chat" class="quick-link">
            <i class="pi pi-comments"></i>
            <span>المحادثات</span>
          </a>
          <a routerLink="/client/challenges" class="quick-link">
            <i class="pi pi-flag"></i>
            <span>التحديات</span>
          </a>
          <a routerLink="/client/profile" class="quick-link">
            <i class="pi pi-user"></i>
            <span>ملفي</span>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Welcome Section */
    .welcome-section {
      margin-bottom: 24px;
    }

    .welcome-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .welcome-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* Loading & Error */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: var(--text-muted);

      i { font-size: 2.5rem; }
      span { font-size: 1rem; }
    }

    .error-state i { color: #ef4444; }

    .retry-btn {
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover { transform: scale(1.05); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }

      &.warning {
        border-color: rgba(245, 158, 11, 0.3);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-primary) 100%);
      }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i { font-size: 1.2rem; color: white; }
    }

    .subscription-icon { background: linear-gradient(135deg, #3b82f6, #6366f1); }
    .program-icon { background: linear-gradient(135deg, #10b981, #059669); }
    .diet-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .notif-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-label {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .content-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);

      h3 {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;

        i { font-size: 0.9rem; color: var(--text-muted); }
      }
    }

    .card-link {
      font-size: 0.8rem;
      color: var(--primary-500, #3b82f6);
      text-decoration: none;
      font-weight: 500;

      &:hover { text-decoration: underline; }
    }

    .card-body {
      padding: 16px 20px;
    }

    /* Coach Card */
    .coach-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .coach-avatar {
      width: 56px;
      height: 56px;
      background: var(--gradient-primary);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      span {
        font-size: 1.2rem;
        font-weight: 600;
        color: white;
      }
    }

    .coach-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .coach-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .coach-phone, .coach-email {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;

      &:hover { color: var(--primary-500, #3b82f6); }
      i { font-size: 0.75rem; }
    }

    /* Subscription Card */
    .sub-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-of-type { border-bottom: none; }
    }

    .sub-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .sub-value {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;

      &.status-1 { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.status-2 { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.status-3 { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.status-4 { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
      &.status-5 { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .remaining-bar {
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      margin-top: 12px;
      overflow: hidden;
    }

    .remaining-progress {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: 3px;
      transition: width 0.3s;
    }

    .remaining-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
      display: block;
    }

    /* List Items */
    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: opacity 0.2s;

      &:last-child { border-bottom: none; }
      &:hover { opacity: 0.8; }
    }

    .list-item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i { font-size: 0.9rem; color: white; }

      &.program-bg { background: linear-gradient(135deg, #10b981, #059669); }
      &.diet-bg { background: linear-gradient(135deg, #f59e0b, #d97706); }
    }

    .list-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .list-item-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .list-item-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Measurements */
    .measurements-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .measurement-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 12px;
      gap: 4px;
    }

    .measurement-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .measurement-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .measurement-date {
      grid-column: 1 / -1;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      padding-top: 4px;
    }

    /* Quick Links */
    .quick-links {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      text-decoration: none;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        color: var(--primary-500, #3b82f6);
        border-color: rgba(59, 130, 246, 0.3);
      }

      i { font-size: 1.3rem; }
      span { font-size: 0.8rem; font-weight: 500; }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
      .quick-links { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 600px) {
      .dashboard-container { padding: 16px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-card { padding: 14px; }
      .stat-icon { width: 40px; height: 40px; i { font-size: 1rem; } }
      .stat-value { font-size: 0.95rem; }
      .quick-links { grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .quick-link { padding: 14px 8px; }
      .welcome-title { font-size: 1.2rem; }
    }
  `]
})
export class ClientDashboardComponent implements OnInit {
  private clientService = inject(ClientService);

  dashboard = signal<ClientDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.clientService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('حدث خطأ في تحميل البيانات');
        this.loading.set(false);
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    return 'مساء الخير';
  }

  getCoachInitials(): string {
    const name = this.dashboard()?.coach?.fullName || '';
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      1: 'نشط', 2: 'مجمد', 3: 'تجريبي', 4: 'منتهي', 5: 'ملغي'
    };
    return labels[status] || 'غير معروف';
  }

  getSubscriptionProgress(sub: MySubscriptionSummary): number {
    const start = new Date(sub.startDate).getTime();
    const end = new Date(sub.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    if (total <= 0) return 0;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }
}
