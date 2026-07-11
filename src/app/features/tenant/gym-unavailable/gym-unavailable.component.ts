import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TenantStatusService } from '../../../core/tenant/tenant-status.service';
import { TenantStatusInfo, isTenantStatusCode, tenantStatusInfo } from '../../../core/tenant/tenant-status';

/**
 * Full-screen status page shown when the current gym is blocked
 * (suspended / expired / cancelled / archived). Reached via the global error
 * interceptor with ?reason=TENANT_* . Billing problems offer a renew CTA to
 * owners; hard blocks (suspended/archived) point to support.
 */
@Component({
  selector: 'app-gym-unavailable',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-page">
      <div class="status-card">
        <div class="status-icon" [class.billing]="info()?.kind === 'billing'">
          <i [class]="info()?.icon || 'pi pi-exclamation-triangle'"></i>
        </div>

        <h1>{{ info()?.title || 'الصالة غير متاحة' }}</h1>
        <p class="status-message">{{ info()?.message || 'حدثت مشكلة في الوصول إلى صالتك.' }}</p>

        <div class="actions">
          @if (info()?.kind === 'billing' && canManageBilling()) {
            <button class="btn btn-primary" (click)="goRenew()">
              <i class="pi pi-credit-card"></i> تجديد الاشتراك / الدفع
            </button>
          } @else if (info()?.kind === 'billing') {
            <p class="support-hint">تواصل مع صاحب الصالة لتجديد الاشتراك.</p>
          } @else {
            <p class="support-hint">للمساعدة، تواصل مع الدعم الفني.</p>
          }

          <button class="btn btn-ghost" (click)="backToLogin()">
            <i class="pi pi-sign-out"></i> العودة لتسجيل الدخول
          </button>
        </div>

        <span class="code-tag" *ngIf="info()">{{ info()?.code }}</span>
      </div>
    </div>
  `,
  styles: [`
    .status-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; background: var(--bg-secondary);
    }
    .status-card {
      width: 100%; max-width: 460px; background: var(--bg-primary);
      border: 1px solid var(--border-color); border-radius: 18px;
      padding: 2.5rem 2rem; text-align: center; box-shadow: var(--shadow-lg, 0 20px 60px rgba(0,0,0,.15));
      position: relative;
    }
    .status-icon {
      width: 84px; height: 84px; margin: 0 auto 1.5rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(239, 68, 68, .12); color: #ef4444; font-size: 2.25rem;
    }
    .status-icon.billing { background: rgba(217, 119, 6, .12); color: #d97706; }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: .75rem; }
    .status-message { color: var(--text-secondary); line-height: 1.7; margin-bottom: 2rem; }
    .actions { display: flex; flex-direction: column; gap: .85rem; }
    .support-hint { color: var(--text-muted); font-size: .9rem; margin: 0; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
      height: 48px; border-radius: 10px; font-size: 1rem; font-weight: 600;
      cursor: pointer; border: none; width: 100%;
    }
    .btn-primary { background: var(--primary-500); color: #fff; }
    .btn-primary:hover { filter: brightness(.95); }
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
    .btn-ghost:hover { background: var(--bg-secondary); }
    .code-tag {
      position: absolute; top: 1rem; inset-inline-end: 1rem; font-size: .7rem;
      color: var(--text-muted); font-family: monospace; letter-spacing: .5px;
    }
  `]
})
export class GymUnavailableComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private tenantStatus = inject(TenantStatusService);

  /** Prefer the live block state; fall back to the ?reason= query param on reload. */
  readonly info = signal<TenantStatusInfo | null>(this.resolveInfo());

  canManageBilling(): boolean {
    return this.auth.hasPermission('ManageTenantBilling');
  }

  private resolveInfo(): TenantStatusInfo | null {
    const live = this.tenantStatus.block();
    if (live) return live;
    const reason = this.route.snapshot.queryParamMap.get('reason');
    return isTenantStatusCode(reason) ? tenantStatusInfo(reason) : null;
  }

  goRenew(): void {
    this.router.navigate(['/owner/subscription'], { queryParams: { upgrade: 1 } });
  }

  backToLogin(): void {
    this.tenantStatus.clear();
    this.auth.logout();
  }
}
