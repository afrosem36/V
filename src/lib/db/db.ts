import Dexie, { type EntityTable } from "dexie";
import type {
  MuscleGroup,
  Equipment,
  Exercise,
  UserEquipment,
  WorkoutPlan,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutSession,
  ExerciseSet,
  PersonalRecord,
  BodyWeight,
  BodyMeasurement,
  DailySteps,
  ProgressPhoto,
  AppSettings,
} from "@/types/domain";

class VshapeDB extends Dexie {
  muscleGroups!: EntityTable<MuscleGroup, "id">;
  equipment!: EntityTable<Equipment, "id">;
  exercises!: EntityTable<Exercise, "id">;
  userEquipment!: EntityTable<UserEquipment, "id">;
  workoutPlans!: EntityTable<WorkoutPlan, "id">;
  workoutDays!: EntityTable<WorkoutDay, "id">;
  workoutDayExercises!: EntityTable<WorkoutDayExercise, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  exerciseSets!: EntityTable<ExerciseSet, "id">;
  personalRecords!: EntityTable<PersonalRecord, "id">;
  bodyWeights!: EntityTable<BodyWeight, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  dailySteps!: EntityTable<DailySteps, "id">;
  progressPhotos!: EntityTable<ProgressPhoto, "id">;
  appSettings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("vshape");
    this.version(1).stores({
      muscleGroups: "id, key",
      equipment: "id, key",
      exercises: "id, primaryMuscle, name",
      userEquipment: "id, equipmentKey",
      workoutPlans: "id, isActive",
      workoutDays: "id, planId, dayOfWeek",
      workoutDayExercises: "id, workoutDayId, exerciseId, order",
      workoutSessions: "id, status, startedAt, workoutDayId",
      exerciseSets: "id, sessionId, exerciseId, [exerciseId+completedAt], completedAt",
      personalRecords: "id, exerciseId, type, [exerciseId+type]",
      bodyWeights: "id, &date",
      bodyMeasurements: "id, &date",
      dailySteps: "id, &date",
      progressPhotos: "id, date, angle",
      appSettings: "id",
    });
    // v2: personalRecords.sessionId needed its own index (getPRsForSession threw without it);
    // added compound indexes the query planner was falling back and warning on.
    this.version(2).stores({
      workoutDays: "id, planId, dayOfWeek, [planId+dayOfWeek]",
      exerciseSets: "id, sessionId, exerciseId, [exerciseId+completedAt], [sessionId+exerciseId], completedAt",
      personalRecords: "id, exerciseId, sessionId, type, [exerciseId+type]",
    });
  }
}

export const db = new VshapeDB();
