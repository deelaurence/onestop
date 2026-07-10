import { sendEmail } from '../email/controller.js';
import { EMAIL_SENDER } from '../email/config.js';
import {
  renderBookingConfirmedEmail,
  renderBookingReceivedEmail,
} from '../email/templates/booking.js';
import { renderCustomEmail } from '../email/templates/custom.js';
import type { HydratedDocument } from 'mongoose';
import type { IBooking } from '../models/Booking.js';
import { appendActivity } from './booking-activity.js';

function replyTo() {
  const email = process.env.EMAIL_REPLY_TO ?? EMAIL_SENDER.email;
  return { email, name: EMAIL_SENDER.name };
}

export interface CustomEmailInput {
  toEmail: string;
  toName: string;
  subject: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  booking?: HydratedDocument<IBooking> | null;
  adminEmail?: string;
}

export async function sendCustomEmail(input: CustomEmailInput): Promise<boolean> {
  const { html, text } = renderCustomEmail({
    title: input.title,
    message: input.message,
    recipientName: input.toName,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    footerNote: input.footerNote,
    preheader: input.subject,
  });

  const sent = await sendEmail({
    to: { email: input.toEmail, name: input.toName },
    subject: input.subject,
    html,
    text,
    replyTo: replyTo(),
  });

  if (sent && input.booking) {
    appendActivity(
      input.booking,
      'email_sent',
      `Custom email: ${input.subject}`,
      input.adminEmail ?? 'admin',
    );
    await input.booking.save();
  }

  return sent;
}

export async function sendBookingReceivedEmail(booking: IBooking): Promise<boolean> {
  const { subject, html, text } = renderBookingReceivedEmail(booking);
  const sent = await sendEmail({
    to: { email: booking.email, name: booking.name },
    subject,
    html,
    text,
    replyTo: replyTo(),
  });
  if (sent) appendActivity(booking, 'email_sent', 'Request received email');
  return sent;
}

export async function sendBookingConfirmedEmail(booking: IBooking): Promise<boolean> {
  const { subject, html, text } = renderBookingConfirmedEmail(booking);
  const sent = await sendEmail({
    to: { email: booking.email, name: booking.name },
    subject,
    html,
    text,
    replyTo: replyTo(),
  });
  if (sent) appendActivity(booking, 'email_sent', 'Confirmation email');
  return sent;
}
