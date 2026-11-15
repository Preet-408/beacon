import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarEvent } from '../types';
import { FamilyMember } from '../types/family';

interface NextUpCardProps {
  events: CalendarEvent[];
  members: FamilyMember[];
  timeFormat: '12h' | '24h';
}

/** Hero card: the next timed event that hasn't ended, and who it's for. */
export function NextUpCard({ events, members, timeFormat }: NextUpCardProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const upcoming = events
    .filter((e) => !e.allDay && new Date(e.end).getTime() > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  if (upcoming.length === 0) return null;

  const first = upcoming[0];
  const sameStart = upcoming.filter((e) => e.start === first.start);
  const who = (e: CalendarEvent) =>
    members.find(
      (m) => m.calendar_entity === e.calendarId || m.additional_calendar_entities?.includes(e.calendarId)
    )?.name;

  const start = new Date(first.start);
  const inProgress = start.getTime() <= now;
  const mins = Math.max(0, Math.round((start.getTime() - now) / 60000));
  const when = inProgress
    ? 'Happening now'
    : mins < 60
      ? `in ${mins} min`
      : format(start, timeFormat === '24h' ? 'HH:mm' : 'h:mm a');

  return (
    <div className="next-up-card">
      <div className="next-up-label">Next up · {when}</div>
      {sameStart.map((e) => (
        <div key={e.id} className="next-up-title">
          {e.title}
          {who(e) && <span className="next-up-who"> — {who(e)}</span>}
        </div>
      ))}
    </div>
  );
}
