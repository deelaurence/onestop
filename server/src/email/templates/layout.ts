const BRAND = {
  cream: '#f5f0eb',
  warmWhite: '#faf8f5',
  dark: '#1a1714',
  textDark: '#2a2520',
  textMuted: '#8a8078',
  accent: '#c8a882',
  accentDark: '#a88962',
};

export interface EmailLayoutOptions {
  preheader?: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}

export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const siteUrl = process.env.SITE_URL ?? 'https://onestopphotography.ca';
  const preheader = opts.preheader ?? '';
  const ctaBlock =
    opts.ctaLabel && opts.ctaHref
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
          <tr>
            <td align="left">
              <a href="${opts.ctaHref}" style="display:inline-block;background:${BRAND.dark};color:${BRAND.cream};text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:500;letter-spacing:0.02em;">${opts.ctaLabel}</a>
            </td>
          </tr>
        </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${opts.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.textDark};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.warmWhite};border:1px solid rgba(200,168,130,0.35);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.dark};padding:28px 32px 24px;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.accent};font-weight:500;">Onestop Photography</p>
              <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${BRAND.cream};line-height:1.2;">${opts.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 28px;font-size:15px;line-height:1.65;color:${BRAND.textDark};">
              ${opts.bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;border-top:1px solid rgba(200,168,130,0.25);">
              <p style="margin:20px 0 6px;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
                ${opts.footerNote ?? 'Questions? Reply to this email and our team will get back to you.'}
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
                <a href="${siteUrl}" style="color:${BRAND.accentDark};text-decoration:none;">onestopphotography.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(200,168,130,0.2);vertical-align:top;">
      <span style="display:block;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.textMuted};margin-bottom:4px;">${label}</span>
      <span style="font-size:15px;color:${BRAND.textDark};">${value}</span>
    </td>
  </tr>`;
}

export function detailTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;background:${BRAND.cream};border-radius:12px;padding:4px 16px;">${rows}</table>`;
}

export function referenceBadge(code: string): string {
  return `<p style="margin:0 0 16px;padding:12px 16px;background:${BRAND.cream};border-left:3px solid ${BRAND.accent};border-radius:0 8px 8px 0;font-size:14px;">
    <span style="display:block;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.textMuted};margin-bottom:4px;">Reference</span>
    <strong style="font-size:18px;letter-spacing:0.06em;color:${BRAND.dark};">${code}</strong>
  </p>`;
}
