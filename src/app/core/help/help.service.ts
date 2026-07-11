import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { SCREEN_HELP, GUIDED_FLOWS } from './help-content';
import { ScreenHelp, HelpTopic, GuidedFlow } from './help.models';
import { searchTopics } from './help-search';

@Injectable({ providedIn: 'root' })
export class HelpService {
  private router = inject(Router);
  private auth = inject(AuthService);

  private readonly url = signal<string>(this.pathOf(this.router.url));
  private readonly globalOpenSig = signal(false);
  private readonly localOpenSig = signal(false);

  readonly globalOpen = this.globalOpenSig.asReadonly();
  readonly localOpen = this.localOpenSig.asReadonly();

  /** The help entry for the screen the user is on (longest route-prefix match). */
  readonly currentScreen = computed<ScreenHelp | null>(() => {
    const path = this.url();
    let best: ScreenHelp | null = null;
    for (const s of SCREEN_HELP) {
      if (path.startsWith(s.route) && (!best || s.route.length > best.route.length)) best = s;
    }
    return best;
  });

  /** True when the current screen has curated help (drives the local "?" button). */
  readonly hasLocalHelp = computed(() => !!this.currentScreen());

  /** Guided flows for the signed-in user's workspace (none before login). */
  readonly guidedFlows = computed<GuidedFlow[]>(() => {
    if (!this.auth.isAuthenticated()) return [];
    const role = this.roleScope();
    return GUIDED_FLOWS.filter(f => f.role === role);
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.url.set(this.pathOf(e.urlAfterRedirects || e.url)));
  }

  private pathOf(url: string): string {
    return (url || '/').split('?')[0].split('#')[0];
  }

  private roleScope(): 'owner' | 'coach' | 'client' {
    if (this.auth.isCoach()) return 'coach';
    if (this.auth.isClient()) return 'client';
    return 'owner';
  }

  openGlobal(): void { this.localOpenSig.set(false); this.globalOpenSig.set(true); }
  closeGlobal(): void { this.globalOpenSig.set(false); }
  openLocal(): void { this.globalOpenSig.set(false); this.localOpenSig.set(true); }
  closeLocal(): void { this.localOpenSig.set(false); }

  navigate(route: string): void {
    this.globalOpenSig.set(false);
    this.localOpenSig.set(false);
    this.router.navigateByUrl(route);
  }

  /** Answer a free-text question against the current screen, then all screens. */
  ask(query: string): { matches: HelpTopic[]; scope: 'screen' | 'global' | 'none' } {
    const screen = this.currentScreen();
    if (screen?.topics?.length) {
      const local = searchTopics(query, screen.topics);
      if (local.length) return { matches: local, scope: 'screen' };
    }
    const allTopics = SCREEN_HELP.flatMap(s => s.topics ?? []);
    const global = searchTopics(query, allTopics, 4);
    return global.length ? { matches: global, scope: 'global' } : { matches: [], scope: 'none' };
  }
}
