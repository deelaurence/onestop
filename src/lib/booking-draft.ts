import type { BookingType } from './api';
import { formatDateLabel, formatDateShort, formatTime12h } from './api';

export const BOOKING_DRAFT_KEY = 'onestop_booking_draft';

export interface BookingDraft {
  step: number;
  type: BookingType | null;
  dateMode: 'single' | 'multi' | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  name: string;
  phoneCountryCode: string;
  phoneLocal: string;
  email: string;
  description: string;
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: BookingDraft) {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

export function clearBookingDraft() {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
}

export interface BookingSummaryInput {
  referenceCode?: string;
  type: BookingType;
  dateMode: 'single' | 'multi' | null;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  name: string;
  phone: string;
  email: string;
  description?: string;
}

export function buildBookingSummaryText(input: BookingSummaryInput): string {
  const lines = [
    'Onestop Photography — Booking Request',
    input.referenceCode ? `Reference: ${input.referenceCode}` : undefined,
    `Session: ${input.type === 'studio' ? 'Studio Session' : 'Event'}`,
    `Duration: ${input.dateMode === 'multi' ? 'Multiple days' : 'One day'}`,
    `Dates: ${
      input.startDate === input.endDate
        ? formatDateLabel(input.startDate)
        : `${formatDateShort(input.startDate)} – ${formatDateShort(input.endDate)}`
    }`,
    input.dateMode === 'multi'
      ? 'Times: Full available hours each day'
      : `Times: ${formatTime12h(input.startTime)} – ${formatTime12h(input.endTime)}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email}`,
    input.description ? `Description: ${input.description}` : undefined,
    '',
    'Status: Pending admin review (typically confirmed within 24–48 hours)',
  ].filter(Boolean);

  return lines.join('\n');
}
