import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import { isSlotAvailable } from '../services/availability.js';
import type { BookingType } from '../types.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^\d{2}:\d{2}$/;

interface BookingBody {
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  type?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

function validateBookingBody(body: BookingBody) {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push('Name is required');
  if (!body.phone?.trim()) errors.push('Phone number is required');
  if (!body.email?.trim() || !EMAIL_RE.test(body.email.trim())) errors.push('Valid email is required');
  if (!body.description?.trim()) errors.push('Description is required');
  if (body.type !== 'studio' && body.type !== 'event') errors.push('Type must be studio or event');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '')) errors.push('Valid date is required');
  if (!TIME_RE.test(body.startTime ?? '')) errors.push('Valid start time is required');
  if (!TIME_RE.test(body.endTime ?? '')) errors.push('Valid end time is required');

  return errors;
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
    const date = body.date!;
    const startTime = body.startTime!;
    const endTime = body.endTime!;

    const existing = await Booking.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    if (!isSlotAvailable(type, date, startTime, endTime, existing)) {
      res.status(409).json({ error: 'This time slot is no longer available' });
      return;
    }

    const booking = await Booking.create({
      name: body.name!.trim(),
      phone: body.phone!.trim(),
      email: body.email!.trim().toLowerCase(),
      description: body.description!.trim(),
      type,
      date,
      startTime,
      endTime,
    });

    res.status(201).json({
      message: 'Booking request submitted successfully',
      booking: {
        id: booking._id,
        name: booking.name,
        type: booking.type,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ date: 1, startTime: 1 })
      .select('name email phone type date startTime endTime status description createdAt');

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;
