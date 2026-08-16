import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnerService, SubscriptionPlan } from '../services/owner.service';
import { SubscriptionsListComponent } from './subscriptions-list.component';

describe('SubscriptionsListComponent', () => {
  let fixture: ComponentFixture<SubscriptionsListComponent>;
  let component: SubscriptionsListComponent;
  let ownerService: jasmine.SpyObj<OwnerService>;

  const plan: SubscriptionPlan = {
    id: 'plan-1',
    name: 'Basic',
    price: 100,
    durationMonths: 1,
    isActive: true
  };

  beforeEach(async () => {
    ownerService = jasmine.createSpyObj<OwnerService>('OwnerService', [
      'getSubscriptions',
      'getSubscriptionPlans',
      'getClients'
    ]);
    ownerService.getSubscriptions.and.returnValue(of([]));
    ownerService.getSubscriptionPlans.and.returnValue(of([plan]));
    ownerService.getClients.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SubscriptionsListComponent],
      providers: [
        provideHttpClient(),
        { provide: OwnerService, useValue: ownerService },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['warn', 'error', 'success'])
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens the first-member flow when the gym has no clients yet', () => {
    component.openSubscriptionDialog();

    expect(component.subscriptionDialogVisible).toBeTrue();
    expect(component.newClientMode).toBeTrue();
  });
});
