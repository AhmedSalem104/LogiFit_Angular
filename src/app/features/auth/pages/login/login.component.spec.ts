import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BrandingService } from '../../../../core/services/branding.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TenantStatusService } from '../../../../core/tenant/tenant-status.service';
import { LoginComponent } from './login.component';

describe('LoginComponent onboarding flow', () => {
  let component: LoginComponent;
  const branding = {
    branding: signal(null),
    clearResolvedTenant: jasmine.createSpy('clearResolvedTenant')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: BrandingService, useValue: branding },
        { provide: TenantStatusService, useValue: {} }
      ]
    });

    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  it('starts at the workspace selection step', () => {
    expect(component.onboardingStep).toBe(1);
    expect(component.stepProgress).toBe(50);
  });

  it('moves to the credentials step after the workspace is resolved', () => {
    component.tenantResolved.set(true);

    expect(component.onboardingStep).toBe(2);
    expect(component.stepProgress).toBe(100);
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
