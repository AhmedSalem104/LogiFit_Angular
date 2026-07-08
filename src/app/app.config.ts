import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/auth/interceptors/error.interceptor';
import { BrandingService } from './core/services/branding.service';

/**
 * Load white-label branding (colors/logo/appName) + resolve tenantId from the
 * subdomain before the app renders. Never blocks startup on failure.
 */
function initBranding(branding: BrandingService) {
  return () => firstValueFrom(branding.bootstrap()).catch(() => null);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
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
    }
  ]
};
