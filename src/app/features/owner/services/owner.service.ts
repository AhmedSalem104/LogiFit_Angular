import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Client interfaces
export interface Client {
  id: string;
  tenantId?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  walletBalance?: number;
  profile?: ClientProfile;
  // Computed/joined fields
  fullName?: string;
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: string;
  assignedCoachId?: string;
  assignedCoachName?: string;
}

export interface ClientProfile {
  fullName?: string;
  gender?: number; // 0 = Male, 1 = Female
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}

export interface CreateClientRequest {
  email?: string;
  phoneNumber: string;
  password: string;
  fullName: string;
  gender?: number;
  birthDate?: string;
}

export interface UpdateClientRequest {
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  fullName?: string;
  gender?: number;
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}

// Coach interfaces
export interface Coach {
  id: string;
  tenantId?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  profile?: CoachProfile;
  // Computed/joined fields
  fullName?: string;
  traineesCount?: number;
  activePrograms?: number;
}

export interface CoachProfile {
  fullName?: string;
  gender?: number;
  birthDate?: string;
}

export interface CreateCoachRequest {
  email?: string;
  phoneNumber: string;
  password: string;
  fullName: string;
  gender?: number;
}

export interface UpdateCoachRequest {
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  fullName?: string;
  gender?: number;
}

// Subscription Plan interfaces
export interface SubscriptionPlan {
  id: string;
  tenantId?: string;
  name: string;
  price: number;
  durationMonths: number;
  isActive?: boolean;
  description?: string;
  // Computed
  subscribersCount?: number;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  durationMonths: number;
  description?: string;
}

export interface UpdatePlanRequest {
  name?: string;
  price?: number;
  durationMonths?: number;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ==================== CLIENTS ====================

  /**
   * Get all clients
   */
  getClients(params?: { isActive?: boolean; hasSubscription?: boolean }): Observable<Client[]> {
    let httpParams = new HttpParams();
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params?.hasSubscription !== undefined) {
      httpParams = httpParams.set('hasActiveSubscription', params.hasSubscription.toString());
    }
    return this.http.get<Client[]>(`${this.apiUrl}/clients`, { params: httpParams });
  }

  /**
   * Get client by ID
   */
  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  /**
   * Create new client
   */
  createClient(data: CreateClientRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/clients`, data);
  }

  /**
   * Update client
   */
  updateClient(id: string, data: UpdateClientRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/clients/${id}`, data);
  }

  /**
   * Delete client
   */
  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }

  /**
   * Toggle client active status
   */
  toggleClientStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/clients/${id}/status`, { isActive });
  }

  // ==================== COACHES ====================

  /**
   * Get all coaches
   */
  getCoaches(params?: { isActive?: boolean }): Observable<Coach[]> {
    let httpParams = new HttpParams();
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    return this.http.get<Coach[]>(`${this.apiUrl}/coaches`, { params: httpParams });
  }

  /**
   * Get coach by ID
   */
  getCoachById(id: string): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/coaches/${id}`);
  }

  /**
   * Create new coach
   */
  createCoach(data: CreateCoachRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/coaches`, data);
  }

  /**
   * Update coach
   */
  updateCoach(id: string, data: UpdateCoachRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/coaches/${id}`, data);
  }

  /**
   * Delete coach
   */
  deleteCoach(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/coaches/${id}`);
  }

  /**
   * Toggle coach active status
   */
  toggleCoachStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/coaches/${id}/status`, { isActive });
  }

  /**
   * Get coach statistics (trainees count, active programs)
   */
  getCoachStats(coachId: string): Observable<{ traineesCount: number; activePrograms: number }> {
    return this.http.get<{ traineesCount: number; activePrograms: number }>(
      `${this.apiUrl}/coaches/${coachId}/stats`
    );
  }

  // ==================== SUBSCRIPTION PLANS ====================

  /**
   * Get all subscription plans
   */
  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/subscriptionplans`);
  }

  /**
   * Get plan by ID
   */
  getPlanById(id: string): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.apiUrl}/subscriptionplans/${id}`);
  }

  /**
   * Create new plan
   */
  createPlan(data: CreatePlanRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptionplans`, data);
  }

  /**
   * Update plan
   */
  updatePlan(id: string, data: UpdatePlanRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/subscriptionplans/${id}`, data);
  }

  /**
   * Delete plan
   */
  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subscriptionplans/${id}`);
  }

  /**
   * Toggle plan active status
   */
  togglePlanStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/subscriptionplans/${id}/status`, { isActive });
  }
}
