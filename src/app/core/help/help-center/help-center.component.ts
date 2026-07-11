import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpService } from '../help.service';
import { HelpTopic } from '../help.models';
import { HelpStepsComponent } from '../help-steps/help-steps.component';

/**
 * Global help assistant: a persistent floating button + a slide-in drawer with
 * role-aware guided flows and a search over every screen's topics.
 */
@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, HelpStepsComponent],
  template: `
    <!-- Floating button (always available) -->
    <button class="help-fab" (click)="help.openGlobal()" aria-label="مساعدة عامة" title="مركز المساعدة">
      <i class="pi pi-question"></i>
    </button>

    @if (help.globalOpen()) {
      <div class="help-overlay" (click)="help.closeGlobal()">
        <aside class="help-drawer" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="مركز المساعدة">
          <header class="hd-head">
            <div>
              <h2><i class="pi pi-compass"></i> مركز المساعدة</h2>
              <p>دليلك خطوة بخطوة داخل النظام</p>
            </div>
            <button class="hd-close" (click)="help.closeGlobal()" aria-label="إغلاق"><i class="pi pi-times"></i></button>
          </header>

          <div class="hd-search">
            <i class="pi pi-search"></i>
            <input type="text" [value]="query()" (input)="onSearch($any($event.target).value)"
              placeholder="ابحث عن أي مهمة… مثلاً: إضافة عميل" aria-label="بحث" />
          </div>

          <div class="hd-body">
            @if (results() !== null) {
              <!-- Search results -->
              @if (results()!.length) {
                <p class="hd-section">نتائج البحث</p>
                @for (t of results()!; track t.id) {
                  <details class="hd-topic">
                    <summary>{{ t.question }}</summary>
                    <app-help-steps [steps]="t.steps" [note]="t.note" [jumps]="t.jumps" (jump)="help.navigate($event)"></app-help-steps>
                  </details>
                }
              } @else {
                <div class="hd-empty">
                  <i class="pi pi-search"></i>
                  <p>لم نجد نتيجة مطابقة. جرّب كلمات أبسط، أو تصفّح الأدلة بالأسفل.</p>
                </div>
              }
            } @else {
              <!-- Current screen shortcut -->
              @if (help.currentScreen(); as s) {
                <button class="hd-current" (click)="help.openLocal()">
                  <i class="pi pi-map-marker"></i>
                  <span>مساعدة هذه الشاشة: <b>{{ s.title }}</b></span>
                  <i class="pi pi-angle-left chev"></i>
                </button>
              }

              <!-- Guided flows for the role -->
              <p class="hd-section">أدلة إرشادية</p>
              @for (flow of help.guidedFlows(); track flow.id) {
                <details class="hd-flow">
                  <summary>
                    <span class="flow-icon"><i class="pi {{ flow.icon }}"></i></span>
                    <span class="flow-titles"><b>{{ flow.title }}</b><small>{{ flow.description }}</small></span>
                  </summary>
                  <ol class="flow-steps">
                    @for (st of flow.steps; track $index) {
                      <li>
                        <span class="fs-text">{{ st.text }}</span>
                        @if (st.result) { <span class="fs-result"><i class="pi pi-check-circle"></i> {{ st.result }}</span> }
                        @if (st.route) { <button class="fs-go" (click)="help.navigate(st.route!)">اذهب <i class="pi pi-arrow-left"></i></button> }
                      </li>
                    }
                  </ol>
                </details>
              }
              @if (!help.guidedFlows().length) {
                <div class="hd-empty"><i class="pi pi-info-circle"></i><p>استخدم البحث بالأعلى للسؤال عن أي مهمة.</p></div>
              }
            }
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .help-fab {
      position: fixed; bottom: 1.5rem; inset-inline-end: 1.5rem; z-index: 900;
      width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--gradient-primary, #3b82f6); color: #fff; font-size: 1.4rem;
      box-shadow: 0 8px 24px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    .help-fab:hover { transform: translateY(-2px) scale(1.05); }
    @media (max-width: 640px) { .help-fab { width: 48px; height: 48px; bottom: 1rem; inset-inline-end: 1rem; } }

    .help-overlay { position: fixed; inset: 0; z-index: 1200; background: rgba(15,23,42,.5); backdrop-filter: blur(2px); display: flex; justify-content: flex-start; }
    :host-context([dir="rtl"]) .help-overlay { justify-content: flex-start; }
    .help-drawer {
      width: 420px; max-width: 92vw; height: 100%; background: var(--bg-primary);
      border-inline-end: 1px solid var(--border-color); display: flex; flex-direction: column;
      box-shadow: 0 0 60px rgba(0,0,0,.3); animation: slideIn .25s ease;
    }
    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    :host-context([dir="rtl"]) .help-drawer { animation: slideInR .25s ease; }
    @keyframes slideInR { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .hd-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid var(--border-color); }
    .hd-head h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
    .hd-head p { margin: .2rem 0 0; font-size: .85rem; color: var(--text-secondary); }
    .hd-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
    .hd-close:hover { color: var(--text-primary); }

    .hd-search { position: relative; padding: 1rem 1.25rem 0; }
    .hd-search i { position: absolute; top: 50%; transform: translateY(-25%); inset-inline-start: 1.9rem; color: var(--text-muted); }
    .hd-search input { width: 100%; padding: .7rem .8rem .7rem 2.4rem; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); color: var(--text-primary); font-size: .92rem; }
    :host-context([dir="rtl"]) .hd-search input { padding: .7rem 2.4rem .7rem .8rem; }
    .hd-search input:focus { outline: none; border-color: var(--primary-500, #3b82f6); }

    .hd-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem 2rem; }
    .hd-section { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 700; margin: 1.1rem 0 .6rem; }

    .hd-current { width: 100%; display: flex; align-items: center; gap: .6rem; padding: .8rem 1rem; border: 1px solid var(--role-solid, var(--primary-500, #3b82f6)); background: var(--role-soft, rgba(59,130,246,.1)); color: var(--text-primary); border-radius: 12px; cursor: pointer; font-size: .9rem; }
    .hd-current .chev { margin-inline-start: auto; color: var(--text-muted); }
    :host-context([dir="ltr"]) .hd-current .chev { transform: rotate(180deg); }

    .hd-flow, .hd-topic { border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: .7rem; overflow: hidden; background: var(--bg-primary); }
    .hd-flow > summary, .hd-topic > summary { cursor: pointer; padding: .85rem 1rem; list-style: none; display: flex; align-items: center; gap: .75rem; font-weight: 600; color: var(--text-primary); }
    .hd-flow > summary::-webkit-details-marker, .hd-topic > summary::-webkit-details-marker { display: none; }
    .hd-flow > summary:hover, .hd-topic > summary:hover { background: var(--bg-secondary); }
    .flow-icon { width: 34px; height: 34px; flex-shrink: 0; border-radius: 9px; background: var(--role-soft, rgba(59,130,246,.12)); color: var(--role-solid, #3b82f6); display: flex; align-items: center; justify-content: center; }
    .flow-titles { display: flex; flex-direction: column; }
    .flow-titles small { color: var(--text-secondary); font-weight: 400; font-size: .78rem; }

    .flow-steps { margin: 0; padding: .3rem 1rem 1rem 1rem; display: flex; flex-direction: column; gap: .7rem; counter-reset: step; list-style: none; }
    .flow-steps li { position: relative; padding-inline-start: 2rem; }
    .flow-steps li::before { counter-increment: step; content: counter(step); position: absolute; inset-inline-start: 0; top: 0; width: 1.4rem; height: 1.4rem; border-radius: 50%; background: var(--role-solid, var(--primary-500, #3b82f6)); color: #fff; font-size: .72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .fs-text { color: var(--text-primary); font-size: .9rem; }
    .fs-result { display: block; color: var(--text-secondary); font-size: .8rem; margin-top: .2rem; }
    .fs-result i { color: #16a34a; }
    .fs-go { margin-top: .35rem; display: inline-flex; align-items: center; gap: .3rem; background: none; border: none; color: var(--role-solid, var(--primary-500, #3b82f6)); font-weight: 600; font-size: .82rem; cursor: pointer; padding: 0; }

    .hd-empty { text-align: center; color: var(--text-muted); padding: 2rem 1rem; }
    .hd-empty i { font-size: 1.8rem; display: block; margin-bottom: .6rem; opacity: .6; }
    .hd-empty p { font-size: .88rem; }
  `]
})
export class HelpCenterComponent {
  help = inject(HelpService);
  query = signal('');
  results = signal<HelpTopic[] | null>(null);

  onSearch(value: string): void {
    this.query.set(value);
    const q = value.trim();
    if (q.length < 2) { this.results.set(null); return; }
    this.results.set(this.help.ask(q).matches);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.help.globalOpen()) this.help.closeGlobal(); }
}
