import clsx from "clsx";

export function ProgressBar({ value, max, className, colorClass = "bg-accent" }: { value: number; max: number; className?: string; colorClass?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={clsx("h-2 w-full rounded-full bg-surface-2 overflow-hidden", className)}>
      <div className={clsx("h-full rounded-full transition-[width] duration-300", colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}
