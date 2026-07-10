import type { BookingType, DayAvailability } from '../types.js';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface BookingBlock {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  fullDays?: boolean;
}

export interface OverrideBlock {
  startDate: string;
  endDate: string;
  type: 'studio' | 'event' | 'all';
  startTime?: string;
  endTime?: string;
  available: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = parseDate(startDate);
  const end = parseDate(endDate);

  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

function getBaseWindow(type: BookingType, dayOfWeek: number): TimeWindow {
  if (type === 'event') {
    return { start: '00:00', end: '23:59' };
  }
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return { start: '09:00', end: '22:00' };
  }
  return { start: '16:30', end: '22:00' };
}

function overrideApplies(override: OverrideBlock, type: BookingType, dateStr: string): boolean {
  if (!datesOverlap(override.startDate, override.endDate, dateStr, dateStr)) return false;
  if (override.type !== 'all' && override.type !== type) return false;
  return true;
}

function isDayFullyBlocked(type: BookingType, dateStr: string, overrides: OverrideBlock[]): boolean {
  return overrides.some(
    (o) =>
      overrideApplies(o, type, dateStr) &&
      !o.available &&
      !o.startTime &&
      !o.endTime,
  );
}

function isDayForceOpened(type: BookingType, dateStr: string, overrides: OverrideBlock[]): boolean {
  return overrides.some(
    (o) =>
      overrideApplies(o, type, dateStr) &&
      o.available &&
      !o.startTime &&
      !o.endTime,
  );
}

export function getAllowedWindows(
  type: BookingType,
  dateStr: string,
  overrides: OverrideBlock[],
): TimeWindow[] {
  if (isPastDate(dateStr)) return [];
  if (isDayFullyBlocked(type, dateStr, overrides)) return [];

  const day = parseDate(dateStr).getDay();
  let windows: TimeWindow[] = [];

  if (isDayForceOpened(type, dateStr, overrides)) {
    windows.push({ start: '00:00', end: '23:59' });
  } else {
    windows.push(getBaseWindow(type, day));
  }

  for (const o of overrides) {
    if (!overrideApplies(o, type, dateStr) || !o.startTime || !o.endTime) continue;
    if (o.available) {
      windows.push({ start: o.startTime, end: o.endTime });
    }
  }

  windows = mergeWindows(windows);

  for (const o of overrides) {
    if (!overrideApplies(o, type, dateStr) || !o.startTime || !o.endTime) continue;
    if (!o.available) {
      windows = subtractWindow(windows, { start: o.startTime, end: o.endTime });
    }
  }

  return windows;
}

function mergeWindows(windows: TimeWindow[]): TimeWindow[] {
  if (windows.length === 0) return [];
  const sorted = [...windows].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const merged: TimeWindow[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (timeToMinutes(cur.start) <= timeToMinutes(last.end)) {
      if (timeToMinutes(cur.end) > timeToMinutes(last.end)) last.end = cur.end;
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

function subtractWindow(windows: TimeWindow[], block: TimeWindow): TimeWindow[] {
  const result: TimeWindow[] = [];
  const bStart = timeToMinutes(block.start);
  const bEnd = timeToMinutes(block.end);

  for (const w of windows) {
    const wStart = timeToMinutes(w.start);
    const wEnd = timeToMinutes(w.end);

    if (bEnd <= wStart || bStart >= wEnd) {
      result.push(w);
      continue;
    }
    if (wStart < bStart) {
      result.push({ start: w.start, end: minutesToTime(bStart) });
    }
    if (wEnd > bEnd) {
      result.push({ start: minutesToTime(bEnd), end: w.end });
    }
  }

  return result;
}

function isTimeRangeWithinWindows(startTime: string, endTime: string, windows: TimeWindow[]): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start >= end) return false;
  return windows.some((w) => start >= timeToMinutes(w.start) && end <= timeToMinutes(w.end));
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dateStr) < today;
}

function isPastRange(startDate: string, startTime: string): boolean {
  const now = new Date();
  const start = parseDate(startDate);
  const [h, m] = startTime.split(':').map(Number);
  start.setHours(h, m, 0, 0);
  return start <= now;
}

function dayInRange(day: string, startDate: string, endDate: string): boolean {
  return day >= startDate && day <= endDate;
}

function getDayCoverageWindow(
  type: BookingType,
  dateStr: string,
  overrides: OverrideBlock[],
): TimeWindow | null {
  const windows = getAllowedWindows(type, dateStr, overrides);
  if (windows.length === 0) return null;

  const start = Math.min(...windows.map((w) => timeToMinutes(w.start)));
  const end = Math.max(...windows.map((w) => timeToMinutes(w.end)));
  return { start: minutesToTime(start), end: minutesToTime(end) };
}

function hasBookingConflictOnDay(
  day: string,
  startTime: string,
  endTime: string,
  fullDays: boolean,
  booking: BookingBlock,
): boolean {
  if (!dayInRange(day, booking.startDate, booking.endDate)) return false;
  if (fullDays || booking.fullDays) return true;
  return timesOverlap(startTime, endTime, booking.startTime, booking.endTime);
}

function hasBookingConflict(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  fullDays: boolean,
  bookings: BookingBlock[],
): boolean {
  const days = enumerateDates(startDate, endDate);
  return days.some((day) =>
    bookings.some((b) => hasBookingConflictOnDay(day, startTime, endTime, fullDays, b)),
  );
}

export function isRangeAvailable(
  type: BookingType,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): { available: boolean; reason?: string } {
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { available: false, reason: 'Invalid date format' };
  }
  if (startDate > endDate) {
    return { available: false, reason: 'End date must be on or after start date' };
  }
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return { available: false, reason: 'End time must be after start time' };
  }
  if (isPastRange(startDate, startTime)) {
    return { available: false, reason: 'Cannot book a time in the past' };
  }

  const days = enumerateDates(startDate, endDate);
  for (const day of days) {
    const windows = getAllowedWindows(type, day, overrides);
    if (windows.length === 0) {
      return { available: false, reason: `${day} is not available` };
    }
    if (!isTimeRangeWithinWindows(startTime, endTime, windows)) {
      return { available: false, reason: `Selected hours are outside allowed times on ${day}` };
    }
  }

  const activeBookings = bookings;
  if (hasBookingConflict(startDate, endDate, startTime, endTime, false, activeBookings)) {
    return { available: false, reason: 'This period conflicts with an existing booking' };
  }

  return { available: true };
}

export function isFullDaysRangeAvailable(
  type: BookingType,
  startDate: string,
  endDate: string,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): { available: boolean; reason?: string } {
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { available: false, reason: 'Invalid date format' };
  }
  if (startDate > endDate) {
    return { available: false, reason: 'End date must be on or after start date' };
  }
  if (startDate === endDate) {
    return { available: false, reason: 'Full-day booking requires multiple dates' };
  }

  const days = enumerateDates(startDate, endDate);
  for (const day of days) {
    const coverage = getDayCoverageWindow(type, day, overrides);
    if (!coverage) {
      return { available: false, reason: `${day} is not available` };
    }
    if (isPastRange(day, coverage.start)) {
      return { available: false, reason: 'Cannot book a time in the past' };
    }
    if (hasBookingConflict(day, day, coverage.start, coverage.end, true, bookings)) {
      return { available: false, reason: `This period conflicts with an existing booking on ${day}` };
    }
  }

  return { available: true };
}

export function isDayBooked(dateStr: string, bookings: BookingBlock[]): boolean {
  // bookings should be confirmed-only (see findBookingsBlockingAvailability)
  return bookings.some((b) => dayInRange(dateStr, b.startDate, b.endDate));
}

export function isDaySelectable(
  type: BookingType,
  dateStr: string,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): boolean {
  if (isPastDate(dateStr)) return false;
  const { starts } = getValidTimeOptions(type, dateStr, dateStr, bookings, overrides);
  return starts.length > 0;
}

export function getMonthAvailability(
  type: BookingType,
  year: number,
  month: number,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): DayAvailability[] {
  const days: DayAvailability[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month - 1, day));
    const windows = getAllowedWindows(type, dateStr, overrides);
    const booked = isDayBooked(dateStr, bookings);
    const available = isDaySelectable(type, dateStr, bookings, overrides);

    days.push({
      date: dateStr,
      available,
      booked,
      slotCount: available ? windows.length : 0,
      hours: windows[0] ?? null,
    });
  }

  return days;
}

export function getDayHours(
  type: BookingType,
  dateStr: string,
  overrides: OverrideBlock[],
): TimeWindow[] {
  return getAllowedWindows(type, dateStr, overrides);
}

export function getIntersectedWindow(
  type: BookingType,
  startDate: string,
  endDate: string,
  overrides: OverrideBlock[],
): TimeWindow | null {
  const days = enumerateDates(startDate, endDate);
  let intersectStart = 0;
  let intersectEnd = 24 * 60;

  for (const day of days) {
    const windows = getAllowedWindows(type, day, overrides);
    if (windows.length === 0) return null;

    const dayStart = Math.min(...windows.map((w) => timeToMinutes(w.start)));
    const dayEnd = Math.max(...windows.map((w) => timeToMinutes(w.end)));
    intersectStart = Math.max(intersectStart, dayStart);
    intersectEnd = Math.min(intersectEnd, dayEnd);
  }

  if (intersectStart >= intersectEnd) return null;
  return { start: minutesToTime(intersectStart), end: minutesToTime(intersectEnd) };
}

export function buildTimeOptions(window: TimeWindow, stepMinutes = 30): {
  starts: string[];
  endsForStart: Record<string, string[]>;
} {
  const starts: string[] = [];
  const endsForStart: Record<string, string[]> = {};
  const wStart = timeToMinutes(window.start);
  const wEnd = timeToMinutes(window.end);

  for (let t = wStart; t + stepMinutes <= wEnd; t += stepMinutes) {
    const start = minutesToTime(t);
    starts.push(start);
    const ends: string[] = [];
    for (let e = t + stepMinutes; e <= wEnd; e += stepMinutes) {
      ends.push(minutesToTime(e));
    }
    endsForStart[start] = ends;
  }

  return { starts, endsForStart };
}

export function getFullDaysPerDayStatus(
  type: BookingType,
  startDate: string,
  endDate: string,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): Array<{ date: string; windows: TimeWindow[]; available: boolean; reason?: string }> {
  const days = enumerateDates(startDate, endDate);

  return days.map((date) => {
    const coverage = getDayCoverageWindow(type, date, overrides);
    if (!coverage) {
      return { date, windows: [], available: false, reason: 'Not available' };
    }
    if (isPastRange(date, coverage.start)) {
      return { date, windows: [], available: false, reason: 'Date is in the past' };
    }
    if (hasBookingConflict(date, date, coverage.start, coverage.end, true, bookings)) {
      return { date, windows: [coverage], available: false, reason: 'Already booked' };
    }
    return { date, windows: [coverage], available: true };
  });
}

export function getValidTimeOptions(
  type: BookingType,
  startDate: string,
  endDate: string,
  bookings: BookingBlock[],
  overrides: OverrideBlock[],
): {
  window: TimeWindow | null;
  starts: string[];
  endsForStart: Record<string, string[]>;
  perDay: Array<{ date: string; windows: TimeWindow[] }>;
} {
  const days = enumerateDates(startDate, endDate);
  const perDay = days.map((date) => ({
    date,
    windows: getAllowedWindows(type, date, overrides),
  }));

  const window = getIntersectedWindow(type, startDate, endDate, overrides);
  if (!window) {
    return { window: null, starts: [], endsForStart: {}, perDay };
  }

  const { starts, endsForStart } = buildTimeOptions(window);
  const validStarts: string[] = [];
  const validEndsForStart: Record<string, string[]> = {};

  for (const start of starts) {
    const validEnds = (endsForStart[start] ?? []).filter((end) =>
      isRangeAvailable(type, startDate, endDate, start, end, bookings, overrides).available,
    );
    if (validEnds.length > 0) {
      validStarts.push(start);
      validEndsForStart[start] = validEnds;
    }
  }

  return { window, starts: validStarts, endsForStart: validEndsForStart, perDay };
}
