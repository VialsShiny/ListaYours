import { formatCounter } from "@/lib/format";

/**
 * Huge rotated gift count ("012"), desktop only. The accessible count is given in text.
 */
export function GiftCounter({ count }: { count: number }) {
  return (
    <div className="hidden md:flex md:flex-col md:items-end md:justify-between md:gap-6">
      <p className="micro text-ink-soft">
        {count} {count > 1 ? "cadeaux" : "cadeau"}
      </p>
      <p
        aria-hidden="true"
        className="vertical-label display text-ink/90"
        style={{ fontSize: "clamp(6rem, 14vw, 13rem)", lineHeight: 0.85 }}
      >
        {formatCounter(count)}
      </p>
    </div>
  );
}
