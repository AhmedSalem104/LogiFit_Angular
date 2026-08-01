import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import {
  ApplicationRequestStatus,
  ApplicationType,
  IdentitySignInResponse,
  OtpChallenge,
  OtpPurpose,
  PendingApplication,
} from '../../../../core/freelance/models/freelance.models';
import { IdentityLoginComponent } from './identity-login.component';

describe('IdentityLoginComponent unified authentication', () => {
  let component: IdentityLoginComponent;
  let onboarding: jasmine.SpyObj<FreelanceOnboardingService>;
  let router: jasmine.SpyObj<Router>;

  const pendingApplication: PendingApplication = {
    applicationId: '8d05c8a3-53ce-4867-8ed4-3f9cd87c6060',
    applicationType: ApplicationType.FreelanceWorkspaceCreation,
    status: ApplicationRequestStatus.NeedsMoreInformation,
    submittedAt: '2026-07-29T00:00:00Z',
  };
  const identityResult: IdentitySignInResponse = {
    workspaceSelectionToken: 'selection-token',
    expiresAt: '2026-07-29T00:15:00Z',
    activeWorkspaces: [],
    pendingApplications: [pendingApplication],
    requiresWorkspaceSelection: true,
  };
  const challenge: OtpChallenge = {
    challengeId: 'd4832234-d6e9-4919-8c78-d01e033227e3',
    purpose: OtpPurpose.PasswordlessLogin,
    expiresAtUtc: new Date(Date.now() + 300_000).toISOString(),
    resendAvailableAtUtc: new Date(Date.now() + 60_000).toISOString(),
    maskedPhoneNumber: '+20***678',
  };

  beforeEach(() => {
    sessionStorage.clear();
    onboarding = jasmine.createSpyObj<FreelanceOnboardingService>('FreelanceOnboardingService', [
      'identityLogin', 'requestPhoneLogin', 'verifyPhoneLogin', 'selectWorkspace',
      'reissueTrackingSessions', 'saveTrackingToken',
    ]);
    onboarding.requestPhoneLogin.and.returnValue(of(challenge));
    onboarding.verifyPhoneLogin.and.returnValue(of(identityResult));
    onboarding.reissueTrackingSessions.and.returnValue(of([{
      applicationId: pendingApplication.applicationId,
      status: pendingApplication.status,
      trackingToken: 'new-tracking-token',
      expiresAt: '2026-07-29T01:00:00Z',
    }]));
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: FreelanceOnboardingService, useValue: onboarding },
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: router },
      ],
    });
    component = TestBed.runInInjectionContext(() => new IdentityLoginComponent());
  });

  afterEach(() => {
    component.ngOnDestroy();
    sessionStorage.clear();
  });

  it('normalizes country code and local phone before requesting a real challenge', () => {
    component.phoneForm.setValue({ countryCode: '+20', phoneNumber: '010 1234 5678' });

    component.requestOtp();

    expect(onboarding.requestPhoneLogin).toHaveBeenCalledWith(
      '+201012345678', jasmine.any(String));
    expect(component.challenge()).toEqual(challenge);
  });

  it('does not create workspace access in the browser after OTP verification', () => {
    component.phoneForm.setValue({ countryCode: '+20', phoneNumber: '01012345678' });
    component.requestOtp();
    component.otpForm.setValue({ code: '1234' });

    component.verifyOtp();

    expect(onboarding.verifyPhoneLogin).toHaveBeenCalledWith(
      challenge.challengeId, '1234', jasmine.any(String));
    expect(component.result()).toEqual(identityResult);
    expect(sessionStorage.getItem('logicfit_pending_phone_login_challenge')).toBeNull();
  });

  it('restores an unexpired pending challenge after a page recreation', () => {
    component.phoneForm.setValue({ countryCode: '+20', phoneNumber: '01012345678' });
    component.requestOtp();
    expect(sessionStorage.getItem('logicfit_pending_phone_login_challenge')).not.toBeNull();
    component.ngOnDestroy();

    component = TestBed.runInInjectionContext(() => new IdentityLoginComponent());

    expect(component.challenge()?.challengeId).toBe(challenge.challengeId);
    expect(component.method()).toBe('phone');
    expect(component.otpSeconds()).toBeGreaterThan(0);
  });

  it('clears the pending challenge when the user changes the phone', () => {
    component.phoneForm.setValue({ countryCode: '+20', phoneNumber: '01012345678' });
    component.requestOtp();

    component.cancelOtp();

    expect(component.challenge()).toBeNull();
    expect(sessionStorage.getItem('logicfit_pending_phone_login_challenge')).toBeNull();
  });

  it('reissues and saves only the tracking token for the selected pending request', () => {
    component.result.set(identityResult);

    component.trackApplication(pendingApplication);

    expect(onboarding.reissueTrackingSessions).toHaveBeenCalledWith('selection-token');
    expect(onboarding.saveTrackingToken).toHaveBeenCalledWith('new-tracking-token');
    expect(router.navigate).toHaveBeenCalledWith(['/identity/application-status']);
  });
});
