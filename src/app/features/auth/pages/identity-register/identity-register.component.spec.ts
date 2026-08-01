import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { IdentityRegisterComponent } from './identity-register.component';

describe('IdentityRegisterComponent phone normalization', () => {
  let component: IdentityRegisterComponent;
  let onboarding: jasmine.SpyObj<FreelanceOnboardingService>;

  beforeEach(() => {
    onboarding = jasmine.createSpyObj<FreelanceOnboardingService>('FreelanceOnboardingService', [
      'registerIdentity',
    ]);
    onboarding.registerIdentity.and.returnValue(of(void 0));
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [{ provide: FreelanceOnboardingService, useValue: onboarding }],
    });
    component = TestBed.runInInjectionContext(() => new IdentityRegisterComponent());
  });

  it('submits an optional local phone in E.164 format', () => {
    component.form.setValue({
      fullName: 'Ahmed Salem',
      email: 'ahmed@example.com',
      countryCode: '+20',
      phoneNumber: '010 1234 5678',
      password: 'Password1',
      confirmPassword: 'Password1',
    });

    component.submit();

    expect(onboarding.registerIdentity).toHaveBeenCalledWith(
      'Ahmed Salem', 'ahmed@example.com', 'Password1', '+201012345678');
  });
});
