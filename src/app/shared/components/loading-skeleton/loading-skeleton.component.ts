import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [ngSwitch]="type">
      <!-- Card Skeleton -->
      <div *ngSwitchCase="'card'" class="skeleton-card">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>

      <!-- Table Skeleton -->
      <div *ngSwitchCase="'table'" class="skeleton-table">
        <div class="skeleton-row header">
          <div class="skeleton skeleton-cell" *ngFor="let col of [1,2,3,4,5]"></div>
        </div>
        <div class="skeleton-row" *ngFor="let row of skeletonRows">
          <div class="skeleton skeleton-cell" *ngFor="let col of [1,2,3,4,5]"></div>
        </div>
      </div>

      <!-- Stats Skeleton -->
      <div *ngSwitchCase="'stats'" class="skeleton-stats">
        <div class="skeleton-stat" *ngFor="let stat of [1,2,3,4]">
          <div class="skeleton skeleton-icon"></div>
          <div class="skeleton-stat-content">
            <div class="skeleton skeleton-label"></div>
            <div class="skeleton skeleton-value"></div>
          </div>
        </div>
      </div>

      <!-- Chart Skeleton -->
      <div *ngSwitchCase="'chart'" class="skeleton-chart">
        <div class="skeleton-chart-header">
          <div class="skeleton skeleton-chart-title"></div>
        </div>
        <div class="skeleton-chart-body">
          <div class="skeleton skeleton-bar" *ngFor="let bar of skeletonBars" [style.height.%]="bar"></div>
        </div>
      </div>

      <!-- Text Skeleton (default) -->
      <div *ngSwitchDefault class="skeleton-text-block">
        <div class="skeleton skeleton-line" *ngFor="let line of skeletonLines" [style.width.%]="line"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Card Skeleton */
    .skeleton-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-title {
      height: 20px;
      width: 60%;
    }

    .skeleton-text {
      height: 14px;
      width: 100%;

      &.short {
        width: 40%;
      }
    }

    /* Table Skeleton */
    .skeleton-table {
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .skeleton-row {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);

      &.header {
        background: var(--bg-secondary);
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .skeleton-cell {
      flex: 1;
      height: 16px;
    }

    /* Stats Skeleton */
    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .skeleton-stat {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--bg-primary);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }

    .skeleton-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
    }

    .skeleton-stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-label {
      height: 14px;
      width: 70%;
    }

    .skeleton-value {
      height: 28px;
      width: 50%;
    }

    /* Chart Skeleton */
    .skeleton-chart {
      background: var(--bg-primary);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .skeleton-chart-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .skeleton-chart-title {
      height: 20px;
      width: 120px;
    }

    .skeleton-chart-body {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      padding: 1.5rem;
      height: 250px;
      gap: 0.5rem;
    }

    .skeleton-bar {
      width: 100%;
      max-width: 40px;
      border-radius: 4px 4px 0 0;
    }

    /* Text Block Skeleton */
    .skeleton-text-block {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-line {
      height: 16px;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'table' | 'stats' | 'chart' | 'text' = 'text';
  @Input() rows = 5;

  get skeletonRows(): number[] {
    return Array(this.rows).fill(0);
  }

  skeletonBars = [60, 80, 45, 90, 70, 55, 85, 40, 75, 65];
  skeletonLines = [100, 90, 95, 70];
}
