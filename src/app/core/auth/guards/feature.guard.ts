import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/auth.models';
import { StorageService } from '../../services/storage.service';

/** Route guard for an optional subscription feature and its RBAC permission. */
export const featureGuard = (featureKey: string, requiredPermission?: Permission): CanActivateFn => {
  return (_route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const storage = inject(StorageService);

    if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      return router.createUrlTree([auth.getRedirectUrl()]);
    }

    // This cache is only an optimistic hint; backend 402/403 remains authoritative.
    const access = storage.getItem<Record<string, boolean>>('logicfit_feature_access');
    if (access && access[featureKey] === false) {
      return router.createUrlTree(['/owner/subscription'], { queryParams: { upgrade: 1, feature: featureKey } });
    }
    return true;
  };
};

