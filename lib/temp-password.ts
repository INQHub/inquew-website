import crypto from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 14): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS[bytes[i] % CHARS.length];
  }
  return out;
}
