import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import { AvailabilityOverride } from '../models/AvailabilityOverride.js';
import { isFullDaysRangeAvailable, isRangeAvailable } from '../services/availability.js';
import { findBookingsBlockingAvailability } from '../services/booking-availability.js';
import { appendActivity } from '../services/booking-activity.js';
import { sendBookingReceivedEmail } from '../services/booking-emails.js';
import { generateReferenceCode } from '../services/reference-code.js';
import { isEmailConfigured } from '../email/controller.js';
import type { BookingType } from '../types.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface BookingBody {
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  fullDays?: boolean;
}

function validateBookingBody(body: BookingBody) {
  const errors: string[] = [];
  const fullDays = body.fullDays === true;

  if (!body.name?.trim()) errors.push('Name is required');
  if (!body.phone?.trim()) errors.push('Phone number is required');
  if (!body.email?.trim() || !EMAIL_RE.test(body.email.trim())) errors.push('Valid email is required');
  if (!body.description?.trim()) errors.push('Description is required');
  if (body.type !== 'studio' && body.type !== 'event') errors.push('Type must be studio or event');
  if (!DATE_RE.test(body.startDate ?? '')) errors.push('Valid start date is required');
  if (!DATE_RE.test(body.endDate ?? '')) errors.push('Valid end date is required');
  if (!fullDays) {
    if (!TIME_RE.test(body.startTime ?? '')) errors.push('Valid start time is required');
    if (!TIME_RE.test(body.endTime ?? '')) errors.push('Valid end time is required');
  }

  return errors;
}

async function createUniqueReferenceCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateReferenceCode();
    const exists = await Booking.exists({ referenceCode: code });
    if (!exists) return code;
  }
  throw new Error('Failed to generate reference code');
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as BookingBody;
    const errors = validateBookingBody(body);

    if (errors.length > 0) {
      res.status(400).json({ error: errors.join('. ') });
      return;
    }

    const type = body.type as BookingType;
    const startDate = body.startDate!;
    const endDate = body.endDate!;
    const fullDays = body.fullDays === true;
    const startTime = fullDays ? '00:00' : body.startTime!;
    const endTime = fullDays ? '23:59' : body.endTime!;

    const [bookings, overrides] = await Promise.all([
      findBookingsBlockingAvailability(),
      AvailabilityOverride.find().select('startDate endDate type startTime endTime available'),
    ]);

    const check = fullDays
      ? isFullDaysRangeAvailable(type, startDate, endDate, bookings, overrides)
      : isRangeAvailable(type, startDate, endDate, startTime, endTime, bookings, overrides);
    if (!check.available) {
      res.status(409).json({ error: check.reason ?? 'This period is not available' });
      return;
    }

    const referenceCode = await createUniqueReferenceCode();
    const booking = await Booking.create({
      referenceCode,
      name: body.name!.trim(),
      phone: body.phone!.trim(),
      email: body.email!.trim().toLowerCase(),
      description: body.description!.trim(),
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      fullDays,
      activityLog: [{ action: 'created', by: 'customer', at: new Date() }],
    });

    void sendBookingReceivedEmail(booking)
      .then(() => booking.save())
      .catch((err) => console.error('[email] Received email error:', err));

    res.status(201).json({
      message: 'Booking request submitted successfully',
      emailEnabled: isEmailConfigured(),
      booking: {
        id: booking._id,
        referenceCode: booking.referenceCode,
        name: booking.name,
        type: booking.type,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        fullDays: booking.fullDays,
        status: booking.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
