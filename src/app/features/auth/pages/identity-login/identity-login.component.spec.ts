import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    await TestBed.configureTestingModule({ imports: [IdentityLoginComponent], providers: [provideRouter([]), { provide: FreelanceOnboardingService, useValue: onboarding }, { provide: AuthService, useValue: auth }] }).compileComponents();
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
