import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { DayAvailability } from '../../lib/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarPickerProps {
  label?: string;
  hint?: string;
  startDate?: string | null;
  endDate?: string | null;
  onSelect: (date: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthDays: DayAvailability[];
  loading?: boolean;
  minDate?: string | null;
}

export default function CalendarPicker({
  label,
  hint,
  startDate,
  endDate,
  onSelect,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  monthDays,
  loading,
  minDate,
}: CalendarPickerProps) {
  const map = new Map(monthDays.map((d) => [d.date, d]));
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const rangeEnd = endDate ?? startDate;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const canGoPrevMonth = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);

  const cells: Array<{ key: string; day?: number; date?: string; available?: boolean; booked?: boolean }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ key: `e-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = map.get(dateStr);
    const baseAvailable = info?.available ?? false;
    const booked = info?.booked ?? false;
    const beforeMin = minDate ? dateStr < minDate : false;
    cells.push({
      key: dateStr,
      day: d,
      date: dateStr,
      available: baseAvailable && !beforeMin,
      booked,
    });
  }

  const inRange = (date: string) => {
    if (!startDate || !rangeEnd) return false;
    return date >= startDate && date <= rangeEnd;
  };

  return (
    <div className="calendar-picker">
      {(label || hint) && (
        <div className="calendar-picker-label">
          {label && <strong>{label}</strong>}
          {hint && <span>{hint}</span>}
        </div>
      )}
      <div className="book-calendar-panel">
        <div className="book-calendar-header">
          <button
            type="button"
            className="book-nav-btn"
            onClick={onPrevMonth}
            disabled={!canGoPrevMonth}
            aria-label="Previous month"
          >
            <ArrowLeft size={18} />
          </button>
          <h3>{MONTHS[viewMonth - 1]} {viewYear}</h3>
          <button type="button" className="book-nav-btn" onClick={onNextMonth} aria-label="Next month">
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="book-weekdays">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
        <div className={`book-calendar-grid${loading ? ' book-calendar-grid--loading' : ''}`}>
          {cells.map((cell) =>
            cell.day ? (
              <button
                key={cell.key}
                type="button"
                className={[
                  'book-day',
                  cell.available ? 'book-day--available' : 'book-day--unavailable',
                  cell.booked ? 'book-day--booked' : '',
                  startDate === cell.date ? 'book-day--selected' : '',
                  endDate && endDate === cell.date && endDate !== startDate ? 'book-day--range-end' : '',
                  inRange(cell.date!) && startDate !== cell.date && endDate !== cell.date ? 'book-day--in-range' : '',
                ].join(' ')}
                disabled={!cell.available}
                onClick={() => cell.available && onSelect(cell.date!)}
              >
                {cell.day}
                {cell.booked && <span className="book-day-dot" aria-hidden />}
              </button>
            ) : (
              <span key={cell.key} className="book-day book-day--empty" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
