import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkspaceCapability, WorkspaceCapabilities } from '../models/auth.models';

const ROUTE_CAPABILITY_RULES: Array<[string, WorkspaceCapability]> = [
  ['/coach/subscription/invoices', WorkspaceCapabilities.WorkspaceBilling],
  ['/coach/subscription', WorkspaceCapabilities.WorkspaceBilling],
  ['/coach/settings', WorkspaceCapabilities.WorkspaceSettings],
  ['/coach/reports', WorkspaceCapabilities.CoachingReports],
  ['/coach/finance', WorkspaceCapabilities.CoachingFinance],
  ['/coach/trainees', WorkspaceCapabilities.CoachingClients],
  ['/coach/workout-programs', WorkspaceCapabilities.CoachingPrograms],
  ['/coach/diet-plans', WorkspaceCapabilities.CoachingNutrition],
  ['/coach/measurements', WorkspaceCapabilities.CoachingProgress],
  ['/coach/appointments', WorkspaceCapabilities.CoachingAppointments],
  ['/coach/dashboard', WorkspaceCapabilities.CoachingReports],
  ['/coach/profile', WorkspaceCapabilities.WorkspaceSettings],
  ['/coach/exercises', WorkspaceCapabilities.CoachingPrograms],
  ['/coach/foods', WorkspaceCapabilities.CoachingNutrition],
  ['/coach/muscles', WorkspaceCapabilities.CoachingPrograms],
  ['/coach/library', WorkspaceCapabilities.CoachingPrograms],
  ['/coach/chat', WorkspaceCapabilities.CoachingClients],
  ['/coach/challenges', WorkspaceCapabilities.CoachingClients],
  ['/owner/freelance-team', WorkspaceCapabilities.FreelanceTeam],
  ['/owner/branches', WorkspaceCapabilities.GymFacilities],
  ['/owner/rooms', WorkspaceCapabilities.GymFacilities],
  ['/owner/equipment', WorkspaceCapabilities.GymFacilities],
  ['/owner/maintenance', WorkspaceCapabilities.GymFacilities],
  ['/owner/group-classes', WorkspaceCapabilities.GymFacilities],
  ['/owner/class-schedules', WorkspaceCapabilities.GymFacilities],
  ['/owner/attendance', WorkspaceCapabilities.GymAttendance],
  ['/owner/gate-access', WorkspaceCapabilities.GymGateAccess],
  ['/owner/membership-cards', WorkspaceCapabilities.GymMembershipCards],
  ['/owner/subscription-plans', WorkspaceCapabilities.GymMembershipPlans],
  ['/owner/employees', WorkspaceCapabilities.GymStaff],
  ['/owner/workspace-access', WorkspaceCapabilities.GymStaff],
  ['/owner/shifts', WorkspaceCapabilities.GymStaff],
  ['/owner/leaves', WorkspaceCapabilities.GymStaff],
  ['/owner/payroll', WorkspaceCapabilities.GymStaff],
  ['/owner/commissions', WorkspaceCapabilities.GymStaff],
  ['/owner/products', WorkspaceCapabilities.GymInventory],
  ['/owner/product-categories', WorkspaceCapabilities.GymInventory],
  ['/owner/stock', WorkspaceCapabilities.GymInventory],
  ['/owner/suppliers', WorkspaceCapabilities.GymInventory],
  ['/owner/pos-sales', WorkspaceCapabilities.GymPOS],
  ['/owner/clients', WorkspaceCapabilities.GymExperience],
  ['/owner/coaches', WorkspaceCapabilities.GymStaff],
  ['/owner/subscriptions', WorkspaceCapabilities.GymExperience],
  ['/owner/invoices', WorkspaceCapabilities.GymExperience],
  ['/owner/payments', WorkspaceCapabilities.GymExperience],
  ['/owner/expenses', WorkspaceCapabilities.GymExperience],
  ['/owner/expense-categories', WorkspaceCapabilities.GymExperience],
  ['/owner/coupons', WorkspaceCapabilities.GymExperience],
  ['/owner/reports', WorkspaceCapabilities.GymReports],
  ['/owner/operations', WorkspaceCapabilities.GymReports],
  ['/owner/management', WorkspaceCapabilities.GymExperience],
  ['/owner/finance', WorkspaceCapabilities.GymExperience],
  ['/owner/operations-reports', WorkspaceCapabilities.GymReports],
  ['/owner/dashboard', WorkspaceCapabilities.GymReports],
  ['/owner/tax-settings', WorkspaceCapabilities.GymSettings],
  ['/owner/gym-settings', WorkspaceCapabilities.GymSettings],
  ['/owner/profile', WorkspaceCapabilities.WorkspaceSettings],
  ['/owner/subscription', WorkspaceCapabilities.WorkspaceBilling]
];

export function requiredCapabilityForWorkspaceRoute(url: string): WorkspaceCapability | null {
  const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  return ROUTE_CAPABILITY_RULES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? null;
}

/**
 * Route-level workspace capability guard. The backend remains authoritative;
 * this guard prevents an invalid workspace route from rendering or calling its
 * APIs after a workspace switch or a browser refresh.
 */
export const workspaceCapabilityGuard = (
  capability: WorkspaceCapability | WorkspaceCapability[]
): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const required = Array.isArray(capability) ? capability : [capability];

    if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
    return required.some(item => auth.hasCapability(item))
      ? true
      : router.createUrlTree(['/workspace-unavailable'], {
        queryParams: { capability: required[0] }
      });
  };
};

/** Parent guard for lazy owner routes; it also protects manually typed child URLs. */
export const workspaceRouteCapabilityGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = requiredCapabilityForWorkspaceRoute(state.url);

  if (!required || auth.hasCapability(required)) return true;
  return router.createUrlTree(['/workspace-unavailable'], { queryParams: { capability: required } });
};
