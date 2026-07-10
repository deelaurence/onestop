/** Default outbound sender — override with EMAIL_FROM only if needed. */
export const EMAIL_SENDER = {
  email: 'tony@onestopphotography.ca',
  name: 'Tony Williams',
} as const;

export function formatSenderAddress(): string {
  return `${EMAIL_SENDER.name} <${EMAIL_SENDER.email}>`;
}
