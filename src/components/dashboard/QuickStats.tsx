import Link from "next/link";
import { Footprints, Flame, Trophy, Scale } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPR, formatWeight } from "@/lib/utils/format";
import type { PersonalRecord, WeightUnit } from "@/types/domain";

interface QuickStatsProps {
  stepsToday: number;
  stepGoal: number;
  streak: number;
  recentPR: { record: PersonalRecord; exerciseName: string } | null;
  latestWeightKg: number | null;
  unit: WeightUnit;
}

export function QuickStats({ stepsToday, stepGoal, streak, recentPR, latestWeightKg, unit }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/steps">
        <Card className="h-full">
          <div className="flex items-center gap-2 text-text-muted">
            <Footprints size={16} />
            <CardLabel>Steps</CardLabel>
          </div>
          <div className="mt-2 text-xl font-bold tabular-nums">
            {stepsToday.toLocaleString()} <span className="text-sm font-medium text-text-muted">/ {stepGoal.toLocaleString()}</span>
          </div>
          <ProgressBar value={stepsToday} max={stepGoal} className="mt-2" />
        </Card>
      </Link>

      <Card className="h-full">
        <div className="flex items-center gap-2 text-text-muted">
          <Flame size={16} />
          <CardLabel>Streak</CardLabel>
        </div>
        <div className="mt-2 text-xl font-bold tabular-nums">{streak}</div>
        <div className="text-xs text-text-muted">{streak === 1 ? "workout" : "workouts"} in a row</div>
      </Card>

      <Card className="h-full">
        <div className="flex items-center gap-2 text-text-muted">
          <Trophy size={16} />
          <CardLabel>Recent PR</CardLabel>
        </div>
        <div className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">
          {recentPR ? formatPR(recentPR.record, recentPR.exerciseName, unit) : "None yet"}
        </div>
      </Card>

      <Link href="/weight">
        <Card className="h-full">
          <div className="flex items-center gap-2 text-text-muted">
            <Scale size={16} />
            <CardLabel>Weight</CardLabel>
          </div>
          <div className="mt-2 text-xl font-bold tabular-nums">
            {latestWeightKg != null ? formatWeight(latestWeightKg, unit) : "—"}
          </div>
        </Card>
      </Link>
    </div>
  );
}
