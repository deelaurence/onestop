import type { BookingType, DayAvailability, TimeSlot } from '../types.js';

const SLOT_DURATION_MINUTES = 60;

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getOperatingWindow(type: BookingType, dayOfWeek: number): { start: number; end: number } {
  if (type === 'event') {
    return { start: 0, end: 24 * 60 };
  }

  // Friday (5) and Saturday (6): 9am – 10pm
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return { start: 9 * 60, end: 22 * 60 };
  }

  // Other days: 4:30pm – 10pm
  return { start: 16 * 60 + 30, end: 22 * 60 };
}

function generateSlots(type: BookingType, dateStr: string): TimeSlot[] {
  const date = parseDate(dateStr);
  const { start, end } = getOperatingWindow(type, date.getDay());
  const slots: TimeSlot[] = [];

  for (let cursor = start; cursor + SLOT_DURATION_MINUTES <= end; cursor += SLOT_DURATION_MINUTES) {
    slots.push({
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + SLOT_DURATION_MINUTES),
    });
  }

  return slots;
}

function slotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dateStr) < today;
}

function isPastSlot(dateStr: string, startTime: string): boolean {
  const now = new Date();
  const slotStart = parseDate(dateStr);
  const [h, m] = startTime.split(':').map(Number);
  slotStart.setHours(h, m, 0, 0);
  return slotStart <= now;
}

export function getAllSlotsForDate(type: BookingType, dateStr: string): TimeSlot[] {
  if (isPastDate(dateStr)) return [];
  return generateSlots(type, dateStr);
}

export function filterAvailableSlots(
  type: BookingType,
  dateStr: string,
  booked: Array<{ startTime: string; endTime: string }>,
): TimeSlot[] {
  const allSlots = getAllSlotsForDate(type, dateStr);

  return allSlots.filter((slot) => {
    if (isPastSlot(dateStr, slot.start)) return false;
    return !booked.some((b) => slotsOverlap(slot.start, slot.end, b.startTime, b.endTime));
  });
}

export function isSlotAvailable(
  type: BookingType,
  dateStr: string,
  startTime: string,
  endTime: string,
  booked: Array<{ startTime: string; endTime: string }>,
): boolean {
  if (isPastDate(dateStr)) return false;
  if (isPastSlot(dateStr, startTime)) return false;

  const allSlots = getAllSlotsForDate(type, dateStr);
  const matchesGeneratedSlot = allSlots.some(
    (s) => s.start === startTime && s.end === endTime,
  );

  if (type === 'studio' && !matchesGeneratedSlot) return false;

  if (type === 'event') {
    const date = parseDate(dateStr);
    const { start, end } = getOperatingWindow(type, date.getDay());
    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);
    if (reqStart < start || reqEnd > end || reqStart >= reqEnd) return false;
  }

  return !booked.some((b) => slotsOverlap(startTime, endTime, b.startTime, b.endTime));
}

export function getMonthAvailability(
  type: BookingType,
  year: number,
  month: number,
  bookedByDate: Map<string, Array<{ startTime: string; endTime: string }>>,
): DayAvailability[] {
  const days: DayAvailability[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month - 1, day));
    const booked = bookedByDate.get(dateStr) ?? [];
    const availableSlots = filterAvailableSlots(type, dateStr, booked);

    days.push({
      date: dateStr,
      available: availableSlots.length > 0,
      slotCount: availableSlots.length,
    });
  }

  return days;
}

export { timeToMinutes, minutesToTime, formatDate, parseDate };
