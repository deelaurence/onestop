import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOff, CalendarPlus, ChevronDown, Copy, LogOut, Mail, Phone, RefreshCw, Send } from 'lucide-react';
import AdminComposeEmail, { type ComposeEmailPrefill } from '../../components/admin/AdminComposeEmail';
import OverridePreviewCalendar from '../../components/admin/OverridePreviewCalendar';
import {
  activityLabel,
  clearAdminToken,
  createOverride,
  deleteOverride,
  fetchAdminBookings,
  fetchOverrides,
  filterBookings,
  getAdminToken,
  updateBookingNote,
  updateBookingStatus,
  type AdminBooking,
  type AvailabilityOverride,
  type BookingFilter,
} from '../../lib/admin-api';
import { shiftOverrideDates } from '../../lib/override-preview';
import { formatDateShort, formatTime12h } from '../../lib/api';
import { phoneToTelUri } from '../../lib/phone-codes';

function formatBookingDates(booking: AdminBooking): string {
  if (!booking.startDate && !booking.endDate) return '—';
  if (booking.startDate === booking.endDate) return formatDateShort(booking.startDate);
  return `${formatDateShort(booking.startDate)} – ${formatDateShort(booking.endDate)}`;
}

function formatBookingTimes(booking: AdminBooking): string {
  if (booking.fullDays) return 'Full hours each day';
  if (booking.startTime && booking.endTime) {
    return `${formatTime12h(booking.startTime)} – ${formatTime12h(booking.endTime)}`;
  }
  return '—';
}

function BookingStatusActions({
  booking,
  onStatus,
  onConfirmNotify,
  busy,
}: {
  booking: AdminBooking;
  onStatus: (id: string, status: string) => void;
  onConfirmNotify: (id: string) => void;
  busy?: boolean;
}) {
  return (
    <div className="admin-status-actions-inner">
      <span className={`admin-badge admin-badge--${booking.status}`}>{booking.status}</span>
      <div className="admin-actions">
        {booking.status !== 'confirmed' ? (
          <>
            <button
              type="button"
              className="admin-action-confirm"
              disabled={busy}
              onClick={() => onConfirmNotify(booking._id)}
            >
              Confirm &amp; notify
            </button>
            <button
              type="button"
              className="admin-action-confirm admin-action-confirm--quiet"
              disabled={busy}
              onClick={() => onStatus(booking._id, 'confirmed')}
            >
              Confirm only
            </button>
          </>
        ) : (
          <span className="admin-action-slot" aria-hidden />
        )}
        {booking.status !== 'cancelled' ? (
          <button type="button" className="admin-action-cancel" disabled={busy} onClick={() => onStatus(booking._id, 'cancelled')}>
            Cancel
          </button>
        ) : (
          <span className="admin-action-slot" aria-hidden />
        )}
      </div>
    </div>
  );
}

function ActivityLog({ booking }: { booking: AdminBooking }) {
  const entries = [...(booking.activityLog ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  if (entries.length === 0) return null;

  return (
    <div className="admin-activity-log">
      <p><strong>Activity</strong></p>
      <ul>
        {entries.map((entry, i) => (
          <li key={`${entry.at}-${i}`}>
            <span>{activityLabel(entry)}</span>
            <small>
              {new Date(entry.at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {entry.by ? ` · ${entry.by}` : ''}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminNoteField({
  booking,
  onSave,
}: {
  booking: AdminBooking;
  onSave: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState(booking.adminNote ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(booking.adminNote ?? '');
  }, [booking.adminNote, booking._id]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(booking._id, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-note-field">
      <label className="book-field">
        <span>Internal note (admin only)</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes visible only to admins…"
        />
      </label>
      <button type="button" className="admin-icon-btn" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save note'}
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'bookings' | 'overrides' | 'compose'>('bookings');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [composePrefill, setComposePrefill] = useState<ComposeEmailPrefill | null>(null);

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as 'all' | 'studio' | 'event',
    startTime: '',
    endTime: '',
    available: false,
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, o] = await Promise.all([fetchAdminBookings(), fetchOverrides()]);
      setBookings(b.bookings);
      setOverrides(o.overrides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      if (err instanceof Error && err.message.includes('Authentication')) {
        clearAdminToken();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [load, navigate]);

  const handleStatus = async (id: string, status: string, notify = false) => {
    setStatusBusyId(id);
    try {
      const result = await updateBookingStatus(id, status, notify);
      if (notify && result.emailSent === false) {
        setToast('Booking updated, but confirmation email could not be sent (check email config).');
      } else if (notify && result.emailSent) {
        setToast('Booking confirmed and customer notified.');
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setStatusBusyId(null);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleConfirmNotify = (id: string) => {
    void handleStatus(id, 'confirmed', true);
  };

  const handleSaveNote = async (id: string, adminNote: string) => {
    try {
      await updateBookingNote(id, adminNote);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOverride({
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        type: form.type,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        available: form.available,
        note: form.note || undefined,
      });
      setForm({ startDate: '', endDate: '', type: 'all', startTime: '', endTime: '', available: false, note: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create override');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Delete this override?')) return;
    try {
      await deleteOverride(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const logout = () => {
    clearAdminToken();
    navigate('/admin/login');
  };

  const toggleBooking = (id: string) => {
    setExpandedBookingId((current) => (current === id ? null : id));
  };

  const openComposeForBooking = (booking: AdminBooking) => {
    setComposePrefill({
      bookingId: booking._id,
      toEmail: booking.email,
      toName: booking.name,
      subject: booking.referenceCode
        ? `Regarding your booking ${booking.referenceCode}`
        : `Regarding your Onestop Photography booking`,
      title: 'A message from Onestop Photography',
    });
    setTab('compose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicateOverrideToForm = (o: AvailabilityOverride) => {
    setForm({
      startDate: o.startDate,
      endDate: o.endDate,
      type: o.type,
      startTime: o.startTime ?? '',
      endTime: o.endTime ?? '',
      available: o.available,
      note: o.note ? `${o.note} (copy)` : '',
    });
    setTab('overrides');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shiftFormToNextWeek = () => {
    if (!form.startDate) return;
    const shifted = shiftOverrideDates(form.startDate, form.endDate || form.startDate, 7);
    setForm((f) => ({ ...f, ...shifted }));
  };

  const filteredBookings = filterBookings(bookings, bookingFilter);

  const BOOKING_FILTERS: { id: BookingFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
  ];

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Bookings and manual availability controls</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-icon-btn" onClick={load} aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
          <button type="button" className="admin-icon-btn" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="admin-tabs">
        <button type="button" className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>
          Bookings ({bookings.length})
        </button>
        <button type="button" className={tab === 'overrides' ? 'active' : ''} onClick={() => setTab('overrides')}>
          Overrides ({overrides.length})
        </button>
        <button type="button" className={tab === 'compose' ? 'active' : ''} onClick={() => { setComposePrefill(null); setTab('compose'); }}>
          <Send size={14} /> Compose email
        </button>
      </div>

      {error && <p className="book-error book-error--global">{error}</p>}
      {toast && <p className="admin-toast">{toast}</p>}
      {loading && <p className="book-muted">Loading…</p>}

      {!loading && tab === 'bookings' && (
        <>
          <div className="admin-filter-chips">
            {BOOKING_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`admin-filter-chip${bookingFilter === f.id ? ' active' : ''}`}
                onClick={() => setBookingFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="admin-table-wrap admin-bookings-desktop">
            {filteredBookings.length === 0 ? (
              <p className="book-muted">No bookings match this filter.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Times</th>
                    <th>Status &amp; actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td><code className="admin-ref">{b.referenceCode ?? '—'}</code></td>
                      <td>
                        <strong>{b.name}</strong>
                        <div className="admin-client-meta">
                          <small>{b.email}<br />{b.phone || '—'}</small>
                          <div className="admin-contact-links">
                            {b.phone && (
                              <a
                                href={`tel:${phoneToTelUri(b.phone)}`}
                                className="admin-contact-btn admin-contact-btn--call"
                                aria-label={`Call ${b.name}`}
                                title={`Call ${b.phone}`}
                              >
                                <Phone size={15} />
                              </a>
                            )}
                            {b.email && (
                              <a
                                href={`mailto:${b.email}`}
                                className="admin-contact-btn admin-contact-btn--email"
                                aria-label={`Email ${b.name}`}
                                title={`Email ${b.email}`}
                              >
                                <Mail size={15} />
                              </a>
                            )}
                            {b.email && (
                              <button
                                type="button"
                                className="admin-contact-btn admin-contact-btn--compose"
                                aria-label={`Send branded email to ${b.name}`}
                                title="Send branded email"
                                onClick={() => openComposeForBooking(b)}
                              >
                                <Send size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{b.type}</td>
                      <td>{formatBookingDates(b)}</td>
                      <td>{formatBookingTimes(b)}</td>
                      <td className="admin-status-actions">
                        <BookingStatusActions
                          booking={b}
                          onStatus={(id, status) => void handleStatus(id, status)}
                          onConfirmNotify={handleConfirmNotify}
                          busy={statusBusyId === b._id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-booking-cards admin-bookings-mobile">
            {filteredBookings.length === 0 ? (
              <p className="book-muted">No bookings match this filter.</p>
            ) : (
              filteredBookings.map((b) => {
                const isOpen = expandedBookingId === b._id;
                return (
                  <article key={b._id} className={`admin-booking-card${isOpen ? ' admin-booking-card--open' : ''}`}>
                    <button
                      type="button"
                      className="admin-booking-card-summary"
                      onClick={() => toggleBooking(b._id)}
                      aria-expanded={isOpen}
                    >
                      <div className="admin-booking-card-main">
                        <strong>{b.name}</strong>
                        <span className="admin-booking-card-meta">
                          {b.referenceCode && <code className="admin-ref">{b.referenceCode}</code>}
                          {formatBookingDates(b)} · {b.type}
                        </span>
                      </div>
                      <span className={`admin-badge admin-badge--${b.status}`}>{b.status}</span>
                      <ChevronDown size={18} className="admin-booking-card-chevron" aria-hidden />
                    </button>

                    {isOpen && (
                      <div className="admin-booking-card-details">
                        <dl className="admin-booking-detail-list">
                          {b.referenceCode && (
                            <div><dt>Reference</dt><dd><code className="admin-ref">{b.referenceCode}</code></dd></div>
                          )}
                          <div><dt>Email</dt><dd>{b.email || '—'}</dd></div>
                          <div><dt>Phone</dt><dd>{b.phone || '—'}</dd></div>
                          <div><dt>Dates</dt><dd>{formatBookingDates(b)}</dd></div>
                          <div><dt>Times</dt><dd>{formatBookingTimes(b)}</dd></div>
                          {b.description && (
                            <div><dt>Description</dt><dd>{b.description}</dd></div>
                          )}
                        </dl>

                        <div className="admin-booking-card-contact">
                          {b.phone && (
                            <a
                              href={`tel:${phoneToTelUri(b.phone)}`}
                              className="admin-contact-btn admin-contact-btn--call"
                              aria-label={`Call ${b.name}`}
                            >
                              <Phone size={15} /> Call
                            </a>
                          )}
                          {b.email && (
                            <a
                              href={`mailto:${b.email}`}
                              className="admin-contact-btn admin-contact-btn--email"
                              aria-label={`Email ${b.name}`}
                            >
                              <Mail size={15} /> Email
                            </a>
                          )}
                          {b.email && (
                            <button
                              type="button"
                              className="admin-contact-btn admin-contact-btn--compose"
                              onClick={() => openComposeForBooking(b)}
                            >
                              <Send size={15} /> Branded email
                            </button>
                          )}
                        </div>

                        <AdminNoteField booking={b} onSave={handleSaveNote} />
                        <ActivityLog booking={b} />

                        <BookingStatusActions
                          booking={b}
                          onStatus={(id, status) => void handleStatus(id, status)}
                          onConfirmNotify={handleConfirmNotify}
                          busy={statusBusyId === b._id}
                        />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {!loading && tab === 'overrides' && (
        <div className="admin-overrides">
          <form className="admin-override-form" onSubmit={handleCreateOverride}>
            <h3><CalendarPlus size={18} /> Add override</h3>
            <p className="book-muted">
              Block a day (available = off) or open extra hours (available = on). Leave times empty for full-day effect. Both times required for partial overrides.
            </p>
            <OverridePreviewCalendar
              startDate={form.startDate}
              endDate={form.endDate || form.startDate}
              available={form.available}
            />
            <div className="admin-override-actions-row">
              <button type="button" className="admin-icon-btn" disabled={!form.startDate} onClick={shiftFormToNextWeek}>
                Shift to next week
              </button>
            </div>
            <div className="admin-form-grid">
              <label className="book-field"><span>Start date</span><input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
              <label className="book-field"><span>End date</span><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
              <label className="book-field">
                <span>Type</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
                  <option value="all">All</option>
                  <option value="studio">Studio</option>
                  <option value="event">Event</option>
                </select>
              </label>
              <label className="book-field">
                <span>Available?</span>
                <select value={form.available ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, available: e.target.value === 'yes' })}>
                  <option value="no">Block (unavailable)</option>
                  <option value="yes">Open (force available)</option>
                </select>
              </label>
              <label className="book-field"><span>Start time (optional)</span><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label>
              <label className="book-field"><span>End time (optional)</span><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></label>
            </div>
            <label className="book-field"><span>Note</span><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason for override" /></label>
            <button type="submit" className="cta-button">Save override</button>
          </form>

          <div className="admin-override-list">
            <h3><CalendarOff size={18} /> Active overrides</h3>
            {overrides.length === 0 ? (
              <p className="book-muted">No overrides configured.</p>
            ) : (
              <ul>
                {overrides.map((o) => (
                  <li key={o._id} className="admin-override-item">
                    <div>
                      <strong className={o.available ? 'text-open' : 'text-block'}>
                        {o.available ? 'OPEN' : 'BLOCKED'}
                      </strong>{' '}
                      {o.startDate === o.endDate ? formatDateShort(o.startDate) : `${formatDateShort(o.startDate)} – ${formatDateShort(o.endDate)}`}
                      {' · '}{o.type}
                      {o.startTime && o.endTime && ` · ${formatTime12h(o.startTime)}–${formatTime12h(o.endTime)}`}
                      {o.note && <p className="book-muted">{o.note}</p>}
                    </div>
                    <div className="admin-override-item-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => duplicateOverrideToForm(o)} title="Duplicate to form">
                        <Copy size={14} /> Duplicate
                      </button>
                      <button type="button" className="admin-delete-btn" onClick={() => handleDeleteOverride(o._id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'compose' && (
        <AdminComposeEmail
          bookings={bookings}
          prefill={composePrefill}
          onSent={(msg) => {
            setToast(msg);
            setComposePrefill(null);
            load();
            setTimeout(() => setToast(''), 4000);
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </section>
  );
}
