import { useLiveQuery } from "dexie-react-hooks";
import {
  getSession,
  getActiveSession,
  getWorkoutDayExercises,
  getSessionSetsForExercise,
  getLastWorkingSets,
} from "@/lib/db/repo/workouts";
import { resolveAvailableExercise, getExercise } from "@/lib/db/repo/exercises";
import { getSettings } from "@/lib/db/repo/settings";
import { trimToTimeBudget } from "@/lib/engine/time-estimate";
import { computeNextPrescription, type Prescription } from "@/lib/engine/progression";
import { stepForLoadType } from "@/lib/engine/weight-math";
import { resolveTrainingPhase } from "@/lib/engine/calibration";
import { todayStr, daysAgo } from "@/lib/utils/date";
import type { Exercise, ExerciseSet, WorkoutDayExercise, WorkoutSession, EquipmentIncrements } from "@/types/domain";

export interface SessionExerciseEntry {
  dayExercise: WorkoutDayExercise;
  exercise: Exercise;
  wasSubstituted: boolean;
  originalExercise: Exercise;
  loggedSets: ExerciseSet[];
  lastWorkingSets: ExerciseSet[];
  prescription: Prescription;
  weightStep: number;
  isComplete: boolean;
}

export interface ActiveWorkoutSessionData {
  session: WorkoutSession;
  entries: SessionExerciseEntry[];
  skippedByTimeBudget: WorkoutDayExercise[];
  increments: EquipmentIncrements;
}

export function useActiveWorkoutSession(
  sessionId: string | null,
  overrides: Record<string, string> = {}
): ActiveWorkoutSessionData | null | undefined {
  const overridesKey = JSON.stringify(overrides);
  return useLiveQuery(async () => {
    const session = sessionId ? await getSession(sessionId) : await getActiveSession();
    if (!session) return null;

    const settings = await getSettings();
    const phase = resolveTrainingPhase(settings.firstWorkoutCompletedAt, new Date().toISOString());

    const allDayExercises = session.workoutDayId ? await getWorkoutDayExercises(session.workoutDayId) : [];
    const { included, skipped } = trimToTimeBudget(allDayExercises, session.timeBudgetMinutes);

    const entries: SessionExerciseEntry[] = [];
    for (const dayExercise of included) {
      const overrideId = overrides[dayExercise.id];
      let exercise: Exercise, wasSubstituted: boolean, original: Exercise;
      if (overrideId) {
        const [ov, orig] = await Promise.all([getExercise(overrideId), getExercise(dayExercise.exerciseId)]);
        if (!ov || !orig) continue;
        exercise = ov;
        original = orig;
        wasSubstituted = ov.id !== orig.id;
      } else {
        const resolved = await resolveAvailableExercise(dayExercise.exerciseId);
        if (!resolved) continue;
        exercise = resolved.exercise;
        wasSubstituted = resolved.wasSubstituted;
        original = resolved.original;
      }

      const [loggedSets, lastWorkingSets] = await Promise.all([
        getSessionSetsForExercise(session.id, exercise.id),
        getLastWorkingSets(exercise.id, session.id),
      ]);

      const weightStep = stepForLoadType(exercise.loadType, settings.equipmentIncrements);
      const repRangeMin = dayExercise.repRangeMin || exercise.repRangeMin;
      const repRangeMax = dayExercise.repRangeMax || exercise.repRangeMax;

      const prescription = computeNextPrescription({
        lastWorkingSets: lastWorkingSets.map((s) => ({
          weightKg: s.weightEntryMode === "barbell_total" && s.barWeightKg != null && s.platePerSideKg != null
            ? s.barWeightKg + s.platePerSideKg * 2
            : s.weightKg,
          reps: s.reps,
          rir: s.rir,
          isWarmup: s.isWarmup,
          painFlag: s.painFlag,
        })),
        repRangeMin,
        repRangeMax,
        loadType: exercise.loadType,
        step: weightStep,
        phase,
        repUnit: exercise.repUnit,
        daysSinceLastPerformed: lastWorkingSets.length > 0 ? daysAgo(lastWorkingSets[0].completedAt) : null,
      });

      entries.push({
        dayExercise,
        exercise,
        wasSubstituted,
        originalExercise: original,
        loggedSets: loggedSets.filter((s) => !s.isWarmup),
        lastWorkingSets,
        prescription,
        weightStep,
        isComplete: loggedSets.filter((s) => !s.isWarmup).length >= dayExercise.targetSets,
      });
    }

    return { session, entries, skippedByTimeBudget: skipped, increments: settings.equipmentIncrements };
  }, [sessionId, overridesKey]);
}

export function firstIncompleteIndex(entries: SessionExerciseEntry[]): number {
  const idx = entries.findIndex((e) => !e.isComplete);
  return idx === -1 ? entries.length - 1 : idx;
}

export { todayStr };
