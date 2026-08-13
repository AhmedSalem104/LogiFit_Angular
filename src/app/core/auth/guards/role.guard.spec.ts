import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { coachGuard } from './role.guard';

describe('roleGuard freelance workspace behavior', () => {
  it('allows a FreelanceOwner to open coach routes in a freelance workspace', () => {
    const auth = {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      isFreelanceWorkspace: jasmine.createSpy().and.returnValue(true),
      isOwner: jasmine.createSpy().and.returnValue(true),
      hasRole: jasmine.createSpy().and.returnValue(false),
      getRedirectUrl: jasmine.createSpy().and.returnValue('/owner/dashboard')
    };
    const router = { createUrlTree: jasmine.createSpy() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => coachGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(auth.hasRole).not.toHaveBeenCalled();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
