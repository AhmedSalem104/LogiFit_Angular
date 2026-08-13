import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantStatusService } from '../../tenant/tenant-status.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let router: { url: string; navigate: jasmine.Spy };

  beforeEach(() => {
    router = { url: '/owner/dashboard', navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: {} },
        { provide: TenantStatusService, useValue: {} }
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('keeps an optional feature 402 on the originating screen', () => {
    let receivedError: HttpErrorResponse | undefined;

    http.get('/api/reports/financial').subscribe({
      error: error => receivedError = error
    });

    const request = controller.expectOne('/api/reports/financial');
    request.flush(
      { message: 'The current plan does not include this report.' },
      { status: 402, statusText: 'Payment Required' }
    );

    expect(receivedError?.status).toBe(402);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
