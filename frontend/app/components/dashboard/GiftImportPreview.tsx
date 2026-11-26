import { voice } from "@/content/voice";
import type { GiftImportResult } from "@/lib/types";

type GiftImportPreviewProps = { result: GiftImportResult };

/**
 * What a dry run found: how many gifts would be added, the categories that do not exist yet,
 * and every row the API refused, so the owner can fix the file before anything is written.
 */
export function GiftImportPreview({ result }: GiftImportPreviewProps) {
  const t = voice.dashboard.gifts.import;
  return (
    <div className="flex flex-col gap-6">
      <p className="display display-sub">
        {result.valid_rows > 0 ? t.ready(result.valid_rows) : t.nothing}
      </p>
      {result.categories_to_create.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-secondary text-soft">{t.categories}</p>
          <ul className="flex flex-wrap gap-2">
            {result.categories_to_create.map((name) => (
              <li key={name} className="rounded-full border border-line px-3 py-1.5">
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.errors.length > 0 ? (
        <div className="flex flex-col gap-2" data-testid="import-errors">
          <p className="font-semibold text-accent">{t.errorsTitle(result.errors.length)}</p>
          <ul className="flex flex-col divide-y divide-line">
            {result.errors.map((error, index) => (
              <li key={`${error.row}-${index}`} className="flex gap-3 py-3">
                <span className="index-tag shrink-0 pt-0.5">{t.rowLabel(error.row)}</span>
                <span className="min-w-0 break-words">
                  {error.field ? <span className="text-secondary">{error.field} · </span> : null}
                  {error.message}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-secondary text-soft">{t.fixFirst}</p>
        </div>
      ) : null}
    </div>
  );
}
