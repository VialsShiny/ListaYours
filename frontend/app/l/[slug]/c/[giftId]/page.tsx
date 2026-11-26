import type { Metadata } from "next";
import { Suspense } from "react";
import { GiftDetailView } from "@/components/wishlist/detail/GiftDetailView";

type PageProps = { params: Promise<{ slug: string; giftId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Liste ${slug}` };
}

export default async function GiftDetailPage({ params }: PageProps) {
  const { slug, giftId } = await params;
  return (
    <Suspense fallback={null}>
      <GiftDetailView slug={slug} giftId={giftId} />
    </Suspense>
  );
}
