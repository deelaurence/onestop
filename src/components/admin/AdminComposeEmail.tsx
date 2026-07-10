import { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { sendCustomEmail, type AdminBooking } from '../../lib/admin-api';

const DEFAULT_SITE = 'https://onestopphotography.ca';

export interface ComposeEmailPrefill {
  bookingId?: string;
  toEmail?: string;
  toName?: string;
  subject?: string;
  title?: string;
  message?: string;
}

interface Props {
  bookings: AdminBooking[];
  prefill?: ComposeEmailPrefill | null;
  onSent: (message: string) => void;
  onError: (message: string) => void;
}

const EMPTY = {
  bookingId: '',
  toEmail: '',
  toName: '',
  subject: '',
  title: '',
  message: '',
  ctaLabel: 'Visit our website',
  ctaHref: DEFAULT_SITE,
  footerNote: 'Questions? Reply to this email and our team will get back to you.',
};

export default function AdminComposeEmail({ bookings, prefill, onSent, onError }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [useManualRecipient, setUseManualRecipient] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    setForm((f) => ({
      ...f,
      bookingId: prefill.bookingId ?? f.bookingId,
      toEmail: prefill.toEmail ?? f.toEmail,
      toName: prefill.toName ?? f.toName,
      subject: prefill.subject ?? f.subject,
      title: prefill.title ?? f.title,
      message: prefill.message ?? f.message,
    }));
    setUseManualRecipient(!prefill.bookingId);
  }, [prefill]);

  const handleBookingChange = (bookingId: string) => {
    const booking = bookings.find((b) => b._id === bookingId);
    setForm((f) => ({
      ...f,
      bookingId,
      toEmail: booking?.email ?? '',
      toName: booking?.name ?? '',
      subject: booking?.referenceCode
        ? `Regarding your booking ${booking.referenceCode}`
        : f.subject,
      title: f.title || 'A message from Onestop Photography',
    }));
    setUseManualRecipient(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendCustomEmail({
        bookingId: useManualRecipient ? undefined : form.bookingId || undefined,
        toEmail: useManualRecipient ? form.toEmail : undefined,
        toName: useManualRecipient ? form.toName : undefined,
        subject: form.subject,
        title: form.title,
        message: form.message,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        footerNote: form.footerNote || undefined,
      });
      onSent(`Email sent to ${useManualRecipient ? form.toEmail : form.toName}`);
      setForm(EMPTY);
      setUseManualRecipient(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const canSend =
    form.subject.trim() &&
    form.title.trim() &&
    form.message.trim() &&
    (useManualRecipient ? form.toEmail.trim() && form.toName.trim() : form.bookingId);

  return (
    <form className="admin-compose-email" onSubmit={(e) => void handleSubmit(e)}>
      <h3><Mail size={18} /> Compose email</h3>
      <p className="book-muted">
        Write plain text below — it will be wrapped in the Onestop branded email template and sent from Tony Williams.
      </p>

      <label className="book-field admin-compose-toggle">
        <input
          type="checkbox"
          checked={useManualRecipient}
          onChange={(e) => setUseManualRecipient(e.target.checked)}
        />
        <span>Send to a custom address (not from bookings list)</span>
      </label>

      {!useManualRecipient ? (
        <label className="book-field">
          <span>Recipient (booking)</span>
          <select
            value={form.bookingId}
            onChange={(e) => handleBookingChange(e.target.value)}
            required={!useManualRecipient}
          >
            <option value="">Select a client…</option>
            {bookings.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} — {b.email}
                {b.referenceCode ? ` (${b.referenceCode})` : ''}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="admin-form-grid">
          <label className="book-field">
            <span>Recipient name</span>
            <input
              value={form.toName}
              onChange={(e) => setForm({ ...form, toName: e.target.value })}
              placeholder="Jane Doe"
              required
            />
          </label>
          <label className="book-field">
            <span>Recipient email</span>
            <input
              type="email"
              value={form.toEmail}
              onChange={(e) => setForm({ ...form, toEmail: e.target.value })}
              placeholder="client@example.com"
              required
            />
          </label>
        </div>
      )}

      <div className="admin-form-grid">
        <label className="book-field">
          <span>Email subject</span>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Regarding your session…"
            required
          />
        </label>
        <label className="book-field">
          <span>Header title (in template)</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="A message from Onestop Photography"
            required
          />
        </label>
      </div>

      <label className="book-field">
        <span>Message</span>
        <textarea
          rows={8}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={'Hi,\n\nThank you for booking with us…\n\nBest,\nTony'}
          required
        />
      </label>

      <div className="admin-form-grid">
        <label className="book-field">
          <span>Button label (optional)</span>
          <input
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
            placeholder="Visit our website"
          />
        </label>
        <label className="book-field">
          <span>Button link (optional)</span>
          <input
            type="url"
            value={form.ctaHref}
            onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
            placeholder={DEFAULT_SITE}
          />
        </label>
      </div>

      <label className="book-field">
        <span>Footer note (optional)</span>
        <input
          value={form.footerNote}
          onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
        />
      </label>

      <button type="submit" className="cta-button" disabled={!canSend || sending}>
        <Send size={16} /> {sending ? 'Sending…' : 'Send branded email'}
      </button>
    </form>
  );
}
