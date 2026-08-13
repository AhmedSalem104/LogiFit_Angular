import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-coach-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="settings-page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Coaching Studio</span>
          <h1>إعدادات مساحة التدريب</h1>
          <p>إدارة الحساب والاشتراك ومساحة العمل من تجربة المدرب الحر.</p>
        </div>
      </header>
      <div class="settings-grid">
        <article class="card">
          <div class="icon account"><i class="pi pi-user"></i></div>
          <h2>الملف الشخصي</h2>
          <p>حدّث بياناتك الشخصية وكلمة المرور وصورة الحساب.</p>
          <a routerLink="/coach/profile" class="btn primary">فتح الملف الشخصي</a>
        </article>
        <article class="card">
          <div class="icon billing"><i class="pi pi-credit-card"></i></div>
          <h2>اشتراك مساحة التدريب</h2>
          <p>راجع الباقة، حالة الدفع، والفواتير الخاصة بمساحتك.</p>
          <a routerLink="/coach/subscription" class="btn primary">إدارة الاشتراك</a>
        </article>
        <article class="card workspace-card">
          <div class="icon workspace"><i class="pi pi-briefcase"></i></div>
          <h2>المساحة الحالية</h2>
          <dl>
            <div><dt>المالك</dt><dd>{{ auth.user()?.fullName || auth.user()?.email || '—' }}</dd></div>
            <div><dt>نوع المساحة</dt><dd>FreelanceCoach</dd></div>
            <div><dt>الميزات المتاحة</dt><dd>{{ auth.capabilities().length }}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .settings-page { max-width: 1050px; }
    .page-header { margin-bottom: 1.25rem; }
    .eyebrow { color: var(--primary-500, #3b82f6); font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    h1, h2, p { margin: 0; }
    h1 { margin-top: .25rem; color: var(--text-primary); font-size: 1.65rem; }
    .page-header p { margin-top: .35rem; color: var(--text-secondary); }
    .settings-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .card { min-height: 230px; padding: 1.25rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px; display: flex; flex-direction: column; align-items: flex-start; }
    .icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 1rem; color: #fff; }
    .icon.account { background: var(--gradient-primary, #3b82f6); }
    .icon.billing { background: var(--gradient-success, #10b981); }
    .icon.workspace { background: var(--gradient-info, #0ea5e9); }
    h2 { color: var(--text-primary); font-size: 1.05rem; }
    .card p { color: var(--text-secondary); line-height: 1.7; margin: .5rem 0 1.25rem; }
    .btn { display: inline-flex; align-items: center; min-height: 40px; padding: 0 .9rem; border-radius: 9px; text-decoration: none; font-weight: 700; margin-top: auto; }
    .btn.primary { background: var(--primary-500, #3b82f6); color: #fff; }
    dl { width: 100%; margin: .25rem 0 0; }
    dl div { display: flex; justify-content: space-between; gap: .75rem; padding: .55rem 0; border-bottom: 1px solid var(--border-color); }
    dt { color: var(--text-secondary); } dd { margin: 0; color: var(--text-primary); font-weight: 700; text-align: end; }
    @media (max-width: 800px) { .settings-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .settings-grid { grid-template-columns: 1fr; } }
  `]
})
export class CoachSettingsComponent {
  protected readonly auth = inject(AuthService);
}
