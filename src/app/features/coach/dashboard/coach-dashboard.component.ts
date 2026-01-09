import { Component, signal, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, CoachDashboardStats, TraineeProgress, CoachActivity } from '../services/coach.service';
import { ThemeState } from '../../../state/theme.state';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxChartsModule,
    PageHeaderComponent,
    StatCardComponent,
    ChartCardComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="coach-dashboard">
      <!-- Welcome Hero Section -->
      <div class="welcome-hero">
        <div class="hero-content">
          <div class="hero-text">
            <span class="greeting">{{ getGreeting() }}</span>
            <h1 class="coach-name">{{ getCoachName() }}</h1>
            <p class="hero-subtitle">إليك نظرة عامة على نشاطك ومتدربيك</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="stat-circle success">
                <span class="stat-value">{{ stats()?.activeTrainees || 0 }}</span>
              </div>
              <span class="stat-label">متدرب نشط</span>
            </div>
            <div class="hero-stat">
              <div class="stat-circle info">
                <span class="stat-value">{{ stats()?.totalSessionsThisMonth || 0 }}</span>
              </div>
              <span class="stat-label">جلسة هذا الشهر</span>
            </div>
            <div class="hero-stat">
              <div class="stat-circle warning">
                <span class="stat-value">{{ stats()?.averageTraineeProgress || 0 }}%</span>
              </div>
              <span class="stat-label">متوسط التقدم</span>
            </div>
          </div>
        </div>
        <div class="hero-decoration">
          <div class="decoration-circle c1"></div>
          <div class="decoration-circle c2"></div>
          <div class="decoration-circle c3"></div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <!-- Quick Actions - Moved to top for better UX -->
      <div class="quick-actions-section" *ngIf="!loading()">
        <div class="section-header">
          <h2><i class="pi pi-bolt"></i> إجراءات سريعة</h2>
        </div>
        <div class="quick-actions-grid">
          <a routerLink="/coach/workout-programs/create" class="quick-action-card workout">
            <div class="action-icon">
              <i class="pi pi-plus"></i>
            </div>
            <div class="action-info">
              <span class="action-title">برنامج تمرين جديد</span>
              <span class="action-desc">إنشاء برنامج تدريبي مخصص</span>
            </div>
            <i class="pi pi-arrow-left action-arrow"></i>
          </a>
          <a routerLink="/coach/diet-plans/create" class="quick-action-card diet">
            <div class="action-icon">
              <i class="pi pi-plus"></i>
            </div>
            <div class="action-info">
              <span class="action-title">خطة تغذية جديدة</span>
              <span class="action-desc">تصميم نظام غذائي متكامل</span>
            </div>
            <i class="pi pi-arrow-left action-arrow"></i>
          </a>
          <a routerLink="/coach/trainees" class="quick-action-card trainees">
            <div class="action-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="action-info">
              <span class="action-title">إدارة المتدربين</span>
              <span class="action-desc">عرض وإدارة جميع المتدربين</span>
            </div>
            <i class="pi pi-arrow-left action-arrow"></i>
          </a>
          <a routerLink="/coach/measurements" class="quick-action-card measurements">
            <div class="action-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="action-info">
              <span class="action-title">تسجيل قياسات</span>
              <span class="action-desc">متابعة تقدم المتدربين</span>
            </div>
            <i class="pi pi-arrow-left action-arrow"></i>
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section" *ngIf="!loading()">
        <div class="section-header">
          <h2><i class="pi pi-chart-bar"></i> الإحصائيات العامة</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-card primary" routerLink="/coach/trainees">
            <div class="stat-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()?.totalTrainees || 0 }}</span>
              <span class="stat-title">إجمالي المتدربين</span>
            </div>
            <div class="stat-badge" *ngIf="stats()?.activeTrainees">
              {{ stats()?.activeTrainees }} نشط
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()?.totalSessionsThisMonth || 0 }}</span>
              <span class="stat-title">جلسات هذا الشهر</span>
            </div>
            <div class="stat-trend up">
              <i class="pi pi-arrow-up"></i>
              <span>+12%</span>
            </div>
          </div>

          <div class="stat-card info" routerLink="/coach/workout-programs">
            <div class="stat-icon">
              <i class="pi pi-list"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()?.totalWorkoutPrograms || 0 }}</span>
              <span class="stat-title">برامج التمرين</span>
            </div>
          </div>

          <div class="stat-card warning" routerLink="/coach/diet-plans">
            <div class="stat-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()?.totalDietPlans || 0 }}</span>
              <span class="stat-title">خطط التغذية</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content-grid" *ngIf="!loading()">
        <!-- Top Trainees Section -->
        <div class="content-card top-trainees">
          <div class="card-header">
            <h3><i class="pi pi-star"></i> أفضل المتدربين تقدماً</h3>
            <a routerLink="/coach/trainees" class="view-all-btn">
              عرض الكل <i class="pi pi-arrow-left"></i>
            </a>
          </div>
          <div class="trainees-list">
            @for (trainee of topTrainees(); track trainee.traineeId; let i = $index) {
              <div class="trainee-item">
                <div class="trainee-rank" [class]="'rank-' + (i + 1)">
                  {{ i + 1 }}
                </div>
                <div class="trainee-avatar">
                  <span>{{ getInitials(trainee.traineeName) }}</span>
                </div>
                <div class="trainee-info">
                  <span class="trainee-name">{{ trainee.traineeName }}</span>
                  <span class="trainee-sessions">{{ trainee.sessionsCompleted }} جلسة مكتملة</span>
                </div>
                <div class="progress-section">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="trainee.progressPercentage"></div>
                  </div>
                  <span class="progress-value">{{ trainee.progressPercentage }}%</span>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <i class="pi pi-users"></i>
                <p>لا يوجد متدربين حالياً</p>
              </div>
            }
          </div>
        </div>

        <!-- Volume & Sessions Stats -->
        <div class="content-card volume-stats">
          <div class="card-header">
            <h3><i class="pi pi-bolt"></i> إحصائيات الأداء</h3>
          </div>
          <div class="performance-grid">
            <div class="performance-item">
              <div class="perf-icon volume">
                <i class="pi pi-sort-amount-up"></i>
              </div>
              <div class="perf-details">
                <span class="perf-value">{{ stats()?.totalVolumeThisMonth | number:'1.0-0' }}</span>
                <span class="perf-unit">كجم</span>
                <span class="perf-label">إجمالي حجم التمارين</span>
              </div>
            </div>
            <div class="performance-item">
              <div class="perf-icon sessions">
                <i class="pi pi-calendar-plus"></i>
              </div>
              <div class="perf-details">
                <span class="perf-value">{{ stats()?.totalSessionsThisMonth || 0 }}</span>
                <span class="perf-unit">جلسة</span>
                <span class="perf-label">جلسات هذا الشهر</span>
              </div>
            </div>
            <div class="performance-item">
              <div class="perf-icon progress">
                <i class="pi pi-percentage"></i>
              </div>
              <div class="perf-details">
                <span class="perf-value">{{ stats()?.averageTraineeProgress || 0 }}</span>
                <span class="perf-unit">%</span>
                <span class="perf-label">متوسط تقدم المتدربين</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="content-card activities">
          <div class="card-header">
            <h3><i class="pi pi-clock"></i> النشاطات الأخيرة</h3>
            <a routerLink="/coach/trainees" class="view-all-btn">
              عرض الكل <i class="pi pi-arrow-left"></i>
            </a>
          </div>
          <div class="activities-list">
            @for (activity of recentActivities(); track activity.id) {
              <div class="activity-item">
                <div class="activity-icon" [ngClass]="getActivityClass(activity.type)">
                  <i [class]="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <p class="activity-description">{{ activity.description }}</p>
                  <div class="activity-meta">
                    <span class="trainee-badge">
                      <i class="pi pi-user"></i>
                      {{ activity.traineeName }}
                    </span>
                    <span class="activity-date">
                      <i class="pi pi-clock"></i>
                      {{ formatDate(activity.date) }}
                    </span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <i class="pi pi-clock"></i>
                <p>لا توجد نشاطات حديثة</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Resources Section -->
      <div class="resources-section" *ngIf="!loading()">
        <div class="section-header">
          <h2><i class="pi pi-database"></i> الموارد والمكتبات</h2>
        </div>
        <div class="resources-grid">
          <a routerLink="/coach/exercises" class="resource-card">
            <div class="resource-icon exercises">
              <i class="pi pi-list"></i>
            </div>
            <div class="resource-info">
              <span class="resource-title">مكتبة التمارين</span>
              <span class="resource-desc">تصفح وإدارة التمارين المتاحة</span>
            </div>
          </a>
          <a routerLink="/coach/foods" class="resource-card">
            <div class="resource-icon foods">
              <i class="pi pi-apple"></i>
            </div>
            <div class="resource-info">
              <span class="resource-title">قاعدة بيانات الأطعمة</span>
              <span class="resource-desc">إدارة الأطعمة والقيم الغذائية</span>
            </div>
          </a>
          <a routerLink="/coach/profile" class="resource-card">
            <div class="resource-icon profile">
              <i class="pi pi-user-edit"></i>
            </div>
            <div class="resource-info">
              <span class="resource-title">الملف الشخصي</span>
              <span class="resource-desc">إدارة بيانات حسابك</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coach-dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Welcome Hero Section */
    .welcome-hero {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      border-radius: 24px;
      padding: 2.5rem;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .hero-text {
      color: white;
    }

    .greeting {
      display: block;
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }

    .coach-name {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .hero-subtitle {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.85;
    }

    .hero-stats {
      display: flex;
      gap: 2rem;
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.1);
      }

      &.success {
        background: rgba(34, 197, 94, 0.3);
        border-color: rgba(34, 197, 94, 0.5);
      }

      &.info {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.5);
      }

      &.warning {
        background: rgba(245, 158, 11, 0.3);
        border-color: rgba(245, 158, 11, 0.5);
      }
    }

    .stat-circle .stat-value {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .hero-stat .stat-label {
      color: white;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .hero-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .decoration-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);

      &.c1 {
        width: 300px;
        height: 300px;
        top: -100px;
        left: -100px;
      }

      &.c2 {
        width: 200px;
        height: 200px;
        bottom: -50px;
        right: 10%;
      }

      &.c3 {
        width: 150px;
        height: 150px;
        top: 50%;
        right: -50px;
      }
    }

    /* Section Headers */
    .section-header {
      margin-bottom: 1.25rem;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          color: #8b5cf6;
          font-size: 1.1rem;
        }
      }
    }

    /* Quick Actions */
    .quick-actions-section {
      margin-bottom: 2rem;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .quick-action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s;
      }

      &.workout::before { background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%); }
      &.diet::before { background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%); }
      &.trainees::before { background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%); }
      &.measurements::before { background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%); }

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.1);

        &::before { opacity: 1; }

        .action-arrow {
          transform: translateX(-5px);
          opacity: 1;
        }
      }
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
        color: white;
      }

      .workout & { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      .diet & { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      .trainees & { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      .measurements & { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    }

    .action-info {
      flex: 1;
      min-width: 0;
    }

    .action-title {
      display: block;
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .action-desc {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .action-arrow {
      color: var(--text-muted);
      opacity: 0;
      transition: all 0.3s;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        transform: translate(30%, -30%);
        opacity: 0.1;
      }

      &.primary::before { background: #3b82f6; }
      &.success::before { background: #22c55e; }
      &.info::before { background: #8b5cf6; }
      &.warning::before { background: #f59e0b; }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: white;
      }

      .primary & { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      .success & { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      .info & { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      .warning & { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-title {
      display: block;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .stat-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      padding: 0.25rem 0.75rem;
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 20px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;

      &.up {
        color: #22c55e;
      }

      &.down {
        color: #ef4444;
      }
    }

    /* Main Content Grid */
    .main-content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .content-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;

      &.top-trainees {
        grid-row: span 2;
      }

      &.activities {
        grid-column: 2;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: #8b5cf6;
        }
      }
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
      font-size: 0.875rem;
      text-decoration: none;
      transition: gap 0.3s;

      &:hover {
        gap: 0.75rem;
      }
    }

    /* Top Trainees List */
    .trainees-list {
      padding: 1rem;
    }

    .trainee-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .trainee-rank {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      background: var(--bg-secondary);
      color: var(--text-muted);

      &.rank-1 {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }

      &.rank-2 {
        background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        color: white;
      }

      &.rank-3 {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        color: white;
      }
    }

    .trainee-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .trainee-info {
      flex: 1;
      min-width: 0;
    }

    .trainee-name {
      display: block;
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .trainee-sessions {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 120px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: #22c55e;
      min-width: 40px;
      text-align: left;
    }

    /* Volume Stats */
    .performance-grid {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .performance-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .perf-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.25rem;
        color: white;
      }

      &.volume { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      &.sessions { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      &.progress { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    }

    .perf-details {
      flex: 1;
    }

    .perf-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .perf-unit {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-right: 0.25rem;
    }

    .perf-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* Activities */
    .activities-list {
      padding: 0.5rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .activity-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.1rem;
        color: white;
      }

      &.session { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      &.program { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      &.diet { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      &.measurement { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-description {
      margin: 0 0 0.5rem;
      color: var(--text-primary);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .activity-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
    }

    .trainee-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-secondary);

      i { font-size: 0.75rem; }
    }

    .activity-date {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-muted);

      i { font-size: 0.75rem; }
    }

    /* Empty State */
    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
      }
    }

    /* Resources Section */
    .resources-section {
      margin-bottom: 2rem;
    }

    .resources-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .resource-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      }
    }

    .resource-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.25rem;
        color: white;
      }

      &.exercises { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      &.foods { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      &.profile { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    }

    .resource-info {
      flex: 1;
    }

    .resource-title {
      display: block;
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .resource-desc {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .hero-content {
        flex-direction: column;
        text-align: center;
      }

      .hero-stats {
        justify-content: center;
      }

      .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .main-content-grid {
        grid-template-columns: 1fr;
      }

      .content-card.top-trainees {
        grid-row: auto;
      }

      .content-card.activities {
        grid-column: auto;
      }

      .performance-grid {
        grid-template-columns: 1fr;
      }

      .resources-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .welcome-hero {
        padding: 1.5rem;
      }

      .coach-name {
        font-size: 1.75rem;
      }

      .hero-stats {
        gap: 1rem;
      }

      .stat-circle {
        width: 60px;
        height: 60px;
      }

      .stat-circle .stat-value {
        font-size: 1.1rem;
      }

      .quick-actions-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .resources-grid {
        grid-template-columns: 1fr;
      }

      .progress-section {
        min-width: 80px;
      }
    }
  `]
})
export class CoachDashboardComponent implements OnInit {
  private coachService = inject(CoachService);
  private themeState = inject(ThemeState);
  private authService = inject(AuthService);

  loading = signal(true);
  stats = signal<CoachDashboardStats | null>(null);
  error = signal<string | null>(null);

  gaugeColorScheme: Color = {
    name: 'gauge',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#22c55e', '#f59e0b']
  };

  progressColorScheme: Color = {
    name: 'progress',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']
  };

  sessionsGaugeData = computed(() => {
    const sessions = this.stats()?.totalSessionsThisMonth || 0;
    return [{ name: 'الجلسات', value: sessions }];
  });

  topTraineesChartData = computed(() => {
    const trainees = this.stats()?.topTraineesByProgress || [];
    return trainees.slice(0, 5).map(t => ({
      name: t.traineeName,
      value: t.progressPercentage
    }));
  });

  topTrainees = computed(() => {
    return this.stats()?.topTraineesByProgress || [];
  });

  recentActivities = computed(() => {
    return this.stats()?.recentActivities || [];
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.coachService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        // Mock data for development
        this.stats.set({
          totalTrainees: 23,
          activeTrainees: 18,
          totalWorkoutPrograms: 12,
          totalDietPlans: 8,
          totalSessionsThisMonth: 67,
          totalVolumeThisMonth: 125430,
          averageTraineeProgress: 72,
          topTraineesByProgress: [
            { traineeId: '1', traineeName: 'أحمد محمد', progressPercentage: 92, sessionsCompleted: 24, lastActivityDate: '2024-01-15' },
            { traineeId: '2', traineeName: 'خالد علي', progressPercentage: 85, sessionsCompleted: 20, lastActivityDate: '2024-01-14' },
            { traineeId: '3', traineeName: 'محمود حسن', progressPercentage: 78, sessionsCompleted: 18, lastActivityDate: '2024-01-15' },
            { traineeId: '4', traineeName: 'عمر السيد', progressPercentage: 65, sessionsCompleted: 15, lastActivityDate: '2024-01-13' },
            { traineeId: '5', traineeName: 'يوسف إبراهيم', progressPercentage: 58, sessionsCompleted: 12, lastActivityDate: '2024-01-12' },
          ],
          recentActivities: [
            { id: '1', type: 'session', description: 'أكمل جلسة تمرين الصدر والكتف', traineeId: '1', traineeName: 'أحمد محمد', date: '2024-01-15T10:30:00' },
            { id: '2', type: 'measurement', description: 'تم تسجيل قياسات جسم جديدة', traineeId: '2', traineeName: 'خالد علي', date: '2024-01-14T14:00:00' },
            { id: '3', type: 'program', description: 'تم تعيين برنامج تمرين جديد', traineeId: '3', traineeName: 'محمود حسن', date: '2024-01-14T09:15:00' },
            { id: '4', type: 'diet', description: 'تم تحديث خطة التغذية', traineeId: '4', traineeName: 'عمر السيد', date: '2024-01-13T16:45:00' },
            { id: '5', type: 'session', description: 'أكمل جلسة تمرين الظهر', traineeId: '1', traineeName: 'أحمد محمد', date: '2024-01-13T11:00:00' },
          ]
        });
        this.loading.set(false);
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'صباح الخير';
    } else if (hour < 17) {
      return 'مساء الخير';
    } else {
      return 'مساء الخير';
    }
  }

  getCoachName(): string {
    const user = this.authService.user();
    if (user?.fullName) {
      return user.fullName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'المدرب';
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.substring(0, 2);
  }

  getActivityClass(type: string): string {
    return type;
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      session: 'pi pi-check-circle',
      program: 'pi pi-list',
      diet: 'pi pi-calendar',
      measurement: 'pi pi-chart-line'
    };
    return icons[type] || 'pi pi-info-circle';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  }
}
