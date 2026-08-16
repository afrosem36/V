import { db } from "@/lib/db/db";
import { getCompletedSessions, getSessionSets } from "@/lib/db/repo/workouts";
import { getExercisesByIds } from "@/lib/db/repo/exercises";
import { totalLoadForSet, displayWeightForSet } from "@/lib/engine/weight-math";
import { estimateCaloriesBurned } from "@/lib/engine/body-metrics";
import { dateStr } from "@/lib/utils/date";
import { startOfWeek, addWeeks, isWithinInterval, endOfWeek, format } from "date-fns";

export interface WeeklyVolume {
  weekStart: string;
  label: string;
  volume: number;
  workouts: number;
}

export async function getWeeklyVolumes(weeks: number): Promise<WeeklyVolume[]> {
  const sessions = await getCompletedSessions(500);
  const allSets = await db.exerciseSets.toArray();
  const setsBySession = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const arr = setsBySession.get(s.sessionId) ?? [];
    arr.push(s);
    setsBySession.set(s.sessionId, arr);
  }

  const results: WeeklyVolume[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    let volume = 0;
    let workouts = 0;
    for (const session of sessions) {
      const started = new Date(session.startedAt);
      if (isWithinInterval(started, { start: weekStart, end: weekEnd })) {
        workouts++;
        const sets = setsBySession.get(session.id) ?? [];
        volume += sets.reduce((sum, s) => sum + totalLoadForSet(s) * s.reps, 0);
      }
    }
    results.push({ weekStart: dateStr(weekStart), label: format(weekStart, "MMM d"), volume: Math.round(volume), workouts });
  }
  return results;
}

export interface ExerciseHistoryPoint {
  date: string;
  sessionId: string;
  bestWeightKg: number;
  bestSetReps: number;
}

export async function getExerciseHistory(exerciseId: string, limit = 12): Promise<ExerciseHistoryPoint[]> {
  const sets = await db.exerciseSets.where("exerciseId").equals(exerciseId).and((s) => !s.isWarmup).toArray();
  const bySession = new Map<string, typeof sets>();
  for (const s of sets) {
    const arr = bySession.get(s.sessionId) ?? [];
    arr.push(s);
    bySession.set(s.sessionId, arr);
  }

  const points: ExerciseHistoryPoint[] = [];
  for (const [sessionId, sessionSets] of bySession) {
    const best = sessionSets.reduce((b, s) => (displayWeightForSet(s) > displayWeightForSet(b) ? s : b));
    points.push({ date: best.completedAt, sessionId, bestWeightKg: displayWeightForSet(best), bestSetReps: best.reps });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date)).slice(-limit);
}

export async function getWorkoutCounts(): Promise<{ thisWeek: number; thisMonth: number }> {
  const sessions = await getCompletedSessions(500);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let thisWeek = 0;
  let thisMonth = 0;
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    if (d >= weekStart) thisWeek++;
    if (d >= monthStart) thisMonth++;
  }
  return { thisWeek, thisMonth };
}

export interface RecentSessionSummary {
  date: string;
  label: string;
  primaryMuscles: string[];
  totalVolume: number;
  durationMin: number;
}

/** Last N completed workouts (most recent first) — the training context sent to the AI for recovery-nutrition suggestions. */
export async function getRecentSessionsSummary(limit = 3): Promise<RecentSessionSummary[]> {
  const sessions = await getCompletedSessions(limit);
  const results: RecentSessionSummary[] = [];

  for (const session of sessions) {
    const sets = await getSessionSets(session.id);
    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    const exercises = await getExercisesByIds(exerciseIds);
    const primaryMuscles = [...new Set(exercises.map((e) => e.primaryMuscle))];
    const totalVolume = Math.round(sets.reduce((sum, s) => sum + totalLoadForSet(s) * s.reps, 0));
    const durationMin =
      session.completedAt != null ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000) : 0;

    results.push({ date: session.startedAt.slice(0, 10), label: session.label, primaryMuscles, totalVolume, durationMin });
  }

  return results;
}

export interface WeeklyGymStats {
  sessionCount: number;
  totalMinutes: number;
  avgMinutesPerSession: number;
  estimatedCalories: number;
}

/** "Time at the gym" + a rough calorie estimate for the current calendar week (Mon-Sun). */
export async function getWeeklyGymStats(bodyWeightKg: number | null): Promise<WeeklyGymStats> {
  const sessions = await getCompletedSessions(500);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  let totalMinutes = 0;
  let sessionCount = 0;
  for (const s of sessions) {
    const started = new Date(s.startedAt);
    if (!isWithinInterval(started, { start: weekStart, end: weekEnd }) || !s.completedAt) continue;
    sessionCount++;
    totalMinutes += Math.max(0, Math.round((new Date(s.completedAt).getTime() - started.getTime()) / 60000));
  }

  return {
    sessionCount,
    totalMinutes,
    avgMinutesPerSession: sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0,
    estimatedCalories: bodyWeightKg != null ? estimateCaloriesBurned(totalMinutes, bodyWeightKg) : 0,
  };
}
