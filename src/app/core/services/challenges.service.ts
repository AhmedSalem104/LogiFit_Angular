import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// Interfaces
// ==========================================

export interface ChallengeDto {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetMetric: string;
  targetValue: number;
  status: number; // 1=Active, 2=Completed, 3=Cancelled
  createdByCoachName: string;
  participantCount: number;
  completedCount: number;
}

export interface ClientChallengeDto {
  id: string;
  challengeId: string;
  challengeTitle: string;
  challengeDescription?: string;
  clientId: string;
  clientName: string;
  currentProgress: number;
  targetValue: number;
  targetMetric: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  progressPercentage: number;
  participantCount?: number;
}

export interface CreateChallengeCommand {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetMetric: string;
  targetValue: number;
  clientIds: string[];
}

export interface UpdateChallengeCommand {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetMetric?: string;
  targetValue?: number;
}

// ==========================================
// Enums & Labels
// ==========================================

export const ChallengeStatus = {
  Active: 1,
  Completed: 2,
  Cancelled: 3
} as const;

export const ChallengeStatusLabels: Record<number, string> = {
  1: 'نشط',
  2: 'مكتمل',
  3: 'ملغي'
};

export const ChallengeMetrics = [
  { label: 'جلسات تمرين', value: 'sessions' },
  { label: 'خسارة وزن (كجم)', value: 'weight_loss_kg' },
  { label: 'تمارين مكتملة', value: 'workouts' },
  { label: 'سعرات محروقة', value: 'calories_burned' },
  { label: 'كيلومترات جري', value: 'running_km' },
  { label: 'ساعات تمرين', value: 'training_hours' }
];

export const ChallengeMetricLabels: Record<string, string> = {
  sessions: 'جلسات تمرين',
  weight_loss_kg: 'خسارة وزن (كجم)',
  workouts: 'تمارين مكتملة',
  calories_burned: 'سعرات محروقة',
  running_km: 'كيلومترات جري',
  training_hours: 'ساعات تمرين'
};

// ==========================================
// Service
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class ChallengesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ==========================================
  // Coach endpoints
  // ==========================================

  getChallenges(status?: number): Observable<ChallengeDto[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<ChallengeDto[]>(`${this.apiUrl}/challenges${query}`);
  }

  getChallenge(id: string): Observable<ChallengeDto> {
    return this.http.get<ChallengeDto>(`${this.apiUrl}/challenges/${id}`);
  }

  createChallenge(command: CreateChallengeCommand): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/challenges`, command);
  }

  updateChallenge(id: string, command: UpdateChallengeCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/challenges/${id}`, command);
  }

  deleteChallenge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/challenges/${id}`);
  }

  // ==========================================
  // Client endpoints
  // ==========================================

  getMyChallenges(): Observable<ClientChallengeDto[]> {
    return this.http.get<ClientChallengeDto[]>(`${this.apiUrl}/challenges/my`);
  }

  joinChallenge(challengeId: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/challenges/${challengeId}/join`, {});
  }

  updateProgress(challengeId: string, progress: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/challenges/${challengeId}/progress`, { progress });
  }
}
