export type BookingType = 'studio' | 'event';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  slotCount: number;
}

export interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  description: string;
  type: BookingType;
  date: string;
  startTime: string;
  endTime: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

export function fetchDaySlots(date: string, type: BookingType) {
  return request<{ slots: TimeSlot[] }>(
    `/availability/day?date=${date}&type=${type}`,
  );
}

export function createBooking(payload: BookingPayload) {
  return request<{ message: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
