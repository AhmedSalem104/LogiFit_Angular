import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OperationsDashboard, ExpensesReport, PosSalesReport, StockValuationReport,
  PayrollSummaryReport, ClassAttendanceReport, EquipmentUtilizationReport,
  BranchComparisonReport, CommissionsReport
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class OperationsReportsService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/Reports`;

  private range(fromDate?: string, toDate?: string, extras: Record<string, string | number | undefined> = {}): HttpParams {
    let p = new HttpParams();
    if (fromDate) p = p.set('fromDate', fromDate);
    if (toDate) p = p.set('toDate', toDate);
    Object.entries(extras).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  operationsDashboard(): Observable<OperationsDashboard> {
    return this.http.get<OperationsDashboard>(`${this.api}/operations-dashboard`);
  }

  expenses(params?: { fromDate?: string; toDate?: string; branchId?: string }): Observable<ExpensesReport> {
    return this.http.get<ExpensesReport>(`${this.api}/expenses`, {
      params: this.range(params?.fromDate, params?.toDate, { branchId: params?.branchId })
    });
  }

  posSales(params?: { fromDate?: string; toDate?: string; branchId?: string; topProductsCount?: number }): Observable<PosSalesReport> {
    return this.http.get<PosSalesReport>(`${this.api}/pos-sales`, {
      params: this.range(params?.fromDate, params?.toDate, {
        branchId: params?.branchId,
        topProductsCount: params?.topProductsCount
      })
    });
  }

  stockValuation(branchId?: string): Observable<StockValuationReport> {
    let p = new HttpParams();
    if (branchId) p = p.set('branchId', branchId);
    return this.http.get<StockValuationReport>(`${this.api}/stock-valuation`, { params: p });
  }

  payrollSummary(params: { year: number; month: number }): Observable<PayrollSummaryReport> {
    return this.http.get<PayrollSummaryReport>(`${this.api}/payroll-summary`, {
      params: new HttpParams().set('year', params.year).set('month', params.month)
    });
  }

  classAttendance(params?: { fromDate?: string; toDate?: string; branchId?: string }): Observable<ClassAttendanceReport> {
    return this.http.get<ClassAttendanceReport>(`${this.api}/class-attendance`, {
      params: this.range(params?.fromDate, params?.toDate, { branchId: params?.branchId })
    });
  }

  equipmentUtilization(branchId?: string): Observable<EquipmentUtilizationReport> {
    let p = new HttpParams();
    if (branchId) p = p.set('branchId', branchId);
    return this.http.get<EquipmentUtilizationReport>(`${this.api}/equipment-utilization`, { params: p });
  }

  branchComparison(params?: { fromDate?: string; toDate?: string }): Observable<BranchComparisonReport> {
    return this.http.get<BranchComparisonReport>(`${this.api}/branch-comparison`, {
      params: this.range(params?.fromDate, params?.toDate)
    });
  }

  commissions(params?: { fromDate?: string; toDate?: string; employeeId?: string }): Observable<CommissionsReport> {
    return this.http.get<CommissionsReport>(`${this.api}/commissions`, {
      params: this.range(params?.fromDate, params?.toDate, { employeeId: params?.employeeId })
    });
  }
}
