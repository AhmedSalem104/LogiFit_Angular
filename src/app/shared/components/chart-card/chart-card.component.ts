import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="chart-card__header">
        <div class="chart-card__title-wrapper">
          <h3 class="chart-card__title">{{ title }}</h3>
          <p class="chart-card__subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="chart-card__actions">
          <button
            *ngIf="showRefresh"
            class="action-btn"
            (click)="refresh.emit()"
            [disabled]="loading"
            title="تحديث"
          >
            <i class="pi pi-refresh" [class.pi-spin]="loading"></i>
          </button>
          <button
            *ngIf="showExport"
            class="action-btn"
            (click)="export.emit()"
            title="تصدير"
          >
            <i class="pi pi-download"></i>
          </button>
        </div>
      </div>

      <div class="chart-card__body" [style.height.px]="height">
        <!-- Loading State -->
        <div class="chart-skeleton" *ngIf="loading">
          <div class="skeleton-bar" *ngFor="let bar of skeletonBars" [style.height.%]="bar"></div>
        </div>

        <!-- Error State -->
        <div class="chart-error" *ngIf="error && !loading">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button class="btn btn-secondary" (click)="refresh.emit()">
            <i class="pi pi-refresh"></i>
            إعادة المحاولة
          </button>
        </div>

        <!-- Empty State -->
        <div class="chart-empty" *ngIf="isEmpty && !loading && !error">
          <i class="pi pi-chart-bar"></i>
          <p>{{ emptyMessage }}</p>
        </div>

        <!-- Chart Content -->
        <ng-content *ngIf="!loading && !error && !isEmpty"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .chart-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .chart-card__title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .chart-card__subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .chart-card__actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .chart-card__body {
      padding: 1.5rem;
      position: relative;
    }

    .chart-skeleton {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 100%;
      gap: 0.5rem;
    }

    .skeleton-bar {
      width: 100%;
      max-width: 40px;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px 4px 0 0;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .chart-error,
    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: var(--text-secondary);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin-bottom: 1rem;
      }
    }

    .chart-error {
      i {
        color: #f59e0b;
      }
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-tertiary);
      }
    }
  `]
})
export class ChartCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() height = 300;
  @Input() loading = false;
  @Input() error?: string;
  @Input() isEmpty = false;
  @Input() emptyMessage = 'لا توجد بيانات لعرضها';
  @Input() showRefresh = true;
  @Input() showExport = false;

  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  skeletonBars = [60, 80, 45, 90, 70, 55, 85, 40, 75, 65];
}
