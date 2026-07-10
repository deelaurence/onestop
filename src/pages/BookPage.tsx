import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Info,
  PartyPopper,
  User,
} from 'lucide-react';
import CalendarPicker from '../components/booking/CalendarPicker';
import PhoneField from '../components/booking/PhoneField';
import {
  checkAvailability,
  createBooking,
  fetchMonthAvailability,
  fetchRangeHours,
  formatDateLabel,
  formatDateShort,
  formatTime12h,
  type BookingType,
  type DayAvailability,
  type DayRangeStatus,
  type RangeTimeOptions,
} from '../lib/api';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  formatFullPhone,
  isValidLocalPhone,
} from '../lib/phone-codes';
import { isReducedPerformance } from '../lib/performance';
import {
  buildBookingSummaryText,
  clearBookingDraft,
  loadBookingDraft,
  saveBookingDraft,
} from '../lib/booking-draft';

const STEPS = ['Session', 'Dates', 'Times', 'Details', 'Review'] as const;
const WHAT_TO_BRING = [
  'Valid ID for check-in',
  'Arrive 10 minutes before your session',
  'Outfits ready — plan 1–2 looks per hour',
  'Any props or references you want captured',
];
type DateMode = 'single' | 'multi';

function visibleIndexToStep(visibleIndex: number, isMultiDay: boolean): number {
  if (!isMultiDay || visibleIndex <= 1) return visibleIndex;
  return visibleIndex + 1;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="wizard-hint">
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}

export default function BookPage() {
  const today = new Date();
  const reducedMotion = isReducedPerformance();
  const [step, setStep] = useState(0);
  const [transitionDir, setTransitionDir] = useState(1);
  const [type, setType] = useState<BookingType | null>(null);
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [name, setName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY_CODE);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [monthDays, setMonthDays] = useState<DayAvailability[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');

  const [timeOptions, setTimeOptions] = useState<RangeTimeOptions | null>(null);
  const [rangeAvailable, setRangeAvailable] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    const draft = loadBookingDraft();
    if (!draft) return;
    setStep(draft.step);
    setType(draft.type);
    setDateMode(draft.dateMode);
    setStartDate(draft.startDate);
    setEndDate(draft.endDate);
    setStartTime(draft.startTime);
    setEndTime(draft.endTime);
    setName(draft.name);
    setPhoneCountryCode(draft.phoneCountryCode);
    setPhoneLocal(draft.phoneLocal);
    setEmail(draft.email);
    setDescription(draft.description);
    setDraftRestored(true);
  }, []);

  useEffect(() => {
    if (success) return;
    saveBookingDraft({
      step,
      type,
      dateMode,
      startDate,
      endDate,
      startTime,
      endTime,
      name,
      phoneCountryCode,
      phoneLocal,
      email,
      description,
    });
  }, [
    success,
    step,
    type,
    dateMode,
    startDate,
    endDate,
    startTime,
    endTime,
    name,
    phoneCountryCode,
    phoneLocal,
    email,
    description,
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const goToDateMonth = (dateStr: string) => {
    const [y, m] = dateStr.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
  };

  const prevMonth = () => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);
    if (!canGoPrev) return;
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const loadMonth = useCallback(async () => {
    if (!type) return;
    setCalendarLoading(true);
    try {
      const data = await fetchMonthAvailability(viewYear, viewMonth, type);
      setMonthDays(data.days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setCalendarLoading(false);
    }
  }, [viewYear, viewMonth, type]);

  const loadAvailableDates = useCallback(async () => {
    if (!type) return;
    const dates: string[] = [];
    let y = today.getFullYear();
    let m = today.getMonth() + 1;

    for (let i = 0; i < 12; i++) {
      const data = await fetchMonthAvailability(y, m, type);
      dates.push(...data.days.filter((d) => d.available).map((d) => d.date));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }

    setAvailableDates([...new Set(dates)].sort());
  }, [type]);

  useEffect(() => {
    if (step === 1 && type && dateMode) loadMonth();
  }, [step, loadMonth, type, dateMode]);

  useEffect(() => {
    if (step === 1 && type && dateMode === 'multi') loadAvailableDates();
  }, [step, loadAvailableDates, type, dateMode]);

  useEffect(() => {
    if (dateMode === 'multi') return;
    if (step !== 2 || !type || !startDate || !endDate) return;

    setHoursLoading(true);
    fetchRangeHours(startDate, endDate, type)
      .then((opts) => {
        setTimeOptions(opts);
        if (opts.starts.length > 0) {
          const firstStart = opts.starts.includes(startTime) ? startTime : opts.starts[0];
          const ends = opts.endsForStart[firstStart] ?? [];
          setStartTime(firstStart);
          setEndTime(ends.includes(endTime) ? endTime : ends[ends.length - 1] ?? '');
        } else {
          setStartTime('');
          setEndTime('');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load time options');
        setTimeOptions(null);
      })
      .finally(() => setHoursLoading(false));
  }, [step, type, startDate, endDate, dateMode]);

  useEffect(() => {
    if (dateMode !== 'multi' || !type || !startDate || !endDate || startDate >= endDate) return;

    setRangeAvailable(false);
    setHoursLoading(true);
    fetchRangeHours(startDate, endDate, type, true)
      .then((opts) => {
        setTimeOptions(opts);
        setRangeAvailable(opts.available !== false);
        if (opts.reason) setError(opts.reason);
        else setError('');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load daily hours');
        setTimeOptions(null);
        setRangeAvailable(false);
      })
      .finally(() => setHoursLoading(false));
  }, [dateMode, type, startDate, endDate]);

  useEffect(() => {
    if (step !== 4 || !type || !startDate || !endDate) return;

    checkAvailability({
      type,
      startDate,
      endDate,
      ...(dateMode === 'multi'
        ? { fullDays: true }
        : { startTime, endTime }),
    })
      .then((result) => {
        setRangeAvailable(result.available);
        if (!result.available && result.reason) setError(result.reason);
      })
      .catch(() => setRangeAvailable(false));
  }, [step, type, startDate, endDate, dateMode, startTime, endTime]);

  const handleDateMode = (mode: DateMode) => {
    setDateMode(mode);
    setStartDate(null);
    setEndDate(null);
    setActiveDateField('start');
    setError('');
  };

  const handleSingleDate = (date: string) => {
    setStartDate(date);
    setEndDate(date);
    setError('');
  };

  const handleStartDate = (date: string) => {
    setStartDate(date);
    if (endDate && endDate < date) setEndDate(null);
    goToDateMonth(date);
    setActiveDateField('end');
    setError('');
  };

  const handleEndDate = (date: string) => {
    setEndDate(date);
    goToDateMonth(date);
    setError('');
  };

  const handleCalendarSelect = (date: string) => {
    if (activeDateField === 'start') handleStartDate(date);
    else handleEndDate(date);
  };

  const endDateOptions = startDate
    ? availableDates.filter((d) => d >= startDate)
    : [];

  const isMultiDay = dateMode === 'multi';
  const visibleSteps = isMultiDay ? STEPS.filter((s) => s !== 'Times') : [...STEPS];
  const visibleStep = isMultiDay && step >= 3 ? step - 1 : step;

  const formatPerDayHours = (perDay: DayRangeStatus[]) =>
    perDay.map((d) => ({
      date: formatDateShort(d.date),
      hours: d.windows.map((w) => `${formatTime12h(w.start)}–${formatTime12h(w.end)}`).join(', '),
      available: d.available,
      reason: d.reason,
    }));

  const hasMultiDayRange = !!(startDate && endDate && endDate > startDate);
  const multiDayConflictDays = timeOptions?.perDay.filter((d) => d.available === false) ?? [];
  const multiDayHasUnavailableDays = multiDayConflictDays.length > 0 || !rangeAvailable;

  const endTimeOptions = startTime && timeOptions ? (timeOptions.endsForStart[startTime] ?? []) : [];

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    const ends = timeOptions?.endsForStart[value] ?? [];
    if (!ends.includes(endTime)) {
      setEndTime(ends[0] ?? '');
    }
  };

  const fullPhone = formatFullPhone(phoneCountryCode, phoneLocal);

  const bookingSummaryInput = type && startDate && endDate
    ? {
        referenceCode: referenceCode || undefined,
        type,
        dateMode,
        startDate,
        endDate,
        startTime,
        endTime,
        name,
        phone: fullPhone,
        email,
        description,
      }
    : null;

  const copyBookingSummary = async () => {
    if (!bookingSummaryInput) return;
    try {
      await navigator.clipboard.writeText(buildBookingSummaryText(bookingSummaryInput));
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback('Copy failed');
    }
  };

  const canNext = () => {
    if (step === 0) return !!type;
    if (step === 1) {
      if (!dateMode) return false;
      if (!startDate) return false;
      if (dateMode === 'single') return true;
      return hasMultiDayRange && !multiDayHasUnavailableDays;
    }
    if (step === 2) return !!startTime && !!endTime && endTime > startTime;
    if (step === 3) return !!(name.trim() && isValidLocalPhone(phoneLocal) && email.trim() && description.trim());
    if (step === 4) return rangeAvailable;
    return true;
  };

  const goNext = () => {
    if (step === 1 && dateMode === 'multi' && multiDayHasUnavailableDays) {
      setError(
        multiDayConflictDays.length > 0
          ? `These dates conflict with existing bookings: ${multiDayConflictDays.map((d) => formatDateShort(d.date)).join(', ')}`
          : timeOptions?.reason ?? 'This date range is not available.',
      );
      return;
    }
    setError('');
    setTransitionDir(1);
    setStep((s) => {
      if (s === 1 && dateMode === 'multi') return 3;
      return Math.min(s + 1, STEPS.length - 1);
    });
  };

  const goBack = () => {
    setError('');
    setTransitionDir(-1);
    if (step === 1 && dateMode) {
      setDateMode(null);
      return;
    }
    if (step === 3 && dateMode === 'multi') {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const goToVisibleStep = (visibleIndex: number) => {
    if (visibleIndex >= visibleStep) return;
    setError('');
    setTransitionDir(-1);
    setStep(visibleIndexToStep(visibleIndex, isMultiDay));
  };

  const stepKey = step === 1 ? `1-${dateMode ?? 'pick'}` : String(step);
  const panelVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: reducedMotion ? 0 : direction > 0 ? 28 : -28,
    }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({
      opacity: 0,
      x: reducedMotion ? 0 : direction > 0 ? -28 : 28,
    }),
  };

  const handleSubmit = async () => {
    if (!type || !startDate || !endDate || !rangeAvailable) return;
    setSubmitting(true);
    setError('');
    try {
      const check = await checkAvailability({
        type,
        startDate,
        endDate,
        ...(dateMode === 'multi' ? { fullDays: true } : { startTime, endTime }),
      });
      if (!check.available) {
        setError(check.reason ?? 'This period is not available');
        return;
      }

      const result = await createBooking({
        name,
        phone: fullPhone,
        email,
        description,
        type,
        startDate,
        endDate,
        ...(dateMode === 'multi' ? { fullDays: true } : { startTime, endTime }),
      });
      setReferenceCode(result.booking.referenceCode);
      setEmailEnabled(result.emailEnabled === true);
      clearBookingDraft();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const summaryText = bookingSummaryInput
      ? buildBookingSummaryText({ ...bookingSummaryInput, referenceCode })
      : '';

    return (
      <section className="standalone-page standalone-page--book">
        <div className="book-success">
          <div className="book-success-icon"><CheckCircle2 size={32} /></div>
          <h1>Request received</h1>
          {referenceCode && (
            <p className="book-reference">
              Reference: <strong>{referenceCode}</strong>
            </p>
          )}
          <p>
            Thanks, {name}. We&apos;ve received your {type} booking request for{' '}
            {startDate === endDate
              ? formatDateLabel(startDate!)
              : `${formatDateShort(startDate!)} – ${formatDateShort(endDate!)}`}
            {dateMode === 'multi' ? (
              <> — full available hours each day.</>
            ) : (
              <>, {formatTime12h(startTime)} – {formatTime12h(endTime)}.</>
            )}
          </p>
          <p className="book-muted book-response-hint">
            We typically confirm bookings within <strong>24–48 hours</strong>.
            {emailEnabled ? (
              <> A confirmation email has been sent to {email}.</>
            ) : (
              <> Save your reference code — we&apos;ll reach out at {email}.</>
            )}
          </p>
          {summaryText && (
            <button type="button" className="wizard-btn wizard-btn--back book-copy-btn" onClick={() => {
              void navigator.clipboard.writeText(summaryText).then(() => {
                setCopyFeedback('Copied!');
                setTimeout(() => setCopyFeedback(''), 2000);
              });
            }}>
              <ClipboardCopy size={16} /> {copyFeedback || 'Copy booking summary'}
            </button>
          )}
          <button type="button" className="cta-button" onClick={() => window.location.reload()}>
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
        <p>We&apos;ll guide you step by step — only valid dates and times can be selected.</p>
        {draftRestored && (
          <p className="book-muted book-draft-restored">Your previous progress was restored.</p>
        )}
      </header>

      <div className="wizard-steps">
        {visibleSteps.map((label, i) => {
          const reachable = i < visibleStep;
          return (
            <button
              key={label}
              type="button"
              className={`wizard-step wizard-step-btn${i === visibleStep ? ' wizard-step--active' : ''}${reachable ? ' wizard-step--done wizard-step--reachable' : ''}`}
              onClick={() => goToVisibleStep(i)}
              disabled={!reachable}
              aria-current={i === visibleStep ? 'step' : undefined}
              aria-label={`${label}${reachable ? ', go back to this step' : i === visibleStep ? ', current step' : ''}`}
            >
              <span>{i + 1}</span>
              <small>{label}</small>
            </button>
          );
        })}
      </div>

      <div className="wizard-panel">
        <div className="wizard-panel-body">
          <AnimatePresence mode="wait" custom={transitionDir}>
            <motion.div
              key={stepKey}
              className="wizard-panel-content"
              custom={transitionDir}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reducedMotion ? 0.15 : 0.32, ease: [0.23, 1, 0.32, 1] }}
            >
        {step === 0 && (
          <>
            <h2>What are you booking?</h2>
            <Hint>
              <strong>Studio sessions</strong> — portraits and in-studio shoots. Fri &amp; Sat 9am–10pm; weekdays 4:30pm–10pm.
              <br /><br />
              <strong>Events</strong> — weddings, birthdays, parties. Flexible hours any time of day.
            </Hint>
            <div className="book-type-selector">
              <button type="button" className={`book-type-card${type === 'studio' ? ' book-type-card--active' : ''}`} onClick={() => setType('studio')}>
                <div className="book-type-icon"><Camera size={20} /></div>
                <div><h3>Studio Session</h3><p>Portraits, couples, editorial.</p></div>
              </button>
              <button type="button" className={`book-type-card${type === 'event' ? ' book-type-card--active' : ''}`} onClick={() => setType('event')}>
                <div className="book-type-icon book-type-icon--event"><PartyPopper size={20} /></div>
                <div><h3>Event</h3><p>Weddings, birthdays, celebrations.</p></div>
              </button>
            </div>
          </>
        )}

        {step === 1 && type && !dateMode && (
          <>
            <h2><Calendar size={18} /> How long is your booking?</h2>
            <Hint>
              Choose <strong>one day</strong> for a single session, or <strong>multiple days</strong> if you need full-day coverage across a date range — for example, a three-day shoot.
            </Hint>
            <div className="book-type-selector">
              <button type="button" className="book-type-card" onClick={() => handleDateMode('single')}>
                <div className="book-type-icon"><Calendar size={20} /></div>
                <div><h3>One day</h3><p>A single date for your session or event.</p></div>
              </button>
              <button type="button" className="book-type-card" onClick={() => handleDateMode('multi')}>
                <div className="book-type-icon book-type-icon--event"><Calendar size={20} /></div>
                <div><h3>Multiple days</h3><p>Pick a start date and end date separately.</p></div>
              </button>
            </div>
          </>
        )}

        {step === 1 && type && dateMode === 'single' && (
          <>
            <h2><Calendar size={18} /> Pick your date</h2>
            <Hint>Tap an available day on the calendar. Unavailable days are greyed out and cannot be selected.</Hint>
            <CalendarPicker
              label="Session date"
              startDate={startDate}
              endDate={startDate}
              onSelect={handleSingleDate}
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              monthDays={monthDays}
              loading={calendarLoading}
            />
          </>
        )}

        {step === 1 && type && dateMode === 'multi' && (
          <>
            <h2><Calendar size={18} /> Pick your start &amp; end dates</h2>
            <Hint>
              Use the dropdowns or tap the calendar to set each date. The calendar highlights your range.
              Your booking covers the <strong>full available hours</strong> on each day — no time selection needed.
            </Hint>
            <div className="wizard-date-dropdowns">
              <label className="book-field">
                <span>Start date</span>
                <select
                  value={startDate ?? ''}
                  onChange={(e) => e.target.value && handleStartDate(e.target.value)}
                >
                  <option value="">Select start date</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>{formatDateLabel(d)}</option>
                  ))}
                </select>
              </label>
              <label className="book-field">
                <span>End date</span>
                <select
                  value={endDate ?? ''}
                  disabled={!startDate}
                  onChange={(e) => e.target.value && handleEndDate(e.target.value)}
                >
                  <option value="">Select end date</option>
                  {endDateOptions.map((d) => (
                    <option key={d} value={d}>{formatDateLabel(d)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="wizard-date-target">
              <span>Calendar sets:</span>
              <button
                type="button"
                className={`wizard-target-btn${activeDateField === 'start' ? ' wizard-target-btn--active' : ''}`}
                onClick={() => setActiveDateField('start')}
              >
                Start date
              </button>
              <button
                type="button"
                className={`wizard-target-btn${activeDateField === 'end' ? ' wizard-target-btn--active' : ''}`}
                onClick={() => setActiveDateField('end')}
                disabled={!startDate}
              >
                End date
              </button>
            </div>
            <CalendarPicker
              startDate={startDate}
              endDate={endDate}
              onSelect={handleCalendarSelect}
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              monthDays={monthDays}
              loading={calendarLoading}
              minDate={activeDateField === 'end' ? startDate : null}
            />
            {hoursLoading && hasMultiDayRange && (
              <p className="book-muted">Checking daily hours…</p>
            )}
            {multiDayHasUnavailableDays && !hoursLoading && (
              <p className="book-error">
                {multiDayConflictDays.length > 0
                  ? `These dates are already booked: ${multiDayConflictDays.map((d) => formatDateShort(d.date)).join(', ')}. Adjust your range to continue.`
                  : (timeOptions?.reason ?? 'Some dates in this range are unavailable. Please choose a different range.')}
              </p>
            )}
            {hasMultiDayRange && !hoursLoading && timeOptions?.perDay && (
              <div className="wizard-per-day-hours">
                <p><strong>Hours included each day:</strong></p>
                {formatPerDayHours(timeOptions.perDay).map((d) => (
                  <p key={d.date} className={d.available === false ? 'wizard-per-day-hours--conflict' : undefined}>
                    <strong>{d.date}:</strong>{' '}
                    {d.available === false
                      ? (d.reason === 'Already booked' ? 'Already booked' : d.reason ?? 'Unavailable')
                      : d.hours}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {step === 2 && dateMode !== 'multi' && (
          <>
            <h2><Clock size={18} /> Pick your time range</h2>
            <Hint>
              Only times that work for <strong>every day</strong> in your range are shown.
              {timeOptions?.window && (
                <>
                  <br /><br />
                  Available daily window: {formatTime12h(timeOptions.window.start)} – {formatTime12h(timeOptions.window.end)}
                </>
              )}
            </Hint>
            {timeOptions?.perDay && timeOptions.perDay.length > 1 && (
              <div className="wizard-per-day-hours">
                {timeOptions.perDay.map((d) => (
                  <p key={d.date}>
                    <strong>{formatDateShort(d.date)}:</strong>{' '}
                    {d.windows.map((w) => `${formatTime12h(w.start)}–${formatTime12h(w.end)}`).join(', ')}
                  </p>
                ))}
              </div>
            )}
            {hoursLoading ? (
              <p className="book-muted">Loading available times…</p>
            ) : !timeOptions?.starts.length ? (
              <p className="book-error">No shared time window exists for these dates. Go back and adjust your date range.</p>
            ) : (
              <div className="wizard-time-row">
                <label className="book-field">
                  <span>Start time</span>
                  <select value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)}>
                    {timeOptions.starts.map((t) => (
                      <option key={t} value={t}>{formatTime12h(t)}</option>
                    ))}
                  </select>
                </label>
                <label className="book-field">
                  <span>End time</span>
                  <select value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!startTime}>
                    {endTimeOptions.map((t) => (
                      <option key={t} value={t}>{formatTime12h(t)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2><User size={18} /> Your details</h2>
            <Hint>We&apos;ll use this to confirm your booking. Add a short brief so we can prepare for your session.</Hint>
            <label className="book-field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required /></label>
            <PhoneField
              countryCode={phoneCountryCode}
              localNumber={phoneLocal}
              onCountryCodeChange={setPhoneCountryCode}
              onLocalNumberChange={setPhoneLocal}
            />
            <label className="book-field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
            <label className="book-field"><span>Short description</span><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about your session…" required /></label>
          </>
        )}

        {step === 4 && type && startDate && endDate && (
          <>
            <h2>Review your request</h2>
            <Hint>
              Nothing is confirmed until we approve your request. We typically respond within <strong>24–48 hours</strong>.
            </Hint>
            <dl className="wizard-review">
              <dt>Session</dt><dd>{type === 'studio' ? 'Studio Session' : 'Event'}</dd>
              <dt>Duration</dt><dd>{dateMode === 'single' ? 'One day' : 'Multiple days'}</dd>
              <dt>Dates</dt><dd>{startDate === endDate ? formatDateLabel(startDate) : `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`}</dd>
              <dt>Times</dt>
              <dd>
                {dateMode === 'multi' ? (
                  <div className="wizard-per-day-review">
                    <span>Full available hours each day</span>
                    {timeOptions?.perDay && formatPerDayHours(timeOptions.perDay).map((d) => (
                      <p key={d.date}><strong>{d.date}:</strong> {d.hours}</p>
                    ))}
                  </div>
                ) : (
                  `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`
                )}
              </dd>
              <dt>Name</dt><dd>{name}</dd>
              <dt>Phone</dt><dd>{fullPhone}</dd>
              <dt>Email</dt><dd>{email}</dd>
              <dt>Description</dt><dd>{description}</dd>
            </dl>

            <div className="wizard-checklist">
              <p><strong>What to bring</strong></p>
              <ul>
                {WHAT_TO_BRING.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <button type="button" className="wizard-btn wizard-btn--back book-copy-btn" onClick={() => void copyBookingSummary()}>
              <ClipboardCopy size={16} /> {copyFeedback || 'Copy booking summary'}
            </button>
          </>
        )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && <p className="book-error book-error--global">{error}</p>}

        <div className="wizard-nav">
          {step > 0 && (
            <button type="button" className="wizard-btn wizard-btn--back" onClick={goBack}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="cta-button wizard-btn" disabled={!canNext() || submitting} onClick={goNext}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="cta-button wizard-btn" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting…' : 'Submit request'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
