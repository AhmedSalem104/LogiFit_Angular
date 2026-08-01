import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
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
});
