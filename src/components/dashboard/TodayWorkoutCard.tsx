"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { startSession } from "@/lib/db/repo/workouts";
import { formatDuration } from "@/lib/utils/format";
import type { WorkoutDay } from "@/types/domain";

const TIME_BUDGETS = [20, 30, 45, 60];

interface TodayWorkoutCardProps {
  today: WorkoutDay | undefined;
  estimatedMinutes: number;
}

export function TodayWorkoutCard({ today, estimatedMinutes }: TodayWorkoutCardProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleStart(budgetMinutes: number | null) {
    if (!today || starting) return;
    setStarting(true);
    const session = await startSession(today.id, today.label, budgetMinutes);
    router.push(`/workout/active?session=${session.id}`);
  }

  if (!today || today.isRestDay) {
    return (
      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-text-muted">Today</div>
        <div className="mt-1 text-xl font-bold">Rest &amp; Recovery</div>
        <p className="mt-2 text-sm text-text-muted">
          No scheduled training today. Recovery is part of the program — light walking is fine if you want to move.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-text-muted">Today</div>
      <div className="mt-1 text-xl font-bold">{today.label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
        <Clock size={14} />
        Estimated {formatDuration(estimatedMinutes)}
      </div>

      <Button className="mt-4" fullWidth size="lg" disabled={starting} onClick={() => handleStart(null)}>
        Start Workout
      </Button>
      <button
        className="mt-2 w-full text-center text-sm font-medium text-text-muted active:text-text"
        onClick={() => setSheetOpen(true)}
      >
        Short on time?
      </button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Short Workout">
        <p className="pb-3 text-sm text-text-muted">
          We'll prioritize the most important exercises and drop optional ones to fit your time.
        </p>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {TIME_BUDGETS.map((m) => (
            <button
              key={m}
              disabled={starting}
              onClick={() => handleStart(m)}
              className="h-16 rounded-xl border border-border bg-surface-2 text-lg font-bold active:brightness-90"
            >
              {m} min
            </button>
          ))}
        </div>
      </BottomSheet>
    </Card>
  );
}
