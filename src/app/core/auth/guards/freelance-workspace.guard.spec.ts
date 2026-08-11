import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { freelanceWorkspaceGuard } from './freelance-workspace.guard';

describe('freelanceWorkspaceGuard', () => {
  const urlTree: any = { redirect: true };
  let auth: { isAuthenticated: jasmine.Spy; isFreelanceWorkspace: jasmine.Spy; getRedirectUrl: jasmine.Spy };
  let router: { createUrlTree: jasmine.Spy };

  beforeEach(() => {
    auth = {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      isFreelanceWorkspace: jasmine.createSpy().and.returnValue(false),
      getRedirectUrl: jasmine.createSpy().and.returnValue('/owner/dashboard')
    };
    router = { createUrlTree: jasmine.createSpy().and.returnValue(urlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows the existing freelance workspace context', () => {
    auth.isFreelanceWorkspace.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => freelanceWorkspaceGuard({} as never, {} as never));
    expect(result).toBeTrue();
  });

  it('blocks a direct Gym URL', () => {
    const result = TestBed.runInInjectionContext(() => freelanceWorkspaceGuard({} as never, {} as never));
    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/owner/dashboard']);
  });
});
