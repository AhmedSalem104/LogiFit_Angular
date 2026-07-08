import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole, BACK_OFFICE_ROLES, COACH_ROLES } from '../models/auth.models';

/**
 * Guard factory to protect routes based on user role
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if authenticated first
    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    // Check if user has required role
    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to appropriate dashboard based on actual role
    return router.createUrlTree([authService.getRedirectUrl()]);
  };
};

/**
 * Guard for back-office routes (Owner + Manager / Receptionist / Accountant).
 * Fine-grained access inside the panel is enforced per-feature via permissions.
 */
export const ownerGuard: CanActivateFn = roleGuard(BACK_OFFICE_ROLES);

/**
 * Guard for coach routes (Coach + Trainer)
 */
export const coachGuard: CanActivateFn = roleGuard(COACH_ROLES);

/**
 * Guard for Client-only routes
 */
export const clientGuard: CanActivateFn = roleGuard([UserRole.Client]);

/**
 * Guard for Owner and Coach routes
 */
export const ownerOrCoachGuard: CanActivateFn = roleGuard([UserRole.Owner, UserRole.Coach]);
