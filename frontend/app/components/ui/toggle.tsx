"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Switch-styled checkbox: a real `<input type="checkbox">` keeps native keyboard and form behaviour.
 */
export function Toggle({ id, label, checked, onChange, hint, disabled, className }: ToggleProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={hintId}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-ink bg-white transition-colors duration-200 peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:opacity-45"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 left-1 size-4 rounded-full bg-ink transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-white"
        />
      </span>
      <span className="flex flex-col gap-1">
        <label htmlFor={id} className="micro cursor-pointer text-ink">
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="text-xs text-ink-soft">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}
