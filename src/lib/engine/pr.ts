import type { ExerciseSet, PersonalRecord, PRType } from "@/types/domain";
import { displayWeightForSet, totalLoadForSet } from "./weight-math";

/** Epley formula — a reasonable estimate for a returning-to-training beginner/intermediate lifter. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface PRCheckResult {
  type: PRType;
  value: number;
  weightKg: number | null;
  reps: number | null;
  isNewPR: boolean;
  /** False on an exercise's very first-ever logged session — that's a baseline, not an earned record. */
  celebrate: boolean;
}

/**
 * Compares a just-completed session's sets for one exercise against all prior PRs.
 * Returns only the records that were actually broken. All four metrics trivially "improve"
 * on an exercise's first-ever session (nothing to beat yet) — those are still saved as the
 * baseline for future comparisons, but `celebrate` is false so the UI doesn't fire off four
 * hollow "NEW PR" banners for just trying something for the first time.
 */
export function detectNewPRs(
  newSets: ExerciseSet[],
  existingPRs: Pick<PersonalRecord, "type" | "value">[]
): PRCheckResult[] {
  const working = newSets.filter((s) => !s.isWarmup);
  if (working.length === 0) return [];

  const isFirstRecord = existingPRs.length === 0;

  const priorByType = new Map<PRType, number>();
  for (const pr of existingPRs) {
    const current = priorByType.get(pr.type);
    if (current == null || pr.value > current) priorByType.set(pr.type, pr.value);
  }

  const results: PRCheckResult[] = [];

  const heaviest = working.reduce((best, s) => {
    const w = displayWeightForSet(s);
    return w > displayWeightForSet(best) ? s : best;
  });
  const heaviestWeight = displayWeightForSet(heaviest);
  const heaviestIsNew = heaviestWeight > (priorByType.get("heaviest_weight") ?? 0);
  results.push({
    type: "heaviest_weight",
    value: heaviestWeight,
    weightKg: heaviestWeight,
    reps: heaviest.reps,
    isNewPR: heaviestIsNew,
    celebrate: heaviestIsNew && !isFirstRecord,
  });

  let best1RM = 0;
  let best1RMSet: ExerciseSet | null = null;
  for (const s of working) {
    const oneRm = estimate1RM(displayWeightForSet(s), s.reps);
    if (oneRm > best1RM) {
      best1RM = oneRm;
      best1RMSet = s;
    }
  }
  if (best1RMSet) {
    const est1RMIsNew = best1RM > (priorByType.get("est_1rm") ?? 0);
    results.push({
      type: "est_1rm",
      value: Math.round(best1RM * 10) / 10,
      weightKg: displayWeightForSet(best1RMSet),
      reps: best1RMSet.reps,
      isNewPR: est1RMIsNew,
      celebrate: est1RMIsNew && !isFirstRecord,
    });
  }

  const totalVolume = working.reduce((sum, s) => sum + totalLoadForSet(s) * s.reps, 0);
  const volumeIsNew = totalVolume > (priorByType.get("volume") ?? 0);
  results.push({
    type: "volume",
    value: Math.round(totalVolume),
    weightKg: null,
    reps: null,
    isNewPR: volumeIsNew,
    celebrate: volumeIsNew && !isFirstRecord,
  });

  const bestRepsAtWeight = working.reduce((best, s) => (s.reps > best.reps ? s : best));
  const bestRepsIsNew = bestRepsAtWeight.reps > (priorByType.get("best_reps_at_weight") ?? 0);
  results.push({
    type: "best_reps_at_weight",
    value: bestRepsAtWeight.reps,
    weightKg: displayWeightForSet(bestRepsAtWeight),
    reps: bestRepsAtWeight.reps,
    isNewPR: bestRepsIsNew,
    celebrate: bestRepsIsNew && !isFirstRecord,
  });

  return results;
}
