import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type GiftPhotoProps = {
  src: string | null | undefined;
  alt: string;
  reserved?: boolean;
  className?: string;
};

/**
 * 4:5 product media on the `--surface-2` tone. Inside a `.card[data-reserved="true"]` the image
 * is desaturated by the theme; the "Réservé" badge carries the same information in text.
 */
export function GiftPhoto({ src, alt, reserved = false, className }: GiftPhotoProps) {
  return (
    <div className={cn("card-media relative", className)}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        <div
          className="flex size-full items-center justify-center text-ink-soft"
          aria-hidden="true"
        >
          <Gift className="size-12" strokeWidth={1.25} />
        </div>
      )}
      {reserved ? (
        <span className="badge badge-reserved absolute top-3 left-3">Réservé</span>
      ) : null}
    </div>
  );
}
