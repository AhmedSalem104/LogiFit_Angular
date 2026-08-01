import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BrandingService } from '../../../../core/services/branding.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TenantStatusService } from '../../../../core/tenant/tenant-status.service';
import { LoginComponent } from './login.component';

describe('LoginComponent legacy gym compatibility flow', () => {
  let component: LoginComponent;
  const branding = {
    branding: signal(null),
    clearResolvedTenant: jasmine.createSpy('clearResolvedTenant')
  };
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: {} },
        { provide: BrandingService, useValue: branding },
        { provide: TenantStatusService, useValue: {} }
      ]
    });

    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  it('starts without a tenant on a non-branded host', () => {
    expect(component.tenantResolved()).toBeFalse();
    expect(component.resolvedGymName()).toBeNull();
  });

  it('clears stale tenant state and asks for a gym identifier', () => {
    component.ngOnInit();

    expect(component.tenantResolved()).toBeFalse();
    expect(branding.clearResolvedTenant).toHaveBeenCalled();
  });

  it('accepts a valid tenant GUID only through the explicit development helper', () => {
    component.manualTenantId = '5cf4f4c7-17ba-4981-a948-a8fbe1af2da5';

    component.useManualTenant();

    expect(component.tenantResolved()).toBeTrue();
    expect(component.loginForm.value.tenantId).toBe(component.manualTenantId);
  });

  it('rejects an invalid development tenant identifier', () => {
    component.manualTenantId = 'not-a-guid';

    component.useManualTenant();

    expect(component.tenantResolved()).toBeFalse();
    expect(component.manualError()).toContain('GUID');
  });

  it('returns to workspace selection when the user changes the workspace', () => {
    component.tenantResolved.set(true);
    component.resolvedGymName.set('Gold Gym');
    component.loginForm.patchValue({ tenantId: 'tenant-id', phoneNumber: '01000000000' });

    component.changeGym();

    expect(component.tenantResolved()).toBeFalse();
    expect(component.resolvedGymName()).toBeNull();
    expect(component.loginForm.value.tenantId).toBe('');
    expect(branding.clearResolvedTenant).toHaveBeenCalled();
  });
});
