"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getAllWorkoutDays, getCompletedSessions } from "@/lib/db/repo/workouts";
import { dateStr, todayStr } from "@/lib/utils/date";
import { startOfWeek, addDays, format } from "date-fns";
import clsx from "clsx";

function usePlanWeek() {
  return useLiveQuery(async () => {
    const days = await getAllWorkoutDays();
    const completed = await getCompletedSessions(60);
    const completedDates = new Set(completed.map((s) => dateStr(new Date(s.startedAt))));

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const ordered = [1, 2, 3, 4, 5, 6, 0].map((dow, i) => {
      const day = days.find((d) => d.dayOfWeek === dow);
      const date = addDays(weekStart, i);
      const ds = dateStr(date);
      return {
        day,
        date: ds,
        dayLabel: format(date, "EEE"),
        isToday: ds === todayStr(),
        done: completedDates.has(ds),
      };
    });

    return ordered;
  }, []);
}

export default function PlanPage() {
  const week = usePlanWeek();

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))]">
      <div className="text-2xl font-bold tracking-tight">This Week</div>

      <div className="flex flex-col gap-2">
        {week?.map(({ day, date, dayLabel, isToday, done }) => (
          <Link key={date} href={day ? `/plan/${day.id}` : "#"}>
            <Card
              className={clsx(
                "flex items-center justify-between",
                isToday && "border-accent/50",
                day?.isRestDay && "opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 text-xs font-semibold uppercase text-text-muted">{dayLabel}</div>
                <div>
                  <div className="font-semibold">{day?.label ?? "—"}</div>
                  {isToday && <div className="text-[11px] font-medium text-accent">Today</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {done && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check size={14} />
                  </span>
                )}
                {!day?.isRestDay && <ChevronRight size={16} className="text-text-faint" />}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
