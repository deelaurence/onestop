import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Camera, PartyPopper, CheckCircle2 } from 'lucide-react';
import {
  createBooking,
  fetchDaySlots,
  fetchMonthAvailability,
  formatDateLabel,
  formatTime12h,
  type BookingType,
  type DayAvailability,
  type TimeSlot,
} from '../lib/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BookPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [type, setType] = useState<BookingType>('studio');
  const [monthDays, setMonthDays] = useState<DayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setError('');
    try {
      const data = await fetchMonthAvailability(viewYear, viewMonth, type);
      setMonthDays(data.days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoadingMonth(false);
    }
  }, [viewYear, viewMonth, type]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
  }, [type, viewYear, viewMonth]);

  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setError('');
    try {
      const data = await fetchDaySlots(date, type);
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time slots');
    } finally {
      setLoadingSlots(false);
    }
  }, [type]);

  const handleSelectDate = (date: string, available: boolean) => {
    if (!available) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    loadSlots(date);
  };

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const availabilityMap = new Map(monthDays.map((d) => [d.date, d]));
    const cells: Array<{ key: string; day?: number; date?: string; available?: boolean }> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const info = availabilityMap.get(dateStr);
      cells.push({
        key: dateStr,
        day,
        date: dateStr,
        available: info?.available ?? false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, monthDays]);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setError('');

    try {
      await createBooking({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim(),
        type,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="standalone-page standalone-page--book">
        <div className="book-success">
          <div className="book-success-icon">
            <CheckCircle2 size={32} />
          </div>
          <h1>Booking request received</h1>
          <p>
            Thank you, {name}. We&apos;ve received your request for{' '}
            {selectedDate && formatDateLabel(selectedDate)}
            {selectedSlot && ` at ${formatTime12h(selectedSlot.start)}`}.
            We&apos;ll confirm within one business day.
          </p>
          <button
            type="button"
            className="cta-button"
            onClick={() => {
              setSuccess(false);
              setName('');
              setPhone('');
              setEmail('');
              setDescription('');
              setSelectedDate(null);
              setSelectedSlot(null);
              loadMonth();
            }}
          >
            Book another session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="standalone-page standalone-page--book">
      <header className="standalone-page-header">
        <span className="standalone-page-label">Book a Session</span>
        <h1>Reserve your <em>spot</em></h1>
        <p>
          Choose your session type, pick an available date, and tell us about your vision.
          Studio sessions follow our weekly schedule; events can be booked any time.
        </p>
      </header>

      <div className="book-type-selector">
        <button
          type="button"
          className={`book-type-card${type === 'studio' ? ' book-type-card--active' : ''}`}
          onClick={() => setType('studio')}
        >
          <div className="book-type-icon"><Camera size={20} /></div>
          <div>
            <h3>Studio Session</h3>
            <p>Fri &amp; Sat: 9am – 10pm · Other days: 4:30pm – 10pm</p>
          </div>
        </button>
        <button
          type="button"
          className={`book-type-card${type === 'event' ? ' book-type-card--active' : ''}`}
          onClick={() => setType('event')}
        >
          <div className="book-type-icon book-type-icon--event"><PartyPopper size={20} /></div>
          <div>
            <h3>Event</h3>
            <p>Birthdays, weddings &amp; celebrations — any time of day</p>
          </div>
        </button>
      </div>

      <div className="book-layout">
        <div className="book-calendar-panel">
          <div className="book-calendar-header">
            <button type="button" className="book-nav-btn" onClick={prevMonth} aria-label="Previous month">
              <ArrowLeft size={18} />
            </button>
            <h2>
              <Calendar size={18} />
              {MONTHS[viewMonth - 1]} {viewYear}
            </h2>
            <button type="button" className="book-nav-btn" onClick={nextMonth} aria-label="Next month">
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="book-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={`book-calendar-grid${loadingMonth ? ' book-calendar-grid--loading' : ''}`}>
            {calendarCells.map((cell) =>
              cell.day ? (
                <button
                  key={cell.key}
                  type="button"
                  className={[
                    'book-day',
                    cell.available ? 'book-day--available' : 'book-day--unavailable',
                    selectedDate === cell.date ? 'book-day--selected' : '',
                  ].join(' ')}
                  disabled={!cell.available}
                  onClick={() => handleSelectDate(cell.date!, cell.available!)}
                >
                  {cell.day}
                </button>
              ) : (
                <span key={cell.key} className="book-day book-day--empty" />
              ),
            )}
          </div>

          <div className="book-legend">
            <span><i className="book-legend-dot book-legend-dot--available" /> Available</span>
            <span><i className="book-legend-dot book-legend-dot--unavailable" /> Unavailable</span>
          </div>
        </div>

        <div className="book-details-panel">
          {selectedDate ? (
            <>
              <h3>{formatDateLabel(selectedDate)}</h3>
              <p className="book-slots-label">Select a time slot</p>

              {loadingSlots ? (
                <p className="book-muted">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="book-muted">No slots available for this date.</p>
              ) : (
                <div className="book-slots">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      className={`book-slot${selectedSlot?.start === slot.start ? ' book-slot--selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime12h(slot.start)} – {formatTime12h(slot.end)}
                    </button>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <form className="book-form" onSubmit={handleSubmit}>
                  <h3>Your details</h3>

                  <label className="book-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </label>

                  <label className="book-field">
                    <span>Phone number</span>
                    <input
                      type="tel"
                      required
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (234) 567 890"
                    />
                  </label>

                  <label className="book-field">
                    <span>Email</span>
                    <input
                      type="email"
                      required
                      maxLength={200}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="book-field">
                    <span>Short description</span>
                    <textarea
                      required
                      maxLength={500}
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us about your session — style, headcount, location, etc."
                    />
                  </label>

                  {error && <p className="book-error">{error}</p>}

                  <button type="submit" className="cta-button book-submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Request Booking'}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="book-placeholder">
              <Calendar size={40} />
              <p>Select an available date to see time slots</p>
            </div>
          )}
        </div>
      </div>

      {error && !selectedSlot && <p className="book-error book-error--global">{error}</p>}
    </section>
  );
}
