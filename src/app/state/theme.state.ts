import { Injectable, signal, effect } from '@angular/core';
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
  private _sidebarCollapsed = signal<boolean>(false);

  // Public readonly signals
  readonly darkMode = this._darkMode.asReadonly();
  readonly language = this._language.asReadonly();
  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();

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
    this._sidebarCollapsed.update(v => !v);
  }

  /**
   * Set sidebar state
   */
  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
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

  /**
   * Load language from storage - Always returns 'en'
   */
  private loadLanguage(): Language {
    // Always use English
    localStorage.setItem(environment.langKey, 'en');
    return 'en';
  }

  /**
   * Save language to storage
   */
  private saveLanguage(lang: Language): void {
    localStorage.setItem(environment.langKey, lang);
  }
}
