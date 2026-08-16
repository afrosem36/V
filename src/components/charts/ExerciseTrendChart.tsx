import type { ExerciseHistoryPoint } from "@/lib/db/repo/analytics";
import { formatShortDate } from "@/lib/utils/date";

const WIDTH = 100;
const HEIGHT = 70;

export function ExerciseTrendChart({ points }: { points: ExerciseHistoryPoint[] }) {
  if (points.length < 2) {
    return <div className="py-6 text-center text-xs text-text-muted">Log a couple more sessions to see a trend.</div>;
  }

  const values = points.map((p) => p.bestWeightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = WIDTH / (points.length - 1);
  const pad = 10;

  const toY = (v: number) => HEIGHT - pad - ((v - min) / range) * (HEIGHT - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(2)} ${toY(p.bestWeightKg).toFixed(2)}`).join(" ");

  const last = points[points.length - 1];
  const lastX = (points.length - 1) * stepX;
  const lastY = toY(last.bestWeightKg);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={4} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-faint">
        <span>{formatShortDate(points[0].date)}</span>
        <span className="font-semibold text-text-muted">
          {last.bestWeightKg}kg × {last.bestSetReps} · {formatShortDate(last.date)}
        </span>
      </div>
    </div>
  );
}
