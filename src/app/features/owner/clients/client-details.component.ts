import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientTrainingOverview, OwnerService } from '../services/owner.service';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="details-page">
      <a routerLink="/owner/clients" class="back-link"><i class="pi pi-arrow-right"></i> العودة إلى العملاء</a>

      @if (loading()) {
        <div class="state">جاري تحميل ملف المشترك وكل بيانات المتابعة...</div>
      } @else if (error()) {
        <div class="state error" role="alert">
          <strong>تعذر تحميل ملف المشترك</strong>
          <p>{{ error() }}</p>
          <button type="button" class="btn" (click)="load()">إعادة المحاولة</button>
        </div>
      } @else if (overview()) {
        <header class="page-header">
          <div>
            <span class="eyebrow">ملف المشترك والمتابعة</span>
            <h1>{{ displayName() }}</h1>
            <p>{{ overview()!.client.email || 'بدون بريد إلكتروني' }} · {{ overview()!.client.phoneNumber || 'بدون هاتف' }}</p>
          </div>
          <span class="status" [class.inactive]="!overview()!.client.isActive">
            {{ overview()!.client.isActive ? 'نشط' : 'غير نشط' }}
          </span>
        </header>

        <section class="summary-grid" aria-label="ملخص المشترك">
          <article><span>الاشتراك الحالي</span><strong>{{ activeSubscriptionLabel() }}</strong></article>
          <article><span>البرامج التدريبية</span><strong>{{ overview()!.workoutPrograms.length }}</strong></article>
          <article><span>الخطط الغذائية</span><strong>{{ overview()!.dietPlans.length }}</strong></article>
          <article><span>آخر نشاط</span><strong>{{ overview()!.lastActivityAt ? (overview()!.lastActivityAt | date:'dd/MM/yyyy HH:mm') : 'لا يوجد' }}</strong></article>
        </section>

        <section class="card quick-actions">
          <div><h2>إجراءات المتابعة</h2><p>أنشئ أو راجع خطة المشترك من نفس الملف دون فقدان سجل القياسات أو الجلسات.</p></div>
          <div class="actions">
            <a class="btn primary" [routerLink]="['/coach/workout-programs/create']" [queryParams]="{ clientId: overview()!.client.id }">برنامج تدريب</a>
            <a class="btn nutrition" [routerLink]="['/coach/diet-plans/create']" [queryParams]="{ clientId: overview()!.client.id }">خطة تغذية</a>
            <a class="btn" routerLink="/owner/subscriptions" [queryParams]="{ clientId: overview()!.client.id }">إدارة الاشتراك</a>
          </div>
        </section>

        <section class="two-columns">
          <article class="card">
            <div class="section-heading"><h2>الاشتراكات والمدفوعات</h2><a routerLink="/owner/subscriptions">فتح الإدارة</a></div>
            @if (overview()!.subscriptions.length) {
              <div class="list">
                @for (subscription of overview()!.subscriptions; track subscription.id) {
                  <div class="list-row">
                    <div><strong>{{ subscription.planName || 'باقة' }}</strong><small>{{ subscription.startDate | date:'dd/MM/yyyy' }} - {{ subscription.endDate | date:'dd/MM/yyyy' }}</small></div>
                    <div class="row-meta"><span class="badge" [class.warn]="subscription.status !== 1">{{ subscriptionStatus(subscription.status) }}</span><small>{{ subscription.amountPaid || 0 | number:'1.0-2' }} / {{ subscription.totalAmount || 0 | number:'1.0-2' }}</small></div>
                  </div>
                  @if (subscription.payments?.length) {
                    <div class="payment-hint">{{ subscription.payments!.length }} دفعة محفوظة · آخر إيصال {{ subscription.payments![0].receiptNumber || '—' }}</div>
                  }
                }
              </div>
            } @else { <div class="empty">لا توجد اشتراكات مسجلة.</div> }
          </article>

          <article class="card">
            <div class="section-heading"><h2>بيانات المتابعة</h2><a routerLink="/coach/measurements">القياسات</a></div>
            <div class="facts">
              <div><span>المدرب</span><strong>{{ overview()!.client.assignedCoachName || 'غير محدد' }}</strong></div>
              <div><span>تاريخ الميلاد</span><strong>{{ overview()!.client.profile?.birthDate ? (overview()!.client.profile?.birthDate | date:'dd/MM/yyyy') : '—' }}</strong></div>
              <div><span>الطول</span><strong>{{ overview()!.client.profile?.heightCm || '—' }} {{ overview()!.client.profile?.heightCm ? 'سم' : '' }}</strong></div>
              <div><span>مستوى النشاط</span><strong>{{ overview()!.client.profile?.activityLevel || '—' }}</strong></div>
              <div><span>جلسات مكتملة</span><strong>{{ overview()!.completedWorkoutSessions || 0 }}</strong></div>
              <div><span>إجمالي سجلات الوجبات</span><strong>{{ overview()!.mealLogs.length }}</strong></div>
            </div>
          </article>
        </section>

        <section class="card">
          <div class="section-heading"><h2>برامج التدريب</h2><a routerLink="/coach/workout-programs">عرض الكل</a></div>
          @if (overview()!.workoutPrograms.length) {
            <div class="plan-grid">
              @for (program of overview()!.workoutPrograms; track program.id) {
                <div class="plan-card workout"><div class="plan-icon"><i class="pi pi-bolt"></i></div><div><strong>{{ program.name }}</strong><span>{{ program.routines?.length || 0 }} أيام · {{ planStatus(program.status) }}</span><small>{{ program.startDate | date:'dd/MM/yyyy' }}{{ program.endDate ? ' - ' + (program.endDate | date:'dd/MM/yyyy') : '' }}</small></div></div>
              }
            </div>
          } @else { <div class="empty">لم يتم إنشاء برنامج تدريب لهذا المشترك بعد.</div> }
        </section>

        <section class="card">
          <div class="section-heading"><h2>الخطط الغذائية</h2><a routerLink="/coach/diet-plans">عرض الكل</a></div>
          @if (overview()!.dietPlans.length) {
            <div class="plan-grid">
              @for (plan of overview()!.dietPlans; track plan.id) {
                <div class="plan-card diet"><div class="plan-icon"><i class="pi pi-heart-fill"></i></div><div><strong>{{ plan.name }}</strong><span>{{ plan.meals?.length || 0 }} وجبات · {{ planStatus(plan.status) }}</span><small>{{ plan.targetCalories || 0 | number:'1.0-0' }} سعرة مستهدفة</small></div></div>
              }
            </div>
          } @else { <div class="empty">لم يتم إنشاء خطة تغذية لهذا المشترك بعد.</div> }
        </section>

        <section class="two-columns">
          <article class="card">
            <div class="section-heading"><h2>القياسات والتقدم</h2><a routerLink="/coach/measurements">فتح القياسات</a></div>
            @if (overview()!.measurements.length) {
              <div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>الوزن</th><th>نسبة الدهون</th><th>ملاحظات</th></tr></thead><tbody>
                @for (measurement of overview()!.measurements.slice(0, 6); track measurement.id) { <tr><td>{{ measurement.dateRecorded | date:'dd/MM/yyyy' }}</td><td>{{ measurement.weightKg ?? '—' }} كجم</td><td>{{ measurement.bodyFatPercent ?? '—' }}%</td><td>{{ measurement.notes || '—' }}</td></tr> }
              </tbody></table></div>
            } @else { <div class="empty">لا توجد قياسات مسجلة.</div> }
          </article>

          <article class="card">
            <div class="section-heading"><h2>الاستعداد اليومي</h2><span class="muted">Check-ins</span></div>
            @if (overview()!.checkins.length) {
              <div class="list compact">
                @for (checkin of overview()!.checkins.slice(0, 6); track checkin.id) { <div class="list-row"><div><strong>{{ checkin.checkinDate | date:'dd/MM/yyyy' }}</strong><small>نوم {{ checkin.sleepHours ?? '—' }} ساعة · إجهاد {{ checkin.fatigue ?? '—' }}/5</small></div><span class="score">{{ checkin.readinessScore ?? '—' }}%</span></div> }
              </div>
            } @else { <div class="empty">لم يسجل المشترك Check-in يوميا بعد.</div> }
          </article>
        </section>

        <section class="activity card">
          <div class="section-heading"><h2>النشاط الأخير</h2><span class="muted">جلسات التمرين وسجل الوجبات محفوظان مع التواريخ</span></div>
          <div class="activity-grid"><div><i class="pi pi-play-circle"></i><strong>{{ overview()!.workoutSessions.length }}</strong><span>جلسة تمرين</span></div><div><i class="pi pi-calendar"></i><strong>{{ overview()!.checkins.length }}</strong><span>Check-in</span></div><div><i class="pi pi-apple"></i><strong>{{ overview()!.mealLogs.length }}</strong><span>وجبة مسجلة</span></div></div>
        </section>
      }
    </main>
  `,
  styles: [`
    .details-page { max-width: 1180px; margin: 0 auto; padding: 2rem; color: #0f172a; }
    .back-link { display: inline-flex; gap: .5rem; align-items: center; color: #2563eb; text-decoration: none; margin-bottom: 1.5rem; }
    .page-header, .section-heading, .quick-actions { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .page-header { margin-bottom: 1.5rem; } .eyebrow, .muted, small, article span { color: #64748b; font-size: .85rem; }
    h1 { margin: .35rem 0; } p { margin: .35rem 0; color: #64748b; } h2 { margin: 0; font-size: 1.08rem; } a { color: #2563eb; text-decoration: none; }
    .status, .badge { padding: .35rem .7rem; border-radius: 999px; color: #166534; background: #dcfce7; white-space: nowrap; } .status.inactive, .badge.warn { color: #991b1b; background: #fee2e2; }
    .summary-grid, .two-columns, .plan-grid { display: grid; gap: 1rem; } .summary-grid { grid-template-columns: repeat(4, 1fr); margin-bottom: 1rem; } .two-columns { grid-template-columns: repeat(2, 1fr); margin-bottom: 1rem; }
    article, .card { padding: 1.25rem; border-radius: 1rem; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.07); } .summary-grid article strong { display: block; margin-top: .55rem; font-size: 1.2rem; }
    .card { margin-bottom: 1rem; } .quick-actions { align-items: center; } .quick-actions p { max-width: 650px; } .actions { display: flex; gap: .5rem; flex-wrap: wrap; }
    .btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: .65rem; padding: .65rem .9rem; cursor: pointer; text-decoration: none; } .btn.primary { color: #fff; border-color: #2563eb; background: #2563eb; } .btn.nutrition { color: #fff; border-color: #16a34a; background: #16a34a; }
    .list { display: grid; gap: .35rem; margin-top: .9rem; } .list-row { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: .8rem 0; border-bottom: 1px solid #e2e8f0; } .list-row:last-child { border-bottom: 0; } .list-row strong, .list-row small { display: block; } .list-row small { margin-top: .25rem; } .row-meta { display: grid; justify-items: end; gap: .3rem; } .payment-hint { color: #475569; background: #f8fafc; padding: .45rem .7rem; border-radius: .5rem; font-size: .8rem; }
    .facts { display: grid; grid-template-columns: repeat(2, 1fr); gap: .9rem; margin-top: 1rem; } .facts span, .facts strong { display: block; } .facts strong { margin-top: .25rem; }
    .plan-grid { grid-template-columns: repeat(2, 1fr); margin-top: .9rem; } .plan-card { display: flex; gap: .8rem; align-items: center; padding: .85rem; border: 1px solid #e2e8f0; border-radius: .8rem; } .plan-card > div:last-child { display: grid; gap: .25rem; } .plan-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: .7rem; color: #fff; background: #7c3aed; } .plan-card.diet .plan-icon { background: #16a34a; }
    .table-wrap { overflow-x: auto; margin-top: .8rem; } table { width: 100%; border-collapse: collapse; } th, td { text-align: right; padding: .65rem .4rem; border-bottom: 1px solid #e2e8f0; font-size: .85rem; } th { color: #64748b; font-weight: 500; } .score { color: #0f766e; font-weight: 700; }
    .activity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin-top: .9rem; } .activity-grid div { display: grid; gap: .2rem; justify-items: center; padding: .8rem; background: #f8fafc; border-radius: .7rem; } .activity-grid i { color: #2563eb; font-size: 1.1rem; } .activity-grid strong { font-size: 1.25rem; }
    .empty { color: #64748b; padding: 1rem 0; } .state { padding: 2rem; text-align: center; border-radius: 1rem; background: #fff; } .error { color: #991b1b; background: #fef2f2; } .error p { color: inherit; } .compact { margin-top: .3rem; }
    @media (max-width: 800px) { .details-page { padding: 1rem; } .summary-grid, .two-columns, .plan-grid { grid-template-columns: 1fr 1fr; } .quick-actions, .page-header { flex-direction: column; } } @media (max-width: 520px) { .summary-grid, .two-columns, .plan-grid, .facts, .activity-grid { grid-template-columns: 1fr; } }
  `]
})
export class ClientDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly owner = inject(OwnerService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly overview = signal<ClientTrainingOverview | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); this.error.set('معرف المشترك غير موجود.'); return; }
    this.loading.set(true);
    this.error.set('');
    this.owner.getClientTrainingOverview(id).subscribe({
      next: value => { this.overview.set(value); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message || 'تعذر تحميل بيانات المشترك والمتابعة.'); this.loading.set(false); }
    });
  }

  displayName(): string { const client = this.overview()?.client; return client?.profile?.fullName || client?.fullName || 'مشترك'; }
  activeSubscriptionLabel(): string { const active = this.overview()?.subscriptions.find(s => s.status === 1 || s.status === 3); return active?.planName || 'لا يوجد اشتراك نشط'; }
  subscriptionStatus(status: number): string { return ({ 1: 'نشط', 2: 'مجمّد', 3: 'تجريبي', 4: 'منتهي', 5: 'ملغي' } as Record<number, string>)[status] || 'غير معروف'; }
  planStatus(status?: number): string { return ({ 1: 'نشط', 2: 'مؤرشف', 3: 'مسودة', 4: 'متوقف', 5: 'مكتمل' } as Record<number, string>)[status || 0] || 'غير محدد'; }
}
