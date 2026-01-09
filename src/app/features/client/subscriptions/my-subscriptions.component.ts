import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, ClientSubscription, SubscriptionStatus } from '../services/client.service';

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-subscriptions-page">
      <app-page-header
        title="اشتراكاتي"
        subtitle="إدارة اشتراكاتك في الصالة"
        [breadcrumbs]="[{label: 'اشتراكاتي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="subscriptions-content" *ngIf="!loading()">
        <!-- Active Subscription -->
        @if (activeSubscription()) {
          <div class="active-subscription card">
            <div class="subscription-badge active">
              <i class="pi pi-check-circle"></i>
              اشتراك نشط
            </div>

            <div class="subscription-header">
              <h2>{{ activeSubscription()?.planName }}</h2>
              <div class="subscription-price">
                <span class="amount">{{ activeSubscription()?.price | number }}</span>
                <span class="currency">جنيه</span>
              </div>
            </div>

            <div class="subscription-details">
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <div class="detail-info">
                  <span class="label">تاريخ البدء</span>
                  <span class="value">{{ formatDate(activeSubscription()?.startDate) }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-calendar-times"></i>
                <div class="detail-info">
                  <span class="label">تاريخ الانتهاء</span>
                  <span class="value">{{ formatDate(activeSubscription()?.endDate) }}</span>
                </div>
              </div>
              <div class="detail-item highlight">
                <i class="pi pi-clock"></i>
                <div class="detail-info">
                  <span class="label">الأيام المتبقية</span>
                  <span class="value">{{ activeSubscription()?.remainingDays }} يوم</span>
                </div>
              </div>
            </div>

            <div class="subscription-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
              </div>
              <div class="progress-labels">
                <span>{{ progressPercentage() }}% مستخدم</span>
                <span>{{ 100 - progressPercentage() }}% متبقي</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="no-subscription card">
            <i class="pi pi-credit-card"></i>
            <h2>لا يوجد اشتراك نشط</h2>
            <p>ليس لديك اشتراك نشط حالياً. تواصل مع إدارة الصالة للاشتراك.</p>
          </div>
        }

        <!-- Subscription History -->
        <div class="history-section">
          <h3>سجل الاشتراكات</h3>
          <div class="history-list">
            @for (sub of subscriptions(); track sub.id) {
              <div class="history-item" [class.active]="isActiveStatus(sub.status)">
                <div class="history-header">
                  <h4>{{ sub.planName }}</h4>
                  <span class="status-badge" [class]="getStatusClass(sub.status)">
                    {{ getStatusLabel(sub.status) }}
                  </span>
                </div>
                <div class="history-info">
                  <span class="date-range">
                    {{ formatDate(sub.startDate) }} - {{ formatDate(sub.endDate) }}
                  </span>
                  <span class="price">{{ sub.price | number }} جنيه</span>
                </div>
              </div>
            } @empty {
              <div class="empty-history">
                <p>لا يوجد سجل اشتراكات</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-subscriptions-page {
      max-width: 800px;
      padding-bottom: 2rem;
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .active-subscription {
      position: relative;
      border: 2px solid #22c55e;
    }

    .subscription-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;

      &.active {
        background: #22c55e;
        color: white;
      }
    }

    :host-context([dir="ltr"]) .subscription-badge {
      right: auto;
      left: 20px;
    }

    .subscription-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-top: 0.5rem;

      h2 {
        margin: 0;
        color: var(--text-primary);
      }
    }

    .subscription-price {
      text-align: left;

      .amount {
        font-size: 2rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .currency {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-right: 0.25rem;
      }
    }

    :host-context([dir="ltr"]) .subscription-price {
      text-align: right;

      .currency {
        margin-right: 0;
        margin-left: 0.25rem;
      }
    }

    .subscription-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;

      i {
        font-size: 1.5rem;
        color: var(--text-muted);
      }

      &.highlight {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);

        i {
          color: #3b82f6;
        }

        .value {
          color: #3b82f6;
          font-weight: 700;
        }
      }
    }

    .detail-info {
      display: flex;
      flex-direction: column;

      .label {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .subscription-progress {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .progress-bar {
      height: 12px;
      background: var(--bg-tertiary);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      border-radius: 6px;
      transition: width 0.3s;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .no-subscription {
      text-align: center;
      padding: 3rem;

      i {
        font-size: 4rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      h2 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .history-section {
      h3 {
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .history-item {
      padding: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;

      &.active {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.05);
      }
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      h4 {
        margin: 0;
        color: var(--text-primary);
      }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;

      &.active {
        background: #dcfce7;
        color: #16a34a;
      }

      &.expired {
        background: #fef2f2;
        color: #dc2626;
      }

      &.pending, &.frozen {
        background: #fef3c7;
        color: #d97706;
      }

      &.cancelled {
        background: #fef2f2;
        color: #dc2626;
      }
    }

    .history-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .empty-history {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .subscription-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .subscription-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MySubscriptionsComponent implements OnInit {
  private clientService = inject(ClientService);

  loading = signal(true);
  subscriptions = signal<ClientSubscription[]>([]);

  activeSubscription = () => this.subscriptions().find(s => this.isActiveStatus(s.status));

  progressPercentage = () => {
    const active = this.activeSubscription();
    if (!active) return 0;

    const start = new Date(active.startDate).getTime();
    const end = new Date(active.endDate).getTime();
    const now = Date.now();

    const total = end - start;
    const elapsed = now - start;

    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);

    this.clientService.getMySubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Mock data
        this.subscriptions.set([
          {
            id: '1',
            planName: 'الاشتراك الشهري',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            status: SubscriptionStatus.Active,
            price: 500,
            remainingDays: 16
          },
          {
            id: '2',
            planName: 'الاشتراك الشهري',
            startDate: '2023-12-01',
            endDate: '2023-12-31',
            status: SubscriptionStatus.Expired,
            price: 500,
            remainingDays: 0
          },
          {
            id: '3',
            planName: 'الاشتراك الشهري',
            startDate: '2023-11-01',
            endDate: '2023-11-30',
            status: SubscriptionStatus.Expired,
            price: 450,
            remainingDays: 0
          }
        ]);
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  // Helper to check if status is active (handles enum, string, and number)
  isActiveStatus(status: SubscriptionStatus | string | number): boolean {
    return status === 0 || status === SubscriptionStatus.Active || status === 'active';
  }

  // Helper to get CSS class for status
  getStatusClass(status: SubscriptionStatus | string | number): string {
    // Handle numeric values (from API)
    if (status === 0 || status === SubscriptionStatus.Active || status === 'active') return 'active';
    if (status === 1 || status === SubscriptionStatus.Expired || status === 'expired') return 'expired';
    if (status === 2 || status === SubscriptionStatus.Frozen || status === 'frozen' || status === 'pending') return 'frozen';
    if (status === 3 || status === SubscriptionStatus.Cancelled || status === 'cancelled') return 'cancelled';
    return '';
  }

  getStatusLabel(status: SubscriptionStatus | string | number): string {
    // Handle numeric values (from API: 0=Active, 1=Expired, 2=Frozen, 3=Cancelled)
    if (status === 0 || status === SubscriptionStatus.Active) return 'نشط';
    if (status === 1 || status === SubscriptionStatus.Expired) return 'منتهي';
    if (status === 2 || status === SubscriptionStatus.Frozen) return 'مجمد';
    if (status === 3 || status === SubscriptionStatus.Cancelled) return 'ملغي';

    // Handle string values (legacy)
    const labels: Record<string, string> = {
      active: 'نشط',
      expired: 'منتهي',
      frozen: 'مجمد',
      pending: 'مجمد',
      cancelled: 'ملغي'
    };
    return labels[status as string] || String(status);
  }
}
