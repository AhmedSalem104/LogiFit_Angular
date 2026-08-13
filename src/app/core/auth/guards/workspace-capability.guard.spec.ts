import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkspaceCapabilities } from '../models/auth.models';
import { requiredCapabilityForWorkspaceRoute, workspaceCapabilityGuard, workspaceRouteCapabilityGuard } from './workspace-capability.guard';

describe('workspace capability guards', () => {
  it('maps Gym-only URLs to the correct capability', () => {
    expect(requiredCapabilityForWorkspaceRoute('/owner/branches')).toBe(WorkspaceCapabilities.GymFacilities);
    expect(requiredCapabilityForWorkspaceRoute('/owner/products/123')).toBe(WorkspaceCapabilities.GymInventory);
    expect(requiredCapabilityForWorkspaceRoute('/owner/subscription-plans')).toBe(WorkspaceCapabilities.GymMembershipPlans);
    expect(requiredCapabilityForWorkspaceRoute('/coach/workout-programs')).toBe(WorkspaceCapabilities.CoachingPrograms);
    expect(requiredCapabilityForWorkspaceRoute('/coach/reports')).toBe(WorkspaceCapabilities.CoachingReports);
    expect(requiredCapabilityForWorkspaceRoute('/coach/settings')).toBe(WorkspaceCapabilities.WorkspaceSettings);
  });

  it('blocks a freelance owner from a Gym route', () => {
    const auth = {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      hasCapability: jasmine.createSpy().and.returnValue(false)
    };
    const router = { createUrlTree: jasmine.createSpy().and.returnValue({ blocked: true }) };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router }] });

    const result = TestBed.runInInjectionContext(() => workspaceCapabilityGuard(WorkspaceCapabilities.GymFacilities)({} as never, {} as never));
    expect(result as unknown as { blocked: boolean }).toEqual({ blocked: true });
    expect(router.createUrlTree).toHaveBeenCalledWith(['/workspace-unavailable'], { queryParams: { capability: WorkspaceCapabilities.GymFacilities } });
  });

  it('allows the selected workspace capability through the parent route guard', () => {
    const auth = { hasCapability: jasmine.createSpy().and.returnValue(true) };
    const router = { createUrlTree: jasmine.createSpy() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router }] });

    const result = TestBed.runInInjectionContext(() => workspaceRouteCapabilityGuard({} as never, { url: '/owner/branches' } as never));
    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
