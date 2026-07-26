import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permissions } from '../models/auth.models';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  const urlTree: any = { redirect: true };
  let auth: { isAuthenticated: jasmine.Spy; hasPermission: jasmine.Spy; getRedirectUrl: jasmine.Spy };
  let router: { createUrlTree: jasmine.Spy };

  beforeEach(() => {
    auth = {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      hasPermission: jasmine.createSpy().and.returnValue(false),
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

  it('redirects unauthenticated users to login', () => {
    auth.isAuthenticated.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => permissionGuard(Permissions.ViewReports)({} as never, {} as never));
    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });

  it('allows a user with the required permission', () => {
    auth.hasPermission.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => permissionGuard(Permissions.ViewReports)({} as never, {} as never));
    expect(result).toBeTrue();
  });

  it('redirects an authenticated user without permission', () => {
    const result = TestBed.runInInjectionContext(() => permissionGuard(Permissions.ViewReports)({} as never, {} as never));
    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/owner/dashboard']);
  });
});
