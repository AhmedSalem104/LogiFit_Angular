import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Breadcrumb {
  label: string;
  route?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="page-header__main">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" *ngIf="breadcrumbs.length">
          @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
            @if (crumb.route && !last) {
              <a [routerLink]="crumb.route" class="breadcrumb-link">{{ crumb.label }}</a>
              <i class="pi pi-chevron-left separator"></i>
            } @else {
              <span class="breadcrumb-current">{{ crumb.label }}</span>
            }
          }
        </nav>

        <!-- Title & Subtitle -->
        <div class="page-header__titles">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="page-header__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumb-link {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: #3b82f6;
      }
    }

    .separator {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    :host-context([dir="ltr"]) .separator {
      transform: rotate(180deg);
    }

    .breadcrumb-current {
      color: var(--text-primary);
      font-weight: 500;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0.5rem 0 0;
    }

    .page-header__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .page-header__actions {
        justify-content: flex-start;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() breadcrumbs: Breadcrumb[] = [];
}
