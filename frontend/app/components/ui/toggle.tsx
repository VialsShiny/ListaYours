"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  size?: "md" | "sm";
  labelHidden?: boolean;
  className?: string;
};

/**
 * Switch-styled checkbox: a real `<input type="checkbox">` keeps native keyboard and form behaviour.
 */
export function Toggle({
  id,
  label,
  checked,
  onChange,
  hint,
  disabled,
  size = "md",
  labelHidden = false,
  className,
}: ToggleProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={hintId}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="toggle-input peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        />
        <span aria-hidden="true" className={cn("toggle-track", size === "sm" && "toggle-sm")}>
          <span className="toggle-knob" />
        </span>
      </span>
      <span className={cn("flex min-w-0 flex-col gap-0.5", labelHidden && "sr-only")}>
        <label htmlFor={id} className="cursor-pointer text-[14px] font-medium text-ink">
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="field-help">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}
