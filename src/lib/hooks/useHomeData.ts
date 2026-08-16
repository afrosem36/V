import { useLiveQuery } from "dexie-react-hooks";
import { getTodayWorkoutDay, getWorkoutDayExercises, getActiveSession, computeWorkoutStreak, getLastCompletedSession } from "@/lib/db/repo/workouts";
import { getSettings } from "@/lib/db/repo/settings";
import { getStepsForDate, getLatestBodyWeight } from "@/lib/db/repo/body";
import { getMostRecentPR } from "@/lib/db/repo/records";
import { getExercise } from "@/lib/db/repo/exercises";
import { estimateWorkoutMinutes } from "@/lib/engine/time-estimate";
import { getReturnPrompt } from "@/lib/engine/calibration";
import { todayStr } from "@/lib/utils/date";

export function useHomeData() {
  return useLiveQuery(async () => {
    const [today, activeSession, settings, steps, latestWeight, streak, lastCompleted, recentPR] = await Promise.all([
      getTodayWorkoutDay(),
      getActiveSession(),
      getSettings(),
      getStepsForDate(todayStr()),
      getLatestBodyWeight(),
      computeWorkoutStreak(),
      getLastCompletedSession(),
      getMostRecentPR(),
    ]);

    const dayExercises = today ? await getWorkoutDayExercises(today.id) : [];
    const estimatedMinutes = estimateWorkoutMinutes(dayExercises);
    const recentPRExercise = recentPR ? await getExercise(recentPR.exerciseId) : undefined;
    const returnPrompt = getReturnPrompt(lastCompleted?.startedAt.slice(0, 10) ?? null, todayStr());

    return {
      today,
      dayExercises,
      estimatedMinutes,
      activeSession,
      settings,
      steps,
      latestWeight,
      streak,
      recentPR: recentPR && recentPRExercise ? { record: recentPR, exerciseName: recentPRExercise.name } : null,
      returnPrompt,
    };
  }, []);
}
