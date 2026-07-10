import { getOverridePreviewDays } from '../../lib/override-preview';

interface Props {
  startDate: string;
  endDate: string;
  available: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function OverridePreviewCalendar({ startDate, endDate, available }: Props) {
  if (!startDate) return null;

  const { year, month, weekdays, cells } = getOverridePreviewDays({ startDate, endDate, available });

  return (
    <div className="override-preview" aria-label="Override preview calendar">
      <p className="override-preview-label">
        Preview — {available ? 'Open' : 'Blocked'}:{' '}
        <strong>{MONTHS[month - 1]} {year}</strong>
      </p>
      <div className="override-preview-grid">
        {weekdays?.map((d) => (
          <span key={d} className="override-preview-weekday">{d}</span>
        ))}
        {cells.map((cell, i) => (
          <span
            key={i}
            className={[
              'override-preview-day',
              cell.inRange ? (available ? 'override-preview-day--open' : 'override-preview-day--block') : '',
            ].filter(Boolean).join(' ')}
          >
            {cell.day ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}
