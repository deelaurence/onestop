export interface PhoneCountryCode {
  code: string;
  country: string;
  flag: string;
}

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
];

export const DEFAULT_PHONE_COUNTRY_CODE = '+234';

export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatFullPhone(countryCode: string, localNumber: string): string {
  const digits = stripPhoneDigits(localNumber);
  if (!digits) return '';
  return `${countryCode}${digits}`;
}

export function isValidLocalPhone(localNumber: string): boolean {
  const digits = stripPhoneDigits(localNumber);
  return digits.length >= 7 && digits.length <= 12;
}

export function phoneToTelUri(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}
