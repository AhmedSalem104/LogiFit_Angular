import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/auth.models';

/** Route-level RBAC guard; hiding a menu item is not a security boundary. */
export const permissionGuard = (permission: Permission | Permission[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const required = Array.isArray(permission) ? permission : [permission];
    if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
    return required.some(item => auth.hasPermission(item))
      ? true
      : router.createUrlTree([auth.getRedirectUrl()]);
  };
};

