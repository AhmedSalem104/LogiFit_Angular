import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardReport,
  FinancialReport,
  ClientsReport,
  SubscriptionsReport,
  CoachDashboardReport,
  TraineeProgressReport
} from '../../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;
  private http = inject(HttpClient);

  /**
   * Get Owner Dashboard Report
   */
  getDashboardReport(): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get Financial Report
   */
  getFinancialReport(): Observable<FinancialReport> {
    return this.http.get<FinancialReport>(`${this.apiUrl}/financial`);
  }

  /**
   * Get Clients Report
   */
  getClientsReport(): Observable<ClientsReport> {
    return this.http.get<ClientsReport>(`${this.apiUrl}/clients`);
  }

  /**
   * Get Subscriptions Report
   */
  getSubscriptionsReport(): Observable<SubscriptionsReport> {
    return this.http.get<SubscriptionsReport>(`${this.apiUrl}/subscriptions`);
  }

  /**
   * Get Coach Dashboard Report
   */
  getCoachDashboardReport(coachId?: string): Observable<CoachDashboardReport> {
    if (coachId) {
      return this.http.get<CoachDashboardReport>(`${this.apiUrl}/coach/dashboard`, { params: { coachId } });
    }
    return this.http.get<CoachDashboardReport>(`${this.apiUrl}/coach/dashboard`);
  }

  /**
   * Get Coach Trainees Report
   */
  getCoachTraineesReport(coachId?: string): Observable<any> {
    if (coachId) {
      return this.http.get(`${this.apiUrl}/coach/trainees`, { params: { coachId } });
    }
    return this.http.get(`${this.apiUrl}/coach/trainees`);
  }

  /**
   * Get Trainee Progress Report
   */
  getTraineeProgressReport(clientId: string): Observable<TraineeProgressReport> {
    return this.http.get<TraineeProgressReport>(`${this.apiUrl}/coach/trainee/${clientId}`);
  }
}
