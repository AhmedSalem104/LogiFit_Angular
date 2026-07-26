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
  logoDarkUrl?: string;
  logoLightUrl?: string;
  logoIconUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
  loginBackgroundUrl?: string;
  dashboardBannerUrl?: string;
  galleryImages?: string[];
  assets?: Array<{ id?: string; assetType?: string; imageUrl?: string; desktopImageUrl?: string; tabletImageUrl?: string; mobileImageUrl?: string; altText?: string; sortOrder?: number }>;
  primaryColor?: string;
  primaryHoverColor?: string;
  primaryForegroundColor?: string;
  secondaryColor?: string;
  secondaryHoverColor?: string;
  secondaryForegroundColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  cardColor?: string;
  sidebarColor?: string;
  sidebarTextColor?: string;
  headerColor?: string;
  headerTextColor?: string;
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  borderColor?: string;
  inputBackgroundColor?: string;
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  infoColor?: string;
  borderRadius?: string;
  themeMode?: string;
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
    // Preview / non-branded hosting domains have no real tenant subdomain.
    if (host.endsWith('.vercel.app') || host.endsWith('.netlify.app')) return null;

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
    return this.http.get<TenantBranding>(`${this.api}/branding/${identifier}`).pipe(
      tap(b => this.normalizeUrls(b))
    );
  }

  /** Converts API-relative upload paths into URLs served by the backend, not Vercel. */
  resolveAssetUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    const origin = environment.production ? 'https://logicfit-saas.runasp.net' : window.location.origin;
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private normalizeUrls(b: TenantBranding): void {
    for (const key of ['logoUrl','logoDarkUrl','logoLightUrl','logoIconUrl','faviconUrl','coverImageUrl','loginBackgroundUrl','dashboardBannerUrl','invoiceLogoUrl'] as const) {
      if (b[key]) b[key] = this.resolveAssetUrl(b[key]);
    }
    if (b.galleryImages) b.galleryImages = b.galleryImages.map(url => this.resolveAssetUrl(url));
    if (b.assets) for (const asset of b.assets) {
      if (asset.imageUrl) asset.imageUrl = this.resolveAssetUrl(asset.imageUrl);
      if (asset.desktopImageUrl) asset.desktopImageUrl = this.resolveAssetUrl(asset.desktopImageUrl);
      if (asset.tabletImageUrl) asset.tabletImageUrl = this.resolveAssetUrl(asset.tabletImageUrl);
      if (asset.mobileImageUrl) asset.mobileImageUrl = this.resolveAssetUrl(asset.mobileImageUrl);
    }
  }

  /**
   * Resolve a gym by its subdomain, then apply + persist its branding and tenantId.
   * Used on non-branded domains (e.g. the preview host) to pick a gym before login.
   */
  resolveBySubdomain(subdomain: string): Observable<TenantBranding> {
    const clean = subdomain.trim().toLowerCase();
    return this.getBranding(clean).pipe(
      tap(b => {
        this.branding.set(b);
        this.storage.setItem(environment.brandingKey, b);
        this.storage.setString(environment.tenantIdKey, b.tenantId);
        this.apply(b);
      })
    );
  }

  /** The tenantId resolved from ACTUAL branding only (never a stale stored value). */
  getBrandingTenantId(): string | null {
    return this.branding()?.tenantId ?? null;
  }

  /** Forget any resolved gym (clears branding + stored tenantId). */
  clearResolvedTenant(): void {
    this.branding.set(null);
    this.storage.removeItem(environment.brandingKey);
    this.storage.removeItem(environment.tenantIdKey);
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
    const primary = b.primaryColor || '#2563eb';
    const primaryHover = b.primaryHoverColor || primary;
    const secondary = b.secondaryColor || '#4f46e5';
    const sidebar = b.sidebarColor || '#0f172a';
    const vars: Record<string, string | undefined> = {
      '--brand-primary': primary, '--brand-primary-hover': primaryHover,
      '--brand-primary-foreground': b.primaryForegroundColor, '--brand-secondary': b.secondaryColor,
      '--brand-secondary-hover': b.secondaryHoverColor, '--brand-secondary-foreground': b.secondaryForegroundColor,
      '--accent-color': b.accentColor ?? primary, '--bg-page': b.backgroundColor,
      '--bg-surface': b.surfaceColor, '--card-color': b.cardColor, '--sidebar-color': b.sidebarColor,
      '--sidebar-bg': sidebar, '--sidebar-text-color': b.sidebarTextColor,
      '--header-color': b.headerColor, '--bg-primary': b.headerColor,
      '--header-text-color': b.headerTextColor, '--text': b.textPrimaryColor,
      '--text-muted': b.textSecondaryColor, '--border': b.borderColor,
      '--input-background': b.inputBackgroundColor, '--success-color': b.successColor,
      '--warning-color': b.warningColor, '--danger-color': b.dangerColor, '--info-color': b.infoColor,
      '--brand-font': b.fontFamily, '--radius': b.borderRadius,
      '--primary-500': primary, '--primary-600': primaryHover,
      '--primary-700': primaryHover, '--primary-400': primary,
      '--gradient-primary': `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      '--bg-secondary': b.surfaceColor || b.backgroundColor,
      '--bg-tertiary': b.surfaceColor,
      '--card-bg': b.cardColor || b.surfaceColor,
      '--border-color': b.borderColor, '--input-bg': b.inputBackgroundColor,
      '--text-primary': b.textPrimaryColor, '--text-secondary': b.textSecondaryColor,
      '--success': b.successColor, '--warning': b.warningColor, '--danger': b.dangerColor,
      '--info': b.infoColor
    };
    Object.entries(vars).forEach(([key, value]) => value && root.style.setProperty(key, value));

    if (b.appName) {
      document.title = b.appName;
    }

    if (b.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link');
      link.rel = 'icon'; link.href = b.faviconUrl;
      if (!link.parentElement) document.head.appendChild(link);
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
