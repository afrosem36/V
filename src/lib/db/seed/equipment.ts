import type { Equipment, EquipmentKey } from "@/types/domain";

const LABELS: Record<EquipmentKey, string> = {
  dumbbell: "Dumbbells",
  barbell: "Barbell",
  adjustable_bench: "Adjustable Bench",
  flat_bench: "Flat Bench",
  incline_bench: "Incline Bench",
  squat_rack: "Squat Rack",
  cable_machine: "Cable Machine",
  lat_pulldown: "Lat Pulldown",
  seated_cable_row: "Seated Cable Row",
  leg_press: "Leg Press",
  leg_extension: "Leg Extension",
  leg_curl: "Leg Curl",
  chest_press_machine: "Chest Press Machine",
  pec_deck: "Pec Deck / Chest Fly Machine",
  shoulder_press_machine: "Shoulder Press Machine",
  smith_machine: "Smith Machine",
  pull_up_bar: "Pull-up Bar",
  ez_curl_bar: "EZ Curl Bar",
  treadmill: "Treadmill",
  exercise_bike: "Exercise Bike",
  bodyweight: "Bodyweight (always available)",
};

export const EQUIPMENT_SEED: Equipment[] = (Object.keys(LABELS) as EquipmentKey[]).map((key) => ({
  id: `eq_${key}`,
  key,
  label: LABELS[key],
}));

// Equipment assumed present at a basic local gym by default; user can edit in Settings.
export const DEFAULT_AVAILABLE_EQUIPMENT: EquipmentKey[] = [
  "dumbbell",
  "barbell",
  "adjustable_bench",
  "flat_bench",
  "incline_bench",
  "cable_machine",
  "lat_pulldown",
  "seated_cable_row",
  "leg_press",
  "leg_extension",
  "leg_curl",
  "pull_up_bar",
  "ez_curl_bar",
  "treadmill",
  "bodyweight",
];
