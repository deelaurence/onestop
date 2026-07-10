import { Booking } from '../models/Booking.js';

/** Only admin-confirmed bookings block public calendar slots and time selection. */
export function findBookingsBlockingAvailability() {
  return Booking.find({ status: 'confirmed' }).select(
    'startDate endDate startTime endTime fullDays',
  );
}
