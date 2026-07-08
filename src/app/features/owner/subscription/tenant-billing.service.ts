import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PlatformPlan, MySubscription, UsageSummary, SubscriptionInvoice,
  PlatformPaymentMethod, TenantSubscriptionSummary, PaymentRequest, CreatePaymentRequestForm
} from './tenant-billing.models';

/**
 * The gym's subscription to the LogicFit platform (billing paid manually by the owner).
 * All endpoints live under /api/tenant and require the `ManageTenantBilling` permission.
 */
@Injectable({ providedIn: 'root' })
export class TenantBillingService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/tenant`;

  /** Available platform plans. */
  getPlans(): Observable<PlatformPlan[]> {
    return this.http.get<PlatformPlan[]>(`${this.api}/plans`);
  }

  /** Current subscription state + usage. */
  getMySubscription(): Observable<MySubscription> {
    return this.http.get<MySubscription>(`${this.api}/my-subscription`);
  }

  /** Usage vs limits (for progress bars). */
  getUsage(): Observable<UsageSummary> {
    return this.http.get<UsageSummary>(`${this.api}/usage`);
  }

  /** Platform invoices. */
  getInvoices(): Observable<SubscriptionInvoice[]> {
    return this.http.get<SubscriptionInvoice[]>(`${this.api}/invoices`);
  }

  /** Available payment methods (bank / InstaPay / wallet...). */
  getPaymentMethods(): Observable<PlatformPaymentMethod[]> {
    return this.http.get<PlatformPaymentMethod[]>(`${this.api}/payment-methods`);
  }

  /** Select a plan → opens a PendingPayment subscription. */
  selectPlan(planId: string): Observable<TenantSubscriptionSummary> {
    return this.http.post<TenantSubscriptionSummary>(`${this.api}/subscription/select-plan`, { planId });
  }

  /** Upgrade to a higher plan → then repeat the payment flow. */
  upgrade(planId: string): Observable<TenantSubscriptionSummary> {
    return this.http.post<TenantSubscriptionSummary>(`${this.api}/subscription/upgrade`, { planId });
  }

  /** Renew the current plan. */
  renew(): Observable<TenantSubscriptionSummary> {
    return this.http.post<TenantSubscriptionSummary>(`${this.api}/subscription/renew`, {});
  }

  /** My payment requests (proof-of-payment history). */
  getPaymentRequests(): Observable<PaymentRequest[]> {
    return this.http.get<PaymentRequest[]>(`${this.api}/payment-requests`);
  }

  /** Submit a payment proof (multipart). */
  submitPaymentRequest(form: CreatePaymentRequestForm): Observable<PaymentRequest> {
    const fd = new FormData();
    fd.append('planId', form.planId);
    if (form.proof) fd.append('proof', form.proof);
    if (form.paymentMethodId) fd.append('paymentMethodId', form.paymentMethodId);
    if (form.transactionNumber) fd.append('transactionNumber', form.transactionNumber);
    if (form.paymentDate) fd.append('paymentDate', form.paymentDate);
    if (form.notes) fd.append('notes', form.notes);
    return this.http.post<PaymentRequest>(`${this.api}/payment-requests`, fd);
  }
}
