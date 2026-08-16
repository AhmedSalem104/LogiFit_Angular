import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Trainee, BodyMeasurement, AthleteCheckin } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MeasurementDialogComponent, MeasurementValue } from '../../../shared/components/measurement-dialog/measurement-dialog.component';

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
    FormsModule,
    RouterLink,
    NgxChartsModule,
    TabViewModule,
    TagModule,
    ButtonModule,
    PageHeaderComponent,
    ChartCardComponent,
    LoadingSkeletonComponent,
    MeasurementDialogComponent
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

      <div class="state-card error-state" *ngIf="!loading() && errorMessage()" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <strong>تعذر تحميل بيانات المتدرب</strong>
          <p>{{ errorMessage() }}</p>
          <button type="button" class="btn btn-secondary" (click)="retryLoad()">إعادة المحاولة</button>
        </div>
      </div>

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
                      <td>{{ m.heightCm ?? m.height ?? '-' }} سم</td>
                      <td>{{ m.bodyFatPercent ?? m.bodyFatPercentage ?? '-' }}%</td>
                      <td>{{ m.chestCm ?? m.chest ?? '-' }} سم</td>
                      <td>{{ m.waistCm ?? m.waist ?? '-' }} سم</td>
                      <td>
                        <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editMeasurement(m)" aria-label="تعديل القياس"></button>
                        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteMeasurement(m)" aria-label="حذف القياس"></button>
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

          <!-- Daily readiness tab -->
          <p-tabPanel header="الاستعداد اليومي">
            <div class="tab-toolbar">
              <div><strong>سجل المتابعة اليومية</strong><small>النوم، الإجهاد، الألم، المزاج والوزن</small></div>
              <button type="button" class="btn btn-primary" (click)="openCheckinEditor()"><i class="pi pi-plus"></i> إضافة متابعة</button>
            </div>
            <div class="measurements-table">
              <table>
                <thead><tr><th>التاريخ</th><th>الاستعداد</th><th>النوم</th><th>الإجهاد</th><th>ألم العضلات</th><th>ملاحظات</th><th>إجراءات</th></tr></thead>
                <tbody>
                  @for (checkin of checkins(); track checkin.id) {
                    <tr><td>{{ formatDate(checkin.checkinDate) }}</td><td>{{ checkin.readinessScore ?? '-' }}%</td><td>{{ checkin.sleepHours ?? '-' }} ساعة</td><td>{{ checkin.fatigue ?? '-' }}/5</td><td>{{ checkin.soreness ?? '-' }}/5</td><td>{{ checkin.notes || '-' }}</td><td class="row-actions"><button type="button" class="link-button" (click)="editCheckin(checkin)">تعديل</button><button type="button" class="link-button danger" (click)="deleteCheckin(checkin)">حذف</button></td></tr>
                  } @empty { <tr><td colspan="7" class="empty-row">لا توجد Check-ins مسجلة</td></tr> }
                </tbody>
              </table>
            </div>
            @if (checkinDialogOpen()) {
              <section class="checkin-editor" aria-label="تحرير المتابعة اليومية">
                <div class="editor-header"><div><h3>{{ editingCheckin() ? 'تعديل المتابعة اليومية' : 'إضافة متابعة يومية' }}</h3><p>احفظ السجل داخل ملف المشترك ليظهر في التقدم والتنبيهات.</p></div><button type="button" class="link-button" (click)="closeCheckinEditor()">إلغاء</button></div>
                <div class="checkin-form-grid">
                  <label>التاريخ<input type="date" [(ngModel)]="checkinForm.checkinDate"></label>
                  <label>النوم بالساعات<input type="number" min="0" max="24" [(ngModel)]="checkinForm.sleepHours"></label>
                  <label>الإجهاد من 5<input type="number" min="0" max="5" [(ngModel)]="checkinForm.fatigue"></label>
                  <label>ألم العضلات من 5<input type="number" min="0" max="5" [(ngModel)]="checkinForm.soreness"></label>
                  <label>التوتر من 5<input type="number" min="0" max="5" [(ngModel)]="checkinForm.stress"></label>
                  <label>المزاج من 5<input type="number" min="0" max="5" [(ngModel)]="checkinForm.mood"></label>
                  <label>الوزن<input type="number" min="0" [(ngModel)]="checkinForm.bodyweightKg"></label>
                  <label class="full-field">ملاحظات<textarea rows="2" [(ngModel)]="checkinForm.notes"></textarea></label>
                </div>
                <div class="editor-actions"><button type="button" class="btn" (click)="closeCheckinEditor()">إلغاء</button><button type="button" class="btn btn-primary" [disabled]="checkinSaving()" (click)="saveCheckin()">{{ checkinSaving() ? 'جاري الحفظ...' : 'حفظ المتابعة' }}</button></div>
              </section>
            }
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
                <button class="btn btn-outline" (click)="openWorkoutBuilder()">تغيير</button>
              </div>

              <div class="program-card" *ngIf="trainee()?.currentDietPlanId">
                <div class="program-icon diet">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="program-info">
                  <h4>خطة التغذية الحالية</h4>
                  <p>خطة بناء العضلات - 2500 سعرة</p>
                </div>
                <button class="btn btn-outline" (click)="openDietBuilder()">تغيير</button>
              </div>

              <div class="assign-program" *ngIf="!trainee()?.currentWorkoutProgramId || !trainee()?.currentDietPlanId">
                <i class="pi pi-plus-circle"></i>
                <p>تعيين برنامج جديد</p>
                <button class="btn btn-primary" (click)="openWorkoutBuilder()">تعيين</button>
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

      <app-measurement-dialog
        [open]="measurementDialogOpen()"
        mode="add"
        [saving]="savingMeasurement()"
        (save)="onSaveMeasurement($event)"
        (cancel)="measurementDialogOpen.set(false)"
      ></app-measurement-dialog>
    </div>
  `,
  styles: [`
    .state-card { display:flex; align-items:center; gap:.75rem; min-height:130px; padding:1.25rem; margin-bottom:1.25rem; border:1px dashed #fecaca; border-radius:16px; color:#991b1b; background:#fff7f7; }
    .state-card i { font-size:1.5rem; color:#dc2626; }
    .state-card p { margin:.35rem 0 .75rem; color:#7f1d1d; }
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

    .tab-toolbar, .editor-header, .editor-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .tab-toolbar { margin-bottom: 1rem; }
    .tab-toolbar strong, .tab-toolbar small { display: block; }
    .tab-toolbar small, .editor-header p { color: var(--text-muted); font-size: .82rem; margin: .25rem 0 0; }
    .checkin-editor { margin-top: 1rem; padding: 1rem; border: 1px solid #bfdbfe; border-radius: 14px; background: #eff6ff; }
    .editor-header h3 { margin: 0; font-size: 1rem; }
    .checkin-form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-top: 1rem; }
    .checkin-form-grid label { display: grid; gap: .3rem; color: var(--text-secondary); font-size: .82rem; }
    .checkin-form-grid input, .checkin-form-grid textarea { width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: .55rem; background: var(--bg-primary); color: var(--text-primary); font: inherit; }
    .checkin-form-grid .full-field { grid-column: 1 / -1; }
    .editor-actions { justify-content: flex-start; margin-top: 1rem; }
    .link-button { border: 0; padding: .2rem .35rem; background: transparent; color: #2563eb; cursor: pointer; font: inherit; }
    .link-button.danger { color: #dc2626; }
    .row-actions { white-space: nowrap; }

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

      .checkin-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class TraineeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  trainee = signal<Trainee | null>(null);
  measurements = signal<BodyMeasurement[]>([]);
  checkins = signal<AthleteCheckin[]>([]);
  workoutHistory = signal<{ date: string; workout: string; duration: number }[]>([]);
  sessions = signal<any[]>([]);
  measurementDialogOpen = signal(false);
  savingMeasurement = signal(false);
  checkinDialogOpen = signal(false);
  editingCheckin = signal<AthleteCheckin | null>(null);
  checkinSaving = signal(false);
  checkinForm = {
    checkinDate: this.today(),
    sleepHours: null as number | null,
    fatigue: null as number | null,
    soreness: null as number | null,
    stress: null as number | null,
    mood: null as number | null,
    bodyweightKg: null as number | null,
    notes: ''
  };

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
    const byMonth = new Map<string, number>();
    for (const session of this.sessions()) {
      const date = new Date(session.startedAt);
      if (!Number.isFinite(date.getTime())) continue;
      const key = date.toLocaleDateString('ar-EG', { month: 'short' });
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    }
    if (byMonth.size > 0) {
      return Array.from(byMonth.entries()).map(([name, value]) => ({ name, value }));
    }
    return [];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTraineeData(id);
    }
  }

  loadTraineeData(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.coachService.getTraineeById(id).subscribe({
      next: (data) => {
        this.trainee.set(data);
        this.loading.set(false);
        // Load this trainee's measurements (keyed by client id).
        const clientId = data.clientId || id;
        this.loadMeasurements(clientId);
        this.loadSessions(clientId);
        this.loadCheckins(clientId);
      },
      error: (err) => {
        console.error('Error loading trainee data:', err);
        this.notificationService.error('حدث خطأ في تحميل البيانات');
        this.errorMessage.set('تعذر الاتصال بالخادم أو لم يعد هذا المتدرب متاحاً.');
        this.trainee.set(null);
        this.measurements.set([]);
        this.checkins.set([]);
        this.workoutHistory.set([]);
        this.loading.set(false);
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadTraineeData(id);
  }

  private loadMeasurements(clientId: string): void {
    this.coachService.getMeasurements(clientId).subscribe({
      next: (list) => this.measurements.set(list || []),
      error: () => this.measurements.set([])
    });
  }

  private loadSessions(clientId: string): void {
    this.coachService.getWorkoutSessions(clientId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions || []);
        this.workoutHistory.set((sessions || []).map(session => ({
          date: session.startedAt,
          workout: session.routineName || 'جلسة تمرين',
          duration: session.endedAt
            ? Math.max(0, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
            : 0
        })));
      },
      error: () => {
        this.sessions.set([]);
        this.workoutHistory.set([]);
      }
    });
  }

  private loadCheckins(clientId: string): void {
    this.coachService.getAthleteCheckins(clientId).subscribe({
      next: rows => this.checkins.set(rows || []),
      error: () => this.checkins.set([])
    });
  }

  today(): string { return new Date().toISOString().slice(0, 10); }

  openCheckinEditor(checkin?: AthleteCheckin): void {
    this.editingCheckin.set(checkin || null);
    this.checkinForm = {
      checkinDate: checkin?.checkinDate?.slice(0, 10) || this.today(),
      sleepHours: checkin?.sleepHours ?? null,
      fatigue: checkin?.fatigue ?? null,
      soreness: checkin?.soreness ?? null,
      stress: checkin?.stress ?? null,
      mood: checkin?.mood ?? null,
      bodyweightKg: checkin?.bodyweightKg ?? null,
      notes: checkin?.notes || ''
    };
    this.checkinDialogOpen.set(true);
  }

  editCheckin(checkin: AthleteCheckin): void { this.openCheckinEditor(checkin); }

  closeCheckinEditor(): void {
    this.checkinDialogOpen.set(false);
    this.editingCheckin.set(null);
    this.checkinSaving.set(false);
  }

  saveCheckin(): void {
    const clientId = this.getClientId();
    if (!clientId || !this.checkinForm.checkinDate) {
      this.notificationService.error('تعذر تحديد المشترك أو تاريخ المتابعة.');
      return;
    }

    const payload = Object.fromEntries(Object.entries(this.checkinForm).filter(([, value]) => value !== null && value !== '')) as Partial<AthleteCheckin>;
    this.checkinSaving.set(true);
    const editing = this.editingCheckin();
    const onSuccess = (result?: string): void => {
      this.checkinSaving.set(false);
      this.closeCheckinEditor();
      if (editing) {
        this.checkins.update(rows => rows.map(row => row.id === editing.id ? { ...row, ...payload } as AthleteCheckin : row));
      } else {
        const created: AthleteCheckin = { id: result || crypto.randomUUID(), clientId, ...payload } as AthleteCheckin;
        this.checkins.update(rows => [created, ...rows]);
      }
      this.notificationService.success(editing ? 'تم تحديث المتابعة اليومية.' : 'تم تسجيل المتابعة اليومية.');
    };
    const onError = (error: any): void => {
      this.checkinSaving.set(false);
      this.notificationService.error(error?.translatedMessage || error?.error?.message || 'تعذر حفظ المتابعة اليومية.');
    };

    if (editing) {
      this.coachService.updateAthleteCheckin(clientId, editing.id, payload).subscribe({ next: () => onSuccess(), error: onError });
    } else {
      this.coachService.createAthleteCheckin(clientId, payload).subscribe({ next: result => onSuccess(result), error: onError });
    }
  }

  deleteCheckin(checkin: AthleteCheckin): void {
    const clientId = this.getClientId();
    if (!clientId || !window.confirm('هل تريد حذف سجل المتابعة هذا؟')) return;
    this.coachService.deleteAthleteCheckin(clientId, checkin.id).subscribe({
      next: () => {
        this.checkins.update(rows => rows.filter(row => row.id !== checkin.id));
        this.notificationService.success('تم حذف المتابعة اليومية.');
      },
      error: (error) => this.notificationService.error(error?.translatedMessage || error?.error?.message || 'تعذر حذف المتابعة اليومية.')
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

  private getClientId(): string | null {
    return this.trainee()?.clientId || this.route.snapshot.paramMap.get('id');
  }

  openWorkoutBuilder(): void {
    const clientId = this.getClientId();
    if (!clientId) {
      this.notificationService.error('تعذر تحديد المتدرب لإنشاء البرنامج');
      return;
    }
    this.router.navigate(['/coach/workout-programs/create'], { queryParams: { clientId } });
  }

  openDietBuilder(): void {
    const clientId = this.getClientId();
    if (!clientId) {
      this.notificationService.error('تعذر تحديد المتدرب لإنشاء الخطة');
      return;
    }
    this.router.navigate(['/coach/diet-plans/create'], { queryParams: { clientId } });
  }

  addMeasurement(): void {
    this.measurementDialogOpen.set(true);
  }

  editMeasurement(measurement: BodyMeasurement): void {
    this.notificationService.info('يمكن تعديل القياس من شاشة القياسات مع الحفاظ على السجل السابق.');
    this.router.navigate(['/coach/measurements'], { queryParams: { edit: measurement.id } });
  }

  deleteMeasurement(measurement: BodyMeasurement): void {
    if (!window.confirm('هل تريد حذف هذا القياس؟ سيظل سجل الخطة والتدريب محفوظا.')) return;
    this.coachService.deleteMeasurement(measurement.id).subscribe({
      next: () => { this.measurements.update(rows => rows.filter(row => row.id !== measurement.id)); this.notificationService.success('تم حذف القياس.'); },
      error: e => this.notificationService.error(e?.translatedMessage || 'تعذر حذف القياس.')
    });
  }

  onSaveMeasurement(value: MeasurementValue): void {
    const clientId = this.trainee()?.clientId || this.route.snapshot.paramMap.get('id') || undefined;
    if (!clientId) { this.notificationService.error('تعذّر تحديد المتدرب'); return; }

    this.savingMeasurement.set(true);
    this.coachService.createMeasurement({ ...value, clientId }).subscribe({
      next: (created) => {
        this.savingMeasurement.set(false);
        this.measurementDialogOpen.set(false);
        // Prepend so the newest shows first without a full reload.
        this.measurements.update(list => [created, ...list]);
        this.notificationService.success('تم إضافة القياس بنجاح');
      },
      error: (e) => {
        this.savingMeasurement.set(false);
        this.notificationService.error(e?.translatedMessage || 'تعذّر حفظ القياس');
      }
    });
  }
}
