import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { Permissions } from '../models/auth.models';
import { featureGuard } from './feature.guard';

describe('featureGuard', () => {
  const urlTree: any = { redirect: true };
  let auth: { isAuthenticated: jasmine.Spy; hasPermission: jasmine.Spy; getRedirectUrl: jasmine.Spy };
  let router: { createUrlTree: jasmine.Spy };
  let storage: { getItem: jasmine.Spy };

  beforeEach(() => {
    auth = {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      hasPermission: jasmine.createSpy().and.returnValue(true),
      getRedirectUrl: jasmine.createSpy().and.returnValue('/owner/dashboard')
    };
    router = { createUrlTree: jasmine.createSpy().and.returnValue(urlTree) };
    storage = { getItem: jasmine.createSpy().and.returnValue(null) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: StorageService, useValue: storage }
      ]
    });
  });

  it('allows access when no feature cache is available', () => {
    const result = TestBed.runInInjectionContext(() => featureGuard('reports', Permissions.ViewReports)({} as never, {} as never));
    expect(result).toBeTrue();
  });

  it('redirects a disabled feature to subscription upgrade', () => {
    storage.getItem.and.returnValue({ reports: false });
    const result = TestBed.runInInjectionContext(() => featureGuard('reports', Permissions.ViewReports)({} as never, {} as never));
    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/owner/subscription'], {
      queryParams: { upgrade: 1, feature: 'reports' }
    });
  });
});
