import clsx from "clsx";

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  size?: "md" | "lg";
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, size = "lg" }: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex-1 rounded-xl border font-semibold transition-colors",
              size === "lg" ? "h-14 text-base" : "h-10 text-sm",
              active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface-2 text-text-muted active:brightness-90"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
