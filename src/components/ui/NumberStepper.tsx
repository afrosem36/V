"use client";

import { Minus, Plus } from "lucide-react";
import clsx from "clsx";

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
  quickSteps?: number[];
  size?: "md" | "lg";
}

function round(v: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

export function NumberStepper({
  value,
  onChange,
  step,
  min = 0,
  max = 999,
  suffix,
  decimals = 1,
  quickSteps,
  size = "lg",
}: NumberStepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, round(v, decimals)));

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className={clsx(
            "flex items-center justify-center rounded-xl bg-surface-2 border border-border active:brightness-90 shrink-0",
            size === "lg" ? "h-14 w-14" : "h-11 w-11"
          )}
          aria-label="Decrease"
        >
          <Minus size={20} />
        </button>

        <div
          className={clsx(
            "flex flex-1 min-w-0 items-center justify-center gap-1 rounded-xl bg-surface-2 border border-border",
            size === "lg" ? "h-14" : "h-11"
          )}
        >
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(Number.isFinite(v) ? clamp(v) : min);
            }}
            className={clsx(
              "min-w-0 flex-1 basis-0 bg-transparent text-center font-bold tabular-nums",
              size === "lg" ? "text-2xl" : "text-lg"
            )}
          />
          {suffix && <span className="shrink-0 pr-3 text-sm text-text-muted">{suffix}</span>}
        </div>

        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className={clsx(
            "flex items-center justify-center rounded-xl bg-surface-2 border border-border active:brightness-90 shrink-0",
            size === "lg" ? "h-14 w-14" : "h-11 w-11"
          )}
          aria-label="Increase"
        >
          <Plus size={20} />
        </button>
      </div>

      {quickSteps && quickSteps.length > 0 && (
        <div className="mt-2 flex gap-2">
          {quickSteps.map((qs) => (
            <button
              key={qs}
              type="button"
              onClick={() => onChange(clamp(value + qs))}
              className="h-9 flex-1 rounded-lg bg-surface-2 border border-border text-xs font-medium text-text-muted active:brightness-90"
            >
              +{qs}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
