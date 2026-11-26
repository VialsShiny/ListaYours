"use client";

import { voice } from "@/content/voice";
import { imageCandidates } from "@/lib/gift-prefill";
import { cn } from "@/lib/utils";

type ImageChoiceProps = {
  candidates: string[];
  value: string;
  onChange: (url: string) => void;
};

/**
 * Thumbnails of the images a scrape found, as a radio group: picking one fills the image URL field.
 * Hidden when there is fewer than two candidates, since the first one is already prefilled.
 */
export function ImageChoice({ candidates, value, onChange }: ImageChoiceProps) {
  const urls = imageCandidates(candidates);
  if (urls.length < 2) return null;
  const labels = voice.dashboard.gifts.imageChoice;
  const selected = urls.includes(value) ? value : null;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="field-help">{labels.legend}</legend>
      <div role="radiogroup" aria-label={labels.legend} className="flex flex-wrap gap-2">
        {urls.map((url, index) => {
          const checked = url === selected;
          const focusable = checked || (selected === null && index === 0);
          return (
            <button
              key={url}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={labels.option(index + 1, urls.length)}
              tabIndex={focusable ? 0 : -1}
              onClick={() => onChange(url)}
              onKeyDown={(event) => {
                const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                if (step === undefined) return;
                event.preventDefault();
                const next = urls[(index + step + urls.length) % urls.length];
                onChange(next);
                (
                  event.currentTarget.parentElement?.children[urls.indexOf(next)] as HTMLElement
                )?.focus();
              }}
              className={cn(
                "h-16 w-16 overflow-hidden rounded-[12px] border-2 bg-bg transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                checked ? "border-ink" : "border-line hover:border-ink/40",
              )}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
