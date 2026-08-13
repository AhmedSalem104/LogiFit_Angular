import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CoachDashboardReport,
  CoachService,
  CoachTraineeReport
} from '../services/coach.service';
import { ReportsService } from '../../owner/services/reports.service';
import { FinancialReport } from '../../../shared/models/api.models';

@Component({
  selector: 'app-coach-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="reports-page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Coaching Studio</span>
          <h1>تقارير العملاء والدخل</h1>
          <p>صورة مختصرة عن العملاء النشطين والبرامج والجلسات والمتابعة.</p>
        </div>
        <a routerLink="/coach/trainees" class="btn secondary"><i class="pi pi-users"></i> إدارة العملاء</a>
      </header>

      @if (loading()) {
        <div class="state loading"><i class="pi pi-spin pi-spinner"></i> جاري تحميل التقارير...</div>
      } @else if (error()) {
        <div class="state error" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <div><strong>تعذر تحميل تقارير التدريب</strong><p>{{ error() }}</p></div>
          <button type="button" class="btn secondary" (click)="load()">إعادة المحاولة</button>
        </div>
      } @else {
        <div class="metrics">
          <article class="metric"><i class="pi pi-users"></i><span>العملاء</span><strong>{{ report()?.totalClients ?? trainees().length }}</strong></article>
          <article class="metric"><i class="pi pi-check-circle"></i><span>العملاء النشطون</span><strong>{{ report()?.activeClients ?? activeClients() }}</strong></article>
          <article class="metric"><i class="pi pi-calendar"></i><span>الجلسات هذا الشهر</span><strong>{{ report()?.totalSessionsThisMonth ?? 0 }}</strong></article>
          <article class="metric"><i class="pi pi-wallet"></i><span>الدخل الشهري</span><strong>{{ financial()?.monthlyRevenue ?? 0 | number:'1.0-2' }}</strong></article>
        </div>

        <section class="card">
          <div class="card-header"><h2>ملخص العملاء</h2><span>{{ trainees().length }} سجل</span></div>
          @if (trainees().length) {
            <div class="table-wrap">
              <table>
                <thead><tr><th>العميل</th><th>الحالة</th><th>البرامج</th><th>الجلسات</th><th>آخر جلسة</th></tr></thead>
                <tbody>
                  @for (trainee of trainees(); track trainee.clientId) {
                    <tr>
                      <td><a [routerLink]="['/coach/trainees', trainee.clientId]">{{ trainee.clientName }}</a></td>
                      <td><span class="status" [class.active]="trainee.isActive">{{ trainee.isActive ? 'نشط' : 'متوقف' }}</span></td>
                      <td>{{ (trainee.workoutProgramsCount || 0) + (trainee.dietPlansCount || 0) }}</td>
                      <td>{{ trainee.workoutSessionsCount || 0 }}</td>
                      <td>{{ trainee.lastSessionDate ? (trainee.lastSessionDate | date:'yyyy/MM/dd') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty"><i class="pi pi-chart-line"></i><p>لا توجد بيانات عملاء بعد.</p><a routerLink="/coach/trainees" class="btn primary">إضافة أول عميل</a></div>
          }
        </section>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .reports-page { max-width: 1180px; }
    .page-header, .card-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .page-header { margin-bottom: 1.25rem; }
    .eyebrow { color: var(--primary-500, #3b82f6); font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    h1, h2, p { margin: 0; }
    h1 { margin-top: .25rem; color: var(--text-primary); font-size: 1.65rem; }
    h2 { color: var(--text-primary); font-size: 1.05rem; }
    .page-header p, .card-header span { color: var(--text-secondary); margin-top: .35rem; font-size: .9rem; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    .metric, .card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px; }
    .metric { padding: 1rem; display: grid; grid-template-columns: auto 1fr; gap: .2rem .7rem; align-items: center; }
    .metric i { grid-row: span 2; font-size: 1.35rem; color: var(--primary-500, #3b82f6); }
    .metric span { color: var(--text-secondary); font-size: .82rem; }
    .metric strong { color: var(--text-primary); font-size: 1.5rem; }
    .card { padding: 1.25rem; }
    .card-header { padding-bottom: .9rem; border-bottom: 1px solid var(--border-color); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
    th, td { padding: .75rem .55rem; text-align: start; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
    th { color: var(--text-secondary); font-size: .8rem; font-weight: 700; }
    td { color: var(--text-primary); font-size: .9rem; }
    td a { color: var(--primary-600, #2563eb); font-weight: 700; text-decoration: none; }
    .status { color: var(--text-secondary); font-size: .78rem; }
    .status.active { color: var(--success-600, #059669); font-weight: 700; }
    .state { min-height: 150px; border: 1px dashed var(--border-color); border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: .75rem; color: var(--text-secondary); }
    .state.error { color: #991b1b; background: #fff7f7; }
    .state.error p { margin-top: .3rem; color: #7f1d1d; }
    .empty { padding: 2.5rem 1rem; text-align: center; color: var(--text-secondary); }
    .empty i { display: block; font-size: 2rem; color: var(--primary-500, #3b82f6); margin-bottom: .75rem; }
    .empty p { margin-bottom: 1rem; }
    .btn { display: inline-flex; align-items: center; gap: .45rem; border-radius: 9px; min-height: 40px; padding: 0 .9rem; border: 1px solid transparent; text-decoration: none; cursor: pointer; font: inherit; font-weight: 700; }
    .btn.primary { background: var(--primary-500, #3b82f6); color: #fff; }
    .btn.secondary { background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary); }
    @media (max-width: 800px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 560px) { .page-header { align-items: flex-start; flex-direction: column; } .metrics { grid-template-columns: 1fr; } }
  `]
})
export class CoachReportsComponent implements OnInit {
  private readonly coachService = inject(CoachService);
  private readonly reportsService = inject(ReportsService);
  report = signal<CoachDashboardReport | null>(null);
  trainees = signal<CoachTraineeReport[]>([]);
  financial = signal<FinancialReport | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      dashboard: this.coachService.getCoachDashboardReport(),
      trainees: this.coachService.getCoachTraineesReport(),
      financial: this.reportsService.getFinancialReport()
    }).subscribe({
      next: value => { this.report.set(value.dashboard); this.trainees.set(value.trainees ?? []); this.financial.set(value.financial); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message || err?.message || 'حدث خطأ غير متوقع.'); this.loading.set(false); }
    });
  }

  activeClients(): number { return this.trainees().filter(item => item.isActive).length; }
}
