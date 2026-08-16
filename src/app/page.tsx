"use client";

import { useHomeData } from "@/lib/hooks/useHomeData";
import { greeting } from "@/lib/utils/format";
import { ActiveSessionBanner } from "@/components/dashboard/ActiveSessionBanner";
import { ReturnPromptBanner } from "@/components/dashboard/ReturnPromptBanner";
import { TodayWorkoutCard } from "@/components/dashboard/TodayWorkoutCard";
import { QuickStats } from "@/components/dashboard/QuickStats";

export default function HomePage() {
  const data = useHomeData();

  if (!data) {
    return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;
  }

  const { today, estimatedMinutes, activeSession, settings, steps, latestWeight, streak, recentPR, returnPrompt } = data;

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))]">
      <div className="text-2xl font-bold tracking-tight">{greeting()}</div>

      {activeSession && <ActiveSessionBanner label={activeSession.label} />}
      {!activeSession && <ReturnPromptBanner prompt={returnPrompt} />}

      {!activeSession && <TodayWorkoutCard today={today} estimatedMinutes={estimatedMinutes} />}

      <QuickStats
        stepsToday={steps?.steps ?? 0}
        stepGoal={settings.stepGoal}
        streak={streak}
        recentPR={recentPR}
        latestWeightKg={latestWeight?.weightKg ?? null}
        unit={settings.units}
      />
    </div>
  );
}
