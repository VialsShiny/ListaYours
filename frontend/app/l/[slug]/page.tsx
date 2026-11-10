import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { WishlistHeaderSkeleton } from "@/components/wishlist/WishlistHeaderSkeleton";

type PageProps = { params: { slug: string } };

export function generateMetadata({ params }: PageProps): Metadata {
  return { title: `Liste ${params.slug}` };
}

export default function PublicWishlistPage({ params }: PageProps) {
  return (
    <Suspense fallback={<WishlistHeaderSkeleton />}>
      <WishlistView slug={params.slug} />
    </Suspense>
  );
}
