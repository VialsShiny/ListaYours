import { Gift } from "lucide-react";
import { safeHttpUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

type GiftPhotoProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

/**
 * Square product media on the `--tile` surface, image contained with padding. Only http(s)
 * sources are rendered; anything else shows the placeholder.
 * Inside a `.card[data-reserved="true"]` the theme lowers the image to 45% opacity.
 */
export function GiftPhoto({ src, alt, className }: GiftPhotoProps) {
  const safeSrc = safeHttpUrl(src);
  return (
    <div className={cn("card-media", className)}>
      {safeSrc ? (
        <img src={safeSrc} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        <div className="flex size-full items-center justify-center text-soft" aria-hidden="true">
          <Gift className="size-12" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
