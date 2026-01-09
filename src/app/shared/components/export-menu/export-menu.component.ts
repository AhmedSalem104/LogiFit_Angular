import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ExportFormat = 'pdf' | 'word' | 'text' | 'csv' | 'print' | 'preview';

@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-container" [class.open]="isOpen">
      <!-- Main Export Button -->
      <button
        class="export-btn"
        (click)="toggleMenu()"
        [class.active]="isOpen"
        [disabled]="disabled"
      >
        <i class="pi pi-download"></i>
        <span>{{ buttonLabel }}</span>
        <i class="pi pi-chevron-down chevron" [class.rotated]="isOpen"></i>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen) {
        <div class="export-dropdown" (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <i class="pi pi-file-export"></i>
            <span>تصدير البيانات</span>
          </div>

          <div class="dropdown-content">
            <!-- PDF -->
            <button class="export-option" (click)="onExport('pdf')">
              <div class="option-icon pdf">
                <i class="pi pi-file-pdf"></i>
              </div>
              <div class="option-info">
                <span class="option-label">PDF</span>
                <span class="option-desc">مستند محمول للطباعة</span>
              </div>
            </button>

            <!-- Word -->
            <button class="export-option" (click)="onExport('word')">
              <div class="option-icon word">
                <i class="pi pi-file-word"></i>
              </div>
              <div class="option-info">
                <span class="option-label">Word</span>
                <span class="option-desc">مستند قابل للتحرير</span>
              </div>
            </button>

            <!-- Excel/CSV -->
            <button class="export-option" (click)="onExport('csv')">
              <div class="option-icon excel">
                <i class="pi pi-file-excel"></i>
              </div>
              <div class="option-info">
                <span class="option-label">Excel / CSV</span>
                <span class="option-desc">جدول بيانات</span>
              </div>
            </button>

            <!-- Text -->
            <button class="export-option" (click)="onExport('text')">
              <div class="option-icon text">
                <i class="pi pi-file"></i>
              </div>
              <div class="option-info">
                <span class="option-label">نص عادي</span>
                <span class="option-desc">ملف TXT بسيط</span>
              </div>
            </button>

            <div class="dropdown-divider"></div>

            <!-- Print Preview -->
            <button class="export-option" (click)="onExport('preview')">
              <div class="option-icon preview">
                <i class="pi pi-eye"></i>
              </div>
              <div class="option-info">
                <span class="option-label">معاينة الطباعة</span>
                <span class="option-desc">عرض قبل الطباعة</span>
              </div>
            </button>

            <!-- Print -->
            <button class="export-option print" (click)="onExport('print')">
              <div class="option-icon print-icon">
                <i class="pi pi-print"></i>
              </div>
              <div class="option-info">
                <span class="option-label">طباعة مباشرة</span>
                <span class="option-desc">طباعة فورية</span>
              </div>
            </button>
          </div>
        </div>
      }

      <!-- Backdrop -->
      @if (isOpen) {
        <div class="backdrop" (click)="closeMenu()"></div>
      }
    </div>
  `,
  styles: [`
    .export-container {
      position: relative;
      display: inline-block;
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--primary-400);
      }

      &.active {
        background: var(--bg-secondary);
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      i {
        font-size: 1rem;
        color: var(--text-secondary);
      }

      .chevron {
        font-size: 0.75rem;
        transition: transform 0.2s ease;
        margin-right: -0.25rem;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    :host-context([dir="ltr"]) .export-btn .chevron {
      margin-right: 0;
      margin-left: -0.25rem;
    }

    .export-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 280px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }

    :host-context([dir="ltr"]) .export-dropdown {
      left: auto;
      right: 0;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);

      i {
        font-size: 1.125rem;
        color: var(--primary-500);
      }

      span {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .dropdown-content {
      padding: 0.5rem;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 0;
    }

    .export-option {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: right;

      &:hover {
        background: var(--bg-tertiary);

        .option-icon {
          transform: scale(1.1);
        }
      }
    }

    :host-context([dir="ltr"]) .export-option {
      text-align: left;
    }

    .option-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;

      i {
        font-size: 1.125rem;
      }

      &.pdf {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      &.word {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.excel {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }

      &.text {
        background: rgba(100, 116, 139, 0.1);
        color: #64748b;
      }

      &.preview {
        background: rgba(249, 115, 22, 0.1);
        color: #f97316;
      }

      &.print-icon {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        color: var(--primary-500);
      }
    }

    .option-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .option-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .option-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
    }

    /* Dark mode adjustments */
    :host-context(.dark) {
      .export-dropdown {
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      }
    }
  `]
})
export class ExportMenuComponent {
  @Input() buttonLabel = 'تصدير';
  @Input() disabled = false;
  @Output() export = new EventEmitter<ExportFormat>();

  isOpen = false;

  toggleMenu(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  onExport(format: ExportFormat): void {
    this.export.emit(format);
    this.closeMenu();
  }
}
