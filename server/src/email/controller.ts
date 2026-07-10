import type { EmailPayload, EmailProvider } from './types.js';
import { ResendProvider } from './providers/resend.js';

let cachedProvider: EmailProvider | null | undefined;

function resolveProvider(): EmailProvider | null {
  if (cachedProvider !== undefined) return cachedProvider;

  const providerName = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase();

  if (providerName === 'resend' && process.env.RESEND_API_KEY) {
    cachedProvider = new ResendProvider(process.env.RESEND_API_KEY);
    return cachedProvider;
  }

  cachedProvider = null;
  return null;
}

/** Provider-agnostic email entry point. Swap EMAIL_PROVIDER to change backends. */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const provider = resolveProvider();
  if (!provider) {
    console.warn('[email] No provider configured — skipped:', payload.subject);
    return false;
  }

  try {
    const result = await provider.send(payload);
    console.log(`[email] Sent via ${provider.name}:`, payload.subject, result.id ?? '');
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return resolveProvider() !== null;
}
