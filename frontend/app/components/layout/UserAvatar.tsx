import { voice } from "@/content/voice";
import { initialOf } from "@/lib/identity";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  src: string | null;
  size?: "sm" | "md" | "xl";
  described?: boolean;
  className?: string;
};

/**
 * Round picture, or the pseudo's initial on the tile grey when there is none.
 * Decorative by default (the pseudo is always written next to it); `described` adds an accessible name.
 */
export function UserAvatar({
  name,
  src,
  size = "sm",
  described = false,
  className,
}: UserAvatarProps) {
  const classes = cn("avatar", `avatar-${size}`, className);
  if (src) {
    return (
      <span className={classes}>
        <img src={src} alt={described ? voice.account.avatarAlt(name) : ""} />
      </span>
    );
  }
  return (
    <span
      className={classes}
      role={described ? "img" : undefined}
      aria-label={described ? voice.account.initialAlt(name) : undefined}
      aria-hidden={described ? undefined : true}
    >
      {initialOf(name)}
    </span>
  );
}
