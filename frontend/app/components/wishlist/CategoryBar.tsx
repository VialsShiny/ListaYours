import { voice } from "@/content/voice";
import type { GiftGroup } from "@/lib/wishlist-groups";

type CategoryBarProps = {
  groups: Array<Pick<GiftGroup<unknown>, "anchor" | "name" | "gifts">>;
};

/**
 * Sticky translucent bar of category anchors with their gift count (grid view).
 */
export function CategoryBar({ groups }: CategoryBarProps) {
  if (groups.length === 0) return null;
  return (
    <nav
      aria-label={voice.list.categories}
      className="material sticky-top -mx-1 flex gap-2 overflow-x-auto rounded-[24px] p-3 [scrollbar-width:none] md:flex-wrap"
    >
      {groups.map((group) => (
        <a key={group.anchor} href={`#${group.anchor}`} className="chip shrink-0">
          {group.name}
          <small>{group.gifts.length}</small>
        </a>
      ))}
    </nav>
  );
}
