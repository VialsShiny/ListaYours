import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

type PageProps = { params: { slug: string } };

export function generateMetadata({ params }: PageProps): Metadata {
  return { title: `Liste ${params.slug}` };
}

export default function PublicWishlistPage({ params }: PageProps) {
  return <WishlistView slug={params.slug} />;
}
