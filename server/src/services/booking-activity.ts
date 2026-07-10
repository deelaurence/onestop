import type { IBooking, IBookingActivity } from '../models/Booking.js';

export type ActivityAction =
  | 'created'
  | 'confirmed'
  | 'cancelled'
  | 'pending'
  | 'note_updated'
  | 'email_sent';

export function appendActivity(
  booking: { activityLog: IBookingActivity[] },
  action: ActivityAction,
  detail?: string,
  by = 'system',
): void {
  booking.activityLog.push({
    action,
    detail,
    by,
    at: new Date(),
  });
}

export function activityLabel(entry: IBookingActivity): string {
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
      return 'Admin note updated';
    case 'email_sent':
      return entry.detail ?? 'Email sent';
    default:
      return entry.action;
  }
}
