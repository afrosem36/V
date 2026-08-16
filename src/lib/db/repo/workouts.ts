import { db } from "@/lib/db/db";
import { newId } from "@/lib/utils/id";
import { dateStr, dayOfWeekOf, todayStr } from "@/lib/utils/date";
import { evaluateAndSavePRs } from "@/lib/db/repo/records";
import { getSettings, updateSettings } from "@/lib/db/repo/settings";
import type { DayOfWeek, ExerciseSet, WorkoutDay, WorkoutDayExercise, WorkoutSession } from "@/types/domain";

// ---------------- Plan / day lookups ----------------

export async function getActivePlan() {
  return db.workoutPlans.filter((p) => p.isActive).first();
}

export async function getWorkoutDayByDow(dow: DayOfWeek): Promise<WorkoutDay | undefined> {
  const plan = await getActivePlan();
  if (!plan) return undefined;
  return db.workoutDays.where({ planId: plan.id, dayOfWeek: dow }).first();
}

export async function getTodayWorkoutDay(): Promise<WorkoutDay | undefined> {
  return getWorkoutDayByDow(dayOfWeekOf(new Date()));
}

export async function getAllWorkoutDays(): Promise<WorkoutDay[]> {
  const plan = await getActivePlan();
  if (!plan) return [];
  return db.workoutDays.where("planId").equals(plan.id).sortBy("order");
}

export async function getWorkoutDayExercises(workoutDayId: string): Promise<WorkoutDayExercise[]> {
  return db.workoutDayExercises.where("workoutDayId").equals(workoutDayId).sortBy("order");
}

export async function getWorkoutDay(id: string): Promise<WorkoutDay | undefined> {
  return db.workoutDays.get(id);
}

export async function updateWorkoutDayExercise(id: string, patch: Partial<Omit<WorkoutDayExercise, "id" | "workoutDayId">>): Promise<void> {
  await db.workoutDayExercises.update(id, patch);
}

export async function addWorkoutDayExercise(workoutDayId: string, exerciseId: string): Promise<void> {
  const [existing, exercise] = await Promise.all([getWorkoutDayExercises(workoutDayId), db.exercises.get(exerciseId)]);
  if (!exercise) return;
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0;
  const row: WorkoutDayExercise = {
    id: newId("wde"),
    workoutDayId,
    exerciseId,
    order: nextOrder,
    priority: 5, // new additions default to "optional / first cut" until the user re-prioritizes
    targetSets: exercise.recommendedSets,
    repRangeMin: exercise.repRangeMin,
    repRangeMax: exercise.repRangeMax,
    restSeconds: exercise.restSeconds,
  };
  await db.workoutDayExercises.add(row);
}

export async function removeWorkoutDayExercise(id: string): Promise<void> {
  await db.workoutDayExercises.delete(id);
}

export async function setDayRestStatus(dayId: string, isRestDay: boolean): Promise<void> {
  await db.workoutDays.update(dayId, { isRestDay });
}

// ---------------- Sessions ----------------

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.where("status").equals("active").first();
}

export async function startSession(
  workoutDayId: string | null,
  label: string,
  timeBudgetMinutes: number | null
): Promise<WorkoutSession> {
  const session: WorkoutSession = {
    id: newId("sess"),
    workoutDayId,
    label,
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    timeBudgetMinutes,
    notes: null,
  };
  await db.workoutSessions.add(session);
  return session;
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.get(id);
}

export async function updateSessionNotes(id: string, notes: string): Promise<void> {
  await db.workoutSessions.update(id, { notes: notes.trim().length > 0 ? notes.trim() : null });
}

export async function abandonSession(id: string): Promise<void> {
  await db.workoutSessions.update(id, { status: "abandoned", completedAt: new Date().toISOString() });
}

export interface CompletionSummary {
  session: WorkoutSession;
  newPRsByExercise: Record<string, ReturnType<typeof evaluateAndSavePRs> extends Promise<infer R> ? R : never>;
}

export async function completeSession(id: string) {
  const sets = await getSessionSets(id);
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];

  const newPRsByExercise: Record<string, Awaited<ReturnType<typeof evaluateAndSavePRs>>> = {};
  for (const exId of exerciseIds) {
    const exSets = sets.filter((s) => s.exerciseId === exId);
    newPRsByExercise[exId] = await evaluateAndSavePRs(exId, id, exSets);
  }

  const completedAt = new Date().toISOString();
  await db.workoutSessions.update(id, { status: "completed", completedAt });

  const settings = await getSettings();
  await updateSettings({
    firstWorkoutCompletedAt: settings.firstWorkoutCompletedAt ?? completedAt,
    lastActiveWorkoutDate: todayStr(),
  });

  const session = await getSession(id);
  return { session: session!, newPRsByExercise };
}

// ---------------- Sets ----------------

export async function getSessionSets(sessionId: string): Promise<ExerciseSet[]> {
  return db.exerciseSets.where("sessionId").equals(sessionId).sortBy("completedAt");
}

export async function getSessionSetsForExercise(sessionId: string, exerciseId: string): Promise<ExerciseSet[]> {
  const all = await db.exerciseSets.where({ sessionId, exerciseId }).sortBy("setNumber");
  return all;
}

export async function addSet(input: Omit<ExerciseSet, "id" | "completedAt">): Promise<ExerciseSet> {
  const set: ExerciseSet = { ...input, id: newId("set"), completedAt: new Date().toISOString() };
  await db.exerciseSets.add(set);
  return set;
}

export async function deleteSet(id: string): Promise<void> {
  await db.exerciseSets.delete(id);
}

/** Most recent OTHER session's working sets for this exercise — powers "LAST TIME" + progression. */
export async function getLastWorkingSets(exerciseId: string, excludeSessionId?: string): Promise<ExerciseSet[]> {
  const all = await db.exerciseSets.where("exerciseId").equals(exerciseId).reverse().sortBy("completedAt");
  const filtered = all.filter((s) => s.sessionId !== excludeSessionId);
  if (filtered.length === 0) return [];
  const lastSessionId = filtered[0].sessionId;
  return filtered.filter((s) => s.sessionId === lastSessionId && !s.isWarmup).sort((a, b) => a.setNumber - b.setNumber);
}

// ---------------- History ----------------

export async function getCompletedSessions(limit = 50): Promise<WorkoutSession[]> {
  return db.workoutSessions.where("status").equals("completed").reverse().sortBy("startedAt").then((r) => r.slice(0, limit));
}

export async function getLastCompletedSession(): Promise<WorkoutSession | undefined> {
  const rows = await getCompletedSessions(1);
  return rows[0];
}

export async function getPreviousCompletedSessionForDay(workoutDayId: string, excludeSessionId: string): Promise<WorkoutSession | undefined> {
  const all = await getCompletedSessions(200);
  return all.find((s) => s.workoutDayId === workoutDayId && s.id !== excludeSessionId);
}

// ---------------- Streak ----------------

export async function computeWorkoutStreak(): Promise<number> {
  const days = await getAllWorkoutDays();
  const completed = await getCompletedSessions(200);
  const completedDates = new Set(completed.map((s) => dateStr(new Date(s.startedAt))));

  let streak = 0;
  const cursor = new Date();
  // Don't penalize for today not being done yet; start checking from today backward.
  for (let i = 0; i < 90; i++) {
    const ds = dateStr(cursor);
    const dow = dayOfWeekOf(cursor);
    const day = days.find((d) => d.dayOfWeek === dow);
    const isRest = day?.isRestDay ?? false;

    if (isRest) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (completedDates.has(ds)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (ds === todayStr()) {
      // today's workout not done yet — doesn't break an existing streak
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}
