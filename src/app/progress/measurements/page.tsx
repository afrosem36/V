"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Button } from "@/components/ui/Button";
import { upsertBodyMeasurement, getAllBodyMeasurements } from "@/lib/db/repo/body";
import { todayStr, formatShortDate } from "@/lib/utils/date";

export default function MeasurementsPage() {
  const router = useRouter();
  const all = useLiveQuery(() => getAllBodyMeasurements(), []);
  const latest = all?.[all.length - 1];

  const [waist, setWaist] = useState(0);
  const [chest, setChest] = useState(0);
  const [arms, setArms] = useState(0);
  const [thighs, setThighs] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const [saved, setSaved] = useState(false);

  if (latest && !seeded) {
    setWaist(latest.waistCm ?? 0);
    setChest(latest.chestCm ?? 0);
    setArms(latest.armsCm ?? 0);
    setThighs(latest.thighsCm ?? 0);
    setSeeded(true);
  }

  async function save() {
    await upsertBodyMeasurement(todayStr(), { waistCm: waist || null, chestCm: chest || null, armsCm: arms || null, thighsCm: thighs || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4 p-5 pt-[calc(1.5rem+var(--safe-top))] pb-10">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="text-2xl font-bold tracking-tight">Body Measurements</div>
      <p className="text-xs text-text-muted">Optional — secondary to your workout tracking. All values in cm.</p>

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <CardLabel>Waist</CardLabel>
            <NumberStepper value={waist} onChange={setWaist} step={0.5} decimals={1} size="md" />
          </div>
          <div>
            <CardLabel>Chest</CardLabel>
            <NumberStepper value={chest} onChange={setChest} step={0.5} decimals={1} size="md" />
          </div>
          <div>
            <CardLabel>Arms</CardLabel>
            <NumberStepper value={arms} onChange={setArms} step={0.5} decimals={1} size="md" />
          </div>
          <div>
            <CardLabel>Thighs</CardLabel>
            <NumberStepper value={thighs} onChange={setThighs} step={0.5} decimals={1} size="md" />
          </div>
        </div>
        <Button fullWidth className="mt-4" onClick={save}>
          {saved ? "Saved" : `Save for ${formatShortDate(todayStr())}`}
        </Button>
      </Card>

      {all && all.length > 0 && (
        <div>
          <CardLabel>History</CardLabel>
          <div className="mt-2 flex flex-col gap-1.5">
            {[...all].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm">
                <span className="text-text-muted">{formatShortDate(m.date)}</span>
                <span className="font-medium">
                  W {m.waistCm ?? "—"} · C {m.chestCm ?? "—"} · A {m.armsCm ?? "—"} · T {m.thighsCm ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
