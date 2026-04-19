import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Employee, CreateEmployeeRequest, UpdateEmployeeRequest, TerminateEmployeeRequest,
  Shift, CreateShiftRequest, UpdateShiftRequest, ShiftAssignment, AssignShiftRequest,
  Leave, CreateLeaveRequest, ReviewLeaveRequest, LeaveStatus, LeaveType,
  Commission, CommissionRule, CreateCommissionRuleRequest, UpdateCommissionRuleRequest,
  CommissionSourceType, CommissionStatus,
  PayrollRun, GeneratePayrollRequest, UpdatePayrollItemRequest, PayrollStatus
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class HrService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ============= Employees =============
  listEmployees(params?: {
    branchId?: string; department?: string; isActive?: boolean; searchTerm?: string;
  }): Observable<Employee[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.department) p = p.set('department', params.department);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    return this.http.get<Employee[]>(`${this.api}/Employees`, { params: p });
  }
  createEmployee(body: CreateEmployeeRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Employees`, body);
  }
  updateEmployee(id: string, body: UpdateEmployeeRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Employees/${id}`, body);
  }
  terminateEmployee(id: string, body: TerminateEmployeeRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Employees/${id}/terminate`, body);
  }

  // ============= Shifts =============
  listShifts(params?: { branchId?: string; isActive?: boolean }): Observable<Shift[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    return this.http.get<Shift[]>(`${this.api}/Shifts`, { params: p });
  }
  createShift(body: CreateShiftRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Shifts`, body);
  }
  updateShift(id: string, body: UpdateShiftRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Shifts/${id}`, body);
  }
  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Shifts/${id}`);
  }
  assignShift(body: AssignShiftRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Shifts/assign`, body);
  }
  listShiftAssignments(params?: {
    employeeId?: string; shiftId?: string; fromDate?: string; toDate?: string;
  }): Observable<ShiftAssignment[]> {
    let p = new HttpParams();
    if (params?.employeeId) p = p.set('employeeId', params.employeeId);
    if (params?.shiftId) p = p.set('shiftId', params.shiftId);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<ShiftAssignment[]>(`${this.api}/Shifts/assignments`, { params: p });
  }

  // ============= Leaves =============
  listLeaves(params?: {
    employeeId?: string; status?: LeaveStatus; leaveType?: LeaveType;
    fromDate?: string; toDate?: string;
  }): Observable<Leave[]> {
    let p = new HttpParams();
    if (params?.employeeId) p = p.set('employeeId', params.employeeId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    if (params?.leaveType !== undefined) p = p.set('leaveType', params.leaveType);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<Leave[]>(`${this.api}/Leaves`, { params: p });
  }
  createLeave(body: CreateLeaveRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Leaves`, body);
  }
  reviewLeave(id: string, body: ReviewLeaveRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Leaves/${id}/review`, body);
  }

  // ============= Commissions =============
  listCommissions(params?: {
    employeeId?: string; status?: CommissionStatus; sourceType?: CommissionSourceType;
    fromDate?: string; toDate?: string;
  }): Observable<Commission[]> {
    let p = new HttpParams();
    if (params?.employeeId) p = p.set('employeeId', params.employeeId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    if (params?.sourceType !== undefined) p = p.set('sourceType', params.sourceType);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<Commission[]>(`${this.api}/Commissions`, { params: p });
  }
  listCommissionRules(): Observable<CommissionRule[]> {
    return this.http.get<CommissionRule[]>(`${this.api}/Commissions/rules`);
  }
  createCommissionRule(body: CreateCommissionRuleRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Commissions/rules`, body);
  }
  updateCommissionRule(id: string, body: UpdateCommissionRuleRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Commissions/rules/${id}`, body);
  }
  deleteCommissionRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Commissions/rules/${id}`);
  }

  // ============= Payroll =============
  listPayrolls(params?: { year?: number; month?: number; branchId?: string; status?: PayrollStatus }): Observable<PayrollRun[]> {
    let p = new HttpParams();
    if (params?.year) p = p.set('year', params.year);
    if (params?.month) p = p.set('month', params.month);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    return this.http.get<PayrollRun[]>(`${this.api}/Payroll`, { params: p });
  }
  generatePayroll(body: GeneratePayrollRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Payroll/generate`, body);
  }
  updatePayrollItem(itemId: string, body: UpdatePayrollItemRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Payroll/items/${itemId}`, body);
  }
  approvePayroll(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/Payroll/${id}/approve`, {});
  }
  payPayroll(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/Payroll/${id}/pay`, {});
  }
}
