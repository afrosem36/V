"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ArrowRightLeft } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { getWorkoutDay, getWorkoutDayExercises, updateWorkoutDayExercise, getActiveSession, startSession } from "@/lib/db/repo/workouts";
import { getExercisesByIds, getExercisesByPrimaryMuscle } from "@/lib/db/repo/exercises";
import type { Exercise, WorkoutDayExercise } from "@/types/domain";

function useDayDetail(dayId: string) {
  return useLiveQuery(async () => {
    const day = await getWorkoutDay(dayId);
    if (!day) return null;
    const dayExercises = await getWorkoutDayExercises(dayId);
    const exercises = await getExercisesByIds(dayExercises.map((d) => d.exerciseId));
    const activeSession = await getActiveSession();
    return {
      activeSession,
      day,
      rows: dayExercises.map((de) => ({ de, exercise: exercises.find((e) => e.id === de.exerciseId)! })).filter((r) => r.exercise),
    };
  }, [dayId]);
}

export default function PlanDayPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const data = useDayDetail(dayId);
  const [swapFor, setSwapFor] = useState<{ de: WorkoutDayExercise; exercise: Exercise } | null>(null);
  const [starting, setStarting] = useState(false);

  if (!data) return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;

  async function handleStart() {
    if (starting || !data) return;
    setStarting(true);
    if (data.activeSession) {
      router.push("/workout/active");
      return;
    }
    const session = await startSession(data.day.id, data.day.label, null);
    router.push(`/workout/active?session=${session.id}`);
  }

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))] pb-10">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="text-2xl font-bold tracking-tight">{data.day.label}</div>

      {data.day.isRestDay ? (
        <p className="text-sm text-text-muted">Rest day — no exercises scheduled.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth disabled={starting} onClick={handleStart}>
            {data.activeSession ? "Resume Workout in Progress" : "Start This Workout"}
          </Button>
          {data.rows.map(({ de, exercise }) => (
            <Card key={de.id}>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">{exercise.name}</div>
                <button
                  onClick={() => setSwapFor({ de, exercise })}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 border border-border active:brightness-90"
                  aria-label="Change exercise"
                >
                  <ArrowRightLeft size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <CardLabel>Sets</CardLabel>
                  <NumberStepper
                    value={de.targetSets}
                    onChange={(v) => updateWorkoutDayExercise(de.id, { targetSets: Math.max(1, Math.round(v)) })}
                    step={1}
                    decimals={0}
                    size="md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <CardLabel>Min reps</CardLabel>
                    <NumberStepper
                      value={de.repRangeMin}
                      onChange={(v) => updateWorkoutDayExercise(de.id, { repRangeMin: Math.max(1, Math.round(v)) })}
                      step={1}
                      decimals={0}
                      size="md"
                    />
                  </div>
                  <div>
                    <CardLabel>Max reps</CardLabel>
                    <NumberStepper
                      value={de.repRangeMax}
                      onChange={(v) => updateWorkoutDayExercise(de.id, { repRangeMax: Math.max(de.repRangeMin, Math.round(v)) })}
                      step={1}
                      decimals={0}
                      size="md"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {swapFor && (
        <SwapDefaultSheet
          current={swapFor}
          onClose={() => setSwapFor(null)}
          onSelect={async (exerciseId) => {
            await updateWorkoutDayExercise(swapFor.de.id, { exerciseId });
            setSwapFor(null);
          }}
        />
      )}
    </div>
  );
}

function SwapDefaultSheet({
  current,
  onClose,
  onSelect,
}: {
  current: { de: WorkoutDayExercise; exercise: Exercise };
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
}) {
  const candidates = useLiveQuery(() => getExercisesByPrimaryMuscle(current.exercise.primaryMuscle), [current.exercise.primaryMuscle]);

  return (
    <BottomSheet open onClose={onClose} title="Change Exercise">
      <div className="space-y-2 pb-4">
        {candidates?.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex.id)}
            className={`w-full rounded-xl border px-4 py-3 text-left ${
              ex.id === current.exercise.id ? "border-accent bg-accent/10" : "border-border bg-surface-2 active:brightness-90"
            }`}
          >
            <div className="font-medium">{ex.name}</div>
            <div className="text-xs text-text-muted">
              {ex.isCompound ? "Compound" : "Isolation"} · {ex.equipment.join(", ")}
            </div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
