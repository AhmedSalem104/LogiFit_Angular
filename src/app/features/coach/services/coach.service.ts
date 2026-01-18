import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CoachDashboardStats {
  totalTrainees: number;
  activeTrainees: number;
  totalWorkoutPrograms: number;
  totalDietPlans: number;
  totalSessionsThisMonth: number;
  totalVolumeThisMonth: number;
  averageTraineeProgress: number;
  topTraineesByProgress: TraineeProgress[];
  recentActivities: CoachActivity[];
}

export interface TraineeProgress {
  traineeId: string;
  traineeName: string;
  progressPercentage: number;
  sessionsCompleted: number;
  lastActivityDate: string;
}

export interface CoachActivity {
  id: string;
  type: 'session' | 'program' | 'diet' | 'measurement';
  description: string;
  traineeId: string;
  traineeName: string;
  date: string;
}

export interface Trainee {
  id: string;
  tenantId?: string;
  coachId?: string;
  coachName?: string;
  // Legacy field names (for backward compatibility)
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  // API field names
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  profileImageUrl?: string;
  profilePictureUrl?: string;
  gender?: number; // 0=Male, 1=Female
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalHistory?: string;
  // Status fields
  isActive: boolean;
  walletBalance?: number;
  notes?: string;
  assignedAt?: string;
  unassignedAt?: string;
  // Subscription info
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: string;
  subscriptionStatus?: 'active' | 'expired' | 'pending' | 'Active' | 'Expired' | 'Pending';
  activeSubscription?: {
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  // Program/Plan assignments
  currentWorkoutProgramId?: string;
  currentDietPlanId?: string;
  workoutProgramsCount?: number;
  dietPlansCount?: number;
  workoutSessionsCount?: number;
  lastSessionDate?: string;
  // Progress tracking
  startDate?: string;
  lastActivityDate?: string;
  progressPercentage?: number;
  sessionsCompleted?: number;
  totalSessions?: number;
  // Profile nested object (from API response)
  profile?: {
    fullName?: string;
    profilePictureUrl?: string;
    gender?: number;
    birthDate?: string;
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    fitnessGoal?: string;
    medicalHistory?: string;
  };
}

// ==================== Workout Program Interfaces ====================
export interface WorkoutProgram {
  id: string;
  coachId?: string;
  coachName?: string;
  clientId?: string;
  clientName?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  // Computed fields (frontend only)
  durationWeeks?: number;
  daysPerWeek?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  goal?: string;
  isActive?: boolean;
  assignedTraineesCount?: number;
  // Routines (API structure)
  routines?: WorkoutRoutine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutRoutine {
  id?: string;
  name: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  exercises: RoutineExercise[];
}

export interface RoutineExercise {
  id?: string;
  exerciseId: number;
  exerciseName?: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  notes?: string;
  tempo?: string;
  supersetGroupId?: string | null;
  // Frontend compatibility
  reps?: number | string;
  restSeconds?: number;
  weight?: number;
}

export interface CreateWorkoutProgramRequest {
  clientId: string;
  name: string;
  startDate: string;
  endDate?: string;
}

export interface CreateRoutineRequest {
  name: string;
  dayOfWeek: number;
}

export interface CreateRoutineExerciseRequest {
  exerciseId: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  notes?: string;
  tempo?: string;
  supersetGroupId?: string | null;
}

// ==================== Diet Plan Interfaces ====================
export interface DietPlan {
  id: string;
  coachId?: string;
  coachName?: string;
  clientId?: string;
  clientName?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: number; // 0=Active, 1=Draft, 2=Archived
  // Target values (API naming)
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  // Frontend compatibility aliases
  totalCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  mealsPerDay?: number;
  isActive?: boolean;
  assignedTraineesCount?: number;
  // Meals (API structure)
  meals?: DietMeal[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DietMeal {
  id?: string;
  name: string; // API uses 'name', not 'mealName'
  mealName?: string; // Legacy compatibility
  orderIndex: number;
  time?: string;
  items: DietMealItem[];
}

export interface DietMealItem {
  id?: string;
  foodId: number;
  foodName?: string;
  assignedQuantity: number;
  unit?: string;
  // API calculated values (read-only from server)
  calcCalories?: number;
  calcProtein?: number;
  calcCarbs?: number;
  calcFats?: number;
  // Frontend compatibility aliases
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface SecondaryMuscle {
  muscleId: number;
  muscleName: string;
  bodyPart?: string;
  contributionPercent: number;
}

export interface Exercise {
  id: number | string; // API returns number
  name: string;
  nameAr?: string; // Arabic name
  description?: string;
  descriptionAr?: string; // Arabic description
  // API field names
  targetMuscleId?: number;
  targetMuscleName?: string;
  targetMuscleBodyPart?: string;
  // Legacy field names (for backward compatibility)
  muscleGroupId?: string;
  muscleGroupName?: string;
  muscleGroupBodyPart?: string;
  /** Primary muscle contribution percentage (100 - sum of secondary). Defaults to 100. */
  primaryMuscleContributionPercent?: number;
  /** Secondary muscles with their contribution percentages. */
  secondaryMuscles?: SecondaryMuscle[];
  equipmentType?: string;
  equipment?: string; // API uses 'equipment'
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  category?: string; // e.g., 'Strength', 'Cardio', etc.
  /** Movement pattern: Push, Pull, Legs, etc. */
  movementPattern?: string;
  /** Mechanic type: Compound or Isolation */
  mechanic?: 'Compound' | 'Isolation' | string;
  /** Force type: Push or Pull */
  force?: 'Push' | 'Pull' | string;
  videoUrl?: string;
  imageUrl?: string;
  icon?: string; // Exercise icon/emoji
  instructions?: string[]; // Array of instruction steps
  instructionsAr?: string[]; // Arabic instructions
  tips?: string[]; // Exercise tips
  tipsAr?: string[]; // Arabic tips
  commonMistakes?: string[]; // Common mistakes to avoid
  commonMistakesAr?: string[]; // Arabic common mistakes
  repsRange?: string; // e.g., "8-12"
  setsRange?: string; // e.g., "3-4"
  restSeconds?: number; // Recommended rest between sets
  tempo?: string; // e.g., "2-1-2-0"
  isGlobal?: boolean;
  /** Indicates if this exercise has high impact (e.g., jumping exercises) */
  isHighImpact?: boolean;
}

export interface Food {
  id: number | string; // API returns number
  tenantId?: string;
  name: string;
  nameAr?: string; // Arabic name
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g?: number; // API uses fatsPer100g (with 's') - optional for compatibility
  fatPer100g?: number; // Legacy alias for component compatibility
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  servingSize?: number;
  servingUnit?: string;
  isVerified?: boolean;
  alternativeGroupId?: string;
  isGlobal?: boolean;
}

export interface BodyMeasurement {
  id: string;
  // API uses clientId/clientName
  clientId?: string;
  clientName?: string;
  // Legacy field names (for compatibility)
  traineeId?: string;
  traineeName?: string;
  // Date field
  dateRecorded?: string;
  measurementDate?: string; // Legacy alias
  // Measurements
  weightKg?: number;
  weight?: number; // Legacy alias
  height?: number;
  skeletalMuscleMass?: number;
  bodyFatMass?: number;
  bodyFatPercent?: number;
  bodyFatPercentage?: number; // Legacy alias
  totalBodyWater?: number;
  bmr?: number;
  visceralFatLevel?: number;
  // Body measurements
  chest?: number;
  waist?: number;
  hips?: number;
  bicepsLeft?: number;
  bicepsRight?: number;
  thighLeft?: number;
  thighRight?: number;
  // Photos
  inbodyImageUrl?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
  notes?: string;
}

// ==================== Profile Interfaces ====================
export interface UserProfileDto {
  fullName?: string;
  profilePictureUrl?: string;
  gender?: number; // 0 = Male, 1 = Female
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalHistory?: string;
}

export interface ProfileResponse {
  id: string;
  tenantId: string;
  email: string;
  phoneNumber?: string;
  role: number;
  isActive: boolean;
  walletBalance: number;
  profile?: UserProfileDto;
}

export interface UpdateProfileRequest {
  fullName?: string;
  gender?: number;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalHistory?: string;
}

export interface UploadProfilePictureResponse {
  url: string;
}

// ==================== Reports Interfaces ====================
export interface DashboardReport {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalCoaches: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  totalRevenueThisMonth: number;
  totalRevenueLastMonth: number;
  totalWorkoutsThisMonth: number;
  totalDietPlansActive: number;
}

export interface CoachDashboardReport {
  totalClients?: number;
  activeClients?: number;
  totalPrograms?: number;
  totalDietPlans?: number;
  totalSessionsThisMonth?: number;
  // Additional coach-specific metrics
}

export interface CoachTraineeReport {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  assignedAt: string;
  isActive: boolean;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  workoutProgramsCount: number;
  dietPlansCount: number;
  workoutSessionsCount: number;
  lastSessionDate?: string;
}

export interface TraineeProgressReport {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  assignedAt: string;
  bodyMeasurements: {
    dateRecorded: string;
    weightKg: number;
    bodyFatPercent?: number;
    muscleMass?: number;
    bmr?: number;
  }[];
  startWeight?: number;
  currentWeight?: number;
  totalWeightChange?: number;
  startBodyFat?: number;
  currentBodyFat?: number;
  totalBodyFatChange?: number;
  totalSessions: number;
  totalVolumeLifted: number;
  workoutPrograms: any[];
  dietPlans: any[];
  personalRecords: {
    exerciseId: number;
    exerciseName: string;
    maxWeight: number;
    reps: number;
    achievedAt: string;
  }[];
}

// ==================== Coach-Clients Interfaces ====================
export interface CoachClient {
  id: string;
  coachId: string;
  coachName?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  assignedAt: string;
  isActive: boolean;
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: string;
  workoutProgramsCount?: number;
  dietPlansCount?: number;
  workoutSessionsCount?: number;
  lastSessionDate?: string;
}

// ==================== Workout Sessions Interfaces ====================
export interface WorkoutSession {
  id: string;
  clientId: string;
  clientName?: string;
  routineId: string;
  routineName?: string;
  startedAt: string;
  endedAt?: string;
  totalVolumLifted?: number;
  notes?: string;
  sets?: SessionSet[];
}

export interface SessionSet {
  id: string;
  exerciseId: number;
  exerciseName?: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (6-10)
  volumeLoad?: number; // weightKg * reps
  isPr?: boolean; // Personal Record
}

export interface StartSessionRequest {
  routineId: string;
}

export interface EndSessionRequest {
  notes?: string;
}

export interface AddSetRequest {
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
}

// ==================== Subscriptions Interfaces ====================
export interface SubscriptionPlan {
  id: string;
  tenantId?: string;
  name: string;
  price: number;
  durationMonths: number;
}

export interface SubscriptionFreeze {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ClientSubscription {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName?: string;
  planId: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: number; // 0=Active, 1=Expired, 2=Frozen, 3=Cancelled
  salesCoachId?: string;
  salesCoachName?: string;
  freezes?: SubscriptionFreeze[];
}

// ==================== Muscles Interfaces ====================
export interface Muscle {
  id: number;
  name: string;
  nameAr?: string;
  bodyPart: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  index?: number; // For ordering/sorting muscles
}

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Dashboard
  getDashboardStats(): Observable<CoachDashboardStats> {
    return this.http.get<CoachDashboardStats>(`${this.apiUrl}/reports/coach/dashboard`);
  }

  // ==========================================
  // Coach-Clients API (المتدربين)
  // Base URL: /api/coach-clients
  // ==========================================

  // GET /api/coach-clients - جلب كل المتدربين
  getTrainees(coachId?: string, isActive?: boolean): Observable<any[]> {
    const params: string[] = [];
    if (coachId) params.push(`coachId=${coachId}`);
    if (isActive !== undefined) params.push(`isActive=${isActive}`);
    const queryString = params.length ? '?' + params.join('&') : '';
    return this.http.get<any[]>(`${this.apiUrl}/coach-clients${queryString}`);
  }

  // GET /api/coach-clients/{id} - جلب علاقة محددة
  getTraineeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/coach-clients/${id}`);
  }

  // GET /api/reports/coach/trainee/{id} - تقرير تقدم المتدرب
  getTraineeProgress(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/coach/trainee/${id}`);
  }

  // POST /api/coach-clients - إضافة متدرب جديد
  createTrainee(trainee: {
    phoneNumber: string;
    email?: string;
    fullName?: string;
    gender?: number; // 0=Male, 1=Female
    birthDate?: string;
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    fitnessGoal?: string;
    medicalHistory?: string;
  }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/coach-clients`, trainee);
  }

  // PUT /api/coach-clients/{id} - تحديث العلاقة (نقل لكوتش آخر أو تفعيل/تعطيل)
  updateTrainee(id: string, data: {
    newCoachId?: string;
    isActive?: boolean;
  }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/coach-clients/${id}`, data);
  }

  // DELETE /api/coach-clients/{clientId} - إلغاء ربط متدرب
  deleteTrainee(clientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/coach-clients/${clientId}`);
  }

  // POST /api/coach-clients/assign - ربط client موجود بكوتش
  assignClientToCoach(data: { clientId: string; coachId?: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/coach-clients/assign`, data);
  }

  // Alias for getTrainees (backward compatibility)
  getCoachClients(coachId?: string, isActive?: boolean): Observable<any[]> {
    return this.getTrainees(coachId, isActive);
  }

  // Workout Programs
  getWorkoutPrograms(): Observable<WorkoutProgram[]> {
    return this.http.get<WorkoutProgram[]>(`${this.apiUrl}/workoutprograms`);
  }

  getWorkoutProgramById(id: string): Observable<WorkoutProgram> {
    return this.http.get<WorkoutProgram>(`${this.apiUrl}/workoutprograms/${id}`);
  }

  createWorkoutProgram(program: Partial<WorkoutProgram>): Observable<WorkoutProgram> {
    return this.http.post<WorkoutProgram>(`${this.apiUrl}/workoutprograms`, program);
  }

  updateWorkoutProgram(id: string, program: Partial<WorkoutProgram>): Observable<WorkoutProgram> {
    return this.http.put<WorkoutProgram>(`${this.apiUrl}/workoutprograms/${id}`, program);
  }

  deleteWorkoutProgram(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workoutprograms/${id}`);
  }

  // Add routine to program
  addRoutineToProgram(programId: string, routine: { name: string; dayOfWeek: number }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/workoutprograms/${programId}/routines`, routine);
  }

  // Add exercise to routine
  addExerciseToRoutine(routineId: string, exercise: {
    exerciseId: number;
    sets: number;
    repsMin: number;
    repsMax: number;
    restSec: number;
    notes?: string;
    tempo?: string;
    supersetGroupId?: string;
  }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/workoutprograms/routines/${routineId}/exercises`, exercise);
  }

  // Duplicate workout program
  duplicateWorkoutProgram(id: string, data?: { newClientId?: string; newName?: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/workoutprograms/${id}/duplicate`, data || {});
  }

  // Update routine
  updateRoutine(routineId: string, routine: { name: string; dayOfWeek: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/workoutprograms/routines/${routineId}`, routine);
  }

  // Delete routine
  deleteRoutine(routineId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workoutprograms/routines/${routineId}`);
  }

  // Update routine exercise
  updateRoutineExercise(id: string, exercise: {
    exerciseId?: number;
    sets: number;
    repsMin: number;
    repsMax: number;
    restSec: number;
    notes?: string;
    tempo?: string;
    supersetGroupId?: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/workoutprograms/routines/exercises/${id}`, exercise);
  }

  // Delete routine exercise
  deleteRoutineExercise(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workoutprograms/routines/exercises/${id}`);
  }

  // Diet Plans
  getDietPlans(): Observable<DietPlan[]> {
    return this.http.get<DietPlan[]>(`${this.apiUrl}/dietplans`);
  }

  getDietPlanById(id: string): Observable<DietPlan> {
    return this.http.get<DietPlan>(`${this.apiUrl}/dietplans/${id}`);
  }

  createDietPlan(plan: Partial<DietPlan>): Observable<DietPlan> {
    return this.http.post<DietPlan>(`${this.apiUrl}/dietplans`, plan);
  }

  updateDietPlan(id: string, plan: Partial<DietPlan>): Observable<DietPlan> {
    return this.http.put<DietPlan>(`${this.apiUrl}/dietplans/${id}`, plan);
  }

  deleteDietPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dietplans/${id}`);
  }

  // Add meal to diet plan
  addMealToPlan(planId: string, meal: { name: string; orderIndex: number }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/dietplans/${planId}/meals`, meal);
  }

  // Add item to meal
  addItemToMeal(mealId: string, item: { foodId: number; assignedQuantity: number }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/dietplans/meals/${mealId}/items`, item);
  }

  // Duplicate diet plan
  duplicateDietPlan(id: string, data?: { newClientId?: string; newName?: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/dietplans/${id}/duplicate`, data || {});
  }

  // Update meal
  updateMeal(mealId: string, meal: { name: string; orderIndex: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/dietplans/meals/${mealId}`, meal);
  }

  // Delete meal
  deleteMeal(mealId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dietplans/meals/${mealId}`);
  }

  // Update meal item
  updateMealItem(itemId: string, item: { foodId?: number; assignedQuantity: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/dietplans/meals/items/${itemId}`, item);
  }

  // Delete meal item
  deleteMealItem(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dietplans/meals/items/${itemId}`);
  }

  // Exercises
  getExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.apiUrl}/exercises`);
  }

  getMuscleGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/muscles`);
  }

  createExercise(exercise: Partial<Exercise>): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.apiUrl}/exercises`, exercise);
  }

  updateExercise(id: number | string, exercise: Partial<Exercise>): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.apiUrl}/exercises/${id}`, exercise);
  }

  deleteExercise(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exercises/${id}`);
  }

  // Foods
  getFoods(): Observable<Food[]> {
    return this.http.get<Food[]>(`${this.apiUrl}/foods`);
  }

  createFood(food: Partial<Food>): Observable<Food> {
    return this.http.post<Food>(`${this.apiUrl}/foods`, food);
  }

  updateFood(id: number | string, food: Partial<Food>): Observable<Food> {
    return this.http.put<Food>(`${this.apiUrl}/foods/${id}`, food);
  }

  deleteFood(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/foods/${id}`);
  }

  // Body Measurements
  getMeasurements(clientId?: string): Observable<BodyMeasurement[]> {
    const url = clientId
      ? `${this.apiUrl}/bodymeasurements?clientId=${clientId}`
      : `${this.apiUrl}/bodymeasurements`;
    return this.http.get<BodyMeasurement[]>(url);
  }

  createMeasurement(measurement: Partial<BodyMeasurement>): Observable<BodyMeasurement> {
    return this.http.post<BodyMeasurement>(`${this.apiUrl}/bodymeasurements`, measurement);
  }

  updateMeasurement(id: string, measurement: Partial<BodyMeasurement>): Observable<BodyMeasurement> {
    return this.http.put<BodyMeasurement>(`${this.apiUrl}/bodymeasurements/${id}`, measurement);
  }

  deleteMeasurement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bodymeasurements/${id}`);
  }

  // ==================== Profile API ====================

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: UpdateProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile`, profile);
  }

  uploadProfilePicture(file: File): Observable<UploadProfilePictureResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadProfilePictureResponse>(`${this.apiUrl}/profile/picture`, formData);
  }

  deleteProfilePicture(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/profile/picture`);
  }

  // ==================== Reports API ====================

  getDashboardReport(): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.apiUrl}/reports/dashboard`);
  }

  getCoachDashboardReport(coachId?: string): Observable<CoachDashboardReport> {
    const url = coachId
      ? `${this.apiUrl}/reports/coach/dashboard?coachId=${coachId}`
      : `${this.apiUrl}/reports/coach/dashboard`;
    return this.http.get<CoachDashboardReport>(url);
  }

  getCoachTraineesReport(coachId?: string): Observable<CoachTraineeReport[]> {
    const url = coachId
      ? `${this.apiUrl}/reports/coach/trainees?coachId=${coachId}`
      : `${this.apiUrl}/reports/coach/trainees`;
    return this.http.get<CoachTraineeReport[]>(url);
  }

  getTraineeProgressReport(clientId: string): Observable<TraineeProgressReport> {
    return this.http.get<TraineeProgressReport>(`${this.apiUrl}/reports/coach/trainee/${clientId}`);
  }

  // ==================== Muscles API ====================

  getMuscles(bodyPart?: string): Observable<Muscle[]> {
    const url = bodyPart
      ? `${this.apiUrl}/muscles?bodyPart=${bodyPart}`
      : `${this.apiUrl}/muscles`;
    return this.http.get<Muscle[]>(url);
  }

  getMuscleById(id: number): Observable<Muscle> {
    return this.http.get<Muscle>(`${this.apiUrl}/muscles/${id}`);
  }

  createMuscle(muscle: Partial<Muscle>): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/muscles`, muscle);
  }

  updateMuscle(id: number, muscle: Partial<Muscle>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/muscles/${id}`, muscle);
  }

  deleteMuscle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/muscles/${id}`);
  }

  // ==================== Workout Sessions API ====================

  getWorkoutSessions(clientId?: string, fromDate?: string, toDate?: string): Observable<WorkoutSession[]> {
    const params: string[] = [];
    if (clientId) params.push(`clientId=${clientId}`);
    if (fromDate) params.push(`fromDate=${fromDate}`);
    if (toDate) params.push(`toDate=${toDate}`);
    const queryString = params.length ? '?' + params.join('&') : '';
    return this.http.get<WorkoutSession[]>(`${this.apiUrl}/workoutsessions${queryString}`);
  }

  getWorkoutSessionById(id: string): Observable<WorkoutSession> {
    return this.http.get<WorkoutSession>(`${this.apiUrl}/workoutsessions/${id}`);
  }

  startWorkoutSession(routineId: string): Observable<WorkoutSession> {
    return this.http.post<WorkoutSession>(`${this.apiUrl}/workoutsessions/start`, { routineId });
  }

  endWorkoutSession(sessionId: string, notes?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/workoutsessions/${sessionId}/end`, { notes });
  }

  addSetToSession(sessionId: string, setData: AddSetRequest): Observable<SessionSet> {
    return this.http.post<SessionSet>(`${this.apiUrl}/workoutsessions/${sessionId}/sets`, setData);
  }

  // ==================== Subscriptions API ====================

  // Subscription Plans
  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/subscriptions/plans`);
  }

  createSubscriptionPlan(plan: { name: string; price: number; durationMonths: number }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions/plans`, plan);
  }

  // Client Subscriptions
  getSubscriptions(clientId?: string, status?: number): Observable<ClientSubscription[]> {
    const params: string[] = [];
    if (clientId) params.push(`clientId=${clientId}`);
    if (status !== undefined) params.push(`status=${status}`);
    const queryString = params.length ? '?' + params.join('&') : '';
    return this.http.get<ClientSubscription[]>(`${this.apiUrl}/subscriptions${queryString}`);
  }

  createSubscription(subscription: { clientId: string; planId: string; startDate: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions`, subscription);
  }

  freezeSubscription(subscriptionId: string, freeze: { startDate: string; endDate: string; reason?: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/subscriptions/${subscriptionId}/freeze`, freeze);
  }

  cancelSubscription(subscriptionId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/subscriptions/${subscriptionId}/cancel`, {});
  }
}
