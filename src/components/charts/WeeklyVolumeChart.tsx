import type { WeeklyVolume } from "@/lib/db/repo/analytics";

const HEIGHT = 120;
const BAR_MAX_WIDTH = 22;

export function WeeklyVolumeChart({ data }: { data: WeeklyVolume[] }) {
  const max = Math.max(1, ...data.map((d) => d.volume));
  const width = 100;
  const gap = width / data.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, gap * 0.55);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} preserveAspectRatio="none">
        <line x1={0} y1={HEIGHT - 1} x2={width} y2={HEIGHT - 1} stroke="var(--color-border)" strokeWidth={1} />
        {data.map((d, i) => {
          const barHeight = (d.volume / max) * (HEIGHT - 16);
          const x = i * gap + (gap - barWidth) / 2;
          const y = HEIGHT - 1 - barHeight;
          const isLast = i === data.length - 1;
          return (
            <g key={d.weekStart}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx={3}
                fill={isLast ? "var(--color-accent)" : "var(--color-surface-2)"}
              >
                <title>
                  {d.label}: {d.volume.toLocaleString()}kg
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-faint">
        <span>{data[0]?.label}</span>
        <span className="font-semibold text-text-muted">
          This week: {data[data.length - 1]?.volume.toLocaleString() ?? 0}kg
        </span>
      </div>
    </div>
  );
}
