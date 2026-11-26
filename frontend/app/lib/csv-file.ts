import { voice } from "@/content/voice";

export const CSV_MAX_CHARS = 1_000_000;
const EXTENSIONS = [".csv", ".txt"];
const BOM = "\uFEFF";
const C1_START = 0x80;
const C1_END = 0x9f;
const WINDOWS_1252_C1 = "€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ";

/**
 * Client-side check of a picked file: only the extension, since browsers report CSV MIME types
 * inconsistently (`text/csv`, `application/vnd.ms-excel`, or nothing at all).
 */
export function checkCsvFile(file: { name: string }): string | null {
  const name = file.name.toLowerCase();
  if (!EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return voice.dashboard.gifts.import.wrongType;
  }
  return null;
}

/**
 * Runtimes built without full ICU data (some Node builds) decode the `windows-1252` label as plain
 * Latin-1, leaving C1 control characters where Excel wrote €, ’, œ or …; browsers never do. The
 * 0x80–0x9F range is remapped here so the result is the same everywhere.
 */
function decodeWindows1252(bytes: ArrayBuffer | Uint8Array): string {
  const text = new TextDecoder("windows-1252").decode(bytes);
  return text.replace(/[\u0080-\u009f]/g, (char) => {
    const code = char.charCodeAt(0);
    return code >= C1_START && code <= C1_END ? WINDOWS_1252_C1[code - C1_START] : char;
  });
}

/**
 * Decodes the bytes as UTF-8 when they are valid UTF-8, otherwise as windows-1252, which is what
 * Excel on Windows writes by default. The BOM Excel adds is dropped either way.
 */
export function decodeCsv(bytes: ArrayBuffer | Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = decodeWindows1252(bytes);
  }
  return text.startsWith(BOM) ? text.slice(1) : text;
}

/**
 * Reads a picked CSV file to text, rejecting with a French message when it cannot be imported.
 */
export async function readCsvFile(file: File): Promise<string> {
  const problem = checkCsvFile(file);
  if (problem) throw new Error(problem);
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new Error(voice.dashboard.gifts.import.unreadable);
  }
  const text = decodeCsv(bytes);
  if (text.length > CSV_MAX_CHARS) throw new Error(voice.dashboard.gifts.import.tooBig);
  return text;
}
