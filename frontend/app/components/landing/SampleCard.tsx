"use client";

import Link from "next/link";
import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { useAsync } from "@/hooks/use-async";
import { fetchPublicWishlist } from "@/lib/api-public";
import { cn } from "@/lib/utils";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";

type SampleCardProps = { slug: string | null; className?: string };

/**
 * Floating sample card showing the first gift of the published list, as a visitor would see it.
 * Renders nothing when there is no list to show.
 */
export function SampleCard({ slug, className }: SampleCardProps) {
  const state = useAsync(
    (signal) => fetchPublicWishlist(slug ?? "", null, signal),
    slug ?? "none",
    Boolean(slug),
  );
  const groups = state.data
    ? groupGiftsByCategory(state.data.categories, state.data.gifts, { dropEmpty: true })
    : [];
  const first = groups[0];
  const gift = first?.gifts[0];

  if (!slug || (!state.loading && !gift)) return null;

  return (
    <div
      className={cn("panel panel-elevated flex flex-col gap-3 p-4", className)}
      aria-hidden="true"
    >
      {gift && first ? (
        <>
          <GiftPhoto src={gift.image_url} alt="" className="aspect-[3/2] rounded-[16px]" />
          <p className="eyebrow eyebrow-accent text-micro tracking-[0.1em]">{first.name}</p>
          <div className="flex items-baseline justify-between gap-3">
            <p className="display-card min-w-0 truncate text-lead">{gift.name}</p>
            <GiftPrice price={gift.price} currency={gift.currency} className="shrink-0" />
          </div>
          <Link href={`/l/${slug}`} className="btn btn-primary btn-sm" tabIndex={-1}>
            Réserver
          </Link>
        </>
      ) : (
        <>
          <div className="skeleton aspect-[3/2] rounded-[16px]" />
          <div className="skeleton h-3 w-24 rounded-md" />
          <div className="skeleton h-5 w-3/4 rounded-md" />
          <div className="skeleton h-11 rounded-full" />
        </>
      )}
    </div>
  );
}
