import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberOnboardingDialogComponent, MemberOnboardingValue } from './member-onboarding-dialog.component';
import { SubscriptionPlan } from '../services/owner.service';

describe('MemberOnboardingDialogComponent', () => {
  let fixture: ComponentFixture<MemberOnboardingDialogComponent>;
  let component: MemberOnboardingDialogComponent;
  const plan: SubscriptionPlan = { id: 'plan-1', name: 'شهري', price: 500, durationMonths: 1, isActive: true };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MemberOnboardingDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(MemberOnboardingDialogComponent);
    component = fixture.componentInstance;
    component.open = true;
    component.plans = [plan];
    fixture.detectChanges();
  });

  it('keeps the workflow in three explicit stages', () => {
    expect(fixture.nativeElement.textContent).toContain('بيانات المشترك');
    expect(fixture.nativeElement.textContent).toContain('العضوية والدفع');
    expect(fixture.nativeElement.textContent).toContain('مراجعة وحفظ');
    component.draft.fullName = 'أحمد سالم';
    component.draft.phoneNumber = '01012345678';
    component.continue();
    expect(component.step).toBe(2);
    expect(component.membership.startDate).toBe(component.draft.registrationDate);
  });

  it('emits one compound onboarding value without asking for a password', () => {
    let emitted: MemberOnboardingValue | undefined;
    component.save.subscribe(value => emitted = value);
    component.draft.fullName = 'أحمد سالم';
    component.draft.phoneNumber = '01012345678';
    component.membership.planId = plan.id;
    component.step = 3;

    component.continue();

    expect(emitted?.fullName).toBe('أحمد سالم');
    expect(emitted?.membership?.planId).toBe(plan.id);
    expect((emitted as any)?.password).toBeUndefined();
  });
});
