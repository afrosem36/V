"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useActiveWorkoutSession, firstIncompleteIndex } from "@/lib/hooks/useActiveWorkoutSession";
import { useActiveWorkoutStore } from "@/store/active-workout-store";
import { abandonSession, completeSession } from "@/lib/db/repo/workouts";
import { acquireWakeLock, releaseWakeLock } from "@/lib/pwa/wake-lock";
import { ExercisePanel } from "@/components/workout/ExercisePanel";
import { RestTimerBar } from "@/components/workout/RestTimerBar";
import { WarmupTip } from "@/components/workout/WarmupTip";
import { GymClock } from "@/components/workout/GymClock";

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session");

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const data = useActiveWorkoutSession(sessionIdParam, overrides);

  const [currentIndex, setCurrentIndex] = useState(0);
  const initialized = useRef(false);
  const skipRest = useActiveWorkoutStore((s) => s.skipRest);
  const resetForNewSession = useActiveWorkoutStore((s) => s.resetForNewSession);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!initialized.current && data) {
      initialized.current = true;
      setCurrentIndex(firstIncompleteIndex(data.entries));
      resetForNewSession();
    }
  }, [data, resetForNewSession]);

  useEffect(() => {
    acquireWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, []);

  async function handleEndEarly() {
    if (!data) return;
    if (!confirm("End this workout now? Sets you've already logged will be saved.")) return;
    if (data.entries.some((e) => e.loggedSets.length > 0)) {
      await completeSession(data.session.id);
      router.push(`/workout/summary/${data.session.id}`);
    } else {
      await abandonSession(data.session.id);
      router.push("/");
    }
  }

  async function handleNext() {
    if (!data) return;
    skipRest();
    if (currentIndex >= data.entries.length - 1) {
      setFinishing(true);
      await completeSession(data.session.id);
      router.push(`/workout/summary/${data.session.id}`);
      return;
    }
    setCurrentIndex((i) => i + 1);
    window.scrollTo(0, 0);
  }

  if (data === undefined) {
    return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;
  }

  if (data === null || data.entries.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="text-lg font-semibold">No active workout</div>
        <button className="text-sm font-medium text-accent" onClick={() => router.push("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const entry = data.entries[currentIndex];

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/95 px-4 pb-3 pt-[calc(0.75rem+var(--safe-top))] backdrop-blur">
        <div>
          <div className="text-sm font-semibold">{data.session.label}</div>
          <div className="text-xs text-text-muted">
            Exercise {currentIndex + 1} of {data.entries.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GymClock startedAt={data.session.startedAt} />
          <button
            onClick={handleEndEarly}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 border border-border active:brightness-90"
            aria-label="End workout"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-32">
        {currentIndex === 0 && <WarmupTip key={entry.exercise.id} exercise={entry.exercise} />}
        <ExercisePanel
          key={entry.exercise.id + currentIndex}
          entry={entry}
          sessionId={data.session.id}
          isLast={currentIndex === data.entries.length - 1}
          onNext={handleNext}
          onSwap={(exerciseId) => setOverrides((prev) => ({ ...prev, [entry.dayExercise.id]: exerciseId }))}
        />
        {finishing && <div className="mt-4 text-center text-sm text-text-muted">Finishing up…</div>}
      </div>

      <RestTimerBar />
    </div>
  );
}
