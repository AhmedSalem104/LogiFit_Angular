import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor to handle HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';

      switch (error.status) {
        case 0:
          // Network error
          errorMessage = 'خطأ في الاتصال بالشبكة';
          break;

        case 400:
          // Bad Request - validation errors
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
          // Unauthorized - token expired or invalid
          errorMessage = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
          authService.logout();
          break;

        case 403:
          // Forbidden - no permission
          errorMessage = 'ليس لديك صلاحية للوصول لهذه الصفحة';
          router.navigate([authService.getRedirectUrl()]);
          break;

        case 404:
          // Not Found
          errorMessage = error.error?.message || 'العنصر المطلوب غير موجود';
          break;

        case 409:
          // Conflict
          errorMessage = error.error?.message || 'تعارض في البيانات';
          break;

        case 422:
          // Unprocessable Entity
          errorMessage = error.error?.message || 'لا يمكن معالجة الطلب';
          break;

        case 500:
          // Server Error
          errorMessage = 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
          break;

        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
        error: error.error,
        errorBody: JSON.stringify(error.error, null, 2)
      });

      // Return error with translated message
      return throwError(() => ({
        ...error,
        translatedMessage: errorMessage
      }));
    })
  );
};
