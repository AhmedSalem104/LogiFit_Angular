import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/auth/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    MessageService
  ]
};
