import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor to add JWT token to all HTTP requests
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isPublicIdentityRequest = req.url.includes('/auth/')
    || req.url.includes('/identity/')
    || req.url.includes('/workspace-applications/');

  // Identity proof and application tracking deliberately use opaque short-lived
  // tokens, never a tenant JWT.
  if (isPublicIdentityRequest) {
    return next(req);
  }

  // Add token if available
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
