import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClientService, MyAppointmentDto } from '../services/client.service';
import { ClientAppointmentsComponent } from './client-appointments.component';

describe('ClientAppointmentsComponent', () => {
  let fixture: ComponentFixture<ClientAppointmentsComponent>;
  let component: ClientAppointmentsComponent;
  let clientService: jasmine.SpyObj<ClientService>;

  const appointment: MyAppointmentDto = {
    id: 'appointment-1',
    coachName: 'مدرب LogicFit',
    startTime: '2026-08-12T10:00:00Z',
    endTime: '2026-08-12T11:00:00Z',
    title: 'جلسة متابعة',
    status: 2
  };

  beforeEach(async () => {
    clientService = jasmine.createSpyObj<ClientService>('ClientService', ['getMyAppointments']);
    clientService.getMyAppointments.and.returnValue(of([appointment]));

    await TestBed.configureTestingModule({
      imports: [ClientAppointmentsComponent],
      providers: [{ provide: ClientService, useValue: clientService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and renders the client appointments from the existing API', () => {
    expect(clientService.getMyAppointments).toHaveBeenCalled();
    expect(component.appointments()).toEqual([appointment]);
    expect(component.statusLabel(2)).toBe('مؤكد');
    expect(component.statusClass(2)).toBe('status-confirmed');
    expect(fixture.nativeElement.textContent).toContain('جلسة متابعة');
  });

  it('keeps compatibility with the old string status response', () => {
    expect(component.statusLabel('Pending')).toBe('قيد الانتظار');
    expect(component.statusClass('Completed')).toBe('status-completed');
  });

  it('shows an actionable error state instead of a blank screen', () => {
    clientService.getMyAppointments.and.returnValue(throwError(() => new Error('offline')));
    component.loadAppointments();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('تحقق من الاتصال ثم أعد المحاولة.');
    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('تعذر تحميل المواعيد');
    expect(fixture.nativeElement.textContent).toContain('إعادة المحاولة');
  });
});
