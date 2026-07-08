import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

/** Public tenant branding (white-label) returned by GET /api/branding/{identifier}. */
export interface TenantBranding {
  tenantId: string;
  name: string;
  subdomain: string;
  appName?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCss?: string;
  invoiceLogoUrl?: string;
  supportPhone?: string;
  supportEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private readonly api = environment.apiUrl;
  private styleEl: HTMLStyleElement | null = null;

  /** Reactive current branding (null when running on the plain app domain). */
  readonly branding = signal<TenantBranding | null>(null);

  /**
   * Resolve the tenant identifier (subdomain / custom domain) from the URL.
   * Returns null for localhost / bare app domains where there is no tenant subdomain.
   */
  resolveIdentifier(): string | null {
    const host = window.location.hostname;
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

    const parts = host.split('.');
    // e.g. goldgym.logicfit.com → "goldgym"; app.goldgym.com (custom) → full host
    if (parts.length > 2) {
      const sub = parts[0];
      if (['www', 'app', 'logicfit'].includes(sub)) return null;
      return sub;
    }
    return null;
  }

  /** Fetch branding for an identifier (subdomain or custom domain). Public / anonymous. */
  getBranding(identifier: string): Observable<TenantBranding> {
    return this.http.get<TenantBranding>(`${this.api}/branding/${identifier}`);
  }

  /**
   * Bootstrap branding on app start: resolve subdomain → fetch → apply theme + store tenantId.
   * Falls back to cached branding (offline / first paint) and never blocks startup on error.
   */
  bootstrap(): Observable<TenantBranding | null> {
    // Apply cached branding immediately for a flash-free first paint.
    const cached = this.storage.getItem<TenantBranding>(environment.brandingKey);
    if (cached) {
      this.branding.set(cached);
      this.apply(cached);
    }

    const identifier = this.resolveIdentifier();
    if (!identifier) return of(cached);

    return this.getBranding(identifier).pipe(
      tap(b => {
        this.branding.set(b);
        this.storage.setItem(environment.brandingKey, b);
        this.storage.setString(environment.tenantIdKey, b.tenantId);
        this.apply(b);
      }),
      catchError(() => of(cached))
    );
  }

  /** The tenantId resolved from branding (used to pre-fill login). */
  getResolvedTenantId(): string | null {
    return this.branding()?.tenantId ?? this.storage.getString(environment.tenantIdKey);
  }

  /** Apply colors, fonts, app name and custom CSS to the document. */
  apply(b: TenantBranding): void {
    const root = document.documentElement;
    if (b.primaryColor) root.style.setProperty('--brand-primary', b.primaryColor);
    if (b.secondaryColor) root.style.setProperty('--brand-secondary', b.secondaryColor);
    if (b.primaryColor) root.style.setProperty('--accent-color', b.primaryColor);
    if (b.fontFamily) root.style.setProperty('--brand-font', b.fontFamily);

    if (b.appName) {
      document.title = b.appName;
    }

    if (b.customCss) {
      if (!this.styleEl) {
        this.styleEl = document.createElement('style');
        this.styleEl.id = 'tenant-custom-css';
        document.head.appendChild(this.styleEl);
      }
      this.styleEl.textContent = b.customCss;
    }
  }
}
