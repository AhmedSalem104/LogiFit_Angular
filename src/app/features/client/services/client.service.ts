import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';

// Client Profile - matches ClientDto from backend
export interface ClientProfile {
  id: string;
  tenantId?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  walletBalance?: number;
  profile?: ClientProfileDetails;
  activeSubscription?: ClientSubscriptionInfo;
  // Legacy properties for component compatibility
  fullName?: string;
  profileImageUrl?: string;
  gender?: string;
  birthDate?: string;
  dateOfBirth?: string;
  height?: number;
  medicalHistory?: string;
  coachId?: string;
  coachName?: string;
}

export interface ClientProfileDetails {
  fullName?: string;
  gender?: number; // 0 = Male, 1 = Female
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}

export interface ClientSubscriptionInfo {
  id: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status?: string;
}

// Client Subscription - matches ClientSubscriptionDto from backend
export interface ClientSubscription {
  id: string;
  tenantId?: string;
  clientId?: string;
  clientName?: string;
  planId?: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus | string; // Allow string for legacy component compatibility
  salesCoachId?: string;
  salesCoachName?: string;
  freezes?: SubscriptionFreeze[];
  // Legacy properties for component compatibility
  price?: number;
  remainingDays?: number;
}

export interface SubscriptionFreeze {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Subscription Status enum (matches API: 0=Active, 1=Expired, 2=Frozen, 3=Cancelled)
export enum SubscriptionStatus {
  Active = 0,
  Expired = 1,
  Frozen = 2,
  Cancelled = 3,
  // Legacy aliases for backward compatibility
  Suspended = 2, // Alias for Frozen
  Trial = 0 // Treat trial as active
}

// Workout Program - matches WorkoutProgramDto from backend
export interface WorkoutProgram {
  id: string;
  tenantId?: string;
  coachId?: string;
  coachName?: string;
  clientId?: string;
  clientName?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  routines?: ProgramRoutine[];
  // Legacy properties for component compatibility
  description?: string;
  goal?: string;
  durationWeeks?: number;
  currentWeek?: number;
  daysPerWeek?: number;
  workoutDays?: WorkoutDay[];
}

export interface ProgramRoutine {
  id: string;
  programId: string;
  name?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: number;
  exerciseName?: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  supersetGroupId?: string;
}

// Workout Session - matches WorkoutSessionDto from backend
export interface WorkoutSession {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  routineId: string;
  routineName?: string;
  startedAt: string;
  endedAt?: string;
  totalVolumLifted: number;
  notes?: string;
  sets?: SessionSet[];
}

export interface SessionSet {
  id: string;
  sessionId: string;
  exerciseId: number;
  exerciseName?: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  volumeLoad: number;
  isPr: boolean;
}

// Diet Plan - matches DietPlanDto from backend with component compatibility
export interface DietPlan {
  id: string;
  tenantId?: string;
  coachId?: string;
  coachName?: string;
  clientId?: string;
  clientName?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: PlanStatus;
  // API fields
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  // Legacy/component fields
  totalCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  description?: string;
  // Meals as DietMeal for component compatibility
  meals?: DietMeal[];
}

export interface DailyMeal {
  id: string;
  planId: string;
  name?: string;
  orderIndex: number;
  items?: MealItem[];
  // Legacy properties for component compatibility
  time?: string;
  isCompleted?: boolean;
  foods?: MealFood[];  // alias for items mapped to MealFood
}

export interface MealItem {
  id: string;
  mealId: string;
  foodId: number;
  foodName?: string;
  assignedQuantity: number;
  calcCalories: number;
  calcProtein: number;
  calcCarbs: number;
  calcFats: number;
}

// Plan Status enum (0-indexed as per API docs)
export enum PlanStatus {
  Active = 0,
  Archived = 1,
  Draft = 2
}

// Body Measurement - matches BodyMeasurementDto from backend
export interface BodyMeasurement {
  id: string;
  tenantId?: string;
  clientId?: string;
  clientName?: string;
  dateRecorded?: string;
  weightKg?: number;
  skeletalMuscleMass?: number;
  bodyFatMass?: number;
  bodyFatPercent?: number;
  totalBodyWater?: number;
  bmr?: number;
  visceralFatLevel?: number;
  inbodyImageUrl?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
  // Legacy properties for component compatibility
  measurementDate?: string; // alias for dateRecorded
  weight?: number; // alias for weightKg
  height?: number;
  bodyFatPercentage?: number; // alias for bodyFatPercent
  chest?: number;
  waist?: number;
  hips?: number;
  bicepsRight?: number;
  bicepsLeft?: number;
  thighRight?: number;
  thighLeft?: number;
}

// Legacy interfaces for backward compatibility with components
export interface WorkoutDay {
  id: string;
  dayNumber: number;
  name: string;
  exercises: WorkoutExercise[];
  isCompleted: boolean;
  isToday: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds: number;
  notes?: string;
  imageUrl?: string;
  videoUrl?: string;
  isCompleted: boolean;
  completedSets: CompletedSet[];
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  weight: number;
}

export interface DietMeal {
  id: string;
  name: string;
  time: string;
  foods: MealFood[];
  isCompleted: boolean;
}

export interface MealFood {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  date: string;
  mealName: string;
  foods: LoggedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface LoggedFood {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
}

// Progress Report - matches TraineeProgressReportDto from backend
export interface ProgressData {
  clientId?: string;
  clientName?: string;
  bodyMeasurements?: BodyProgressDto[];
  startWeight?: number;
  currentWeight?: number;
  totalWeightChange?: number;
  startBodyFat?: number;
  currentBodyFat?: number;
  totalBodyFatChange?: number;
  totalSessions?: number;
  totalVolumeLifted?: number;
  personalRecords?: PersonalRecord[];
  // Legacy properties for component compatibility
  sessionsCompleted?: number;
  caloriesConsumed?: number;
  caloriesTarget?: number;
  achievements?: Achievement[];
  weightProgress?: ProgressItem[];
  bodyFatProgress?: ProgressItem[];
  streakDays?: number;
}

export interface ProgressItem {
  date: string;
  value: number;
}

export interface BodyProgressDto {
  dateRecorded: string;
  weightKg: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  bmr?: number;
}

export interface PersonalRecord {
  exerciseId: number;
  exerciseName?: string;
  maxWeight: number;
  reps: number;
  achievedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  /**
   * Get current authenticated user ID
   */
  private getCurrentUserId(): string {
    const userId = this.authService.user()?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  // Profile
  getProfile(): Observable<ClientProfile> {
    const userId = this.getCurrentUserId();
    return this.http.get<ClientProfile>(`${this.apiUrl}/clients/${userId}`);
  }

  updateProfile(data: Partial<ClientProfile>): Observable<ClientProfile> {
    const userId = this.getCurrentUserId();
    return this.http.put<ClientProfile>(`${this.apiUrl}/clients/${userId}`, data);
  }

  // Subscriptions
  getMySubscriptions(): Observable<ClientSubscription[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<ClientSubscription[]>(`${this.apiUrl}/subscriptions?clientId=${userId}`);
  }

  // Workout Program
  getMyWorkoutProgram(): Observable<WorkoutProgram[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<WorkoutProgram[]>(`${this.apiUrl}/workoutprograms?clientId=${userId}`);
  }

  // Start workout session - uses routineId as per OpenAPI StartWorkoutSessionCommand
  startWorkoutSession(routineId: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/workoutsessions/start`, { routineId });
  }

  // Get workout sessions
  getMyWorkoutSessions(fromDate?: string, toDate?: string): Observable<WorkoutSession[]> {
    const userId = this.getCurrentUserId();
    let url = `${this.apiUrl}/workoutsessions?clientId=${userId}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    return this.http.get<WorkoutSession[]>(url);
  }

  // Log a set during workout - uses CreateSetRequest
  logSet(sessionId: string, data: {
    exerciseId: number;
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe?: number;
  }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/workoutsessions/${sessionId}/sets`, data);
  }

  // End workout session - uses EndSessionRequest
  endWorkoutSession(sessionId: string, notes?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/workoutsessions/${sessionId}/end`, { notes });
  }

  // Diet Plan - status=Active as string per API docs
  getMyDietPlan(): Observable<DietPlan[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<DietPlan[]>(`${this.apiUrl}/dietplans?clientId=${userId}&status=Active`);
  }

  // Measurements
  getMyMeasurements(): Observable<BodyMeasurement[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<BodyMeasurement[]>(`${this.apiUrl}/bodymeasurements?clientId=${userId}`);
  }

  // Progress - uses TraineeProgressReportDto from /api/Reports/coach/trainee/{clientId}
  getMyProgress(): Observable<ProgressData> {
    const userId = this.getCurrentUserId();
    return this.http.get<ProgressData>(`${this.apiUrl}/reports/coach/trainee/${userId}`);
  }
}
