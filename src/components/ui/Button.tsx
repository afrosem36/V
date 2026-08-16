import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground active:brightness-90",
  secondary: "bg-surface-2 text-text border border-border active:brightness-90",
  ghost: "bg-transparent text-text active:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/30 active:bg-danger/25",
};

const sizeClasses: Record<Size, string> = {
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-[filter,opacity] select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        disabled && "opacity-40 pointer-events-none",
        className
      )}
      {...props}
    />
  );
});
