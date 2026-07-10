import { getApiBaseUrl } from './api-config';

export type BookingType = 'studio' | 'event';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  booked: boolean;
  slotCount: number;
  hours: TimeWindow | null;
}

export interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  description: string;
  type: BookingType;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  fullDays?: boolean;
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
}

function apiBase() {
  return getApiBaseUrl();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Something went wrong');
  }

  return data as T;
}

export function fetchMonthAvailability(year: number, month: number, type: BookingType) {
  return request<{ days: DayAvailability[] }>(
    `/availability/month?year=${year}&month=${month}&type=${type}`,
  );
}

export interface DayRangeStatus {
  date: string;
  windows: TimeWindow[];
  available: boolean;
  reason?: string;
}

export interface RangeTimeOptions {
  window: TimeWindow | null;
  starts: string[];
  endsForStart: Record<string, string[]>;
  perDay: DayRangeStatus[];
  fullDays?: boolean;
  available?: boolean;
  reason?: string;
}

export function fetchRangeHours(
  startDate: string,
  endDate: string,
  type: BookingType,
  fullDays = false,
) {
  const fullDaysParam = fullDays ? '&fullDays=1' : '';
  return request<RangeTimeOptions & { startDate: string; endDate: string; type: BookingType }>(
    `/availability/range-hours?startDate=${startDate}&endDate=${endDate}&type=${type}${fullDaysParam}`,
  );
}

export function fetchDayHours(date: string, type: BookingType) {
  return request<{ windows: TimeWindow[] }>(
    `/availability/hours?date=${date}&type=${type}`,
  );
}

export function checkAvailability(payload: {
  type: BookingType;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  fullDays?: boolean;
}) {
  return request<AvailabilityCheck>('/availability/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createBooking(payload: BookingPayload) {
  return request<{
    message: string;
    emailEnabled?: boolean;
    booking: {
      id: string;
      referenceCode: string;
      name: string;
      type: BookingType;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      fullDays?: boolean;
      status: BookingStatus;
    };
  }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function formatTime12h(time?: string | null): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);

  while (cursor <= last) {
    dates.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
