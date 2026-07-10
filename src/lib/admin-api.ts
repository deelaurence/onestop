import { getApiBaseUrl } from './api-config';

const TOKEN_KEY = 'onestop_admin_token';

export interface BookingActivity {
  action: string;
  detail?: string;
  by?: string;
  at: string;
}

export interface AdminUser {
  email: string;
  name: string;
}

export interface AdminBooking {
  _id: string;
  referenceCode?: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  fullDays?: boolean;
  status: string;
  description: string;
  adminNote?: string;
  activityLog?: BookingActivity[];
  createdAt: string;
}

export interface AvailabilityOverride {
  _id: string;
  startDate: string;
  endDate: string;
  type: 'studio' | 'event' | 'all';
  startTime?: string;
  endTime?: string;
  available: boolean;
  note?: string;
}

export type BookingFilter = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'today' | 'week';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export function adminLogin(email: string, password: string) {
  return adminRequest<{ token: string; admin: AdminUser }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchAdminBookings() {
  return adminRequest<{ bookings: AdminBooking[] }>('/admin/bookings');
}

export function updateBookingStatus(id: string, status: string, notify = false) {
  return adminRequest<{ booking: AdminBooking; emailSent?: boolean }>(`/admin/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notify }),
  });
}

export function updateBookingNote(id: string, adminNote: string) {
  return adminRequest<{ booking: AdminBooking }>(`/admin/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNote }),
  });
}

export function fetchOverrides() {
  return adminRequest<{ overrides: AvailabilityOverride[] }>('/admin/overrides');
}

export function createOverride(payload: Omit<AvailabilityOverride, '_id'>) {
  return adminRequest<{ override: AvailabilityOverride }>('/admin/overrides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteOverride(id: string) {
  return adminRequest<{ message: string }>(`/admin/overrides/${id}`, {
    method: 'DELETE',
  });
}

export interface CustomEmailPayload {
  bookingId?: string;
  toEmail?: string;
  toName?: string;
  subject: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}

export function sendCustomEmail(payload: CustomEmailPayload) {
  return adminRequest<{ message: string; emailSent: boolean }>('/admin/emails/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function filterBookings(bookings: AdminBooking[], filter: BookingFilter): AdminBooking[] {
  if (filter === 'all') return bookings;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

  return bookings.filter((b) => {
    if (filter === 'pending' || filter === 'confirmed' || filter === 'cancelled') {
      return b.status === filter;
    }
    if (!b.startDate) return false;
    if (filter === 'today') {
      return b.startDate <= todayStr && (b.endDate ?? b.startDate) >= todayStr;
    }
    if (filter === 'week') {
      return b.startDate <= weekEndStr && (b.endDate ?? b.startDate) >= todayStr;
    }
    return true;
  });
}

export function activityLabel(entry: BookingActivity): string {
  switch (entry.action) {
    case 'created':
      return 'Request submitted';
    case 'confirmed':
      return 'Confirmed by admin';
    case 'cancelled':
      return 'Cancelled';
    case 'pending':
      return 'Marked pending';
    case 'note_updated':
      return entry.detail ?? 'Admin note updated';
    case 'email_sent':
      return entry.detail ?? 'Email sent';
    default:
      return entry.action;
  }
}
