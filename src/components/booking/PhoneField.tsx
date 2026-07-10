import { PHONE_COUNTRY_CODES } from '../../lib/phone-codes';

interface PhoneFieldProps {
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (code: string) => void;
  onLocalNumberChange: (value: string) => void;
}

export default function PhoneField({
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
}: PhoneFieldProps) {
  return (
    <label className="book-field">
      <span>Phone</span>
      <div className="phone-field-row">
        <select
          className="phone-country-select"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          aria-label="Country code"
        >
          {PHONE_COUNTRY_CODES.map((entry, index) => (
            <option key={`${entry.code}-${entry.country}-${index}`} value={entry.code}>
              {entry.flag} {entry.code} {entry.country}
            </option>
          ))}
        </select>
        <input
          type="tel"
          className="phone-local-input"
          value={localNumber}
          onChange={(e) => onLocalNumberChange(e.target.value)}
          placeholder="816 566 1486"
          inputMode="numeric"
          autoComplete="tel-national"
          required
        />
      </div>
    </label>
  );
}
