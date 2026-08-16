"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Pencil } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { upsertBodyWeight, getBodyWeightsInRange, rollingAverageWeight, getLatestBodyWeight } from "@/lib/db/repo/body";
import { getSettings } from "@/lib/db/repo/settings";
import { todayStr, formatShortDate } from "@/lib/utils/date";
import { kgToDisplay, displayToKg } from "@/lib/utils/format";
import { format, subDays } from "date-fns";

function useWeightData() {
  return useLiveQuery(async () => {
    const settings = await getSettings();
    const start90 = format(subDays(new Date(), 89), "yyyy-MM-dd");
    const range = await getBodyWeightsInRange(start90, todayStr());
    const latest = await getLatestBodyWeight();

    const avg7 = rollingAverageWeight(range, 7);
    const avg30 = rollingAverageWeight(range, 30);

    // Compare rolling averages (not single days) so a noisy one-off weigh-in doesn't skew the trend.
    const avg7Prior = rollingAverageWeight(range.slice(0, -7), 7);
    const avg30Prior = rollingAverageWeight(range.slice(0, -30), 30);
    const weeklyChangeKg = avg7 != null && avg7Prior != null ? Math.round((avg7 - avg7Prior) * 10) / 10 : null;
    const monthlyChangeKg = avg30 != null && avg30Prior != null ? Math.round((avg30 - avg30Prior) * 10) / 10 : null;

    return { unit: settings.units, latest, avg7, avg30, weeklyChangeKg, monthlyChangeKg, recent: [...range].reverse().slice(0, 14) };
  }, []);
}

export default function WeightPage() {
  const router = useRouter();
  const data = useWeightData();
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [editBodyFat, setEditBodyFat] = useState(0);

  if (!data) return <div className="p-5 pt-[calc(1.5rem+var(--safe-top))] text-sm text-text-muted">Loading…</div>;

  const { unit } = data;

  function openEdit(date: string, weightKg: number | null, bodyFatPercent?: number | null) {
    setEditDate(date);
    setEditValue(weightKg != null ? kgToDisplay(weightKg, unit) : 70);
    setEditBodyFat(bodyFatPercent ?? 0);
  }

  async function saveEdit() {
    if (!editDate) return;
    await upsertBodyWeight(editDate, displayToKg(editValue, unit), null, editBodyFat > 0 ? editBodyFat : null);
    setEditDate(null);
  }

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))]">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="text-2xl font-bold tracking-tight">Body Weight</div>

      <Card>
        <CardLabel>Today</CardLabel>
        <div className="mt-2">
          <NumberStepper
            value={data.latest?.date === todayStr() ? kgToDisplay(data.latest.weightKg, unit) : kgToDisplay(data.latest?.weightKg ?? 70, unit)}
            onChange={(v) => upsertBodyWeight(todayStr(), displayToKg(v, unit), null)}
            step={0.1}
            decimals={1}
            suffix={unit}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <CardLabel>7-day avg</CardLabel>
          <div className="mt-1 text-lg font-bold">{data.avg7 != null ? kgToDisplay(data.avg7, unit) : "—"}</div>
        </Card>
        <Card className="text-center">
          <CardLabel>30-day avg</CardLabel>
          <div className="mt-1 text-lg font-bold">{data.avg30 != null ? kgToDisplay(data.avg30, unit) : "—"}</div>
        </Card>
        <Card className="text-center">
          <CardLabel>Weekly trend</CardLabel>
          <div className={`mt-1 text-lg font-bold ${data.weeklyChangeKg != null && data.weeklyChangeKg < 0 ? "text-success" : ""}`}>
            {data.weeklyChangeKg != null ? `${data.weeklyChangeKg > 0 ? "+" : ""}${kgToDisplay(data.weeklyChangeKg, unit)}` : "—"}
          </div>
        </Card>
        <Card className="text-center">
          <CardLabel>Monthly trend</CardLabel>
          <div className={`mt-1 text-lg font-bold ${data.monthlyChangeKg != null && data.monthlyChangeKg < 0 ? "text-success" : ""}`}>
            {data.monthlyChangeKg != null ? `${data.monthlyChangeKg > 0 ? "+" : ""}${kgToDisplay(data.monthlyChangeKg, unit)}` : "—"}
          </div>
        </Card>
      </div>

      <p className="px-0.5 text-xs text-text-muted">
        Daily weight naturally fluctuates with water and food. Trust the rolling average over any single day.
      </p>

      <div>
        <CardLabel>Recent Entries</CardLabel>
        <div className="mt-2 flex flex-col gap-1.5">
          {data.recent.map((entry) => (
            <button
              key={entry.date}
              onClick={() => openEdit(entry.date, entry.weightKg, entry.bodyFatPercent)}
              className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm active:brightness-95"
            >
              <span className="text-text-muted">{formatShortDate(entry.date)}</span>
              <span className="flex items-center gap-2 font-medium">
                {kgToDisplay(entry.weightKg, unit)} {unit}
                {entry.bodyFatPercent != null && <span className="text-text-muted">· {entry.bodyFatPercent}% BF</span>}
                <Pencil size={13} className="text-text-faint" />
              </span>
            </button>
          ))}
          {data.recent.length === 0 && <p className="text-sm text-text-muted">No entries yet.</p>}
        </div>
      </div>

      <button
        onClick={() => openEdit(todayStr(), data.latest?.weightKg ?? null, data.latest?.bodyFatPercent)}
        className="text-sm font-medium text-accent"
      >
        + Add / edit an entry
      </button>

      <BottomSheet open={editDate != null} onClose={() => setEditDate(null)} title={editDate ? formatShortDate(editDate) : ""}>
        <div className="pb-4">
          <div className="mb-1 text-xs text-text-muted">Weight</div>
          <NumberStepper value={editValue} onChange={setEditValue} step={0.1} decimals={1} suffix={unit} />
          <div className="mt-3 mb-1 text-xs text-text-muted">Body fat % (optional, only if your scale reads it)</div>
          <NumberStepper value={editBodyFat} onChange={setEditBodyFat} step={0.5} decimals={1} suffix="%" size="md" />
          <Button fullWidth size="lg" className="mt-4" onClick={saveEdit}>
            Save
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
