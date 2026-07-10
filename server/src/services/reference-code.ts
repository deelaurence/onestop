import { randomBytes } from 'node:crypto';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferenceCode(): string {
  const bytes = randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[bytes[i % bytes.length] % CODE_CHARS.length];
  }
  return `OSP-${suffix}`;
}
