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
      padding: 1.5rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    .status-card {
      width: 100%; max-width: 460px; background: #fff; border-radius: 18px;
      padding: 2.5rem 2rem; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.35);
      position: relative;
    }
    .status-icon {
      width: 84px; height: 84px; margin: 0 auto 1.5rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #fef2f2; color: #dc2626; font-size: 2.25rem;
    }
    .status-icon.billing { background: #fffbeb; color: #d97706; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: .75rem; }
    .status-message { color: #475569; line-height: 1.7; margin-bottom: 2rem; }
    .actions { display: flex; flex-direction: column; gap: .85rem; }
    .support-hint { color: #64748b; font-size: .9rem; margin: 0; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
      height: 48px; border-radius: 10px; font-size: 1rem; font-weight: 600;
      cursor: pointer; border: none; width: 100%;
    }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-ghost:hover { background: #f8fafc; }
    .code-tag {
      position: absolute; top: 1rem; inset-inline-end: 1rem; font-size: .7rem;
      color: #cbd5e1; font-family: monospace; letter-spacing: .5px;
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
