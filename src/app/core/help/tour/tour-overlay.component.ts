import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TourService } from './tour.service';

interface Box { top: number; left: number; width: number; height: number; }

/**
 * Renders the active tour: a spotlight cutout around the target element (via a
 * huge box-shadow) plus a tooltip with prev/next/skip. Navigates between screens
 * and waits for the target to appear (e.g. after a modal opens). Non-blocking —
 * the highlighted element stays clickable so users can act as they're guided.
 */
@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tour.running()) {
      <!-- Full-screen dim for centered (no-target) steps -->
      @if (!box()) { <div class="tour-dim"></div> }

      <!-- Spotlight ring around the target -->
      @if (box(); as b) {
        <div class="tour-spot" [style.top.px]="b.top" [style.left.px]="b.left"
          [style.width.px]="b.width" [style.height.px]="b.height"></div>
      }

      <!-- Tooltip -->
      <div class="tour-tip" [class.centered]="!box()"
        [style.top.px]="tipTop()" [style.left.px]="tipLeft()">
        <div class="tt-head">
          <span class="tt-count">{{ tour.stepIndex() + 1 }} / {{ tour.total() }}</span>
          <button class="tt-skip" (click)="tour.stop()">تخطّي</button>
        </div>
        <h4>{{ tour.currentStep()?.title }}</h4>
        <p>{{ tour.currentStep()?.text }}</p>
        @if (tour.currentStep()?.hint) {
          <div class="tt-hint"><i class="pi pi-hand-point-up"></i> {{ tour.currentStep()?.hint }}</div>
        }
        <div class="tt-actions">
          <button class="tt-btn ghost" (click)="tour.prev()" [disabled]="tour.isFirst()">
            <i class="pi pi-angle-right"></i> السابق
          </button>
          <button class="tt-btn primary" (click)="tour.next()">
            {{ tour.isLast() ? 'إنهاء' : 'التالي' }} <i class="pi" [class.pi-check]="tour.isLast()" [class.pi-angle-left]="!tour.isLast()"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-dim { position: fixed; inset: 0; z-index: 1390; background: rgba(15,23,42,.6); pointer-events: none; }
    .tour-spot {
      position: fixed; z-index: 1391; border-radius: 10px; pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(15,23,42,.6), 0 0 0 3px var(--role-solid, #3b82f6);
      transition: top .25s ease, left .25s ease, width .25s ease, height .25s ease;
    }
    .tour-tip {
      position: fixed; z-index: 1400; width: 320px; max-width: calc(100vw - 2rem);
      background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,.35); padding: 1rem 1.1rem; pointer-events: auto;
      animation: pop .18s ease;
    }
    .tour-tip.centered { top: 50% !important; left: 50% !important; transform: translate(-50%, -50%); }
    @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .tour-tip.centered { animation: none; }
    .tt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .4rem; }
    .tt-count { font-size: .72rem; font-weight: 700; color: var(--role-solid, #3b82f6); background: var(--role-soft, rgba(59,130,246,.12)); padding: .12rem .5rem; border-radius: 999px; }
    .tt-skip { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: .8rem; }
    .tt-skip:hover { color: var(--text-primary); }
    .tour-tip h4 { margin: .1rem 0 .3rem; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
    .tour-tip p { margin: 0; font-size: .88rem; color: var(--text-secondary); line-height: 1.6; }
    .tt-hint { margin-top: .6rem; display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: var(--warn, #d97706); background: var(--warn-soft, rgba(217,119,6,.1)); padding: .4rem .6rem; border-radius: 8px; }
    .tt-actions { display: flex; gap: .5rem; margin-top: .9rem; }
    .tt-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .35rem; height: 38px; border-radius: 9px; font-weight: 600; font-size: .85rem; cursor: pointer; border: none; }
    .tt-btn:disabled { opacity: .4; cursor: not-allowed; }
    .tt-btn.ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
    .tt-btn.primary { background: var(--role-solid, var(--primary-500, #3b82f6)); color: #fff; }
    :host-context([dir="ltr"]) .tt-btn .pi-angle-right { transform: rotate(180deg); }
    :host-context([dir="ltr"]) .tt-btn .pi-angle-left { transform: rotate(180deg); }
  `]
})
export class TourOverlayComponent {
  tour = inject(TourService);
  private router = inject(Router);

  box = signal<Box | null>(null);
  tipTop = signal(0);
  tipLeft = signal(0);
  private targetEl: Element | null = null;
  private token = 0;

  constructor() {
    // Re-locate whenever the step changes (or the tour starts/stops).
    effect(() => {
      const step = this.tour.currentStep();
      if (!step) { this.targetEl = null; this.box.set(null); return; }
      this.locate();
    });
  }

  private async locate(): Promise<void> {
    const my = ++this.token;
    const step = this.tour.currentStep();
    if (!step) return;

    if (step.route && this.pathOf(this.router.url) !== step.route) {
      await this.router.navigateByUrl(step.route);
      if (my !== this.token) return;
    }

    if (!step.target) { this.targetEl = null; this.box.set(null); this.centerTip(); return; }

    const el = await this.waitFor(step.target, 1800);
    if (my !== this.token) return;
    if (!el) { this.targetEl = null; this.box.set(null); this.centerTip(); return; }

    this.targetEl = el;
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    await this.delay(300);
    if (my !== this.token) return;
    this.measure();
  }

  private measure(): void {
    if (!this.targetEl) { this.box.set(null); this.centerTip(); return; }
    const r = this.targetEl.getBoundingClientRect();
    const pad = 6;
    const b: Box = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
    this.box.set(b);
    this.positionTip(b);
  }

  private positionTip(b: Box): void {
    const tipW = Math.min(320, window.innerWidth - 32);
    const tipH = 190; // approximate
    const gap = 12;
    // Prefer below; flip above if not enough room.
    let top = b.top + b.height + gap;
    if (top + tipH > window.innerHeight - 8) top = Math.max(8, b.top - tipH - gap);
    let left = b.left + b.width / 2 - tipW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    this.tipTop.set(top);
    this.tipLeft.set(left);
  }

  private centerTip(): void {
    // handled by .centered class; values irrelevant
    this.tipTop.set(0);
    this.tipLeft.set(0);
  }

  private waitFor(selector: string, timeoutMs: number): Promise<Element | null> {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = () => {
        const el = document.querySelector(selector);
        if (el) { resolve(el); return; }
        if (performance.now() - start > timeoutMs) { resolve(null); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  private pathOf(url: string): string {
    return (url || '/').split('?')[0].split('#')[0];
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.tour.running() && this.targetEl) this.measure();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.tour.running()) this.tour.stop(); }
}
