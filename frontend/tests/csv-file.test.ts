import { describe, expect, it } from "vitest";
import { voice } from "@/content/voice";
import { CSV_MAX_CHARS, checkCsvFile, decodeCsv, readCsvFile } from "@/lib/csv-file";

const t = voice.dashboard.gifts.import;

describe("checkCsvFile", () => {
  it("accepts .csv and .txt whatever the case, refuses the rest", () => {
    expect(checkCsvFile({ name: "cadeaux.csv" })).toBeNull();
    expect(checkCsvFile({ name: "CADEAUX.TXT" })).toBeNull();
    expect(checkCsvFile({ name: "cadeaux.xlsx" })).toBe(t.wrongType);
    expect(checkCsvFile({ name: "csv" })).toBe(t.wrongType);
  });
});

describe("decodeCsv", () => {
  it("reads UTF-8 and drops the BOM", () => {
    const bytes = new TextEncoder().encode("\uFEFFnom;prix\nBonnet é;12,50\n");
    expect(decodeCsv(bytes)).toBe("nom;prix\nBonnet é;12,50\n");
  });

  it("falls back to windows-1252 when the bytes are not UTF-8", () => {
    const bytes = new Uint8Array([0x6e, 0x6f, 0x6d, 0x0a, 0x63, 0x61, 0x66, 0xe9, 0x0a]);
    expect(decodeCsv(bytes)).toBe("nom\ncafé\n");
  });

  it("keeps the euro sign of windows-1252 files", () => {
    expect(decodeCsv(new Uint8Array([0x31, 0x32, 0x20, 0x80]))).toBe("12 €");
  });

  it("maps the typographic punctuation Excel writes in the 0x80-0x9F range", () => {
    const bytes = new Uint8Array([0x6c, 0x92, 0x9c, 0x75, 0x66, 0x85, 0x93, 0x61, 0x94]);
    expect(decodeCsv(bytes)).toBe("l’œuf…“a”");
  });
});

describe("readCsvFile", () => {
  it("returns the decoded text of a valid file", async () => {
    const file = new File(["\uFEFFnom,prix\nBonnet,12\n"], "cadeaux.csv", { type: "text/csv" });
    await expect(readCsvFile(file)).resolves.toBe("nom,prix\nBonnet,12\n");
  });

  it("refuses the wrong extension before reading", async () => {
    const file = new File(["nom\n"], "cadeaux.pdf");
    await expect(readCsvFile(file)).rejects.toThrow(t.wrongType);
  });

  it("refuses files over the character limit", async () => {
    const file = new File(["nom\n" + "a".repeat(CSV_MAX_CHARS)], "gros.csv");
    await expect(readCsvFile(file)).rejects.toThrow(t.tooBig);
  });
});
