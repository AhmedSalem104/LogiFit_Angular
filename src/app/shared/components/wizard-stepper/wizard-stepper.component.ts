import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WizardStep {
  label: string;
  icon?: string;
  completed?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wizard-stepper" [class.diet-theme]="theme === 'diet'" [class.workout-theme]="theme === 'workout'">
      @for (step of steps; track $index; let i = $index; let isLast = $last) {
        <div
          class="wizard-step"
          [class.active]="currentStep === i"
          [class.completed]="currentStep > i || step.completed"
          [class.disabled]="step.disabled"
          (click)="onStepClick(i)"
        >
          <div class="step-indicator">
            @if (currentStep > i || step.completed) {
              <i class="pi pi-check"></i>
            } @else {
              <span class="step-number">{{ i + 1 }}</span>
            }
          </div>
          <div class="step-content">
            <span class="step-label">{{ step.label }}</span>
          </div>
          @if (!isLast) {
            <div class="step-connector">
              <div class="connector-line" [class.filled]="currentStep > i"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .wizard-stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 16px 24px;
      background: var(--premium-bg-elevated);
      border-radius: var(--premium-radius-lg);
      border: 1px solid var(--premium-border-default);
    }

    .wizard-step {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all var(--transition-base);
      padding: 8px 16px;
      border-radius: var(--premium-radius-md);
      position: relative;

      &:hover:not(.disabled) {
        background: var(--premium-bg-hover);
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    .step-indicator {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      background: var(--premium-bg-card);
      border: 2px solid var(--premium-border-default);
      color: var(--premium-text-muted);
      transition: all var(--transition-base);

      .pi {
        font-size: 14px;
      }
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .step-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--premium-text-secondary);
      transition: color var(--transition-base);
      white-space: nowrap;
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: var(--premium-border-default);
      margin: 0 8px;
      position: relative;
      overflow: hidden;

      .connector-line {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 0;
        transition: width 0.5s ease;

        &.filled {
          width: 100%;
        }
      }
    }

    // Active State
    .wizard-step.active {
      .step-indicator {
        border-color: var(--theme-primary, var(--diet-primary));
        background: var(--theme-primary, var(--diet-primary));
        color: white;
        box-shadow: 0 0 20px var(--theme-glow, var(--diet-primary-glow));
      }

      .step-label {
        color: var(--premium-text-primary);
        font-weight: 600;
      }
    }

    // Completed State
    .wizard-step.completed {
      .step-indicator {
        border-color: var(--theme-primary, var(--diet-primary));
        background: var(--theme-primary, var(--diet-primary));
        color: white;
      }

      .step-label {
        color: var(--premium-text-secondary);
      }

      .connector-line {
        background: var(--theme-primary, var(--diet-primary));
      }
    }

    // Diet Theme
    .diet-theme {
      --theme-primary: var(--diet-primary);
      --theme-glow: var(--diet-primary-glow);
    }

    // Workout Theme
    .workout-theme {
      --theme-primary: var(--workout-primary);
      --theme-glow: var(--workout-primary-glow);
    }

    // Responsive
    @media (max-width: 768px) {
      .wizard-stepper {
        padding: 12px 16px;
      }

      .step-label {
        display: none;
      }

      .step-connector {
        width: 30px;
      }

      .wizard-step {
        padding: 8px;
      }
    }

    @media (max-width: 480px) {
      .step-connector {
        width: 20px;
        margin: 0 4px;
      }

      .step-indicator {
        width: 32px;
        height: 32px;
        font-size: 12px;
      }
    }
  `]
})
export class WizardStepperComponent {
  @Input() steps: WizardStep[] = [];
  @Input() currentStep: number = 0;
  @Input() theme: 'diet' | 'workout' = 'diet';
  @Input() allowStepClick: boolean = true;

  @Output() stepChange = new EventEmitter<number>();

  onStepClick(index: number): void {
    if (this.allowStepClick && !this.steps[index]?.disabled) {
      this.stepChange.emit(index);
    }
  }
}
