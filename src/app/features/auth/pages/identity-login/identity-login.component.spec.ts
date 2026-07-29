import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { ApplicationRequestStatus, ApplicationType, IdentitySignInResponse, PendingApplication } from '../../../../core/freelance/models/freelance.models';
import { IdentityLoginComponent } from './identity-login.component';

describe('IdentityLoginComponent tracking recovery', () => {
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

  beforeEach(() => {
    onboarding = jasmine.createSpyObj<FreelanceOnboardingService>('FreelanceOnboardingService', [
      'reissueTrackingSessions', 'saveTrackingToken',
    ]);
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
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ continue: 'application-status' }) } } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new IdentityLoginComponent());
  });

  it('identifies the tracking recovery path', () => {
    expect(component.trackingRecovery).toBeTrue();
  });

  it('reissues and saves only the tracking token for the selected pending request', () => {
    component.result.set(identityResult);

    component.trackApplication(pendingApplication);

    expect(onboarding.reissueTrackingSessions).toHaveBeenCalledWith('selection-token');
    expect(onboarding.saveTrackingToken).toHaveBeenCalledWith('new-tracking-token');
    expect(router.navigate).toHaveBeenCalledWith(['/identity/application-status']);
  });
});
