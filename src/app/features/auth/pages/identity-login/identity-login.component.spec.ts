import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IdentityLoginComponent } from './identity-login.component';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

describe('IdentityLoginComponent', () => {
  let fixture: ComponentFixture<IdentityLoginComponent>;
  let onboarding: jasmine.SpyObj<FreelanceOnboardingService>;
  const response = { workspaceSelectionToken: 'selection', expiresAt: '2099-01-01', activeWorkspaces: [], pendingApplications: [], requiresWorkspaceSelection: false };

  beforeEach(async () => {
    onboarding = jasmine.createSpyObj('FreelanceOnboardingService', ['identityLogin', 'selectWorkspace', 'reissueTrackingSessions', 'saveTrackingToken']);
    onboarding.identityLogin.and.returnValue(of(response));
    const auth = jasmine.createSpyObj('AuthService', ['completeWorkspaceSelection', 'getRedirectUrlForRole']);
    auth.getRedirectUrlForRole.and.returnValue('/owner/dashboard');
    const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate']);
    router.navigateByUrl.and.resolveTo(true);
    await TestBed.configureTestingModule({ imports: [IdentityLoginComponent], providers: [{ provide: Router, useValue: router }, { provide: FreelanceOnboardingService, useValue: onboarding }, { provide: AuthService, useValue: auth }] }).compileComponents();
    fixture = TestBed.createComponent(IdentityLoginComponent);
    fixture.detectChanges();
  });

  it('submits only the email and password identity contract', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'user@example.com', password: 'StrongPassword1!' });
    component.submit();
    expect(onboarding.identityLogin).toHaveBeenCalledWith('user@example.com', 'StrongPassword1!');
    expect(component.result()).toEqual(response);
  });

  it('selects the only active workspace without waiting for the selection screen', () => {
    const workspace = {
      workspaceId: 'gym-1', name: 'Air Gym', identifier: 'airgym', workspaceType: 1,
      workspaceStatus: 1, role: 'Owner'
    };
    const identityResponse = {
      workspaceSelectionToken: 'selection', expiresAt: '2099-01-01', activeWorkspaces: [workspace],
      pendingApplications: [], requiresWorkspaceSelection: true
    };
    onboarding.identityLogin.and.returnValue(of(identityResponse));
    onboarding.selectWorkspace.and.returnValue(of({ accessToken: 'access', tenantId: 'gym-1', role: 'Owner' } as any));

    const component = fixture.componentInstance;
    component.form.setValue({ email: 'owner@example.com', password: 'StrongPassword1!' });
    component.submit();

    expect(onboarding.selectWorkspace).toHaveBeenCalledWith('selection', 'gym-1');
    expect(component.error()).toBe('');
  });

  it('does not expose a phone or OTP login surface', () => {
    const component = fixture.componentInstance as any;
    expect(component.phoneForm).toBeUndefined();
    expect(component.otpForm).toBeUndefined();
    expect(fixture.nativeElement.textContent).not.toContain('OTP');
  });

  it('shows a safe error when credentials are rejected', () => {
    onboarding.identityLogin.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'user@example.com', password: 'wrong' });
    component.submit();
    expect(component.error()).toBe('Invalid credentials');
  });
});
