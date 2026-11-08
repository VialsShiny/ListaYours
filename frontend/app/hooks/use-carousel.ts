"use client";

import { useCallback, useRef } from "react";

/**
 * Scrolls a horizontal scroller by exactly one card (first child width + gap),
 * wrapping back to the start once the end is reached.
 */
export function useCarousel() {
  const scrollerRef = useRef<HTMLUListElement | null>(null);

  const slide = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const first = scroller.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(scroller).columnGap || "0") || 0;
    const step = first ? first.getBoundingClientRect().width + gap : scroller.clientWidth * 0.8;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left: atEnd ? 0 : scroller.scrollLeft + step,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  return { scrollerRef, slide };
}
