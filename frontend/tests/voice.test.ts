import { describe, expect, it } from "vitest";
import { voice } from "@/content/voice";

type Line = { path: string; text: string };

const SAMPLE_ARGS = ["Bonnet", 7, "12 mars 2026"];

/**
 * Flattens every string of the voice module, calling functions with a sample argument.
 */
function collect(value: unknown, path: string, out: Line[]): Line[] {
  if (typeof value === "string") out.push({ path, text: value });
  else if (typeof value === "function") {
    for (const arg of SAMPLE_ARGS) {
      try {
        const text: unknown = (value as (input: unknown) => unknown)(arg);
        if (typeof text === "string") out.push({ path, text });
      } catch {
        continue;
      }
    }
  } else if (Array.isArray(value)) value.forEach((item, i) => collect(item, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) collect(item, `${path}.${key}`, out);
  }
  return out;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9À-ÿœ]/.test(token)).length;
}

const lines = collect(voice, "voice", []);

const PITCH =
  /cr[ée]ez votre liste|rejoignez|gratuit|fonctionnalit|commencer maintenant|propuls[ée] par|font confiance|inscrivez-vous|cr[ée]er (ma|votre) liste/i;

describe("voice", () => {
  it("collects every screen", () => {
    expect(new Set(lines.map((line) => line.path)).size).toBeGreaterThan(120);
  });

  it("speaks to one person with « tu », never « vous »", () => {
    const formal = lines.filter((line) => /\b(vous|votre|vos)\b/i.test(line.text));
    expect(formal.map((line) => line.path)).toEqual([]);
  });

  it("contains no product pitch", () => {
    const pitch = lines.filter((line) => PITCH.test(line.text));
    expect(pitch.map((line) => line.path)).toEqual([]);
  });

  it("keeps every line short (12 words at most, assistive instructions aside)", () => {
    const long = lines.filter(
      (line) => !/\.(instructions|hold)$/.test(line.path) && countWords(line.text) > 12,
    );
    expect(long.map((line) => `${line.path}: ${line.text}`)).toEqual([]);
  });

  it("lists the only placeholder the owner has to fill", () => {
    const placeholders = new Set(lines.flatMap((line) => line.text.match(/\[[A-ZÉ]+\]/g) ?? []));
    expect(Array.from(placeholders)).toEqual(["[PRÉNOM]"]);
  });
});
