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

    // A FreelanceOwner is stored as Owner for identity/authorization, but the
    // freelance workspace uses the coach feature panel. Allow that owner to
    // enter coach routes without changing the backend role or tenant scope.
    const isFreelanceOwnerCoachRoute = authService.isFreelanceWorkspace()
      && authService.isOwner()
      && allowedRoles.length > 0
      && allowedRoles.every(role => COACH_ROLES.includes(role));

    // Check if user has required role
    if (isFreelanceOwnerCoachRoute || authService.hasRole(allowedRoles)) {
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
 * Guard for coach routes. Gym owners enter the shared coaching components
 * while managing their members; capabilities and API policies still limit
 * the actual workspace features.
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
