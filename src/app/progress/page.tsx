"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Ruler, Camera, HeartPulse } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { WeeklyVolumeChart } from "@/components/charts/WeeklyVolumeChart";
import { ExerciseTrendChart } from "@/components/charts/ExerciseTrendChart";
import { getWeeklyVolumes, getExerciseHistory, getWorkoutCounts } from "@/lib/db/repo/analytics";
import { getAllPRsByType } from "@/lib/db/repo/records";
import { getExercisesByIds } from "@/lib/db/repo/exercises";
import { getSettings } from "@/lib/db/repo/settings";
import { formatPR } from "@/lib/utils/format";

function useProgressOverview() {
  return useLiveQuery(async () => {
    const [weeklyVolumes, counts, heaviestPRs, settings] = await Promise.all([
      getWeeklyVolumes(8),
      getWorkoutCounts(),
      getAllPRsByType("heaviest_weight"),
      getSettings(),
    ]);
    const exercises = await getExercisesByIds(heaviestPRs.map((p) => p.exerciseId));
    const prRows = heaviestPRs
      .map((pr) => ({ pr, exercise: exercises.find((e) => e.id === pr.exerciseId) }))
      .filter((r): r is { pr: typeof heaviestPRs[number]; exercise: NonNullable<typeof r.exercise> } => r.exercise != null)
      .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));

    return { weeklyVolumes, counts, prRows, unit: settings.units };
  }, []);
}

function useExerciseTrend(exerciseId: string | null) {
  return useLiveQuery(async () => {
    if (!exerciseId) return [];
    return getExerciseHistory(exerciseId, 12);
  }, [exerciseId]);
}

export default function ProgressPage() {
  const data = useProgressOverview();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const trend = useExerciseTrend(selectedExerciseId ?? data?.prRows[0]?.exercise.id ?? null);

  if (!data) return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;

  const activeExerciseId = selectedExerciseId ?? data.prRows[0]?.exercise.id ?? null;

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))] pb-10">
      <div className="text-2xl font-bold tracking-tight">Progress</div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <CardLabel>This Week</CardLabel>
          <div className="mt-1 text-lg font-bold">
            {data.counts.thisWeek} {data.counts.thisWeek === 1 ? "workout" : "workouts"}
          </div>
        </Card>
        <Card className="text-center">
          <CardLabel>This Month</CardLabel>
          <div className="mt-1 text-lg font-bold">
            {data.counts.thisMonth} {data.counts.thisMonth === 1 ? "workout" : "workouts"}
          </div>
        </Card>
      </div>

      <Card>
        <CardLabel>Weekly Volume</CardLabel>
        <div className="mt-2">
          <WeeklyVolumeChart data={data.weeklyVolumes} />
        </div>
      </Card>

      {data.prRows.length > 0 && (
        <Card>
          <CardLabel>Strength Progression</CardLabel>
          <div className="mt-2 -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {data.prRows.map(({ exercise }) => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExerciseId(exercise.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  activeExerciseId === exercise.id ? "bg-accent text-accent-foreground" : "bg-surface-2 text-text-muted"
                }`}
              >
                {exercise.name}
              </button>
            ))}
          </div>
          {trend && <ExerciseTrendChart points={trend} />}
        </Card>
      )}

      <Card>
        <CardLabel>Personal Records</CardLabel>
        <div className="mt-2 flex flex-col gap-2">
          {data.prRows.length === 0 && <p className="text-sm text-text-muted">Complete a few workouts to start setting records.</p>}
          {data.prRows.map(({ pr, exercise }) => (
            <div key={pr.id} className="flex items-center justify-between text-sm">
              <span>{exercise.name}</span>
              <span className="font-semibold">{formatPR(pr, exercise.name, data.unit).split("· ")[1]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <Link href="/progress/body">
          <Card className="flex items-center justify-between border-accent/30 active:brightness-95">
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-accent" />
              <span className="font-medium">Body Metrics Dashboard</span>
            </div>
            <ChevronRight size={16} className="text-text-faint" />
          </Card>
        </Link>
        <Link href="/progress/measurements">
          <Card className="flex items-center justify-between active:brightness-95">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-text-muted" />
              <span className="font-medium">Body Measurements</span>
            </div>
            <ChevronRight size={16} className="text-text-faint" />
          </Card>
        </Link>
        <Link href="/progress/photos">
          <Card className="flex items-center justify-between active:brightness-95">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-text-muted" />
              <span className="font-medium">Progress Photos</span>
            </div>
            <ChevronRight size={16} className="text-text-faint" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
