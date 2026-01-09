// Pagination
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Dashboard Report
export interface DashboardReport {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalCoaches: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  workoutsThisMonth: number;
  activeDietPlans: number;
}

// Financial Report
export interface FinancialReport {
  totalRevenue: number;
  monthlyRevenue: number;
  growthPercentage: number;
  averageSubscriptionValue: number;
  totalWalletBalances: number;
  monthlyBreakdown: MonthlyData[];
  paymentMethodStats: PaymentMethodStat[];
}

export interface MonthlyData {
  month: string;
  revenue: number;
  newClients?: number;
  churnedClients?: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  total: number;
}

// Clients Report
export interface ClientsReport {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  clientsWithActiveSubscription: number;
  clientsWithoutSubscription: number;
  topClientsBySessionsCount: TopClient[];
  topClientsByRevenue: TopClient[];
  monthlyTrend: MonthlyData[];
}

export interface TopClient {
  clientId: string;
  clientName: string;
  sessionsCount?: number;
  totalRevenue?: number;
}

// Subscriptions Report
export interface SubscriptionsReport {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  expiringSoon7Days: number;
  expiringSoon30Days: number;
  totalRevenue: number;
  monthlyRevenue: number;
  planStatistics: PlanStatistic[];
  monthlyRevenueTrend: MonthlyData[];
}

export interface PlanStatistic {
  planId: string;
  planName: string;
  activeCount: number;
  totalRevenue: number;
}

// Coach Dashboard Report
export interface CoachDashboardReport {
  totalTrainees: number;
  activeTrainees: number;
  newTraineesThisMonth: number;
  activeWorkoutPrograms: number;
  activeDietPlans: number;
  totalSessionsThisMonth: number;
  totalVolumeThisMonth: number;
  topTraineesByProgress: TraineeProgress[];
  topTraineesBySessions: TraineeSessions[];
}

export interface TraineeProgress {
  clientId: string;
  clientName: string;
  clientPhone: string;
  weightChange: number;
  bodyFatChange: number;
}

export interface TraineeSessions {
  clientId: string;
  clientName: string;
  clientPhone: string;
  sessionsCount: number;
}

// Trainee Progress Report
export interface TraineeProgressReport {
  clientId: string;
  clientName: string;
  clientPhone: string;
  assignedAt: string;
  bodyMeasurements: BodyMeasurementSummary[];
  startWeight: number;
  currentWeight: number;
  totalWeightChange: number;
  startBodyFat: number;
  currentBodyFat: number;
  totalBodyFatChange: number;
  totalSessions: number;
  totalVolumeLifted: number;
  monthlySessions: MonthlySessionData[];
  workoutPrograms: ProgramSummary[];
  dietPlans: DietPlanSummary[];
  personalRecords: PersonalRecord[];
}

export interface BodyMeasurementSummary {
  dateRecorded: string;
  weightKg: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  bmr?: number;
}

export interface MonthlySessionData {
  month: string;
  sessionCount: number;
  totalVolume: number;
}

export interface ProgramSummary {
  id: string;
  name: string;
  startDate: string;
  routinesCount: number;
}

export interface DietPlanSummary {
  id: string;
  name: string;
  startDate: string;
  targetCalories: number;
}

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  maxWeight: number;
  reps: number;
  achievedAt: string;
}

// Client
export interface Client {
  id: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profile?: ClientProfile;
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: string;
  assignedCoachId?: string;
  assignedCoachName?: string;
}

export interface ClientProfile {
  fullName: string;
  gender?: 'Male' | 'Female';
  birthDate?: string;
  heightCm?: number;
  activityLevel?: string;
  medicalHistory?: string;
}

// Coach
export interface Coach {
  id: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profile?: CoachProfile;
  traineesCount?: number;
  activePrograms?: number;
}

export interface CoachProfile {
  fullName: string;
  gender?: 'Male' | 'Female';
  birthDate?: string;
}

// Subscription Plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
}

// Subscription Status enum (matches API: 0=Active, 1=Expired, 2=Frozen, 3=Cancelled)
export enum SubscriptionStatus {
  Active = 0,
  Expired = 1,
  Frozen = 2,
  Cancelled = 3
}

// Client Subscription
export interface ClientSubscription {
  id: string;
  clientId: string;
  clientName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus | number; // Numeric: 0=Active, 1=Expired, 2=Frozen, 3=Cancelled
  amountPaid?: number;
  salesCoachId?: string;
  salesCoachName?: string;
  freezes?: SubscriptionFreeze[];
}

// Subscription Freeze
export interface SubscriptionFreeze {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Workout Program
export interface WorkoutProgram {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  name: string;
  description?: string;
  isActive: boolean;
  routines: ProgramRoutine[];
}

export interface ProgramRoutine {
  id: string;
  name: string;
  dayOfWeek: number;
  orderIndex: number;
  exercises: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  exerciseId: number;
  exerciseName: string;
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
  orderIndex: number;
  supersetGroup?: number;
}

// Secondary Muscle (for exercise muscle contribution)
export interface SecondaryMuscle {
  muscleId: number;
  muscleName: string;
  bodyPart?: string;
  contributionPercent: number;
}

// Secondary Muscle Input (for creating/updating exercises)
export interface SecondaryMuscleInput {
  muscleId: number;
  contributionPercent: number;
}

// Exercise
export interface Exercise {
  id: number;
  name: string;
  targetMuscleId: number;
  targetMuscleName: string;
  targetMuscleBodyPart?: string;
  /** Primary muscle contribution percentage (100 - sum of secondary). Defaults to 100 if no secondary muscles. */
  primaryMuscleContributionPercent: number;
  /** Secondary muscles with their contribution percentages. Empty array if no secondary muscles defined. */
  secondaryMuscles: SecondaryMuscle[];
  equipment?: string;
  isHighImpact: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

// Muscle
export interface Muscle {
  id: number;
  name: string;
  bodyPart: string;
}

// Muscle Workload (for distribution analysis)
export interface MuscleWorkload {
  muscleId: number;
  muscleName: string;
  bodyPart: string;
  totalEffectiveVolume: number;
  totalSets: number;
  percentageOfTotal: number;
  status: 'optimal' | 'undertrained' | 'overtrained' | 'balanced';
  exercises: MuscleWorkloadExercise[];
}

export interface MuscleWorkloadExercise {
  exerciseName: string;
  isPrimary: boolean;
  contributionPercent: number;
  effectiveVolume: number;
  sets: number;
}

// Workout Analysis (for program analysis)
export interface WorkoutAnalysis {
  totalVolume: number;
  muscleWorkloads: MuscleWorkload[];
  warnings: AnalysisWarning[];
  recommendations: string[];
}

export interface AnalysisWarning {
  type: 'overtraining' | 'imbalance' | 'missing_muscle';
  message: string;
  muscleId?: number;
  severity: 'low' | 'medium' | 'high';
}

// Diet Plan Status enum (matches API: 0=Draft, 1=Active, 2=Archived)
export enum DietPlanStatus {
  Draft = 0,
  Active = 1,
  Archived = 2
}

// Diet Plan
export interface DietPlan {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  name: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  startDate: string;
  endDate?: string;
  status: DietPlanStatus | number; // Numeric: 0=Draft, 1=Active, 2=Archived
  meals: DailyMeal[];
}

export interface DailyMeal {
  id: string;
  mealName: string;
  orderIndex: number;
  items: MealItem[];
}

export interface MealItem {
  id: string;
  foodId: number;
  foodName: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Food
export interface Food {
  id: number;
  name: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  fiberPer100g?: number;
  isVerified: boolean;
}

// Body Measurement
export interface BodyMeasurement {
  id: string;
  clientId: string;
  dateRecorded: string;
  weightKg: number;
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
}

// Workout Session
export interface WorkoutSession {
  id: string;
  clientId: string;
  routineId: string;
  routineName: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  sets: SessionSet[];
}

export interface SessionSet {
  id: string;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  volumeLoad: number;
  isPR: boolean;
}

// Coach Client (Trainee Assignment)
export interface CoachClient {
  id: string;
  coachId: string;
  coachName: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  assignedAt: string;
  isActive: boolean;
  notes?: string;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  workoutProgramsCount: number;
  dietPlansCount: number;
  workoutSessionsCount: number;
  lastSessionDate?: string;
}

// Gym Profile
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
}
