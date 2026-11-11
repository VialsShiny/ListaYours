"use client";

import { voice } from "@/content/voice";
import { useTheme } from "@/hooks/use-theme";
import { THEME_SETTINGS } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeSwitchProps = { className?: string };

/**
 * Three-way segmented control (system, light, dark) with 44px targets.
 */
export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const [setting, setTheme] = useTheme();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span id="theme-switch-label" className="field-label">
        {voice.theme.label}
      </span>
      <div role="group" aria-labelledby="theme-switch-label" className="segmented theme-switch">
        {THEME_SETTINGS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={setting === option}
            onClick={() => setTheme(option)}
          >
            {voice.theme[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
