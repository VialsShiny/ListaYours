import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { WishlistHeaderSkeleton } from "@/components/wishlist/WishlistHeaderSkeleton";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Liste ${slug}` };
}

export default async function PublicWishlistPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <Suspense fallback={<WishlistHeaderSkeleton />}>
      <WishlistView slug={slug} />
    </Suspense>
  );
}
