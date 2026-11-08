import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type GiftPhotoProps = {
  src: string | null | undefined;
  alt: string;
  reserved?: boolean;
  restGrey?: boolean;
  className?: string;
};

/**
 * 3:4 portrait photo with a `--surface-alt` placeholder. Greyscale at rest only on hover-capable
 * devices (`restGrey`), desaturated at 55% opacity with a black tag when `reserved`.
 */
export function GiftPhoto({
  src,
  alt,
  reserved = false,
  restGrey = true,
  className,
}: GiftPhotoProps) {
  return (
    <div
      className={cn(
        "photo relative aspect-[3/4] w-full overflow-hidden bg-surface-alt",
        restGrey && !reserved && "photo-rest-grey",
        reserved && "photo-reserved",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-block" aria-hidden="true">
          <Gift className="size-12" strokeWidth={1.25} />
        </div>
      )}
      {reserved ? (
        <span className="micro absolute top-4 left-4 bg-ink px-3 py-2 text-white">Réservé</span>
      ) : null}
    </div>
  );
}
