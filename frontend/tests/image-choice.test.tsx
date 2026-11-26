import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageChoice } from "@/components/dashboard/ImageChoice";

const urls = [
  "https://cdn.example/1.jpg",
  "https://cdn.example/2.jpg",
  "https://cdn.example/3.jpg",
];

describe("ImageChoice", () => {
  it("renders one radio per safe image, the current one checked and focusable", () => {
    const html = renderToStaticMarkup(
      <ImageChoice
        candidates={[...urls, "javascript:alert(1)"]}
        value={urls[1]}
        onChange={() => {}}
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(html).toContain('aria-checked="true" aria-label="Image 2 sur 3" tabindex="0"');
    expect(html).toContain('aria-checked="false" aria-label="Image 1 sur 3" tabindex="-1"');
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Choisis l&#x27;image du cadeau");
  });

  it("renders nothing with fewer than two candidates", () => {
    expect(
      renderToStaticMarkup(<ImageChoice candidates={[urls[0]]} value="" onChange={() => {}} />),
    ).toBe("");
  });
});
