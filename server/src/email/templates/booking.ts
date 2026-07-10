import type { IBooking } from '../../models/Booking.js';
import { detailRow, detailTable, referenceBadge, renderEmailLayout } from './layout.js';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDates(booking: IBooking): string {
  if (booking.startDate === booking.endDate) return formatDate(booking.startDate);
  return `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;
}

function formatTimes(booking: IBooking): string {
  if (booking.fullDays) return 'Full available hours each day';
  return `${formatTime12h(booking.startTime)} – ${formatTime12h(booking.endTime)}`;
}

function bookingDetailsTable(booking: IBooking): string {
  return detailTable(
    [
      detailRow('Session', booking.type === 'studio' ? 'Studio Session' : 'Event'),
      detailRow('Dates', formatDates(booking)),
      detailRow('Times', formatTimes(booking)),
      detailRow('Name', booking.name),
    ].join(''),
  );
}

export function renderBookingReceivedEmail(booking: IBooking) {
  const html = renderEmailLayout({
    preheader: `We received your booking request — ref ${booking.referenceCode}`,
    title: 'Request received',
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${booking.name},</p>
      <p style="margin:0 0 12px;">Thank you for your booking request with Onestop Photography. We&apos;ve received your details and will review availability shortly.</p>
      ${referenceBadge(booking.referenceCode)}
      ${bookingDetailsTable(booking)}
      <p style="margin:16px 0 0;padding:14px 16px;background:#faf8f5;border-radius:10px;font-size:14px;color:#8a8078;">
        <strong style="color:#2a2520;">What happens next?</strong><br />
        We typically confirm bookings within <strong style="color:#2a2520;">24–48 hours</strong>. You&apos;ll receive another email once your session is confirmed.
      </p>
    `,
    footerNote: 'Keep your reference code handy if you need to contact us about this request.',
  });

  const text = [
    `Hi ${booking.name},`,
    '',
    'We received your booking request with Onestop Photography.',
    `Reference: ${booking.referenceCode}`,
    `Session: ${booking.type}`,
    `Dates: ${formatDates(booking)}`,
    `Times: ${formatTimes(booking)}`,
    '',
    'We typically confirm within 24–48 hours.',
  ].join('\n');

  return {
    subject: `Booking request received — ${booking.referenceCode}`,
    html,
    text,
  };
}

export function renderBookingConfirmedEmail(booking: IBooking) {
  const siteUrl = process.env.SITE_URL ?? 'https://onestopphotography.ca';

  const html = renderEmailLayout({
    preheader: `Your session is confirmed — ref ${booking.referenceCode}`,
    title: 'Booking confirmed',
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${booking.name},</p>
      <p style="margin:0 0 12px;">Great news — your session with Onestop Photography is <strong>confirmed</strong>. We look forward to seeing you!</p>
      ${referenceBadge(booking.referenceCode)}
      ${bookingDetailsTable(booking)}
      <p style="margin:16px 0 0;font-size:14px;color:#8a8078;">
        <strong style="color:#2a2520;">Before you arrive</strong><br />
        Bring a valid ID, arrive 10 minutes early, and wear outfits you&apos;re comfortable in. If anything changes, reply to this email.
      </p>
    `,
    ctaLabel: 'Visit our website',
    ctaHref: siteUrl,
    footerNote: 'Need to reschedule? Reply to this email as soon as possible.',
  });

  const text = [
    `Hi ${booking.name},`,
    '',
    'Your booking with Onestop Photography is confirmed.',
    `Reference: ${booking.referenceCode}`,
    `Session: ${booking.type}`,
    `Dates: ${formatDates(booking)}`,
    `Times: ${formatTimes(booking)}`,
  ].join('\n');

  return {
    subject: `Booking confirmed — ${booking.referenceCode}`,
    html,
    text,
  };
}
