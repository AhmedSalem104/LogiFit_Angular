import {
  HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, take, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// ---- Single-flight refresh state (module scope) ----
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * On 401: try to refresh the access token once, then retry the original request.
 * Concurrent 401s wait for the single in-flight refresh instead of stampeding.
 */
function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService
): Observable<HttpEvent<unknown>> {
  if (!auth.getRefreshToken()) {
    auth.logout();
    return throwError(() => ({ status: 401, translatedMessage: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' }));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return auth.refreshToken().pipe(
      switchMap((newToken: string) => {
        isRefreshing = false;
        refreshTokenSubject.next(newToken);
        return next(addToken(req, newToken));
      }),
      catchError(err => {
        isRefreshing = false;
        auth.logout();
        return throwError(() => ({ ...err, translatedMessage: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' }));
      })
    );
  }

  // A refresh is already in progress — queue behind it.
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addToken(req, token as string)))
  );
}

/**
 * Global HTTP error handler: token refresh (401), plan-limit gating (402),
 * permission (403), and translated messages for the rest.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 on a protected endpoint → attempt silent refresh + retry
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401(req, next, authService);
      }

      let errorMessage = 'حدث خطأ غير متوقع';

      switch (error.status) {
        case 0:
          errorMessage = 'خطأ في الاتصال بالشبكة';
          break;

        case 400:
          if (error.error?.errors) {
            const errors = Object.values(error.error.errors).flat();
            errorMessage = errors.join('\n');
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = 'خطأ في البيانات المدخلة';
          }
          break;

        case 401:
          // 401 on an /auth/ endpoint (e.g. bad credentials / dead refresh)
          errorMessage = error.error?.message || 'بيانات الدخول غير صحيحة';
          break;

        case 402:
          // Plan limit exceeded / feature not included → route owner to billing/upgrade
          errorMessage = error.error?.message || 'لقد وصلت إلى حد باقتك. يرجى ترقية الاشتراك.';
          if (authService.hasPermission('ManageTenantBilling')) {
            router.navigate(['/owner/subscription'], { queryParams: { upgrade: 1 } });
          }
          break;

        case 403:
          errorMessage = 'ليس لديك صلاحية للوصول لهذه الصفحة';
          router.navigate([authService.getRedirectUrl()]);
          break;

        case 404:
          errorMessage = error.error?.message || 'العنصر المطلوب غير موجود';
          break;

        case 409:
          errorMessage = error.error?.message || 'تعارض في البيانات';
          break;

        case 422:
          errorMessage = error.error?.message || 'لا يمكن معالجة الطلب';
          break;

        case 500:
          errorMessage = 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
          break;

        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
        error: error.error
      });

      return throwError(() => ({
        ...error,
        translatedMessage: errorMessage
      }));
    })
  );
};
