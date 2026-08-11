import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientService, MyAppointmentDto } from '../services/client.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

type AppointmentStatus = number | string;

@Component({
  selector: 'app-client-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSkeletonComponent],
  template: `
    <main class="appointments-page" aria-labelledby="appointments-title">
      <header class="page-header">
        <div>
          <span class="eyebrow"><i class="pi pi-calendar-plus" aria-hidden="true"></i> المتابعة</span>
          <h1 id="appointments-title">مواعيدي</h1>
          <p>راجع مواعيدك مع المدرب وحالة كل موعد في مساحة التدريب الحالية.</p>
        </div>
        <button class="refresh-button" type="button" (click)="loadAppointments()" [disabled]="loading()" aria-label="تحديث المواعيد">
          <i class="pi" [class.pi-spin]="loading()" [class.pi-spinner]="loading()" [class.pi-refresh]="!loading()" aria-hidden="true"></i>
          {{ loading() ? 'جاري التحديث...' : 'تحديث' }}
        </button>
      </header>

      @if (loading()) {
        <app-loading-skeleton type="table" [rows]="4"></app-loading-skeleton>
      } @else if (errorMessage()) {
        <section class="state-card error-state" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <h2>تعذر تحميل المواعيد</h2>
            <p>{{ errorMessage() }}</p>
            <button class="primary-button" type="button" (click)="loadAppointments()">إعادة المحاولة</button>
          </div>
        </section>
      } @else if (appointments().length === 0) {
        <section class="state-card empty-state">
          <i class="pi pi-calendar" aria-hidden="true"></i>
          <h2>لا توجد مواعيد مسجلة</h2>
          <p>سيظهر هنا أي موعد يحدده لك المدرب.</p>
          <a class="secondary-button" routerLink="/client/dashboard">العودة إلى لوحة التحكم</a>
        </section>
      } @else {
        <section class="summary-card" aria-label="ملخص المواعيد">
          <div><strong>{{ appointments().length }}</strong><span>إجمالي المواعيد</span></div>
          <div><strong>{{ countByStatus(2) }}</strong><span>مؤكدة</span></div>
          <div><strong>{{ countByStatus(1) }}</strong><span>قيد الانتظار</span></div>
        </section>

        <section class="appointments-list" aria-label="قائمة المواعيد">
          @for (appointment of appointments(); track appointment.id) {
            <article class="appointment-card">
              <div class="appointment-date">
                <i class="pi pi-calendar" aria-hidden="true"></i>
                <time [attr.datetime]="appointment.startTime">{{ appointment.startTime | date:'EEEE، d MMMM y' }}</time>
                <span>{{ appointment.startTime | date:'h:mm a' }} - {{ appointment.endTime | date:'h:mm a' }}</span>
              </div>
              <div class="appointment-details">
                <h2>{{ appointment.title || 'جلسة تدريب' }}</h2>
                <p><i class="pi pi-user" aria-hidden="true"></i> {{ appointment.coachName || 'المدرب غير محدد' }}</p>
                @if (appointment.notes) {
                  <p class="notes"><i class="pi pi-info-circle" aria-hidden="true"></i> {{ appointment.notes }}</p>
                }
              </div>
              <span class="status-badge" [class]="statusClass(appointment.status)">{{ statusLabel(appointment.status) }}</span>
            </article>
          }
        </section>
      }
    </main>
  `,
  styles: [`
    :host { display:block; }
    .appointments-page { max-width:1100px; margin:0 auto; padding:1.25rem; color:var(--text-primary,#172033); }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; }
    .eyebrow { display:flex; align-items:center; gap:.4rem; color:#4f46e5; font-size:.8rem; font-weight:800; }
    h1 { margin:.35rem 0; font-size:clamp(1.55rem,3vw,2.15rem); }
    .page-header p { margin:0; color:var(--text-secondary,#64748b); line-height:1.7; }
    .refresh-button,.primary-button,.secondary-button { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; min-height:42px; padding:.6rem .85rem; border-radius:.65rem; font:inherit; font-weight:700; cursor:pointer; text-decoration:none; }
    .refresh-button { border:1px solid var(--border-color,#e2e8f0); background:var(--surface-card,#fff); color:#334155; }
    .primary-button { border:0; background:#4f46e5; color:#fff; }
    .secondary-button { border:1px solid #cbd5e1; background:#f8fafc; color:#334155; }
    button:disabled { opacity:.6; cursor:not-allowed; }
    .state-card { min-height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.55rem; padding:1.5rem; text-align:center; border:1px dashed #cbd5e1; border-radius:1rem; background:var(--surface-card,#fff); }
    .state-card > i { font-size:2.3rem; color:#94a3b8; }
    .state-card h2 { margin:.25rem 0; font-size:1.15rem; }
    .state-card p { margin:0 0 .7rem; color:var(--text-secondary,#64748b); }
    .error-state { flex-direction:row; justify-content:flex-start; text-align:right; border-color:#fecaca; background:#fff7f7; }
    .error-state > i { color:#dc2626; }
    .summary-card { display:grid; grid-template-columns:repeat(3,1fr); gap:.8rem; margin-bottom:1rem; }
    .summary-card > div { display:flex; flex-direction:column; gap:.2rem; padding:1rem; border:1px solid var(--border-color,#e2e8f0); border-radius:.9rem; background:var(--surface-card,#fff); }
    .summary-card strong { color:#4f46e5; font-size:1.5rem; }
    .summary-card span { color:var(--text-secondary,#64748b); font-size:.82rem; }
    .appointments-list { display:grid; gap:.8rem; }
    .appointment-card { display:grid; grid-template-columns:minmax(180px,.8fr) 1fr auto; align-items:center; gap:1rem; padding:1rem; border:1px solid var(--border-color,#e2e8f0); border-radius:1rem; background:var(--surface-card,#fff); box-shadow:0 5px 18px rgba(15,23,42,.04); }
    .appointment-date { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:.2rem .55rem; color:#4338ca; font-weight:800; }
    .appointment-date i { grid-row:span 2; font-size:1.25rem; }
    .appointment-date span { color:var(--text-secondary,#64748b); font-size:.82rem; font-weight:500; }
    .appointment-details h2 { margin:0 0 .35rem; font-size:1rem; }
    .appointment-details p { margin:.2rem 0; color:var(--text-secondary,#64748b); font-size:.86rem; }
    .appointment-details i { margin-inline-end:.25rem; }
    .notes { color:#475569 !important; }
    .status-badge { white-space:nowrap; border-radius:999px; padding:.38rem .65rem; font-size:.78rem; font-weight:800; }
    .status-pending { color:#92400e; background:#fef3c7; }
    .status-confirmed { color:#166534; background:#dcfce7; }
    .status-cancelled { color:#991b1b; background:#fee2e2; }
    .status-completed { color:#3730a3; background:#e0e7ff; }
    .status-unknown { color:#475569; background:#e2e8f0; }
    @media (max-width:700px) { .page-header { flex-direction:column; } .refresh-button { width:100%; } .summary-card { grid-template-columns:1fr; } .appointment-card { grid-template-columns:1fr; align-items:flex-start; } .status-badge { justify-self:start; } .error-state { flex-direction:column; text-align:center; } }
  `]
})
export class ClientAppointmentsComponent implements OnInit {
  private readonly clientService = inject(ClientService);

  readonly appointments = signal<MyAppointmentDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.clientService.getMyAppointments().subscribe({
      next: appointments => {
        this.appointments.set([...(appointments ?? [])].sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
        this.loading.set(false);
      },
      error: () => {
        this.appointments.set([]);
        this.errorMessage.set('تحقق من الاتصال ثم أعد المحاولة.');
        this.loading.set(false);
      }
    });
  }

  countByStatus(status: number): number {
    return this.appointments().filter(appointment => this.statusCode(appointment.status) === status).length;
  }

  statusLabel(status: AppointmentStatus): string {
    switch (this.statusCode(status)) {
      case 1: return 'قيد الانتظار';
      case 2: return 'مؤكد';
      case 3: return 'ملغي';
      case 4: return 'مكتمل';
      default: return 'غير محدد';
    }
  }

  statusClass(status: AppointmentStatus): string {
    switch (this.statusCode(status)) {
      case 1: return 'status-pending';
      case 2: return 'status-confirmed';
      case 3: return 'status-cancelled';
      case 4: return 'status-completed';
      default: return 'status-unknown';
    }
  }

  private statusCode(status: AppointmentStatus): number {
    if (typeof status === 'number') return status;
    const normalized = status.toLowerCase();
    return ({ pending: 1, confirmed: 2, cancelled: 3, completed: 4 } as Record<string, number>)[normalized] ?? Number(status);
  }
}
