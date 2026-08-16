import type { MuscleGroup } from "@/types/domain";

// vShapePriority: 1 = highest priority for the V-taper goal.
export const MUSCLE_GROUP_SEED: MuscleGroup[] = [
  { id: "mg_lateral_delts", key: "lateral_delts", label: "Lateral Delts", vShapePriority: 1 },
  { id: "mg_lats", key: "lats", label: "Lats", vShapePriority: 2 },
  { id: "mg_traps", key: "traps", label: "Traps (Upper Back)", vShapePriority: 3 },
  { id: "mg_rear_delts", key: "rear_delts", label: "Rear Delts", vShapePriority: 4 },
  { id: "mg_upper_chest", key: "upper_chest", label: "Upper Chest", vShapePriority: 5 },
  { id: "mg_biceps", key: "biceps", label: "Biceps", vShapePriority: 6 },
  { id: "mg_triceps", key: "triceps", label: "Triceps", vShapePriority: 6 },
  { id: "mg_quads", key: "quads", label: "Quads", vShapePriority: 7 },
  { id: "mg_hamstrings", key: "hamstrings", label: "Hamstrings", vShapePriority: 7 },
  { id: "mg_glutes", key: "glutes", label: "Glutes", vShapePriority: 7 },
  { id: "mg_calves", key: "calves", label: "Calves", vShapePriority: 7 },
  { id: "mg_core", key: "core", label: "Core", vShapePriority: 8 },
  { id: "mg_chest", key: "chest", label: "Chest", vShapePriority: 9 },
  { id: "mg_front_delts", key: "front_delts", label: "Front Delts", vShapePriority: 9 },
  { id: "mg_forearms", key: "forearms", label: "Forearms", vShapePriority: 10 },
  { id: "mg_full_body", key: "full_body", label: "Full Body / Cardio", vShapePriority: 11 },
];
