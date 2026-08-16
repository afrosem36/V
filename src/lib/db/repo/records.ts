import { db } from "@/lib/db/db";
import { newId } from "@/lib/utils/id";
import { detectNewPRs, type PRCheckResult } from "@/lib/engine/pr";
import type { ExerciseSet, PersonalRecord, PRType } from "@/types/domain";

export async function getPRsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
  return db.personalRecords.where("exerciseId").equals(exerciseId).toArray();
}

/** Call once per exercise right after a session is completed. Persists any records broken and returns them. */
export async function evaluateAndSavePRs(exerciseId: string, sessionId: string, newSets: ExerciseSet[]): Promise<PRCheckResult[]> {
  const existing = await getPRsForExercise(exerciseId);
  const results = detectNewPRs(newSets, existing);
  const now = new Date().toISOString();

  for (const r of results) {
    if (!r.isNewPR) continue;
    const existingOfType = existing.find((p) => p.type === r.type);
    const record: PersonalRecord = {
      id: existingOfType?.id ?? newId("pr"),
      exerciseId,
      type: r.type,
      value: r.value,
      weightKg: r.weightKg,
      reps: r.reps,
      achievedAt: now,
      sessionId,
      isBaseline: !r.celebrate,
    };
    await db.personalRecords.put(record);
  }

  return results.filter((r) => r.celebrate);
}

export async function getAllPRsByType(type: PRType): Promise<PersonalRecord[]> {
  return db.personalRecords.where("type").equals(type).toArray();
}

/** PRs worth celebrating from a session — excludes baseline records set on an exercise's first-ever outing. */
export async function getPRsForSession(sessionId: string): Promise<PersonalRecord[]> {
  const rows = await db.personalRecords.where("sessionId").equals(sessionId).toArray();
  return rows.filter((r) => !r.isBaseline);
}

export async function getMostRecentPR(): Promise<PersonalRecord | undefined> {
  const all = (await db.personalRecords.toArray()).filter((p) => !p.isBaseline);
  if (all.length === 0) return undefined;
  return all.reduce((latest, p) => (p.achievedAt > latest.achievedAt ? p : latest));
}
