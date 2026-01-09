import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, BodyMeasurement } from '../services/client.service';

@Component({
  selector: 'app-my-measurements',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    PageHeaderComponent,
    ChartCardComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-measurements-page">
      <app-page-header
        title="قياساتي"
        subtitle="تتبع قياسات جسمك"
        [breadcrumbs]="[{label: 'قياساتي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="measurements-content" *ngIf="!loading()">
        <!-- Current Stats -->
        <div class="current-stats">
          <div class="stat-card weight">
            <div class="stat-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ getWeight(latestMeasurement()) || '-' }}</span>
              <span class="stat-label">الوزن (كجم)</span>
              @if (weightChange() !== 0) {
                <span class="stat-change" [class.positive]="weightChange() < 0" [class.negative]="weightChange() > 0">
                  {{ weightChange() > 0 ? '+' : '' }}{{ weightChange() }} كجم
                </span>
              }
            </div>
          </div>

          <div class="stat-card height">
            <div class="stat-icon">
              <i class="pi pi-arrows-v"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ latestMeasurement()?.height || '-' }}</span>
              <span class="stat-label">الطول (سم)</span>
            </div>
          </div>

          <div class="stat-card bmi">
            <div class="stat-icon">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ bmi() }}</span>
              <span class="stat-label">مؤشر كتلة الجسم</span>
              <span class="stat-status" [class]="bmiStatus()">{{ bmiLabel() }}</span>
            </div>
          </div>

          <div class="stat-card bodyfat">
            <div class="stat-icon">
              <i class="pi pi-chart-pie"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ getBodyFatPercent(latestMeasurement()) || '-' }}%</span>
              <span class="stat-label">نسبة الدهون</span>
            </div>
          </div>
        </div>

        <!-- Weight Chart -->
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
            [curve]="curve"
          ></ngx-charts-line-chart>
        </app-chart-card>

        <!-- Body Measurements -->
        <div class="body-measurements card">
          <h3>قياسات الجسم</h3>
          <div class="measurements-grid">
            <div class="measurement-item">
              <span class="measurement-label">الصدر</span>
              <span class="measurement-value">{{ latestMeasurement()?.chest || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">الخصر</span>
              <span class="measurement-value">{{ latestMeasurement()?.waist || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">الوركين</span>
              <span class="measurement-value">{{ latestMeasurement()?.hips || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">بايسبس (يمين)</span>
              <span class="measurement-value">{{ latestMeasurement()?.bicepsRight || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">بايسبس (يسار)</span>
              <span class="measurement-value">{{ latestMeasurement()?.bicepsLeft || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">فخذ (يمين)</span>
              <span class="measurement-value">{{ latestMeasurement()?.thighRight || '-' }} سم</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">فخذ (يسار)</span>
              <span class="measurement-value">{{ latestMeasurement()?.thighLeft || '-' }} سم</span>
            </div>
          </div>
          <div class="last-update">
            آخر تحديث: {{ formatDate(getMeasurementDate(latestMeasurement())) }}
          </div>
        </div>

        <!-- Measurements History -->
        <div class="measurements-history card">
          <h3>سجل القياسات</h3>
          <div class="history-list">
            @for (m of measurements(); track m.id) {
              <div class="history-item">
                <div class="history-date">
                  <span class="day">{{ getDay(getMeasurementDate(m)) }}</span>
                  <span class="month">{{ getMonth(getMeasurementDate(m)) }}</span>
                </div>
                <div class="history-data">
                  <div class="data-item">
                    <span class="label">الوزن</span>
                    <span class="value">{{ getWeight(m) }} كجم</span>
                  </div>
                  <div class="data-item" *ngIf="getBodyFatPercent(m)">
                    <span class="label">الدهون</span>
                    <span class="value">{{ getBodyFatPercent(m) }}%</span>
                  </div>
                  <div class="data-item" *ngIf="m.waist">
                    <span class="label">الخصر</span>
                    <span class="value">{{ m.waist }} سم</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-history">
                <p>لا توجد قياسات مسجلة</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-measurements-page {
      max-width: 1000px;
      padding-bottom: 2rem;
    }

    .current-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
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
    }

    .weight .stat-icon { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .height .stat-icon { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    .bmi .stat-icon { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
    .bodyfat .stat-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .stat-change {
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;

      &.positive { color: #22c55e; }
      &.negative { color: #ef4444; }
    }

    .stat-status {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      margin-top: 0.25rem;
      display: inline-block;
      width: fit-content;

      &.normal { background: #dcfce7; color: #16a34a; }
      &.overweight { background: #fef3c7; color: #d97706; }
      &.obese { background: #fef2f2; color: #dc2626; }
      &.underweight { background: #dbeafe; color: #2563eb; }
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      h3 {
        margin: 0 0 1.25rem;
        color: var(--text-primary);
      }
    }

    .measurements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .measurement-item {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      text-align: center;
    }

    .measurement-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .measurement-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .last-update {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
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
      min-width: 50px;
      padding: 0.5rem;
      background: #3b82f6;
      border-radius: 8px;
      color: white;

      .day {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .month {
        font-size: 0.7rem;
      }
    }

    .history-data {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: center;
    }

    .data-item {
      .label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .empty-history {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .current-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .measurements-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class MyMeasurementsComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  measurements = signal<BodyMeasurement[]>([]);

  curve: any = (d3: any) => d3.curveMonotoneX;

  weightColorScheme: Color = {
    name: 'weight',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6']
  };

  latestMeasurement = computed(() => {
    const m = this.measurements();
    return m.length > 0 ? m[0] : null;
  });

  previousMeasurement = computed(() => {
    const m = this.measurements();
    return m.length > 1 ? m[1] : null;
  });

  weightChange = computed(() => {
    const latest = this.latestMeasurement();
    const prev = this.previousMeasurement();
    if (!latest || !prev) return 0;
    const latestWeight = this.getWeight(latest);
    const prevWeight = this.getWeight(prev);
    if (!latestWeight || !prevWeight) return 0;
    return Math.round((latestWeight - prevWeight) * 10) / 10;
  });

  bmi = computed(() => {
    const m = this.latestMeasurement();
    if (!m || !m.height) return '-';
    const weight = this.getWeight(m);
    if (!weight) return '-';
    const heightM = m.height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  });

  bmiStatus = computed(() => {
    const bmiVal = parseFloat(this.bmi());
    if (isNaN(bmiVal)) return '';
    if (bmiVal < 18.5) return 'underweight';
    if (bmiVal < 25) return 'normal';
    if (bmiVal < 30) return 'overweight';
    return 'obese';
  });

  bmiLabel = computed(() => {
    const status = this.bmiStatus();
    const labels: Record<string, string> = {
      underweight: 'نقص وزن',
      normal: 'طبيعي',
      overweight: 'زيادة وزن',
      obese: 'سمنة'
    };
    return labels[status] || '';
  });

  weightChartData = computed(() => {
    const m = this.measurements();
    if (m.length === 0) return [];

    return [{
      name: 'الوزن',
      series: m.slice().reverse().map(measurement => ({
        name: this.formatDate(this.getMeasurementDate(measurement)),
        value: this.getWeight(measurement) || 0
      }))
    }];
  });

  ngOnInit(): void {
    this.loadMeasurements();
  }

  loadMeasurements(): void {
    this.loading.set(true);

    this.clientService.getMyMeasurements().subscribe({
      next: (data) => {
        this.measurements.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        this.measurements.set([
          { id: '1', measurementDate: '2024-01-15', weight: 78, height: 175, bodyFatPercentage: 18, chest: 102, waist: 84, hips: 98, bicepsRight: 36, bicepsLeft: 35, thighRight: 58, thighLeft: 57 },
          { id: '2', measurementDate: '2024-01-01', weight: 80, height: 175, bodyFatPercentage: 20, chest: 100, waist: 86, hips: 99, bicepsRight: 35, bicepsLeft: 34, thighRight: 57, thighLeft: 56 },
          { id: '3', measurementDate: '2023-12-15', weight: 82, height: 175, bodyFatPercentage: 22, chest: 98, waist: 88, hips: 100, bicepsRight: 34, bicepsLeft: 33, thighRight: 56, thighLeft: 55 },
          { id: '4', measurementDate: '2023-12-01', weight: 83, height: 175, bodyFatPercentage: 23, chest: 97, waist: 90, hips: 101, bicepsRight: 33, bicepsLeft: 32, thighRight: 55, thighLeft: 54 },
        ]);
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  getMonth(dateStr: string): string {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[new Date(dateStr).getMonth()];
  }

  // Helper methods to handle both API and legacy property names
  getWeight(m: BodyMeasurement | null): number | undefined {
    if (!m) return undefined;
    return m.weightKg ?? m.weight;
  }

  getBodyFatPercent(m: BodyMeasurement | null): number | undefined {
    if (!m) return undefined;
    return m.bodyFatPercent ?? m.bodyFatPercentage;
  }

  getMeasurementDate(m: BodyMeasurement | null): string {
    if (!m) return '';
    return m.dateRecorded ?? m.measurementDate ?? '';
  }
}
