import { inject } from '@angular/core';
import { Router, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.user();
    if (user?.mustChangePassword && !state.url.includes('/profile')) {
      return router.createUrlTree([authService.getPasswordChangeUrlForRole(user.role)]);
    }
    return true;
  }

  // Redirect to login
  return router.createUrlTree(['/auth/login']);
};
