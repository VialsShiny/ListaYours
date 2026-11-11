import { voice } from "@/content/voice";

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_OUTPUT_SIDE = 512;
const TILE = "#ededed";

/**
 * Client-side check of a picked file, mirroring the API rules (type and 2 MB limit).
 */
export function checkAvatarFile(file: { type: string; size: number }): string | null {
  if (AVATAR_TYPES.indexOf(file.type) === -1) return voice.account.photo.wrongType;
  if (file.size > AVATAR_MAX_BYTES) return voice.account.photo.tooHeavy;
  return null;
}

/**
 * Centre-crops the picture to a square on a canvas (512 px at most) and returns it as a JPEG.
 */
export async function cropToSquare(file: Blob, side = AVATAR_OUTPUT_SIDE): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const source = Math.min(bitmap.width, bitmap.height);
  const output = Math.min(source, side);
  const canvas = document.createElement("canvas");
  canvas.width = output;
  canvas.height = output;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(voice.account.photo.unreadable);
  context.fillStyle = TILE;
  context.fillRect(0, 0, output, output);
  const left = Math.floor((bitmap.width - source) / 2);
  const top = Math.floor((bitmap.height - source) / 2);
  context.drawImage(bitmap, left, top, source, source, 0, 0, output, output);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(voice.account.photo.unreadable))),
      "image/jpeg",
      0.9,
    );
  });
}
