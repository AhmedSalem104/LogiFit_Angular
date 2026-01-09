import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Trainee, BodyMeasurement } from '../services/coach.service';

interface TraineeProgress {
  trainee: Trainee;
  bodyMeasurements: BodyMeasurement[];
  monthlySessions: { month: string; count: number }[];
  workoutHistory: { date: string; workout: string; duration: number }[];
}

@Component({
  selector: 'app-trainee-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxChartsModule,
    TabViewModule,
    TagModule,
    ButtonModule,
    PageHeaderComponent,
    ChartCardComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="trainee-details">
      <app-page-header
        [title]="trainee()?.clientName || trainee()?.fullName || 'تفاصيل المتدرب'"
        subtitle="متابعة تقدم المتدرب"
        [breadcrumbs]="[
          {label: 'لوحة التحكم', route: '/coach/dashboard'},
          {label: 'المتدربين', route: '/coach/trainees'},
          {label: trainee()?.clientName || trainee()?.fullName || ''}
        ]"
      >
        <button class="btn btn-primary" (click)="addMeasurement()">
          <i class="pi pi-plus"></i>
          <span>إضافة قياسات</span>
        </button>
      </app-page-header>

      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="content" *ngIf="!loading() && trainee()">
        <!-- Trainee Info Card -->
        <div class="info-section">
          <div class="trainee-profile card">
            <div class="profile-header">
              <div class="avatar">
                @if (trainee()?.profileImageUrl) {
                  <img [src]="trainee()?.profileImageUrl" [alt]="trainee()?.clientName || trainee()?.fullName" />
                } @else {
                  {{ getInitials(trainee()?.clientName || trainee()?.fullName || '') }}
                }
              </div>
              <div class="profile-info">
                <h2>{{ trainee()?.clientName || trainee()?.fullName }}</h2>
                <p-tag
                  [value]="getStatusLabel(trainee()?.subscriptionStatus || '')"
                  [severity]="getStatusSeverity(trainee()?.subscriptionStatus || '')"
                ></p-tag>
              </div>
            </div>

            <div class="profile-details">
              <div class="detail-item">
                <i class="pi pi-phone"></i>
                <span>{{ trainee()?.clientPhone || trainee()?.phoneNumber }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-envelope"></i>
                <span>{{ trainee()?.clientEmail || trainee()?.email }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <span>بدأ في {{ formatDate(trainee()?.assignedAt || trainee()?.startDate || '') }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-header">
                <span>التقدم الكلي</span>
                <span class="progress-value">{{ trainee()?.progressPercentage }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="trainee()?.progressPercentage"></div>
              </div>
              <div class="progress-stats">
                <span>{{ trainee()?.sessionsCompleted }} / {{ trainee()?.totalSessions }} جلسة</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-card">
              <div class="stat-icon blue">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ trainee()?.sessionsCompleted }}</span>
                <span class="stat-label">جلسة مكتملة</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green">
                <i class="pi pi-chart-line"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ latestWeight() }}</span>
                <span class="stat-label">الوزن الحالي (كجم)</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon purple">
                <i class="pi pi-percentage"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ latestBodyFat() }}</span>
                <span class="stat-label">نسبة الدهون %</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Section -->
        <p-tabView>
          <!-- Progress Tab -->
          <p-tabPanel header="التقدم">
            <div class="charts-grid">
              <app-chart-card
                title="تطور الوزن"
                [loading]="false"
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

              <app-chart-card
                title="الجلسات الشهرية"
                [loading]="false"
              >
                <ngx-charts-bar-vertical
                  [results]="sessionsChartData()"
                  [scheme]="sessionsColorScheme"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  xAxisLabel="الشهر"
                  yAxisLabel="عدد الجلسات"
                  [gradient]="true"
                  [roundEdges]="true"
                ></ngx-charts-bar-vertical>
              </app-chart-card>
            </div>
          </p-tabPanel>

          <!-- Measurements Tab -->
          <p-tabPanel header="القياسات">
            <div class="measurements-table">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوزن</th>
                    <th>الطول</th>
                    <th>نسبة الدهون</th>
                    <th>الصدر</th>
                    <th>الخصر</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of measurements(); track m.id) {
                    <tr>
                      <td>{{ formatDate(m.dateRecorded || m.measurementDate || '') }}</td>
                      <td>{{ m.weightKg ?? m.weight }} كجم</td>
                      <td>{{ m.height }} سم</td>
                      <td>{{ m.bodyFatPercent ?? m.bodyFatPercentage ?? '-' }}%</td>
                      <td>{{ m.chest || '-' }} سم</td>
                      <td>{{ m.waist || '-' }} سم</td>
                      <td>
                        <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"></button>
                        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"></button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="empty-row">لا توجد قياسات مسجلة</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </p-tabPanel>

          <!-- Programs Tab -->
          <p-tabPanel header="البرامج">
            <div class="programs-grid">
              <div class="program-card" *ngIf="trainee()?.currentWorkoutProgramId">
                <div class="program-icon workout">
                  <i class="pi pi-list"></i>
                </div>
                <div class="program-info">
                  <h4>برنامج التمرين الحالي</h4>
                  <p>برنامج تضخيم العضلات - المستوى المتوسط</p>
                </div>
                <button class="btn btn-outline">تغيير</button>
              </div>

              <div class="program-card" *ngIf="trainee()?.currentDietPlanId">
                <div class="program-icon diet">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="program-info">
                  <h4>خطة التغذية الحالية</h4>
                  <p>خطة بناء العضلات - 2500 سعرة</p>
                </div>
                <button class="btn btn-outline">تغيير</button>
              </div>

              <div class="assign-program" *ngIf="!trainee()?.currentWorkoutProgramId || !trainee()?.currentDietPlanId">
                <i class="pi pi-plus-circle"></i>
                <p>تعيين برنامج جديد</p>
                <button class="btn btn-primary">تعيين</button>
              </div>
            </div>
          </p-tabPanel>

          <!-- History Tab -->
          <p-tabPanel header="سجل التمارين">
            <div class="workout-history">
              @for (session of workoutHistory(); track session.date) {
                <div class="history-item">
                  <div class="history-date">
                    <span class="day">{{ getDay(session.date) }}</span>
                    <span class="month">{{ getMonth(session.date) }}</span>
                  </div>
                  <div class="history-content">
                    <h4>{{ session.workout }}</h4>
                    <span class="duration">
                      <i class="pi pi-clock"></i>
                      {{ session.duration }} دقيقة
                    </span>
                  </div>
                </div>
              } @empty {
                <div class="empty-history">
                  <i class="pi pi-calendar"></i>
                  <p>لا يوجد سجل تمارين</p>
                </div>
              }
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>
    </div>
  `,
  styles: [`
    .trainee-details {
      max-width: 1400px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .trainee-profile {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.5rem;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .profile-info {
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        color: var(--text-primary);
      }
    }

    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: var(--text-muted);
        width: 20px;
      }
    }

    .progress-section {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .progress-value {
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-bar {
      height: 10px;
      background: var(--bg-tertiary);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
      border-radius: 5px;
      transition: width 0.3s;
    }

    .progress-stats {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }

    .quick-stats {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: white;
      }

      &.blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      &.green { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      &.purple { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .measurements-table {
      overflow-x: auto;

      table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 1rem;
          text-align: right;
          border-bottom: 1px solid var(--border-color);
        }

        th {
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary);
        }

        td {
          color: var(--text-primary);
        }

        .empty-row {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem;
        }
      }
    }

    .programs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .program-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .program-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: white;
      }

      &.workout { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
      &.diet { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    }

    .program-info {
      flex: 1;

      h4 {
        margin: 0 0 0.25rem;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .assign-program {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 2.5rem;
      }
    }

    .workout-history {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .history-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 60px;
      padding: 0.5rem;
      background: #3b82f6;
      border-radius: 8px;
      color: white;

      .day {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .month {
        font-size: 0.75rem;
      }
    }

    .history-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      h4 {
        margin: 0 0 0.25rem;
        color: var(--text-primary);
      }

      .duration {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .empty-history {
      text-align: center;
      padding: 3rem;
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
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.btn-primary {
        background: #3b82f6;
        color: white;

        &:hover {
          background: #2563eb;
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
      }
    }

    @media (max-width: 1024px) {
      .info-section {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .stat-card {
        flex: 1;
        min-width: 200px;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TraineeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private coachService = inject(CoachService);

  loading = signal(true);
  trainee = signal<Trainee | null>(null);
  measurements = signal<BodyMeasurement[]>([]);
  workoutHistory = signal<{ date: string; workout: string; duration: number }[]>([]);

  weightColorScheme: Color = {
    name: 'weight',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6']
  };

  sessionsColorScheme: Color = {
    name: 'sessions',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#22c55e']
  };

  latestWeight = computed(() => {
    const m = this.measurements();
    return m.length > 0 ? (m[0].weightKg ?? m[0].weight) : '-';
  });

  latestBodyFat = computed(() => {
    const m = this.measurements();
    return m.length > 0 ? (m[0].bodyFatPercent ?? m[0].bodyFatPercentage ?? '-') : '-';
  });

  weightChartData = computed(() => {
    const m = this.measurements();
    if (m.length === 0) return [];

    return [{
      name: 'الوزن',
      series: m.slice().reverse().map(measurement => ({
        name: this.formatDate(measurement.dateRecorded || measurement.measurementDate || ''),
        value: measurement.weightKg ?? measurement.weight ?? 0
      }))
    }];
  });

  sessionsChartData = computed(() => {
    return [
      { name: 'يناير', value: 8 },
      { name: 'فبراير', value: 12 },
      { name: 'مارس', value: 10 },
      { name: 'أبريل', value: 15 }
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTraineeData(id);
    }
  }

  loadTraineeData(id: string): void {
    this.loading.set(true);

    // Load trainee and measurements in parallel
    this.coachService.getTraineeById(id).subscribe({
      next: (data) => {
        this.trainee.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        this.trainee.set({
          id: id,
          clientId: id,
          clientName: 'أحمد محمد علي',
          clientPhone: '01012345678',
          fullName: 'أحمد محمد علي',
          phoneNumber: '01012345678',
          email: 'ahmed@email.com',
          isActive: true,
          hasActiveSubscription: true,
          subscriptionStatus: 'active',
          currentWorkoutProgramId: 'prog1',
          currentDietPlanId: 'diet1',
          workoutProgramsCount: 2,
          dietPlansCount: 1,
          startDate: '2024-01-01',
          lastActivityDate: '2024-01-15',
          progressPercentage: 85,
          sessionsCompleted: 24,
          totalSessions: 28
        });

        this.measurements.set([
          { id: '1', traineeId: id, traineeName: 'أحمد', measurementDate: '2024-01-15', weight: 78, height: 175, bodyFatPercentage: 18, chest: 102, waist: 84 },
          { id: '2', traineeId: id, traineeName: 'أحمد', measurementDate: '2024-01-01', weight: 80, height: 175, bodyFatPercentage: 20, chest: 100, waist: 86 },
          { id: '3', traineeId: id, traineeName: 'أحمد', measurementDate: '2023-12-15', weight: 82, height: 175, bodyFatPercentage: 22, chest: 98, waist: 88 },
        ]);

        this.workoutHistory.set([
          { date: '2024-01-15', workout: 'تمرين الصدر والترايسبس', duration: 65 },
          { date: '2024-01-14', workout: 'تمرين الظهر والبايسبس', duration: 70 },
          { date: '2024-01-12', workout: 'تمرين الأرجل', duration: 55 },
          { date: '2024-01-10', workout: 'تمرين الكتف والترابيس', duration: 50 },
        ]);

        this.loading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      expired: 'منتهي',
      pending: 'معلق'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      active: 'success',
      expired: 'danger',
      pending: 'warning'
    };
    return severities[status] || 'info';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  getMonth(dateStr: string): string {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[new Date(dateStr).getMonth()];
  }

  addMeasurement(): void {
    console.log('Add measurement');
  }
}
