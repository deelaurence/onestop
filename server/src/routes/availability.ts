import { Router } from 'express';
import { AvailabilityOverride } from '../models/AvailabilityOverride.js';
import { findBookingsBlockingAvailability } from '../services/booking-availability.js';
import {
  getDayHours,
  getFullDaysPerDayStatus,
  getMonthAvailability,
  getValidTimeOptions,
  isFullDaysRangeAvailable,
  isRangeAvailable,
} from '../services/availability.js';
import type { BookingType } from '../types.js';

const router = Router();

function parseBookingType(value: unknown): BookingType | null {
  return value === 'studio' || value === 'event' ? value : null;
}

async function loadContext() {
  const [bookings, overrides] = await Promise.all([
    findBookingsBlockingAvailability(),
    AvailabilityOverride.find().select('startDate endDate type startTime endTime available'),
  ]);
  return { bookings, overrides };
}

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

    const { bookings, overrides } = await loadContext();
    const days = getMonthAvailability(type, year, month, bookings, overrides);

    res.json({ year, month, type, days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch month availability' });
  }
});

router.get('/hours', async (req, res) => {
  try {
    const date = String(req.query.date ?? '');
    const type = parseBookingType(req.query.type);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date.' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Invalid type.' });
      return;
    }

    const overrides = await AvailabilityOverride.find().select(
      'startDate endDate type startTime endTime available',
    );
    const windows = getDayHours(type, date, overrides);

    res.json({ date, type, windows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hours' });
  }
});

router.get('/range-hours', async (req, res) => {
  try {
    const startDate = String(req.query.startDate ?? '');
    const endDate = String(req.query.endDate ?? startDate);
    const type = parseBookingType(req.query.type);
    const fullDays = req.query.fullDays === '1' || req.query.fullDays === 'true';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      res.status(400).json({ error: 'Invalid date range.' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Invalid type.' });
      return;
    }
    if (startDate > endDate) {
      res.status(400).json({ error: 'End date must be on or after start date.' });
      return;
    }

    const { bookings, overrides } = await loadContext();

    if (fullDays) {
      const perDay = getFullDaysPerDayStatus(type, startDate, endDate, bookings, overrides);
      const rangeCheck = isFullDaysRangeAvailable(type, startDate, endDate, bookings, overrides);
      res.json({
        startDate,
        endDate,
        type,
        fullDays: true,
        available: rangeCheck.available,
        reason: rangeCheck.reason,
        window: null,
        starts: [],
        endsForStart: {},
        perDay,
      });
      return;
    }

    const options = getValidTimeOptions(type, startDate, endDate, bookings, overrides);

    res.json({ startDate, endDate, type, ...options });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch range hours' });
  }
});

router.post('/check', async (req, res) => {
  try {
    const { type, startDate, endDate, startTime, endTime, fullDays } = req.body;
    const bookingType = parseBookingType(type);

    if (!bookingType) {
      res.status(400).json({ error: 'Invalid type.' });
      return;
    }

    const { bookings, overrides } = await loadContext();
    const result = fullDays
      ? isFullDaysRangeAvailable(
          bookingType,
          startDate,
          endDate ?? startDate,
          bookings,
          overrides,
        )
      : isRangeAvailable(
          bookingType,
          startDate,
          endDate ?? startDate,
          startTime,
          endTime,
          bookings,
          overrides,
        );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
