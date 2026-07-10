import { enumerateDates } from '../lib/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatYmd(d);
}

interface OverridePreviewProps {
  startDate: string;
  endDate: string;
  available: boolean;
}

export function getOverridePreviewDays({ startDate, endDate, available }: OverridePreviewProps) {
  if (!startDate) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, cells: [] as Array<{ day?: number; inRange?: boolean; label?: string }> };

  const start = parseDate(startDate);
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const rangeStart = startDate <= endDate ? startDate : endDate;
  const rangeEnd = startDate <= endDate ? endDate : startDate;

  const cells: Array<{ day?: number; inRange?: boolean; label?: string }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const inRange = dateStr >= rangeStart && dateStr <= rangeEnd;
    cells.push({ day, inRange, label: available ? 'open' : 'block' });
  }

  return { year, month, weekdays: WEEKDAYS, cells, available };
}

export function shiftOverrideDates(startDate: string, endDate: string, days: number) {
  return {
    startDate: shiftDate(startDate, days),
    endDate: shiftDate(endDate || startDate, days),
  };
}

export function enumerateOverrideRange(startDate: string, endDate: string): string[] {
  return enumerateDates(startDate, endDate || startDate);
}
