/** Standard BMI. An informational estimate, not a diagnosis — doesn't account for body composition. */
export function computeBMI(weightKg: number, heightCm: number): number | null {
  if (heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BMICategory = "Underweight" | "Normal" | "Overweight" | "Obese";

/** WHO adult thresholds — informational only, same caveat as computeBMI. */
export function bmiCategory(bmi: number): BMICategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export interface WeightToGoal {
  direction: "lose" | "gain" | "at_goal";
  amountKg: number;
}

export function weightToGoal(currentKg: number, goalKg: number): WeightToGoal {
  const diff = Math.round((currentKg - goalKg) * 10) / 10;
  if (Math.abs(diff) < 0.2) return { direction: "at_goal", amountKg: 0 };
  return diff > 0 ? { direction: "lose", amountKg: diff } : { direction: "gain", amountKg: Math.abs(diff) };
}

export function fatMassKg(weightKg: number, bodyFatPercent: number): number {
  return Math.round(weightKg * (bodyFatPercent / 100) * 10) / 10;
}

/**
 * Rough resistance-training calorie estimate (MET-based: calories = MET x weight(kg) x hours).
 * MET 5.0 is a reasonable middle-of-the-road value for moderate-to-vigorous weight training.
 * This is always an estimate, not a measurement — label it as such wherever it's shown.
 */
const RESISTANCE_TRAINING_MET = 5.0;

export function estimateCaloriesBurned(durationMinutes: number, bodyWeightKg: number): number {
  if (durationMinutes <= 0 || bodyWeightKg <= 0) return 0;
  return Math.round(RESISTANCE_TRAINING_MET * bodyWeightKg * (durationMinutes / 60));
}
