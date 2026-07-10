import { Resend } from 'resend';
import { formatSenderAddress } from '../config.js';
import type { EmailPayload, EmailProvider, EmailSendResult } from '../types.js';

function formatAddress(addr: { email: string; name?: string }): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const to = Array.isArray(payload.to)
      ? payload.to.map((a) => formatAddress(a))
      : formatAddress(payload.to);

    const from = process.env.EMAIL_FROM ?? formatSenderAddress();

    const { data, error } = await this.client.emails.send({
      from,
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo ? formatAddress(payload.replyTo) : undefined,
    });

    if (error) throw new Error(error.message);
    return { id: data?.id };
  }
}
