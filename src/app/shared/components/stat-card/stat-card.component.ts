import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface StatCardData {
  title: string;
  value: number | string;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a *ngIf="link" [routerLink]="link" class="stat-card stat-card--link" [class]="'stat-card--' + color">
      <ng-container *ngTemplateOutlet="cardContent"></ng-container>
    </a>
    <div *ngIf="!link" class="stat-card" [class]="'stat-card--' + color">
      <ng-container *ngTemplateOutlet="cardContent"></ng-container>
    </div>

    <ng-template #cardContent>
      <div class="stat-card__icon">
        <i [class]="'pi ' + icon"></i>
      </div>
      <div class="stat-card__content">
        <span class="stat-card__title">{{ title }}</span>
        <div class="stat-card__value-wrapper">
          <span class="stat-card__value" *ngIf="!loading">{{ formattedValue }}</span>
          <div class="skeleton skeleton-value" *ngIf="loading"></div>
        </div>
        <div class="stat-card__trend" *ngIf="trend !== undefined && !loading" [class.positive]="trend >= 0" [class.negative]="trend < 0">
          <i [class]="trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
          <span>{{ Math.abs(trend) | number:'1.1-1' }}%</span>
          <span class="trend-label" *ngIf="trendLabel">{{ trendLabel }}</span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-color);
      }

      &.stat-card--link {
        text-decoration: none;
        cursor: pointer;
      }
    }

    .stat-card__icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.5rem;
        color: white;
      }
    }

    .stat-card--primary .stat-card__icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .stat-card--success .stat-card__icon {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    .stat-card--warning .stat-card__icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .stat-card--danger .stat-card__icon {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .stat-card--info .stat-card__icon {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    }

    .stat-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-card__title {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .stat-card__value-wrapper {
      min-height: 2.25rem;
    }

    .stat-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .skeleton-value {
      width: 80px;
      height: 28px;
      border-radius: 6px;
    }

    .stat-card__trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      margin-top: 0.25rem;

      i {
        font-size: 0.7rem;
      }

      &.positive {
        color: #16a34a;
      }

      &.negative {
        color: #dc2626;
      }

      .trend-label {
        color: var(--text-muted);
        margin-right: 0.25rem;
      }
    }

    :host-context([dir="ltr"]) .stat-card__trend .trend-label {
      margin-right: 0;
      margin-left: 0.25rem;
    }
  `]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: number | string = 0;
  @Input() icon = 'pi-chart-bar';
  @Input() trend?: number;
  @Input() trendLabel?: string;
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
  @Input() loading = false;
  @Input() isCurrency = false;
  @Input() link?: string;

  Math = Math;

  get formattedValue(): string {
    if (typeof this.value === 'string') {
      return this.value;
    }

    if (this.isCurrency) {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0
      }).format(this.value);
    }

    return new Intl.NumberFormat('ar-EG').format(this.value);
  }
}
