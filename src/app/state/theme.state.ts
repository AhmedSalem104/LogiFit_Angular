import { Injectable, signal, effect, computed } from '@angular/core';
import { environment } from '../../environments/environment';

export type Theme = 'light' | 'dark';
export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

@Injectable({
  providedIn: 'root'
})
export class ThemeState {
  // Theme state
  private _darkMode = signal<boolean>(this.loadTheme() === 'dark');
  private _language = signal<Language>(this.loadLanguage());
  // Desktop starts as a compact rail that expands on hover.  The user can pin it
  // open, while phones always start with a closed drawer.
  private _isMobileViewport = signal<boolean>(this.isMobileViewport());
  private _sidebarPinned = signal<boolean>(this.loadSidebarPinned());
  private _mobileSidebarOpen = signal<boolean>(false);

  // Public readonly signals
  readonly darkMode = this._darkMode.asReadonly();
  readonly language = this._language.asReadonly();
  readonly sidebarCollapsed = computed(() =>
    this._isMobileViewport() ? !this._mobileSidebarOpen() : !this._sidebarPinned()
  );

  // Computed
  readonly theme = (): Theme => this._darkMode() ? 'dark' : 'light';
  readonly direction = (): Direction => this._language() === 'ar' ? 'rtl' : 'ltr';
  readonly isRtl = (): boolean => this._language() === 'ar';

  constructor() {
    // Apply theme on changes
    effect(() => {
      this.applyTheme(this._darkMode());
    });

    // Apply language/direction on changes
    effect(() => {
      this.applyLanguage(this._language());
    });

    // Initial apply
    this.applyTheme(this._darkMode());
    this.applyLanguage(this._language());
  }

  /**
   * Toggle dark/light mode
   */
  toggleDarkMode(): void {
    this._darkMode.update(v => !v);
    this.saveTheme(this._darkMode() ? 'dark' : 'light');
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this._darkMode.set(theme === 'dark');
    this.saveTheme(theme);
  }

  /**
   * Toggle language
   */
  toggleLanguage(): void {
    const newLang: Language = this._language() === 'ar' ? 'en' : 'ar';
    this._language.set(newLang);
    this.saveLanguage(newLang);
  }

  /**
   * Set specific language
   */
  setLanguage(lang: Language): void {
    this._language.set(lang);
    this.saveLanguage(lang);
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    if (this._isMobileViewport()) {
      this._mobileSidebarOpen.update(v => !v);
      return;
    }

    this._sidebarPinned.update(v => !v);
    this.saveSidebarPinned(this._sidebarPinned());
  }

  /**
   * Set sidebar state
   */
  setSidebarCollapsed(collapsed: boolean): void {
    if (this._isMobileViewport()) {
      this._mobileSidebarOpen.set(!collapsed);
      return;
    }

    this._sidebarPinned.set(!collapsed);
    this.saveSidebarPinned(!collapsed);
  }

  /** Keeps the drawer behaviour in sync when the viewport crosses the tablet breakpoint. */
  syncViewport(width = typeof window === 'undefined' ? 0 : window.innerWidth): void {
    const isMobile = width <= 1024;
    if (isMobile && !this._isMobileViewport()) {
      this._mobileSidebarOpen.set(false);
    }
    this._isMobileViewport.set(isMobile);
  }

  closeMobileSidebar(): void {
    if (this._isMobileViewport()) {
      this._mobileSidebarOpen.set(false);
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(isDark: boolean): void {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  /**
   * Apply language and direction to document
   */
  private applyLanguage(lang: Language): void {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Load theme from storage
   */
  private loadTheme(): Theme {
    const saved = localStorage.getItem(environment.themeKey);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Save theme to storage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem(environment.themeKey, theme);
  }

  /** Load the user preference and use Arabic/RTL on a first visit. */
  private loadLanguage(): Language {
    const saved = localStorage.getItem(environment.langKey);
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
    return 'ar';
  }

  /**
   * Save language to storage
   */
  private saveLanguage(lang: Language): void {
    localStorage.setItem(environment.langKey, lang);
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 1024;
  }

  private loadSidebarPinned(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('logicfit_sidebar_pinned') === 'true';
  }

  private saveSidebarPinned(pinned: boolean): void {
    localStorage.setItem('logicfit_sidebar_pinned', String(pinned));
  }
}
