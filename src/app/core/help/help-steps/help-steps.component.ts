import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpStep, HelpJump } from '../help.models';

/** Renders a numbered step list with expected results, an optional note, and jump links. */
@Component({
  selector: 'app-help-steps',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="hs-steps">
      @for (s of steps; track $index) {
        <li>
          <span class="hs-text">{{ s.text }}</span>
          @if (s.result) { <span class="hs-result"><i class="pi pi-check-circle"></i> {{ s.result }}</span> }
        </li>
      }
    </ol>
    @if (note) {
      <div class="hs-note"><i class="pi pi-exclamation-triangle"></i> {{ note }}</div>
    }
    @if (jumps?.length) {
      <div class="hs-jumps">
        @for (j of jumps!; track j.route) {
          <button class="hs-jump" (click)="jump.emit(j.route)"><i class="pi pi-arrow-left"></i> {{ j.label }}</button>
        }
      </div>
    }
  `,
  styles: [`
    .hs-steps { margin: 0; padding: .4rem 1rem 1rem; display: flex; flex-direction: column; gap: .7rem; counter-reset: hstep; list-style: none; }
    .hs-steps li { position: relative; padding-inline-start: 2rem; }
    .hs-steps li::before { counter-increment: hstep; content: counter(hstep); position: absolute; inset-inline-start: 0; top: 0; width: 1.4rem; height: 1.4rem; border-radius: 50%; background: var(--role-solid, var(--primary-500, #3b82f6)); color: #fff; font-size: .72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .hs-text { color: var(--text-primary); font-size: .9rem; }
    .hs-result { display: block; color: var(--text-secondary); font-size: .8rem; margin-top: .2rem; }
    .hs-result i { color: #16a34a; }
    .hs-note { margin: 0 1rem 1rem; padding: .6rem .8rem; background: var(--warn-soft, rgba(217,119,6,.1)); color: var(--warn, #d97706); border-radius: 9px; font-size: .82rem; }
    .hs-jumps { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0 1rem 1rem; }
    .hs-jump { display: inline-flex; align-items: center; gap: .35rem; background: var(--role-soft, rgba(59,130,246,.1)); color: var(--role-solid, var(--primary-500, #3b82f6)); border: none; border-radius: 999px; padding: .35rem .75rem; font-size: .82rem; font-weight: 600; cursor: pointer; }
    .hs-jump:hover { filter: brightness(.97); }
  `]
})
export class HelpStepsComponent {
  @Input() steps: HelpStep[] = [];
  @Input() note?: string;
  @Input() jumps?: HelpJump[];
  @Output() jump = new EventEmitter<string>();
}
