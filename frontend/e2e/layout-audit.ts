export type Failure = { rule: string; target: string; detail: string };

export type AuditOptions = { minBody: number; minSecondary: number; minTarget: number };

/**
 * Runs inside the page: fails on horizontal page scroll, clipped overflow, a title word wider
 * than its box, text under the minimum sizes, and interactive targets under 44px.
 * Self-contained on purpose: Playwright serialises it with `page.evaluate`.
 */
export function auditLayout(options: AuditOptions): Failure[] {
  const failures: Failure[] = [];
  const root = document.documentElement;
  const describe = (el: Element): string => {
    const id = el.id ? `#${el.id}` : "";
    const cls = el.classList.length ? `.${Array.from(el.classList).slice(0, 3).join(".")}` : "";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls} « ${text} »`;
  };
  const visible = (el: Element): boolean => {
    if (el.closest("[hidden], .sr-only, [data-audit-skip]")) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  };

  if (root.scrollWidth > window.innerWidth) {
    const culprits = Array.from(document.querySelectorAll("body *"))
      .filter((el) => visible(el) && el.getBoundingClientRect().right > window.innerWidth + 1)
      .filter(
        (el) =>
          !Array.from(el.children).some(
            (c) => c.getBoundingClientRect().right > window.innerWidth + 1,
          ),
      )
      .slice(0, 4)
      .map(describe);
    failures.push({
      rule: "page-overflow",
      target: "html",
      detail: `scrollWidth ${root.scrollWidth} > innerWidth ${window.innerWidth}; ${culprits.join(" | ")}`,
    });
  }

  for (const el of Array.from(document.querySelectorAll("body *"))) {
    if (!visible(el) || el.hasAttribute("data-overflow-ok")) continue;
    const style = getComputedStyle(el);
    const clips = /hidden|clip/.test(style.overflowX);
    const ellipsis = style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
    if (clips && !ellipsis && el.scrollWidth > el.clientWidth + 1) {
      failures.push({
        rule: "clipped-overflow",
        target: describe(el),
        detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`,
      });
    }
  }

  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;top:0;left:0";
  document.body.appendChild(probe);
  for (const el of Array.from(document.querySelectorAll("h1, h2, .display"))) {
    if (!visible(el) || el.closest("[aria-hidden='true'], .display-user, .navigator-title"))
      continue;
    const style = getComputedStyle(el);
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.fontStyle = style.fontStyle;
    probe.style.letterSpacing = style.letterSpacing;
    probe.style.textTransform = style.textTransform;
    const box = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const words = (el.textContent ?? "").split(/\s+/).filter(Boolean);
    for (const word of words) {
      probe.textContent = word;
      const width = probe.getBoundingClientRect().width;
      if (width > box + 0.5) {
        failures.push({
          rule: "word-too-wide",
          target: describe(el),
          detail: `« ${word} » ${Math.round(width)}px > ${Math.round(box)}px at ${style.fontSize}`,
        });
      }
    }
  }
  probe.remove();

  const SECONDARY =
    '.text-small, .text-secondary, .text-micro, [class*="text-[1"], .eyebrow, .index-tag, [class*="field-"], .navigator-counter, .wordmark';
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const hasText = Array.from(el.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "",
    );
    if (!hasText || !visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < options.minSecondary) {
      failures.push({ rule: "text-too-small", target: describe(el), detail: `${size}px` });
    } else if (
      size < options.minBody &&
      /^(P|LI|DD)$/.test(el.tagName) &&
      !el.closest(SECONDARY) &&
      !el.closest("button, a, label, .notice, .navigator-bar, .btn")
    ) {
      failures.push({ rule: "body-text-small", target: describe(el), detail: `${size}px` });
    }
  }

  const targets = document.querySelectorAll(
    "a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch]",
  );
  for (const el of Array.from(targets)) {
    if (!visible(el) || el.getAttribute("tabindex") === "-1") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height < options.minTarget - 0.5 || rect.width < options.minTarget - 0.5) {
      failures.push({
        rule: "target-too-small",
        target: describe(el),
        detail: `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
      });
    }
  }

  return failures;
}
