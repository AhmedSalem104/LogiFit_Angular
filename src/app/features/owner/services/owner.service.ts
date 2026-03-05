import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardReport, ClientsReport, FinancialReport } from '../../../shared/models/api.models';

// ==================== Client Interfaces ====================
export interface Client {
  id: string;
  tenantId?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  walletBalance?: number;
  profile?: ClientProfile;
  fullName?: string;
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: string;
  assignedCoachId?: string;
  assignedCoachName?: string;
}

export interface ClientProfile {
  fullName?: string;
  gender?: number;
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

// ==================== Coach Interfaces ====================
export interface Coach {
  id: string;
  tenantId?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  profile?: CoachProfile;
  fullName?: string;
  traineesCount?: number;
  traineeCount?: number;
  activePrograms?: number;
}

export interface CoachProfile {
  fullName?: string;
  profilePictureUrl?: string;
  gender?: number;
  birthDate?: string;
}

export interface CreateCoachRequest {
  email?: string;
  phoneNumber: string;
  password: string;
  fullName: string;
  gender?: number;
  birthDate?: string;
}

export interface UpdateCoachRequest {
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  fullName?: string;
  gender?: number;
  birthDate?: string;
}

// ==================== Subscription Plan Interfaces ====================
export interface SubscriptionPlan {
  id: string;
  tenantId?: string;
  name: string;
  price: number;
  durationMonths: number;
  description?: string;
  features?: string[];
  maxFreezeDays?: number;
  maxFreezeCount?: number;
  isActive?: boolean;
  sessionsPerWeek?: number | null;
  inBodyIncluded?: boolean;
  privateCoach?: boolean;
  activeSubscribersCount?: number;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  durationMonths: number;
  description?: string;
  features?: string[];
  maxFreezeDays?: number;
  maxFreezeCount?: number;
  isActive?: boolean;
  sessionsPerWeek?: number | null;
  inBodyIncluded?: boolean;
  privateCoach?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  price?: number;
  durationMonths?: number;
  description?: string;
  features?: string[];
  maxFreezeDays?: number;
  maxFreezeCount?: number;
  isActive?: boolean;
  sessionsPerWeek?: number | null;
  inBodyIncluded?: boolean;
  privateCoach?: boolean;
}

// ==================== Subscription Interfaces ====================
export interface SubscriptionFreeze {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive?: boolean;
}

export interface ClientSubscription {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  planId: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: number; // 1=Active, 2=Suspended, 3=Trial, 4=Expired, 5=Cancelled
  statusName?: string;
  salesCoachId?: string;
  salesCoachName?: string;
  paymentMethod?: number; // 0=Cash, 1=Wallet, 2=Card, 3=BankTransfer
  paymentMethodName?: string;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
  discount?: number;
  isPaid?: boolean;
  notes?: string;
  renewedFromId?: string | null;
  remainingDays?: number;
  totalFreezeDays?: number;
  freezes?: SubscriptionFreeze[];
  planDetails?: SubscriptionPlan;
  renewalHistory?: RenewalHistoryItem[];
}

export interface RenewalHistoryItem {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: number;
  amountPaid: number;
}

export interface CreateSubscriptionRequest {
  clientId: string;
  planId: string;
  startDate: string;
  paymentMethod?: number;
  amountPaid?: number;
  discount?: number;
  notes?: string;
  payFromWallet?: boolean;
}

export interface UpdateSubscriptionRequest {
  endDate?: string;
  notes?: string;
  amountPaid?: number;
  discount?: number;
}

export interface RenewSubscriptionRequest {
  planId?: string;
  startDate?: string;
  paymentMethod?: number;
  amountPaid?: number;
  discount?: number;
  notes?: string;
  payFromWallet?: boolean;
}

export interface AddPaymentRequest {
  amount: number;
  paymentMethod?: number;
  payFromWallet?: boolean;
}

export interface CancelSubscriptionRequest {
  refundToWallet?: boolean;
  refundAmount?: number | null;
}

export interface FreezeSubscriptionRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

// ==================== Report Interfaces ====================
export interface SubscriptionReport {
  totalSubscriptions: number;
  activeSubscriptions: number;
  suspendedSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  totalRevenue: number;
  revenueThisMonth: number;
  renewalRate: number;
  averageSubscriptionDurationDays: number;
  planStatistics: PlanStatistic[];
  monthlyRevenue: MonthlyRevenue[];
  revenueByPaymentMethod: PaymentMethodRevenue[];
}

export interface PlanStatistic {
  planId: string;
  planName: string;
  activeCount: number;
  totalSold: number;
  totalRevenue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  subscriptionCount: number;
}

export interface PaymentMethodRevenue {
  paymentMethod: string;
  count: number;
  totalRevenue: number;
}

// ==================== Gym Profile Interfaces ====================
export interface GymProfile {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  facebook?: string;
  instagram?: string;
  website?: string;
  openingHours?: string;
}

export interface UpdateGymProfileRequest {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  openingHours?: string;
}

// ==================== Enums ====================
export const SubscriptionStatus = {
  Active: 1,
  Suspended: 2,
  Trial: 3,
  Expired: 4,
  Cancelled: 5
} as const;

export const PaymentMethod = {
  Cash: 0,
  Wallet: 1,
  Card: 2,
  BankTransfer: 3
} as const;

export const StatusLabels: Record<number, string> = {
  1: 'نشط',
  2: 'مجمد',
  3: 'تجريبي',
  4: 'منتهي',
  5: 'ملغي'
};

export const PaymentMethodLabels: Record<number, string> = {
  0: 'كاش',
  1: 'محفظة',
  2: 'كارت',
  3: 'تحويل بنكي'
};

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ==================== CLIENTS ====================

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

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  createClient(data: CreateClientRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/clients`, data);
  }

  updateClient(id: string, data: UpdateClientRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/clients/${id}`, data);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }

  toggleClientStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/clients/${id}/status`, { isActive });
  }

  // ==================== COACHES ====================

  getCoaches(params?: { isActive?: boolean; searchTerm?: string }): Observable<Coach[]> {
    let httpParams = new HttpParams();
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params?.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }
    return this.http.get<Coach[]>(`${this.apiUrl}/coaches`, { params: httpParams });
  }

  getCoachById(id: string): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/coaches/${id}`);
  }

  createCoach(data: CreateCoachRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/coaches`, data);
  }

  updateCoach(id: string, data: UpdateCoachRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/coaches/${id}`, data);
  }

  deleteCoach(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/coaches/${id}`);
  }

  toggleCoachStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/coaches/${id}/status`, { isActive });
  }

  getCoachStats(coachId: string): Observable<{ traineesCount: number; activePrograms: number }> {
    return this.http.get<{ traineesCount: number; activePrograms: number }>(
      `${this.apiUrl}/coaches/${coachId}/stats`
    );
  }

  // ==================== SUBSCRIPTION PLANS ====================

  getSubscriptionPlans(isActive?: boolean): Observable<SubscriptionPlan[]> {
    let httpParams = new HttpParams();
    if (isActive !== undefined) {
      httpParams = httpParams.set('isActive', isActive.toString());
    }
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/subscriptions/plans`, { params: httpParams });
  }

  getPlanById(id: string): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.apiUrl}/subscriptions/plans/${id}`);
  }

  createPlan(data: CreatePlanRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions/plans`, data);
  }

  updatePlan(id: string, data: UpdatePlanRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/subscriptions/plans/${id}`, data);
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subscriptions/plans/${id}`);
  }

  togglePlanStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/subscriptions/plans/${id}`, { isActive });
  }

  // ==================== SUBSCRIPTIONS ====================

  getSubscriptions(params?: {
    clientId?: string;
    status?: number;
    planId?: string;
    expiringWithinDays?: number;
    searchTerm?: string;
  }): Observable<ClientSubscription[]> {
    let httpParams = new HttpParams();
    if (params?.clientId) httpParams = httpParams.set('clientId', params.clientId);
    if (params?.status !== undefined) httpParams = httpParams.set('status', params.status.toString());
    if (params?.planId) httpParams = httpParams.set('planId', params.planId);
    if (params?.expiringWithinDays !== undefined) httpParams = httpParams.set('expiringWithinDays', params.expiringWithinDays.toString());
    if (params?.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    return this.http.get<ClientSubscription[]>(`${this.apiUrl}/subscriptions`, { params: httpParams });
  }

  getSubscriptionById(id: string): Observable<ClientSubscription> {
    return this.http.get<ClientSubscription>(`${this.apiUrl}/subscriptions/${id}`);
  }

  getExpiringSubscriptions(days: number = 7): Observable<ClientSubscription[]> {
    return this.http.get<ClientSubscription[]>(`${this.apiUrl}/subscriptions/expiring`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  createSubscription(data: CreateSubscriptionRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions`, data);
  }

  updateSubscription(id: string, data: UpdateSubscriptionRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/subscriptions/${id}`, data);
  }

  renewSubscription(subscriptionId: string, data: RenewSubscriptionRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions/${subscriptionId}/renew`, data);
  }

  addPayment(subscriptionId: string, data: AddPaymentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/subscriptions/${subscriptionId}/payment`, data);
  }

  cancelSubscription(subscriptionId: string, data: CancelSubscriptionRequest = {}): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/subscriptions/${subscriptionId}/cancel`, data);
  }

  // ==================== FREEZES ====================

  freezeSubscription(subscriptionId: string, data: FreezeSubscriptionRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions/${subscriptionId}/freeze`, data);
  }

  endFreeze(freezeId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/subscriptions/freezes/${freezeId}/end`, {});
  }

  // ==================== REPORTS ====================

  getDashboardReport(): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.apiUrl}/reports/dashboard`);
  }

  getClientsReport(): Observable<ClientsReport> {
    return this.http.get<ClientsReport>(`${this.apiUrl}/reports/clients`);
  }

  getSubscriptionReport(): Observable<SubscriptionReport> {
    return this.http.get<SubscriptionReport>(`${this.apiUrl}/reports/subscriptions`);
  }

  getFinancialReport(): Observable<FinancialReport> {
    return this.http.get<FinancialReport>(`${this.apiUrl}/reports/financial`);
  }

  // ==================== GYM PROFILE ====================

  getGymProfile(): Observable<GymProfile> {
    return this.http.get<GymProfile>(`${this.apiUrl}/gymprofile`);
  }

  updateGymProfile(data: UpdateGymProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/gymprofile`, data);
  }

  uploadGymLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/gymprofile/logo`, formData);
  }

  uploadGymCover(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/gymprofile/cover`, formData);
  }

  uploadGymGallery(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/gymprofile/gallery`, formData);
  }

  deleteGymGalleryImage(imageUrl: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/gymprofile/gallery`, { body: { imageUrl } });
  }
}
