"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { CompletedSetRow } from "@/components/workout/SetRow";
import { getSession, getSessionSets } from "@/lib/db/repo/workouts";
import { getExercisesByIds } from "@/lib/db/repo/exercises";
import { getPRsForSession } from "@/lib/db/repo/records";
import { totalLoadForSet } from "@/lib/engine/weight-math";
import { formatFriendlyDate, formatTime } from "@/lib/utils/date";
import { formatPR } from "@/lib/utils/format";
import { getSettings } from "@/lib/db/repo/settings";

export default function HistoryDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const data = useLiveQuery(async () => {
    const session = await getSession(sessionId);
    if (!session) return null;
    const sets = await getSessionSets(sessionId);
    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    const exercises = await getExercisesByIds(exerciseIds);
    const prs = await getPRsForSession(sessionId);
    const settings = await getSettings();

    const byExercise = exercises.map((ex) => ({
      exercise: ex,
      sets: sets.filter((s) => s.exerciseId === ex.id).sort((a, b) => a.setNumber - b.setNumber),
    }));

    const totalVolume = sets.reduce((sum, s) => sum + totalLoadForSet(s) * s.reps, 0);
    const durationMin =
      session.completedAt != null ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000) : null;

    return { session, byExercise, prs, totalVolume, totalSets: sets.length, durationMin, unit: settings.units };
  }, [sessionId]);

  if (!data) {
    return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;
  }

  const { session, byExercise, prs, totalVolume, totalSets, durationMin, unit } = data;

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))]">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <div className="text-2xl font-bold tracking-tight">{session.label}</div>
        <div className="text-sm text-text-muted">
          {formatFriendlyDate(session.startedAt)} · {formatTime(session.startedAt)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardLabel>Duration</CardLabel>
          <div className="mt-1 text-lg font-bold">{durationMin != null ? `${durationMin}m` : "—"}</div>
        </Card>
        <Card className="text-center">
          <CardLabel>Sets</CardLabel>
          <div className="mt-1 text-lg font-bold">{totalSets}</div>
        </Card>
        <Card className="text-center">
          <CardLabel>Volume</CardLabel>
          <div className="mt-1 text-lg font-bold">{Math.round(totalVolume)}kg</div>
        </Card>
      </div>

      {prs.length > 0 && (
        <Card className="border-accent/40 bg-accent/10">
          <CardLabel>Records that day</CardLabel>
          <div className="mt-2 flex flex-col gap-1.5">
            {prs.map((pr) => {
              const ex = byExercise.find((e) => e.exercise.id === pr.exerciseId)?.exercise;
              return (
                <div key={pr.id} className="text-sm font-semibold text-accent">
                  {ex ? formatPR(pr, ex.name, unit) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {byExercise.map(({ exercise, sets }) => (
          <Card key={exercise.id}>
            <div className="mb-2 font-semibold">{exercise.name}</div>
            <div className="flex flex-col gap-1.5">
              {sets.map((s) => (
                <CompletedSetRow key={s.id} setNumber={s.setNumber} set={s} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
