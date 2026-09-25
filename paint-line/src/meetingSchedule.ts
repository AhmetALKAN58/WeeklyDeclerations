import {
  DAYS,
  DAY_META,
  SHIFTS,
  addDays,
  getMonday,
  isoDate,
  meetingHasContent,
  orderHasContent,
  repaintDayHasContent,
  repaintPageHasContent,
  type DayId,
  type ShiftId,
  type WeeklyReport,
} from "./model";

/** End-of-shift handover times. Night is 07:00 the following calendar morning. */
export const MEETING_TRIGGERS: Record<
  ShiftId,
  { hour: number; minute: number; label: string }
> = {
  morning: { hour: 15, minute: 0, label: "15:00" },
  evening: { hour: 23, minute: 0, label: "23:00" },
  night: { hour: 7, minute: 0, label: "07:00" },
};

export interface DueSlot {
  shift: ShiftId;
  day: DayId;
  weekStart: string;
  triggerAt: number;
}

export type DueMeeting = DueSlot;

/** Repaint opens 30 minutes before the shift ends. */
export const REPAINT_TRIGGERS: Record<ShiftId, { label: string }> = {
  morning: { label: "14:30" },
  evening: { label: "22:30" },
  night: { label: "06:30" },
};

export function clockNow(): Date {
  if (typeof window === "undefined") return new Date();
  const at = new URLSearchParams(window.location.search).get("at");
  if (at) {
    const local = parseLocalDateTime(at);
    if (local) return local;
  }
  return new Date();
}

function parseLocalDateTime(value: string): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? 0),
      0,
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function triggerAtForMeeting(shift: ShiftId, workDate: Date): Date {
  const y = workDate.getFullYear();
  const m = workDate.getMonth();
  const d = workDate.getDate();
  if (shift === "morning") return new Date(y, m, d, 15, 0, 0, 0);
  if (shift === "evening") return new Date(y, m, d, 23, 0, 0, 0);
  return new Date(y, m, d + 1, 7, 0, 0, 0);
}

export function triggerAtForRepaint(shift: ShiftId, workDate: Date): Date {
  return new Date(triggerAtForMeeting(shift, workDate).getTime() - 30 * 60 * 1000);
}

function weekdayId(d: Date): DayId {
  const js = d.getDay();
  if (js === 0) return "sunday";
  return DAYS[js - 1];
}

function addDue(
  out: DueSlot[],
  work: Date,
  shift: ShiftId,
  weekStart: string,
  now: Date,
  at: (shift: ShiftId, workDate: Date) => Date,
) {
  const day = weekdayId(work);
  const trigger = at(shift, work);
  if (trigger.getTime() > now.getTime()) return;
  out.push({
    shift,
    day,
    weekStart,
    triggerAt: trigger.getTime(),
  });
}

function uniqueDueSlots(items: DueSlot[]): DueSlot[] {
  const seen = new Set<string>();
  return items
    .sort((a, b) => a.triggerAt - b.triggerAt)
    .filter((item) => {
      const key = `${item.weekStart}:${item.shift}:${item.day}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function allTriggeredForWeek(
  weekStart: string,
  now: Date,
  at: (shift: ShiftId, workDate: Date) => Date,
): DueSlot[] {
  const out: DueSlot[] = [];
  for (const day of DAYS) {
    const work = addDays(weekStart, DAY_META[day].offset);
    for (const shift of SHIFTS) {
      addDue(out, work, shift, weekStart, now, at);
    }
  }
  return out;
}

/**
 * Forms that should block the tablet now (oldest trigger first):
 * - every shift in the active week whose trigger has passed (day 14:30/15:00,
 *   evening 22:30/23:00, night 06:30/07:00 next calendar morning)
 * - when holding an ended week, also queue the new calendar week's due forms
 *   so today's triggers still fire and sit behind leftover handovers
 * - on Monday, Sunday evening/night from the previous week (week rollover)
 *
 * Overdue slots stay until submitted — we never drop forms older than
 * "yesterday", which previously made mid-week popups vanish.
 */
function dueCandidates(
  now: Date,
  heldWeekStart: string | undefined,
  at: (shift: ShiftId, workDate: Date) => Date,
): DueSlot[] {
  const calendarWeek = getMonday(now);
  const week = heldWeekStart ?? calendarWeek;
  const out: DueSlot[] = [];

  if (week < calendarWeek) {
    out.push(...allTriggeredForWeek(week, now, at));
    // Do not starve the new week while operators clear last week's queue.
    out.push(...allTriggeredForWeek(calendarWeek, now, at));
    return uniqueDueSlots(out);
  }

  out.push(...allTriggeredForWeek(week, now, at));

  // Sunday evening / night remain due on Monday after the calendar week rolls.
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    12,
    0,
    0,
    0,
  );
  const yesterdayWeek = getMonday(yesterday);
  if (yesterdayWeek < week) {
    for (const shift of SHIFTS) {
      addDue(out, yesterday, shift, yesterdayWeek, now, at);
    }
  }

  return uniqueDueSlots(out);
}

export function dueMeetingCandidates(
  now: Date,
  heldWeekStart?: string,
): DueSlot[] {
  return dueCandidates(now, heldWeekStart, triggerAtForMeeting);
}

export function dueRepaintCandidates(
  now: Date,
  heldWeekStart?: string,
): DueSlot[] {
  return dueCandidates(now, heldWeekStart, triggerAtForRepaint);
}

export function weekWasStarted(report: WeeklyReport): boolean {
  return SHIFTS.some((shift) => {
    const data = report.shifts[shift];
    if (data.repaintSubmitted || repaintPageHasContent(data.repaint)) return true;
    return DAYS.some((day) => {
      const order = data.orders[day];
      const meeting = data.meeting[day];
      return (
        order.submitted ||
        orderHasContent(order) ||
        meeting.submitted ||
        meetingHasContent(meeting)
      );
    });
  });
}

/** True when an ended week still has meetings or filled pages waiting to be sent. */
export function weekHasPendingSubmissions(
  report: WeeklyReport,
  now: Date,
): boolean {
  if (!weekWasStarted(report)) return false;
  for (const shift of SHIFTS) {
    const data = report.shifts[shift];
    for (const day of DAYS) {
      const order = data.orders[day];
      if (!order.submitted && orderHasContent(order)) return true;
      const work = addDays(report.weekStart, DAY_META[day].offset);
      const meetingTrigger = triggerAtForMeeting(shift, work);
      if (
        !data.meeting[day].submitted &&
        meetingTrigger.getTime() <= now.getTime()
      ) {
        return true;
      }
      const repaint = data.repaint[day];
      const repaintTrigger = triggerAtForRepaint(shift, work);
      if (
        !repaint.submitted &&
        (repaintTrigger.getTime() <= now.getTime() || repaintDayHasContent(repaint))
      ) {
        return true;
      }
    }
  }
  return false;
}

export function previousWeekStart(weekStart: string): string {
  return isoDate(addDays(weekStart, -7));
}

export function sameDueMeeting(
  a: DueSlot | null,
  b: DueSlot | null,
): boolean {
  if (!a || !b) return a === b;
  return (
    a.shift === b.shift && a.day === b.day && a.weekStart === b.weekStart
  );
}

export function meetingLockKey(report: WeeklyReport): string {
  return SHIFTS.flatMap((shift) =>
    DAYS.map((day) => (report.shifts[shift].meeting[day].submitted ? "1" : "0")),
  ).join("");
}

export function formatDueDate(weekStart: string, day: DayId): string {
  return isoDate(addDays(weekStart, DAY_META[day].offset));
}
