import crypto from "node:crypto";

export function hashApiKey(apiKey: string, pepper: string): string {
  return crypto.createHash("sha256").update(`${pepper}:${apiKey}`).digest("hex");
}

export function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
