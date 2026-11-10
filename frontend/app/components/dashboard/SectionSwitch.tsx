"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/segmented";

type SectionSwitchProps = {
  sections: Array<{ id: string; label: string }>;
  ready: boolean;
};

/**
 * Anchor links to the dashboard sections; the sliding pill follows the section in view once
 * the sections are rendered (`ready`).
 */
export function SectionSwitch({ sections, ready }: SectionSwitchProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!ready || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const index = sections.findIndex((section) => section.id === visible.target.id);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sections, ready]);

  return (
    <Segmented
      aria-label="Sections du tableau de bord"
      count={sections.length}
      activeIndex={active}
      className="section-switch"
    >
      {sections.map((section, index) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={index === active ? "true" : undefined}
          onClick={() => setActive(index)}
        >
          {section.label}
        </a>
      ))}
    </Segmented>
  );
}
