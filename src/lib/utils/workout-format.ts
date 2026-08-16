import { displayWeightForSet } from "@/lib/engine/weight-math";
import type { ExerciseSet, LoadType } from "@/types/domain";

type MinimalSet = Pick<ExerciseSet, "weightEntryMode" | "weightKg" | "barWeightKg" | "platePerSideKg" | "reps">;

export function formatLastPerformance(sets: MinimalSet[], loadType: LoadType, repUnit: "reps" | "seconds" | "minutes"): string {
  if (sets.length === 0) return "No history yet";

  const unit = repUnit === "reps" ? "" : ` ${repUnit === "seconds" ? "sec" : "min"}`;
  const isBodyweight = loadType === "bodyweight" || loadType === "cardio";

  if (isBodyweight) {
    return sets.map((s) => `${s.reps}${unit}`).join(", ");
  }

  const weights = sets.map((s) => displayWeightForSet(s));
  const allSame = weights.every((w) => w === weights[0]);
  const suffix = loadType === "dumbbell_each" ? "kg each" : "kg";

  if (allSame) {
    return `${weights[0]}${suffix} × ${sets.map((s) => `${s.reps}${unit}`).join(", ")}`;
  }
  return sets.map((s, i) => `${weights[i]}${suffix} × ${s.reps}${unit}`).join(", ");
}
