import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor to add JWT token to all HTTP requests
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  // Refresh cookies are HttpOnly and cross-origin capable. JavaScript never reads them.
  let outgoing = req.clone({ withCredentials: true });

  // Sending an existing access token to an AllowAnonymous endpoint is harmless, while protected
  // identity endpoints (phone change and step-up) require it.
  if (token) {
    outgoing = outgoing.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(outgoing);
};
