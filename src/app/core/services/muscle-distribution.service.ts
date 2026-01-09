import { Injectable } from '@angular/core';
import {
  Exercise,
  RoutineExercise,
  MuscleWorkload,
  MuscleWorkloadExercise,
  WorkoutAnalysis,
  AnalysisWarning
} from '../../shared/models/api.models';

/**
 * Service for calculating muscle distribution and analyzing workout programs.
 * Helps coaches understand how exercises contribute to different muscle groups
 * and identify potential overtraining or imbalances.
 */
@Injectable({
  providedIn: 'root'
})
export class MuscleDistributionService {

  /**
   * Optimal weekly sets per muscle group (based on research).
   * Used to determine if a muscle is undertrained, optimal, or overtrained.
   */
  private readonly OPTIMAL_SETS_RANGE: Record<string, { min: number; max: number }> = {
    'Chest': { min: 10, max: 20 },
    'Back': { min: 10, max: 20 },
    'Shoulders': { min: 8, max: 16 },
    'Biceps': { min: 6, max: 12 },
    'Triceps': { min: 6, max: 12 },
    'Quadriceps': { min: 10, max: 20 },
    'Hamstrings': { min: 8, max: 16 },
    'Glutes': { min: 8, max: 16 },
    'Calves': { min: 8, max: 16 },
    'Abs': { min: 6, max: 12 },
    // Arabic muscle names
    'صدر': { min: 10, max: 20 },
    'ظهر': { min: 10, max: 20 },
    'أكتاف': { min: 8, max: 16 },
    'باي': { min: 6, max: 12 },
    'تراي': { min: 6, max: 12 },
    'أرجل أمامية': { min: 10, max: 20 },
    'أرجل خلفية': { min: 8, max: 16 },
    'مؤخرة': { min: 8, max: 16 },
    'سمانة': { min: 8, max: 16 },
    'بطن': { min: 6, max: 12 }
  };

  /**
   * Calculate muscle distribution for a single workout day.
   * @param routineExercises - Exercises in the routine with sets/reps
   * @param exerciseDatabase - All available exercises with muscle contribution data
   * @returns Array of muscle workloads sorted by percentage
   */
  calculateDayDistribution(
    routineExercises: RoutineExercise[],
    exerciseDatabase: Exercise[]
  ): MuscleWorkload[] {
    const muscleMap = new Map<number, MuscleWorkload>();

    for (const routineExercise of routineExercises) {
      const exercise = exerciseDatabase.find(e => e.id === routineExercise.exerciseId);
      if (!exercise) continue;

      // Calculate base volume (sets * average reps)
      const avgReps = (routineExercise.minReps + routineExercise.maxReps) / 2;
      const baseVolume = routineExercise.sets * avgReps;

      // Get primary muscle contribution (defaults to 100 if not specified)
      const primaryContribution = exercise.primaryMuscleContributionPercent ?? 100;

      // Add primary muscle contribution
      this.addMuscleContribution(
        muscleMap,
        exercise.targetMuscleId,
        exercise.targetMuscleName,
        exercise.targetMuscleBodyPart || '',
        primaryContribution,
        baseVolume,
        routineExercise.sets,
        exercise.name,
        true
      );

      // Add secondary muscle contributions
      if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
        for (const secondary of exercise.secondaryMuscles) {
          this.addMuscleContribution(
            muscleMap,
            secondary.muscleId,
            secondary.muscleName,
            secondary.bodyPart || '',
            secondary.contributionPercent,
            baseVolume,
            routineExercise.sets,
            exercise.name,
            false
          );
        }
      }
    }

    return this.calculatePercentages(muscleMap);
  }

  /**
   * Analyze a full workout program for muscle balance across all days.
   * @param routines - Array of routines with their exercises
   * @param exerciseDatabase - All available exercises with muscle contribution data
   * @returns Complete workout analysis with warnings and recommendations
   */
  analyzeProgram(
    routines: { name: string; exercises: RoutineExercise[] }[],
    exerciseDatabase: Exercise[]
  ): WorkoutAnalysis {
    const aggregatedMap = new Map<number, MuscleWorkload>();

    for (const routine of routines) {
      const dayWorkloads = this.calculateDayDistribution(routine.exercises, exerciseDatabase);

      for (const workload of dayWorkloads) {
        const existing = aggregatedMap.get(workload.muscleId);
        if (existing) {
          existing.totalEffectiveVolume += workload.totalEffectiveVolume;
          existing.totalSets += workload.totalSets;
          existing.exercises.push(...workload.exercises);
        } else {
          aggregatedMap.set(workload.muscleId, { ...workload });
        }
      }
    }

    const muscleWorkloads = this.calculatePercentages(aggregatedMap);
    const totalVolume = muscleWorkloads.reduce((sum, m) => sum + m.totalEffectiveVolume, 0);

    return {
      totalVolume,
      muscleWorkloads: this.assignStatuses(muscleWorkloads),
      warnings: this.generateWarnings(muscleWorkloads),
      recommendations: this.generateRecommendations(muscleWorkloads)
    };
  }

  /**
   * Get a simple muscle summary for an exercise (for display in exercise cards).
   * @param exercise - The exercise to summarize
   * @returns Human-readable muscle contribution summary
   */
  getExerciseMusclesSummary(exercise: Exercise): string {
    const parts: string[] = [];

    // Add primary muscle
    const primaryPercent = exercise.primaryMuscleContributionPercent ?? 100;
    parts.push(`${exercise.targetMuscleName} (${primaryPercent}%)`);

    // Add secondary muscles
    if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
      for (const secondary of exercise.secondaryMuscles) {
        parts.push(`${secondary.muscleName} (${secondary.contributionPercent}%)`);
      }
    }

    return parts.join('، ');
  }

  /**
   * Check if an exercise has secondary muscle data.
   * Useful for backward compatibility checks.
   */
  hasSecondaryMuscles(exercise: Exercise): boolean {
    return exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0;
  }

  private addMuscleContribution(
    map: Map<number, MuscleWorkload>,
    muscleId: number,
    muscleName: string,
    bodyPart: string,
    contributionPercent: number,
    baseVolume: number,
    sets: number,
    exerciseName: string,
    isPrimary: boolean
  ): void {
    const effectiveVolume = baseVolume * (contributionPercent / 100);
    const effectiveSets = sets * (contributionPercent / 100);

    const exerciseContribution: MuscleWorkloadExercise = {
      exerciseName,
      isPrimary,
      contributionPercent,
      effectiveVolume,
      sets: effectiveSets
    };

    const existing = map.get(muscleId);

    if (existing) {
      existing.totalEffectiveVolume += effectiveVolume;
      existing.totalSets += effectiveSets;
      existing.exercises.push(exerciseContribution);
    } else {
      map.set(muscleId, {
        muscleId,
        muscleName,
        bodyPart,
        totalEffectiveVolume: effectiveVolume,
        totalSets: effectiveSets,
        percentageOfTotal: 0,
        status: 'balanced',
        exercises: [exerciseContribution]
      });
    }
  }

  private calculatePercentages(map: Map<number, MuscleWorkload>): MuscleWorkload[] {
    const workloads = Array.from(map.values());
    const totalVolume = workloads.reduce((sum, m) => sum + m.totalEffectiveVolume, 0);

    return workloads.map(w => ({
      ...w,
      percentageOfTotal: totalVolume > 0
        ? Math.round((w.totalEffectiveVolume / totalVolume) * 100)
        : 0
    })).sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
  }

  private assignStatuses(workloads: MuscleWorkload[]): MuscleWorkload[] {
    return workloads.map(w => {
      const range = this.OPTIMAL_SETS_RANGE[w.muscleName];
      if (!range) {
        w.status = 'balanced';
      } else if (w.totalSets < range.min) {
        w.status = 'undertrained';
      } else if (w.totalSets > range.max) {
        w.status = 'overtrained';
      } else {
        w.status = 'optimal';
      }
      return w;
    });
  }

  private generateWarnings(workloads: MuscleWorkload[]): AnalysisWarning[] {
    const warnings: AnalysisWarning[] = [];

    for (const workload of workloads) {
      if (workload.status === 'overtrained') {
        warnings.push({
          type: 'overtraining',
          message: `${workload.muscleName} قد يكون مفرط التدريب (${Math.round(workload.totalSets)} مجموعة فعالة)`,
          muscleId: workload.muscleId,
          severity: 'medium'
        });
      }
    }

    // Check for muscle imbalances (e.g., chest vs back)
    const chestWork = workloads.find(w =>
      w.muscleName.toLowerCase().includes('chest') || w.muscleName.includes('صدر')
    );
    const backWork = workloads.find(w =>
      w.muscleName.toLowerCase().includes('back') || w.muscleName.includes('ظهر')
    );

    if (chestWork && backWork) {
      const ratio = chestWork.totalSets / (backWork.totalSets || 1);
      if (ratio > 1.5) {
        warnings.push({
          type: 'imbalance',
          message: 'عدم توازن بين الصدر والظهر - الصدر أكثر بكثير',
          severity: 'medium'
        });
      } else if (ratio < 0.67) {
        warnings.push({
          type: 'imbalance',
          message: 'عدم توازن بين الصدر والظهر - الظهر أكثر بكثير',
          severity: 'low'
        });
      }
    }

    // Check for biceps/triceps imbalance from compound movements
    const bicepsWork = workloads.find(w =>
      w.muscleName.toLowerCase().includes('biceps') || w.muscleName.includes('باي')
    );
    const tricepsWork = workloads.find(w =>
      w.muscleName.toLowerCase().includes('triceps') || w.muscleName.includes('تراي')
    );

    if (bicepsWork && tricepsWork) {
      const ratio = tricepsWork.totalSets / (bicepsWork.totalSets || 1);
      if (ratio > 2) {
        warnings.push({
          type: 'imbalance',
          message: 'الترايسبس يتلقى حمل زائد من تمارين الضغط - قد لا تحتاج تمارين عزل إضافية',
          severity: 'low'
        });
      }
    }

    return warnings;
  }

  private generateRecommendations(workloads: MuscleWorkload[]): string[] {
    const recommendations: string[] = [];

    const undertrained = workloads.filter(w => w.status === 'undertrained');
    if (undertrained.length > 0) {
      recommendations.push(
        `يُنصح بزيادة حجم التدريب للعضلات: ${undertrained.map(w => w.muscleName).join('، ')}`
      );
    }

    const overtrained = workloads.filter(w => w.status === 'overtrained');
    if (overtrained.length > 0) {
      recommendations.push(
        `يُنصح بتقليل حجم التدريب للعضلات: ${overtrained.map(w => w.muscleName).join('، ')}`
      );
    }

    // Check if small muscles are getting too much indirect work
    const smallMusclesWithHighIndirectWork = workloads.filter(w => {
      const directExercises = w.exercises.filter(e => e.isPrimary);
      const indirectExercises = w.exercises.filter(e => !e.isPrimary);
      const indirectSets = indirectExercises.reduce((sum, e) => sum + e.sets, 0);

      return indirectSets > 6 && (
        w.muscleName.toLowerCase().includes('biceps') ||
        w.muscleName.toLowerCase().includes('triceps') ||
        w.muscleName.includes('باي') ||
        w.muscleName.includes('تراي')
      );
    });

    if (smallMusclesWithHighIndirectWork.length > 0) {
      recommendations.push(
        'العضلات الصغيرة (الباي والتراي) تتلقى عمل كافي من التمارين المركبة - يمكنك تقليل تمارين العزل'
      );
    }

    return recommendations;
  }
}
