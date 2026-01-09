import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

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
 * Guard for Owner-only routes
 */
export const ownerGuard: CanActivateFn = roleGuard([UserRole.Owner]);

/**
 * Guard for Coach-only routes
 */
export const coachGuard: CanActivateFn = roleGuard([UserRole.Coach]);

/**
 * Guard for Client-only routes
 */
export const clientGuard: CanActivateFn = roleGuard([UserRole.Client]);

/**
 * Guard for Owner and Coach routes
 */
export const ownerOrCoachGuard: CanActivateFn = roleGuard([UserRole.Owner, UserRole.Coach]);
