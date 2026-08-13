import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions, withPreloading, PreloadAllModules, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/auth/interceptors/error.interceptor';
import { BrandingService } from './core/services/branding.service';
import { AuthService } from './core/auth/services/auth.service';

/**
 * Load white-label branding (colors/logo/appName) + resolve tenantId from the
 * subdomain before the app renders. Never blocks startup on failure.
 */
function initBranding(branding: BrandingService) {
  return () => firstValueFrom(branding.bootstrap()).catch(() => null);
}

/**
 * Reconcile sessions created before workspaceType/capabilities were part of
 * the auth contract. The server is authoritative; a missing context is never
 * interpreted as a Gym session.
 */
function initAuthSession(auth: AuthService) {
  return () => firstValueFrom(auth.restoreSession()).catch(() => false);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      // Background-preload lazy chunks after the first screen → instant navigation.
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    MessageService,
    {
      provide: APP_INITIALIZER,
      useFactory: initBranding,
      deps: [BrandingService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthSession,
      deps: [AuthService],
      multi: true
    }
  ]
};
