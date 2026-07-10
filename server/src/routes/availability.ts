import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import {
  filterAvailableSlots,
  getMonthAvailability,
  isSlotAvailable,
} from '../services/availability.js';
import type { BookingType } from '../types.js';

const router = Router();

function parseBookingType(value: unknown): BookingType | null {
  return value === 'studio' || value === 'event' ? value : null;
}

router.get('/day', async (req, res) => {
  try {
    const date = String(req.query.date ?? '');
    const type = parseBookingType(req.query.type);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date. Use YYYY-MM-DD.' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Invalid type. Use studio or event.' });
      return;
    }

    const bookings = await Booking.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    const slots = filterAvailableSlots(type, date, bookings);

    res.json({ date, type, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

router.get('/month', async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const type = parseBookingType(req.query.type);

    if (!year || !month || month < 1 || month > 12) {
      res.status(400).json({ error: 'Invalid year or month.' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Invalid type. Use studio or event.' });
      return;
    }

    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const bookings = await Booking.find({
      date: { $regex: `^${prefix}` },
      status: { $ne: 'cancelled' },
    }).select('date startTime endTime');

    const bookedByDate = new Map<string, Array<{ startTime: string; endTime: string }>>();
    for (const b of bookings) {
      const list = bookedByDate.get(b.date) ?? [];
      list.push({ startTime: b.startTime, endTime: b.endTime });
      bookedByDate.set(b.date, list);
    }

    const days = getMonthAvailability(type, year, month, bookedByDate);

    res.json({ year, month, type, days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch month availability' });
  }
});

router.post('/check', async (req, res) => {
  try {
    const { date, type, startTime, endTime } = req.body;
    const bookingType = parseBookingType(type);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date.' });
      return;
    }
    if (!bookingType) {
      res.status(400).json({ error: 'Invalid type.' });
      return;
    }

    const bookings = await Booking.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    const available = isSlotAvailable(bookingType, date, startTime, endTime, bookings);
    res.json({ available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
