import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protects the existing freelance-team screen from direct Gym URLs. */
export const freelanceWorkspaceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  return auth.isFreelanceWorkspace()
    ? true
    : router.createUrlTree([auth.getRedirectUrl()]);
};
