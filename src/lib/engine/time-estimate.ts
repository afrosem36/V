import type { WorkoutDayExercise } from "@/types/domain";

const SET_PERFORM_SECONDS = 40;
const TRANSITION_SECONDS = 45;
const WARMUP_BUFFER_SECONDS = 5 * 60;

export function estimateExerciseSeconds(sets: number, restSeconds: number): number {
  return sets * SET_PERFORM_SECONDS + Math.max(0, sets - 1) * restSeconds + TRANSITION_SECONDS;
}

export function estimateWorkoutMinutes(exercises: Pick<WorkoutDayExercise, "targetSets" | "restSeconds">[]): number {
  if (exercises.length === 0) return 0;
  const totalSeconds =
    WARMUP_BUFFER_SECONDS + exercises.reduce((sum, e) => sum + estimateExerciseSeconds(e.targetSets, e.restSeconds), 0);
  return Math.round(totalSeconds / 60);
}

export interface TrimResult<T> {
  included: T[];
  skipped: T[];
  estimatedMinutes: number;
}

/**
 * Fits the day's exercise list into a time budget by dropping the lowest-priority
 * (highest priority number = most optional) exercises first. Priority 1-2 are never dropped.
 */
export function trimToTimeBudget<T extends Pick<WorkoutDayExercise, "targetSets" | "restSeconds" | "priority" | "order">>(
  exercises: T[],
  budgetMinutes: number | null
): TrimResult<T> {
  const sorted = [...exercises].sort((a, b) => a.order - b.order);
  if (budgetMinutes == null) {
    return { included: sorted, skipped: [], estimatedMinutes: estimateWorkoutMinutes(sorted) };
  }

  let current = [...sorted];
  const skipped: T[] = [];

  for (let priorityCut = 5; priorityCut >= 3; priorityCut--) {
    while (estimateWorkoutMinutes(current) > budgetMinutes) {
      const idx = [...current]
        .map((e, i) => ({ e, i }))
        .reverse()
        .find(({ e }) => e.priority === priorityCut)?.i;
      if (idx == null) break;
      skipped.push(current[idx]);
      current = current.filter((_, i) => i !== idx);
    }
  }

  return { included: current, skipped, estimatedMinutes: estimateWorkoutMinutes(current) };
}
