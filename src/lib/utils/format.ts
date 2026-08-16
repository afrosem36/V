import type { PersonalRecord, WeightUnit } from "@/types/domain";

const KG_TO_LB = 2.20462;

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round(kg * KG_TO_LB * 10) / 10 : Math.round(kg * 10) / 10;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round((value / KG_TO_LB) * 100) / 100 : value;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${kgToDisplay(kg, unit)} ${unit}`;
}

export function formatPR(record: PersonalRecord, exerciseName: string, unit: WeightUnit): string {
  switch (record.type) {
    case "heaviest_weight":
      return `${exerciseName} · ${formatWeight(record.value, unit)}`;
    case "est_1rm":
      return `${exerciseName} · Est. 1RM ${formatWeight(record.value, unit)}`;
    case "best_reps_at_weight":
      return `${exerciseName} · ${record.reps} reps${record.weightKg ? ` @ ${formatWeight(record.weightKg, unit)}` : ""}`;
    case "volume":
      return `${exerciseName} · Volume PR`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
