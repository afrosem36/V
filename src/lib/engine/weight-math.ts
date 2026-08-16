import type { EquipmentIncrements, ExerciseSet, LoadType } from "@/types/domain";

export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/** Total load moved for volume math. Dumbbell weight is per-hand, so double it. */
export function totalLoadForSet(set: Pick<ExerciseSet, "weightEntryMode" | "weightKg" | "barWeightKg" | "platePerSideKg" | "assistKg">): number {
  switch (set.weightEntryMode) {
    case "dumbbell_each":
      return set.weightKg * 2;
    case "barbell_total":
      return set.barWeightKg != null && set.platePerSideKg != null ? set.barWeightKg + set.platePerSideKg * 2 : set.weightKg;
    case "machine":
      return set.weightKg;
    case "bodyweight":
      return 0;
    case "assisted":
      return 0;
    default:
      return set.weightKg;
  }
}

/** The number shown as "today's suggested weight" — per-hand for dumbbells, total for barbell/machine. */
export function displayWeightForSet(set: Pick<ExerciseSet, "weightEntryMode" | "weightKg" | "barWeightKg" | "platePerSideKg">): number {
  if (set.weightEntryMode === "barbell_total" && set.barWeightKg != null && set.platePerSideKg != null) {
    return set.barWeightKg + set.platePerSideKg * 2;
  }
  return set.weightKg;
}

export function loadTypeToEntryMode(loadType: LoadType): ExerciseSet["weightEntryMode"] {
  switch (loadType) {
    case "dumbbell_each":
      return "dumbbell_each";
    case "barbell":
      return "barbell_total";
    case "machine_stack":
      return "machine";
    case "bodyweight":
      return "bodyweight";
    case "cardio":
      return "bodyweight";
  }
}

/** Smallest weight step achievable next, given the equipment increments configured for this gym. */
export function stepForLoadType(loadType: LoadType, increments: EquipmentIncrements): number {
  switch (loadType) {
    case "dumbbell_each":
      return increments.dumbbellStepKg;
    case "barbell":
      return increments.plateStepKg * 2; // a plate is added to both sides
    case "machine_stack":
      return increments.machineStepKg;
    default:
      return 0;
  }
}

export function nextPlatePerSide(currentPlatePerSideKg: number, plateStepKg: number): number {
  return roundToStep(currentPlatePerSideKg + plateStepKg, plateStepKg);
}
