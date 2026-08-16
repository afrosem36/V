import { db } from "@/lib/db/db";
import { MUSCLE_GROUP_SEED } from "./muscle-groups";
import { EQUIPMENT_SEED, DEFAULT_AVAILABLE_EQUIPMENT } from "./equipment";
import { EXERCISE_SEED } from "./exercises";
import { DEFAULT_PLAN, DEFAULT_PLAN_ID, WORKOUT_DAY_SEED, WORKOUT_DAY_EXERCISE_SEED } from "./program";
import type { AppSettings, EquipmentKey } from "@/types/domain";

export const SETTINGS_ID = "settings";

/**
 * Bump whenever exercises.ts / program.ts reference data changes (rep ranges, priorities,
 * new exercises, etc). syncLibraryIfNeeded() re-applies that reference data to existing
 * installs without touching user-generated data (sessions, sets, PRs, steps, weight,
 * equipment availability toggles).
 */
const LIBRARY_VERSION = 2;

function defaultSettings(now: string): AppSettings {
  return {
    id: SETTINGS_ID,
    units: "kg",
    stepGoal: 8000,
    defaultRestCompoundSec: 150,
    defaultRestIsolationSec: 75,
    defaultRestAbsSec: 60,
    equipmentIncrements: {
      dumbbellStepKg: 2,
      plateStepKg: 1.25,
      barWeightKg: 20,
      machineStepKg: 5,
    },
    trainingPhase: "calibration",
    phaseStartedAt: now,
    firstWorkoutCompletedAt: null,
    theme: "dark",
    lastActiveWorkoutDate: null,
    libraryVersion: LIBRARY_VERSION,
    heightCm: null,
    goalWeightKg: null,
  };
}

let seedingPromise: Promise<void> | null = null;

/** Idempotent: seeds on first run, then syncs corrected reference data on every subsequent boot. */
export function ensureSeeded(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = doSeed().then(() => syncLibraryIfNeeded());
  }
  return seedingPromise;
}

async function doSeed(): Promise<void> {
  const exerciseCount = await db.exercises.count();
  if (exerciseCount > 0) return;

  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [db.muscleGroups, db.equipment, db.exercises, db.userEquipment, db.workoutPlans, db.workoutDays, db.workoutDayExercises, db.appSettings],
    async () => {
      await db.muscleGroups.bulkAdd(MUSCLE_GROUP_SEED);
      await db.equipment.bulkAdd(EQUIPMENT_SEED);
      await db.exercises.bulkAdd(EXERCISE_SEED.map((e) => ({ ...e, createdAt: now, updatedAt: now })));

      const availableSet = new Set<EquipmentKey>(DEFAULT_AVAILABLE_EQUIPMENT);
      await db.userEquipment.bulkAdd(
        EQUIPMENT_SEED.map((eq) => ({
          id: `ue_${eq.key}`,
          equipmentKey: eq.key,
          available: eq.key === "bodyweight" ? true : availableSet.has(eq.key),
          updatedAt: now,
        }))
      );

      await db.workoutPlans.add({ ...DEFAULT_PLAN, createdAt: now, updatedAt: now });
      await db.workoutDays.bulkAdd(WORKOUT_DAY_SEED);
      await db.workoutDayExercises.bulkAdd(WORKOUT_DAY_EXERCISE_SEED);

      const existingSettings = await db.appSettings.get(SETTINGS_ID);
      if (!existingSettings) {
        await db.appSettings.add(defaultSettings(now));
      }
    }
  );
}

/**
 * Re-applies corrected exercise/program reference data on top of an existing install.
 * Reference tables (muscleGroups, equipment, exercises) are fully re-synced — they're
 * library data, never user-edited directly. workoutDayExercises are re-synced by id too:
 * today that's safe because the Plan editor only patches sets/rep-range/exerciseId on
 * these same seeded rows rather than creating new ones, so a version bump will currently
 * overwrite a manually-edited day. Acceptable for now (single user, pre-launch); if the
 * program editor becomes more independent, gate individual rows behind a "customized" flag
 * before re-syncing them.
 */
async function syncLibraryIfNeeded(): Promise<void> {
  const settings = await db.appSettings.get(SETTINGS_ID);
  const currentVersion = settings?.libraryVersion ?? 1;
  if (currentVersion >= LIBRARY_VERSION) return;

  const now = new Date().toISOString();

  await db.transaction("rw", [db.muscleGroups, db.equipment, db.exercises, db.userEquipment, db.workoutDayExercises, db.appSettings], async () => {
    await db.muscleGroups.bulkPut(MUSCLE_GROUP_SEED);
    await db.equipment.bulkPut(EQUIPMENT_SEED);

    const existingExercises = await db.exercises.toArray();
    const createdAtById = new Map(existingExercises.map((e) => [e.id, e.createdAt]));
    await db.exercises.bulkPut(
      EXERCISE_SEED.map((e) => ({ ...e, createdAt: createdAtById.get(e.id) ?? now, updatedAt: now }))
    );

    await db.workoutDayExercises.bulkPut(WORKOUT_DAY_EXERCISE_SEED);

    const existingEquipmentKeys = new Set((await db.userEquipment.toArray()).map((u) => u.equipmentKey));
    const newEquipment = EQUIPMENT_SEED.filter((eq) => !existingEquipmentKeys.has(eq.key));
    if (newEquipment.length > 0) {
      await db.userEquipment.bulkAdd(
        newEquipment.map((eq) => ({ id: `ue_${eq.key}`, equipmentKey: eq.key, available: true, updatedAt: now }))
      );
    }

    await db.appSettings.update(SETTINGS_ID, { libraryVersion: LIBRARY_VERSION });
  });
}

export { DEFAULT_PLAN_ID };
