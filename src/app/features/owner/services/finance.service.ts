import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExpenseCategory, CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest,
  Expense, CreateExpenseRequest, UpdateExpenseRequest,
  Invoice, CreateInvoiceRequest, CancelInvoiceRequest, InvoiceStatus,
  Payment, CreatePaymentRequest, PaymentMethodEnum,
  Coupon, CreateCouponRequest, UpdateCouponRequest, CouponValidation, CouponApplicability,
  TaxSetting, CreateTaxRequest, UpdateTaxRequest
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Expense Categories
  listExpenseCategories(isActive?: boolean): Observable<ExpenseCategory[]> {
    let p = new HttpParams();
    if (isActive !== undefined) p = p.set('isActive', isActive);
    return this.http.get<ExpenseCategory[]>(`${this.api}/ExpenseCategories`, { params: p });
  }
  createExpenseCategory(body: CreateExpenseCategoryRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/ExpenseCategories`, body);
  }
  updateExpenseCategory(id: string, body: UpdateExpenseCategoryRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/ExpenseCategories/${id}`, body);
  }
  deleteExpenseCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/ExpenseCategories/${id}`);
  }

  // Expenses
  listExpenses(params?: {
    branchId?: string; categoryId?: string; fromDate?: string; toDate?: string; searchTerm?: string;
  }): Observable<Expense[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.categoryId) p = p.set('categoryId', params.categoryId);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    return this.http.get<Expense[]>(`${this.api}/Expenses`, { params: p });
  }
  createExpense(body: CreateExpenseRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Expenses`, body);
  }
  updateExpense(id: string, body: UpdateExpenseRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Expenses/${id}`, body);
  }
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Expenses/${id}`);
  }

  // Invoices
  listInvoices(params?: {
    clientId?: string; branchId?: string; status?: InvoiceStatus; fromDate?: string; toDate?: string;
  }): Observable<Invoice[]> {
    let p = new HttpParams();
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<Invoice[]>(`${this.api}/Invoices`, { params: p });
  }
  getInvoice(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.api}/Invoices/${id}`);
  }
  createInvoice(body: CreateInvoiceRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Invoices`, body);
  }
  issueInvoice(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/Invoices/${id}/issue`, {});
  }
  cancelInvoice(id: string, body: CancelInvoiceRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Invoices/${id}/cancel`, body);
  }

  // Payments
  listPayments(params?: {
    clientId?: string; branchId?: string; invoiceId?: string; subscriptionId?: string;
    method?: PaymentMethodEnum; fromDate?: string; toDate?: string;
  }): Observable<Payment[]> {
    let p = new HttpParams();
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.invoiceId) p = p.set('invoiceId', params.invoiceId);
    if (params?.subscriptionId) p = p.set('subscriptionId', params.subscriptionId);
    if (params?.method !== undefined) p = p.set('method', params.method);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<Payment[]>(`${this.api}/Payments`, { params: p });
  }
  createPayment(body: CreatePaymentRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Payments`, body);
  }

  // Coupons
  listCoupons(params?: { isActive?: boolean; search?: string }): Observable<Coupon[]> {
    let p = new HttpParams();
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.search) p = p.set('search', params.search);
    return this.http.get<Coupon[]>(`${this.api}/Coupons`, { params: p });
  }
  createCoupon(body: CreateCouponRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Coupons`, body);
  }
  updateCoupon(id: string, body: UpdateCouponRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Coupons/${id}`, body);
  }
  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Coupons/${id}`);
  }
  validateCoupon(params: { code: string; amount: number; context?: CouponApplicability }): Observable<CouponValidation> {
    let p = new HttpParams().set('code', params.code).set('amount', params.amount);
    if (params.context !== undefined) p = p.set('context', params.context);
    return this.http.get<CouponValidation>(`${this.api}/Coupons/validate`, { params: p });
  }

  // Tax Settings
  listTaxes(isActive?: boolean): Observable<TaxSetting[]> {
    let p = new HttpParams();
    if (isActive !== undefined) p = p.set('isActive', isActive);
    return this.http.get<TaxSetting[]>(`${this.api}/TaxSettings`, { params: p });
  }
  createTax(body: CreateTaxRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/TaxSettings`, body);
  }
  updateTax(id: string, body: UpdateTaxRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/TaxSettings/${id}`, body);
  }
  deleteTax(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/TaxSettings/${id}`);
  }
}
