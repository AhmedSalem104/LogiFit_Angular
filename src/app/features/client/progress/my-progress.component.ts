import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, ProgressData } from '../services/client.service';

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    ProgressBarModule,
    PageHeaderComponent,
    ChartCardComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-progress-page">
      <app-page-header
        title="تقدمي"
        subtitle="تتبع تقدمك في التمارين والتغذية"
        [breadcrumbs]="[{label: 'تقدمي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="progress-content" *ngIf="!loading()">
        <!-- Streak Card -->
        <div class="streak-card">
          <div class="streak-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="streak-info">
            <span class="streak-count">{{ progressData()?.streakDays || 0 }}</span>
            <span class="streak-label">أيام متتالية</span>
          </div>
          <div class="streak-message">
            استمر في التقدم! أنت رائع
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card sessions">
            <div class="stat-header">
              <i class="pi pi-check-circle"></i>
              <span>جلسات التمرين</span>
            </div>
            <div class="stat-progress">
              <p-progressBar
                [value]="sessionsProgress()"
                [showValue]="false"
              ></p-progressBar>
            </div>
            <div class="stat-values">
              <span class="current">{{ progressData()?.sessionsCompleted }}</span>
              <span class="separator">/</span>
              <span class="total">{{ progressData()?.totalSessions }}</span>
            </div>
          </div>

          <div class="stat-card calories">
            <div class="stat-header">
              <i class="pi pi-bolt"></i>
              <span>السعرات اليوم</span>
            </div>
            <div class="stat-progress">
              <p-progressBar
                [value]="caloriesProgress()"
                [showValue]="false"
                styleClass="calories-bar"
              ></p-progressBar>
            </div>
            <div class="stat-values">
              <span class="current">{{ progressData()?.caloriesConsumed }}</span>
              <span class="separator">/</span>
              <span class="total">{{ progressData()?.caloriesTarget }}</span>
            </div>
          </div>
        </div>

        <!-- Weight Progress Chart -->
        <app-chart-card
          title="تطور الوزن"
          [loading]="loading()"
        >
          <ngx-charts-line-chart
            [results]="weightChartData()"
            [scheme]="weightColorScheme"
            [xAxis]="true"
            [yAxis]="true"
            [showXAxisLabel]="true"
            [showYAxisLabel]="true"
            xAxisLabel="التاريخ"
            yAxisLabel="الوزن (كجم)"
            [autoScale]="true"
            [timeline]="false"
          ></ngx-charts-line-chart>
        </app-chart-card>

        <!-- Body Fat Chart -->
        <app-chart-card
          title="تطور نسبة الدهون"
          [loading]="loading()"
        >
          <ngx-charts-area-chart
            [results]="bodyFatChartData()"
            [scheme]="fatColorScheme"
            [xAxis]="true"
            [yAxis]="true"
            [showXAxisLabel]="true"
            [showYAxisLabel]="true"
            xAxisLabel="التاريخ"
            yAxisLabel="نسبة الدهون %"
            [autoScale]="true"
          ></ngx-charts-area-chart>
        </app-chart-card>

        <!-- Achievements -->
        <div class="achievements-section">
          <h3>الإنجازات</h3>
          <div class="achievements-grid">
            @for (achievement of progressData()?.achievements; track achievement.id) {
              <div class="achievement-card">
                <div class="achievement-icon">
                  <i [class]="achievement.icon"></i>
                </div>
                <div class="achievement-info">
                  <h4>{{ achievement.title }}</h4>
                  <p>{{ achievement.description }}</p>
                  <span class="achievement-date">{{ formatDate(achievement.earnedDate) }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-achievements">
                <i class="pi pi-star"></i>
                <p>لم تحصل على إنجازات بعد</p>
                <span>استمر في التمرين لفتح الإنجازات!</span>
              </div>
            }
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="weekly-summary card">
          <h3>ملخص الأسبوع</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-value">4</span>
              <span class="summary-label">جلسات مكتملة</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">2.5</span>
              <span class="summary-label">ساعات تمرين</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">12,500</span>
              <span class="summary-label">حجم التمارين (كجم)</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">18,000</span>
              <span class="summary-label">سعرات مستهلكة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-progress-page {
      max-width: 1000px;
      padding-bottom: 2rem;
    }

    .streak-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 20px;
      margin-bottom: 1.5rem;
      color: white;
    }

    .streak-icon {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 2rem;
      }
    }

    .streak-info {
      display: flex;
      flex-direction: column;
    }

    .streak-count {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .streak-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .streak-message {
      margin-right: auto;
      font-size: 1.1rem;
      font-weight: 500;
    }

    :host-context([dir="ltr"]) .streak-message {
      margin-right: 0;
      margin-left: auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: #3b82f6;
      }
    }

    .stat-progress {
      margin-bottom: 0.75rem;
    }

    .stat-values {
      text-align: center;

      .current {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .separator {
        margin: 0 0.25rem;
        color: var(--text-muted);
      }

      .total {
        color: var(--text-secondary);
      }
    }

    ::ng-deep .sessions .p-progressbar-value { background: #22c55e; }
    ::ng-deep .calories-bar .p-progressbar-value { background: #f59e0b; }

    .achievements-section {
      margin-bottom: 1.5rem;

      h3 {
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .achievement-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }

    .achievement-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.5rem;
        color: white;
      }
    }

    .achievement-info {
      h4 {
        margin: 0 0 0.25rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .achievement-date {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .empty-achievements {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;

      i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
        font-weight: 500;
      }

      span {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;

      h3 {
        margin: 0 0 1.25rem;
        color: var(--text-primary);
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .summary-item {
      text-align: center;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;

      .summary-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .summary-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    @media (max-width: 768px) {
      .streak-card {
        flex-direction: column;
        text-align: center;
      }

      .streak-message {
        margin: 0;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class MyProgressComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  progressData = signal<ProgressData | null>(null);

  weightColorScheme: Color = {
    name: 'weight',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6']
  };

  fatColorScheme: Color = {
    name: 'fat',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#f59e0b']
  };

  sessionsProgress = computed(() => {
    const data = this.progressData();
    if (!data || !data.totalSessions || data.totalSessions === 0 || !data.sessionsCompleted) return 0;
    return Math.round((data.sessionsCompleted / data.totalSessions) * 100);
  });

  caloriesProgress = computed(() => {
    const data = this.progressData();
    if (!data || !data.caloriesTarget || data.caloriesTarget === 0 || !data.caloriesConsumed) return 0;
    return Math.min(100, Math.round((data.caloriesConsumed / data.caloriesTarget) * 100));
  });

  weightChartData = computed(() => {
    const data = this.progressData();
    if (!data || !data.weightProgress) return [];

    return [{
      name: 'الوزن',
      series: data.weightProgress.map(p => ({
        name: this.formatDate(p.date),
        value: p.value
      }))
    }];
  });

  bodyFatChartData = computed(() => {
    const data = this.progressData();
    if (!data || !data.bodyFatProgress) return [];

    return [{
      name: 'نسبة الدهون',
      series: data.bodyFatProgress.map(p => ({
        name: this.formatDate(p.date),
        value: p.value
      }))
    }];
  });

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading.set(true);

    this.clientService.getMyProgress().subscribe({
      next: (data) => {
        // Map API response to component format
        const mappedData = this.mapProgressFromApi(data);
        this.progressData.set(mappedData);
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        this.progressData.set({
          weightProgress: [
            { date: '2023-12-01', value: 83 },
            { date: '2023-12-15', value: 82 },
            { date: '2024-01-01', value: 80 },
            { date: '2024-01-15', value: 78 }
          ],
          bodyFatProgress: [
            { date: '2023-12-01', value: 23 },
            { date: '2023-12-15', value: 22 },
            { date: '2024-01-01', value: 20 },
            { date: '2024-01-15', value: 18 }
          ],
          sessionsCompleted: 24,
          totalSessions: 28,
          caloriesConsumed: 2100,
          caloriesTarget: 2800,
          streakDays: 12,
          achievements: [
            { id: '1', title: 'الأسبوع الأول', description: 'أكملت أسبوعك الأول من التمارين', icon: 'pi pi-star', earnedDate: '2024-01-07' },
            { id: '2', title: '10 جلسات', description: 'أكملت 10 جلسات تمرين', icon: 'pi pi-check-circle', earnedDate: '2024-01-12' },
            { id: '3', title: 'خسارة 5 كجم', description: 'خسرت 5 كيلوجرام من وزنك', icon: 'pi pi-chart-line', earnedDate: '2024-01-15' }
          ]
        });
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Map API TraineeProgressReportDto to component ProgressData format
   * API returns bodyMeasurements[], but component expects weightProgress[] and bodyFatProgress[]
   */
  private mapProgressFromApi(data: ProgressData): ProgressData {
    // Map bodyMeasurements to weightProgress and bodyFatProgress
    const weightProgress = data.bodyMeasurements?.map(m => ({
      date: m.dateRecorded,
      value: m.weightKg
    })) || data.weightProgress || [];

    const bodyFatProgress = data.bodyMeasurements?.filter(m => m.bodyFatPercent != null).map(m => ({
      date: m.dateRecorded,
      value: m.bodyFatPercent!
    })) || data.bodyFatProgress || [];

    // Calculate weight change from bodyMeasurements
    let startWeight = data.startWeight;
    let currentWeight = data.currentWeight;
    if (!startWeight && data.bodyMeasurements && data.bodyMeasurements.length > 0) {
      startWeight = data.bodyMeasurements[data.bodyMeasurements.length - 1].weightKg;
      currentWeight = data.bodyMeasurements[0].weightKg;
    }

    return {
      ...data,
      weightProgress,
      bodyFatProgress,
      startWeight,
      currentWeight,
      totalWeightChange: data.totalWeightChange ?? (currentWeight && startWeight ? currentWeight - startWeight : undefined),
      // Map totalSessions from API
      sessionsCompleted: data.sessionsCompleted ?? data.totalSessions,
      totalSessions: data.totalSessions ?? data.sessionsCompleted,
      // Map totalVolumeLifted
      totalVolumeLifted: data.totalVolumeLifted,
      // Achievements from personalRecords if not present
      achievements: data.achievements || data.personalRecords?.map(pr => ({
        id: pr.exerciseId.toString(),
        title: `رقم قياسي: ${pr.exerciseName || 'تمرين'}`,
        description: `${pr.maxWeight} كجم × ${pr.reps} تكرار`,
        icon: 'pi pi-trophy',
        earnedDate: pr.achievedAt
      })) || []
    };
  }
}
