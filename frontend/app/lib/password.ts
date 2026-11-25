export const PASSWORD_MAX_BYTES = 72;

/**
 * True when the password exceeds what bcrypt reads (72 bytes of UTF-8); `maxLength` counts
 * characters, so accented letters and emoji can slip past it.
 */
export function passwordTooLong(value: string): boolean {
  return new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES;
}
