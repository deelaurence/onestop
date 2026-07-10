import { plainTextToEmailHtml, plainTextToEmailText, escapeHtml } from '../text-to-html.js';
import { renderEmailLayout } from './layout.js';

export interface CustomEmailOptions {
  title: string;
  message: string;
  preheader?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  recipientName?: string;
}

export function renderCustomEmail(opts: CustomEmailOptions) {
  const greeting = opts.recipientName
    ? `<p style="margin:0 0 12px;">Hi ${escapeHtml(opts.recipientName)},</p>`
    : '';

  const bodyHtml = `${greeting}${plainTextToEmailHtml(opts.message)}`;
  const text = [
    opts.recipientName ? `Hi ${opts.recipientName},` : '',
    opts.recipientName ? '' : undefined,
    plainTextToEmailText(opts.message),
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const html = renderEmailLayout({
    preheader: opts.preheader ?? opts.message.slice(0, 120),
    title: opts.title,
    bodyHtml,
    ctaLabel: opts.ctaLabel,
    ctaHref: opts.ctaHref,
    footerNote: opts.footerNote,
  });

  return { html, text };
}
