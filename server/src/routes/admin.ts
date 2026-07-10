import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser.js';
import { Booking } from '../models/Booking.js';
import { AvailabilityOverride } from '../models/AvailabilityOverride.js';
import { requireAdmin, signToken } from '../middleware/auth.js';
import { appendActivity } from '../services/booking-activity.js';
import { sendBookingConfirmedEmail, sendCustomEmail } from '../services/booking-emails.js';
import { isEmailConfigured } from '../email/controller.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ adminId: String(admin._id), email: admin.email });

    res.json({
      token,
      admin: { email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/bookings', requireAdmin, async (_req, res) => {
  try {
    const rows = await Booking.find()
      .sort({ createdAt: -1 })
      .select(
        'referenceCode name email phone type startDate endDate date startTime endTime fullDays status description adminNote activityLog createdAt',
      )
      .lean();

    const bookings = rows.map((row) => {
      const legacy = row as typeof row & { date?: string };
      const startDate = legacy.startDate ?? legacy.date ?? null;
      const endDate = legacy.endDate ?? legacy.date ?? legacy.startDate ?? null;
      return { ...legacy, startDate, endDate };
    });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.patch('/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const { status, notify, adminNote } = req.body as {
      status?: string;
      notify?: boolean;
      adminNote?: string;
    };
    const auth = req.admin;
    const adminEmail = auth?.email ?? 'admin';

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (status !== undefined) {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      if (booking.status !== status) {
        booking.status = status as typeof booking.status;
        appendActivity(booking, status as 'confirmed' | 'cancelled' | 'pending', undefined, adminEmail);
      }
    }

    if (adminNote !== undefined) {
      const trimmed = adminNote.trim();
      if (trimmed !== (booking.adminNote ?? '')) {
        booking.adminNote = trimmed || undefined;
        appendActivity(booking, 'note_updated', trimmed ? 'Note saved' : 'Note cleared', adminEmail);
      }
    }

    await booking.save();

    let emailSent = false;
    if (status === 'confirmed' && notify) {
      emailSent = await sendBookingConfirmedEmail(booking);
      if (emailSent) await booking.save();
    }

    res.json({
      booking,
      emailSent: notify ? emailSent : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/emails/send', requireAdmin, async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      res.status(503).json({ error: 'Email is not configured on the server' });
      return;
    }

    const {
      bookingId,
      toEmail,
      toName,
      subject,
      title,
      message,
      ctaLabel,
      ctaHref,
      footerNote,
    } = req.body as {
      bookingId?: string;
      toEmail?: string;
      toName?: string;
      subject?: string;
      title?: string;
      message?: string;
      ctaLabel?: string;
      ctaHref?: string;
      footerNote?: string;
    };

    if (!subject?.trim() || !title?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Subject, title, and message are required' });
      return;
    }

    let booking = null;
    let recipientEmail = toEmail?.trim().toLowerCase() ?? '';
    let recipientName = toName?.trim() ?? '';

    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      recipientEmail = booking.email;
      recipientName = booking.name;
    }

    if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
      res.status(400).json({ error: 'Valid recipient email is required' });
      return;
    }
    if (!recipientName) {
      res.status(400).json({ error: 'Recipient name is required' });
      return;
    }

    const sent = await sendCustomEmail({
      toEmail: recipientEmail,
      toName: recipientName,
      subject: subject.trim(),
      title: title.trim(),
      message: message.trim(),
      ctaLabel: ctaLabel?.trim() || undefined,
      ctaHref: ctaHref?.trim() || undefined,
      footerNote: footerNote?.trim() || undefined,
      booking,
      adminEmail: req.admin?.email,
    });

    if (!sent) {
      res.status(502).json({ error: 'Failed to send email' });
      return;
    }

    res.json({ message: 'Email sent', emailSent: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.get('/overrides', requireAdmin, async (_req, res) => {
  try {
    const overrides = await AvailabilityOverride.find().sort({ startDate: 1 });
    res.json({ overrides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch overrides' });
  }
});

router.post('/overrides', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, type, startTime, endTime, available, note } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      res.status(400).json({ error: 'Valid start and end dates are required' });
      return;
    }
    if (typeof available !== 'boolean') {
      res.status(400).json({ error: 'available must be true or false' });
      return;
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      res.status(400).json({ error: 'Both start and end times are required for partial overrides' });
      return;
    }

    const override = await AvailabilityOverride.create({
      startDate,
      endDate,
      type: type ?? 'all',
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      available,
      note: note?.trim(),
    });

    res.status(201).json({ override });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create override' });
  }
});

router.delete('/overrides/:id', requireAdmin, async (req, res) => {
  try {
    const result = await AvailabilityOverride.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Override not found' });
      return;
    }
    res.json({ message: 'Override deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete override' });
  }
});

export default router;
