import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpService } from '../help.service';
import { HelpTopic } from '../help.models';
import { HelpStepsComponent } from '../help-steps/help-steps.component';

/**
 * Local, screen-specific assistant. Shows the current screen's steps and lets the
 * user type a question to get step-by-step guidance for THIS screen (falls back
 * to global topics, and flags cross-screen navigation).
 */
@Component({
  selector: 'app-help-local',
  standalone: true,
  imports: [CommonModule, HelpStepsComponent],
  template: `
    @if (help.localOpen() && help.currentScreen(); as screen) {
      <div class="hl-overlay" (click)="help.closeLocal()">
        <div class="hl-panel" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="'مساعدة ' + screen.title">
          <header class="hl-head">
            <div>
              <span class="hl-eyebrow"><i class="pi pi-map-marker"></i> مساعدة هذه الشاشة</span>
              <h3>{{ screen.title }}</h3>
              <p>{{ screen.summary }}</p>
            </div>
            <button class="hl-close" (click)="help.closeLocal()" aria-label="إغلاق"><i class="pi pi-times"></i></button>
          </header>

          <div class="hl-ask">
            <i class="pi pi-comment"></i>
            <input type="text" [value]="query()" (input)="onAsk($any($event.target).value)"
              placeholder="اكتب سؤالك عن هذه الشاشة…" aria-label="اكتب سؤالك" />
          </div>

          <div class="hl-body">
            @if (answer() !== null) {
              @if (answer()!.matches.length) {
                @if (answer()!.scope === 'global') {
                  <div class="hl-hint"><i class="pi pi-info-circle"></i> إجابة من شاشة أخرى — قد تحتاج للانتقال إليها.</div>
                }
                @for (t of answer()!.matches; track t.id) {
                  <div class="hl-answer">
                    <h4>{{ t.question }}</h4>
                    <app-help-steps [steps]="t.steps" [note]="t.note" [jumps]="t.jumps" (jump)="help.navigate($event)"></app-help-steps>
                  </div>
                }
              } @else {
                <div class="hl-empty">
                  <i class="pi pi-search"></i>
                  <p>لم أجد إجابة دقيقة لسؤالك. إليك خطوات هذه الشاشة، أو افتح مركز المساعدة العام.</p>
                  <button class="hl-openglobal" (click)="help.openGlobal()">فتح مركز المساعدة</button>
                </div>
                <app-help-steps [steps]="screen.steps" [note]="screen.note" [jumps]="screen.jumps" (jump)="help.navigate($event)"></app-help-steps>
              }
            } @else {
              <!-- Default: the screen's main steps + suggested questions -->
              <p class="hl-section">خطوات المهمة الأساسية</p>
              <app-help-steps [steps]="screen.steps" [note]="screen.note" [jumps]="screen.jumps" (jump)="help.navigate($event)"></app-help-steps>

              @if (suggestions().length) {
                <p class="hl-section">أسئلة شائعة هنا</p>
                <div class="hl-chips">
                  @for (t of suggestions(); track t.id) {
                    <button class="hl-chip" (click)="pick(t)">{{ t.question }}</button>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hl-overlay { position: fixed; inset: 0; z-index: 1150; background: rgba(15,23,42,.5); backdrop-filter: blur(2px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
    @media (min-width: 720px) { .hl-overlay { align-items: center; padding: 1rem; } }
    .hl-panel { width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 18px 18px 0 0; box-shadow: 0 -10px 50px rgba(0,0,0,.3); animation: up .25s ease; }
    @media (min-width: 720px) { .hl-panel { border-radius: 18px; animation: fade .2s ease; } }
    @keyframes up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .hl-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.4rem .5rem; }
    .hl-eyebrow { font-size: .72rem; font-weight: 700; color: var(--role-solid, var(--primary-500, #3b82f6)); text-transform: uppercase; letter-spacing: .04em; }
    .hl-head h3 { margin: .3rem 0 .1rem; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); }
    .hl-head p { margin: 0; font-size: .85rem; color: var(--text-secondary); }
    .hl-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
    .hl-close:hover { color: var(--text-primary); }

    .hl-ask { position: relative; padding: .75rem 1.4rem 0; }
    .hl-ask i { position: absolute; top: 50%; transform: translateY(-15%); inset-inline-start: 2.1rem; color: var(--text-muted); }
    .hl-ask input { width: 100%; padding: .7rem .8rem .7rem 2.4rem; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); color: var(--text-primary); font-size: .92rem; }
    :host-context([dir="rtl"]) .hl-ask input { padding: .7rem 2.4rem .7rem .8rem; }
    .hl-ask input:focus { outline: none; border-color: var(--role-solid, var(--primary-500, #3b82f6)); }

    .hl-body { flex: 1; overflow-y: auto; padding: .5rem 1.4rem 1.5rem; }
    .hl-section { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 700; margin: 1rem 0 .3rem; }
    .hl-answer h4 { margin: .8rem 0 0; font-size: .95rem; color: var(--text-primary); font-weight: 700; }
    .hl-hint { display: flex; gap: .4rem; align-items: center; font-size: .82rem; color: var(--text-secondary); background: var(--bg-secondary); border-radius: 9px; padding: .5rem .7rem; margin-top: .6rem; }
    .hl-chips { display: flex; flex-wrap: wrap; gap: .5rem; }
    .hl-chip { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 999px; padding: .4rem .8rem; font-size: .84rem; cursor: pointer; }
    .hl-chip:hover { border-color: var(--role-solid, var(--primary-500, #3b82f6)); color: var(--role-solid, var(--primary-500, #3b82f6)); }
    .hl-empty { text-align: center; color: var(--text-muted); padding: 1.2rem 1rem .5rem; }
    .hl-empty i { font-size: 1.6rem; display: block; margin-bottom: .5rem; opacity: .6; }
    .hl-empty p { font-size: .86rem; }
    .hl-openglobal { margin-top: .6rem; background: var(--role-soft, rgba(59,130,246,.1)); color: var(--role-solid, var(--primary-500, #3b82f6)); border: none; border-radius: 9px; padding: .5rem 1rem; font-weight: 600; cursor: pointer; }
  `]
})
export class HelpLocalComponent {
  help = inject(HelpService);
  query = signal('');
  answer = signal<{ matches: HelpTopic[]; scope: 'screen' | 'global' | 'none' } | null>(null);

  readonly suggestions = computed<HelpTopic[]>(() => this.help.currentScreen()?.topics ?? []);

  onAsk(value: string): void {
    this.query.set(value);
    const q = value.trim();
    if (q.length < 2) { this.answer.set(null); return; }
    this.answer.set(this.help.ask(q));
  }

  pick(topic: HelpTopic): void {
    this.query.set(topic.question);
    this.answer.set({ matches: [topic], scope: 'screen' });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.help.localOpen()) this.help.closeLocal(); }
}
