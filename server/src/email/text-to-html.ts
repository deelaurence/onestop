export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Converts admin plain text into safe, styled email body HTML. */
export function plainTextToEmailHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '<p style="margin:0;color:#8a8078;">&nbsp;</p>';
  }

  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, '<br />');
      return `<p style="margin:0 0 14px;line-height:1.65;">${lines}</p>`;
    })
    .join('');
}

export function plainTextToEmailText(text: string): string {
  return text.trim();
}
