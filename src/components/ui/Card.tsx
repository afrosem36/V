import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-2xl border border-border bg-surface p-4", className)} {...props} />;
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("text-xs font-medium uppercase tracking-wide text-text-muted", className)} {...props} />;
}
