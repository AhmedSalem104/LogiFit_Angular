import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { ApplicationRequestStatus, ApplicationTrackingStatus } from '../../../../core/freelance/models/freelance.models';
import { ApplicationStatusComponent } from './application-status.component';

describe('ApplicationStatusComponent tracking recovery', () => {
  let component: ApplicationStatusComponent;
  let onboarding: jasmine.SpyObj<FreelanceOnboardingService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    onboarding = jasmine.createSpyObj<FreelanceOnboardingService>('FreelanceOnboardingService', [
      'getTrackingToken', 'getTrackingStatus', 'clearTrackingToken',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: FreelanceOnboardingService, useValue: onboarding },
        { provide: Router, useValue: router },
      ],
    });
    component = TestBed.runInInjectionContext(() => new ApplicationStatusComponent());
  });

  function trackingStatus(overrides: Partial<ApplicationTrackingStatus> = {}): ApplicationTrackingStatus {
    return {
      applicationId: 'application-1',
      applicationType: 2,
      status: ApplicationRequestStatus.Submitted,
      workspaceIdentifier: 'coach-space',
      informationRequest: null,
      requestedFields: [],
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      editableValues: {},
      canAccessDashboard: false,
      userJourneyStage: 'Preparing',
      ...overrides,
    };
  }

  it('redirects to identity recovery when no tracking session exists in this browser', () => {
    onboarding.getTrackingToken.and.returnValue(null);

    component.ngOnInit();

    expect(onboarding.clearTrackingToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/identity/login'], {
      queryParams: { continue: 'application-status' },
      replaceUrl: true,
    });
  });

  it('redirects to identity recovery when the tracking session has expired', () => {
    onboarding.getTrackingToken.and.returnValue('expired-token');
    onboarding.getTrackingStatus.and.returnValue(throwError(() => ({ status: 401 })));

    component.ngOnInit();

    expect(onboarding.clearTrackingToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/identity/login'], {
      queryParams: { continue: 'application-status' },
      replaceUrl: true,
    });
  });

  it('refreshes a non-terminal application and stops when the workspace is ready', fakeAsync(() => {
    onboarding.getTrackingToken.and.returnValue('tracking-token');
    onboarding.getTrackingStatus.and.returnValues(
      of(trackingStatus()),
      of(trackingStatus({
        status: ApplicationRequestStatus.Approved,
        canAccessDashboard: true,
        userJourneyStage: 'Ready',
      })),
    );

    component.ngOnInit();
    expect(onboarding.getTrackingStatus).toHaveBeenCalledTimes(1);

    tick(10000);

    expect(onboarding.getTrackingStatus).toHaveBeenCalledTimes(2);
    expect(component.status()?.canAccessDashboard).toBeTrue();
    component.ngOnDestroy();
  }));

  it('returns to identity login instead of leaving a ready user on the tracking screen', () => {
    onboarding.getTrackingToken.and.returnValue('tracking-token');
    onboarding.getTrackingStatus.and.returnValue(of(trackingStatus({
      status: ApplicationRequestStatus.Approved,
      canAccessDashboard: true,
      userJourneyStage: 'Ready',
    })));

    component.ngOnInit();
    component.continueToWorkspace();

    expect(onboarding.clearTrackingToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/identity/login'], {
      queryParams: { continue: 'workspace' },
      replaceUrl: true,
    });
    component.ngOnDestroy();
  });
});
