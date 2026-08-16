import type { TrainingPhase } from "@/types/domain";

const CALIBRATION_WEEKS = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY);
}

/** Steady-state kicks in once CALIBRATION_WEEKS have passed since the first workout was completed. */
export function resolveTrainingPhase(firstWorkoutCompletedAt: string | null, now: string): TrainingPhase {
  if (!firstWorkoutCompletedAt) return "calibration";
  const days = daysBetween(firstWorkoutCompletedAt, now);
  return days >= CALIBRATION_WEEKS * 7 ? "steady_state" : "calibration";
}

export type BreakSeverity = "none" | "short" | "long";

/** 1-6 days = normal gap. 7-20 days = ask about a lighter restart. 21+ = recommend a gradual restart outright. */
export function classifyBreak(lastSessionDate: string | null, now: string): BreakSeverity {
  if (!lastSessionDate) return "none";
  const days = daysBetween(lastSessionDate, now);
  if (days < 7) return "none";
  if (days < 21) return "short";
  return "long";
}

export interface ReturnPrompt {
  show: boolean;
  severity: BreakSeverity;
  daysSinceLastWorkout: number;
  message: string;
}

export function getReturnPrompt(lastSessionDate: string | null, now: string): ReturnPrompt {
  const severity = classifyBreak(lastSessionDate, now);
  const days = lastSessionDate ? daysBetween(lastSessionDate, now) : 0;
  if (severity === "none") {
    return { show: false, severity, daysSinceLastWorkout: days, message: "" };
  }
  if (severity === "short") {
    return {
      show: true,
      severity,
      daysSinceLastWorkout: days,
      message: `It's been ${days} days since your last workout. Resume normally, or use a lighter restart session?`,
    };
  }
  return {
    show: true,
    severity,
    daysSinceLastWorkout: days,
    message: `It's been ${days} days — a longer break. A gradual restart at reduced weight is recommended before returning to your previous working weights.`,
  };
}
