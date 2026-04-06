'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Mail, Building2, CalendarCheck, Loader2, Check } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────── */
interface TimeSlot {
  start: string; // ISO string
  end: string;
  label: string; // e.g. "9:00 AM"
}

type BookingStep = 'date' | 'time' | 'info' | 'confirm';

/* ──────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWeekday(d: Date) {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function formatDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ──────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────── */
export function BookingCalendar() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<BookingStep>('date');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  // Async state
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* ── Fetch available slots when a date is selected ── */
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    setError('');

    const dateStr = selectedDate.toISOString().split('T')[0];
    fetch(`/api/booking/slots?date=${dateStr}`)
      .then(r => r.json())
      .then(data => {
        if (data.slots) setSlots(data.slots);
        else setError('No availability for this date.');
      })
      .catch(() => setError('Failed to load slots.'))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  /* ── Submit booking ── */
  const handleSubmit = async () => {
    if (!selectedSlot || !name || !email) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          start: selectedSlot.start,
          end: selectedSlot.end,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep('confirm');
      } else {
        setError(data.error || 'Booking failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  /* ── Calendar grid ── */
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  /* ── Render ── */

  // Confirmation screen
  if (step === 'confirm') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#22c55e]/15 flex items-center justify-center mb-4">
          <Check size={28} className="text-[#22c55e]" />
        </div>
        <h3 className="text-xl font-bold text-[#e8e8f0] mb-2">You&apos;re Booked!</h3>
        <p className="text-sm text-[#8888a0] mb-1">
          {formatDate(selectedDate!)} at {selectedSlot?.label}
        </p>
        <p className="text-sm text-[#8888a0] mb-4">
          Check your email at <span className="text-[#a5b4fc]">{email}</span> for confirmation.
        </p>
        <p className="text-xs text-[#555] mb-6">
          We&apos;ll send you a Google Meet link before the call.
        </p>

        {/* Signup push */}
        <div className="bg-[#06b6d4]/5 border border-[#06b6d4]/20 rounded-lg p-4 max-w-sm">
          <p className="text-sm text-[#b0b0c8] mb-3">
            While you wait for our call, start your free trial and connect your QuickBooks. That way we can look at <span className="text-[#e8e8f0] font-medium">YOUR numbers</span> together — not sample data.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition text-sm"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">

      {/* ── LEFT: Calendar ── */}
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-[#1e1e2e] transition cursor-pointer">
            <ChevronLeft size={18} className="text-[#8888a0]" />
          </button>
          <span className="text-sm font-semibold text-[#e8e8f0]">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-[#1e1e2e] transition cursor-pointer">
            <ChevronRight size={18} className="text-[#8888a0]" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#555] py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const date = new Date(viewYear, viewMonth, day);
            const past = isPast(day);
            const weekend = !isWeekday(date);
            const disabled = past || weekend;
            const selected = selectedDate && isSameDay(date, selectedDate);

            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => { setSelectedDate(date); setStep('time'); }}
                className={`
                  h-9 w-full rounded-lg text-sm font-medium transition cursor-pointer
                  ${disabled ? 'text-[#333] cursor-not-allowed' : 'text-[#e8e8f0] hover:bg-[#06b6d4]/15 hover:text-[#a5b4fc]'}
                  ${selected ? 'bg-[#06b6d4] text-white hover:bg-[#06b6d4] hover:text-white' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Timezone */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#555]">
          <Clock size={12} />
          Mountain Time (US)
        </div>
      </div>

      {/* ── RIGHT: Slots or Form ── */}
      <div className="mt-6 md:mt-0 md:border-l md:border-[#1e1e2e] md:pl-6">
        {step === 'date' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#555]">Select a date to see available times.</p>
          </div>
        )}

        {step === 'time' && (
          <>
            <p className="text-sm font-semibold text-[#e8e8f0] mb-1">
              {selectedDate && formatDate(selectedDate)}
            </p>
            <p className="text-xs text-[#8888a0] mb-4">30-minute scope call</p>

            {loadingSlots && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-[#06b6d4] animate-spin" />
              </div>
            )}

            {!loadingSlots && slots.length === 0 && (
              <p className="text-sm text-[#555] py-8 text-center">No available slots for this date.</p>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {slots.map(slot => {
                  const active = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => { setSelectedSlot(slot); }}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer border
                        ${active
                          ? 'bg-[#06b6d4] text-white border-[#06b6d4]'
                          : 'text-[#a5b4fc] border-[#06b6d4]/30 hover:bg-[#06b6d4]/10 hover:border-[#06b6d4]/50'}
                      `}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <button
                onClick={() => setStep('info')}
                className="w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition cursor-pointer text-sm"
              >
                Continue
              </button>
            )}
          </>
        )}

        {step === 'info' && (
          <>
            <button onClick={() => setStep('time')} className="text-xs text-[#06b6d4] mb-3 hover:underline cursor-pointer">
              &larr; Back to times
            </button>
            <p className="text-sm font-semibold text-[#e8e8f0] mb-1">
              {selectedDate && formatDate(selectedDate)} at {selectedSlot?.label}
            </p>
            <p className="text-xs text-[#8888a0] mb-5">Enter your details to confirm the call.</p>

            <div className="space-y-3">
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#12121a] border border-[#2a2a3d] text-[#e8e8f0] text-sm placeholder:text-[#555] focus:border-[#06b6d4] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#12121a] border border-[#2a2a3d] text-[#e8e8f0] text-sm placeholder:text-[#555] focus:border-[#06b6d4] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  placeholder="Company name (optional)"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#12121a] border border-[#2a2a3d] text-[#e8e8f0] text-sm placeholder:text-[#555] focus:border-[#06b6d4] focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="text-xs text-[#ef4444] mt-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !name || !email.includes('@')}
              className="w-full mt-4 px-4 py-3 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Booking...</>
              ) : (
                <><CalendarCheck size={16} /> Confirm Booking</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
