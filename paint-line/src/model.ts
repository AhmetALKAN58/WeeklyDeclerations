export const SHIFTS = ["morning", "evening", "night"] as const;
export type ShiftId = (typeof SHIFTS)[number];

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type DayId = (typeof DAYS)[number];

export type Screen = "overview" | "orders" | "meeting" | "repaint";

export interface LadderSection {
  qty: string;
  outstanding: string;
  rush: string;
  superRush: string;
  other: string;
  typeQty: string;
}

export interface GrillSection {
  frameSD: string;
  frameDD: string;
  frameER: string;
  framePF: string;
  outstanding: string;
  rushSuperRush: string;
  frameSF: string;
  frameHF: string;
  typeQty: string;
}

export interface OemSection {
  shortLongPanel: string;
  superLongPanel: string;
  extraLongPanel: string;
  shortLongFrame: string;
  superLongFrame: string;
  extraLongFrame: string;
}

export interface LinearSection {
  frames: string;
  cores: string;
  outstanding: string;
  rush: string;
  superRush: string;
  other: string;
  typeQty: string;
}

export interface DiffuserSection {
  size6: string;
  size8: string;
  size10: string;
  size12: string;
  size14: string;
  size0: string;
  autres: string;
  iso: string;
  smallCone: string;
  middleCone: string;
  largeCone: string;
  threeCupeCone: string;
  perf: string;
  dsw: string;
  autre2: string;
  outstanding: string;
  core12: string;
  iso12: string;
  shell12: string;
  alumDf: string;
  collets: string;
  rushSuperRush: string;
  autre3: string;
  typeQty: string;
}

export interface OrderList {
  date: string;
  ladder: LadderSection;
  grill: GrillSection;
  oem: OemSection;
  linear: LinearSection;
  diffuser: DiffuserSection;
  other: string;
  boxUsed: string;
  submitted: boolean;
  submittedAt: string;
}

export interface MeetingDay {
  topics: string;
  conclusions: string;
  nameA: string;
  nameB: string;
  signatureA: string;
  signatureB: string;
  submitted: boolean;
  submittedAt: string;
}

export interface RepaintRow {
  material: string;
  repaintQty: string;
  recyclingQty: string;
  badQty: string;
}

export interface RepaintDay {
  rows: RepaintRow[];
  submitted: boolean;
  submittedAt: string;
}

export interface ShiftReport {
  orders: Record<DayId, OrderList>;
  meeting: Record<DayId, MeetingDay>;
  meetingSubmitted: boolean;
  meetingSubmittedAt: string;
  repaint: Record<DayId, RepaintDay>;
  repaintSubmitted: boolean;
  repaintSubmittedAt: string;
}

export interface WeeklyReport {
  weekStart: string;
  shifts: Record<ShiftId, ShiftReport>;
}

export const DAY_META: Record<
  DayId,
  { fr: string; en: string; offset: number }
> = {
  monday: { fr: "Lundi", en: "Monday", offset: 0 },
  tuesday: { fr: "Mardi", en: "Tuesday", offset: 1 },
  wednesday: { fr: "Mercredi", en: "Wednesday", offset: 2 },
  thursday: { fr: "Jeudi", en: "Thursday", offset: 3 },
  friday: { fr: "Vendredi", en: "Friday", offset: 4 },
  saturday: { fr: "Samedi", en: "Saturday", offset: 5 },
  sunday: { fr: "Dimanche", en: "Sunday", offset: 6 },
};

export const SHIFT_META: Record<
  ShiftId,
  { fr: string; en: string; shortFr: string; icon: string }
> = {
  morning: {
    fr: "Quart du matin",
    en: "Morning Shift",
    shortFr: "MATIN",
    icon: "☀",
  },
  evening: {
    fr: "Quart de soirée",
    en: "Evening Shift",
    shortFr: "SOIR",
    icon: "◐",
  },
  night: {
    fr: "Quart de nuit",
    en: "Night Shift",
    shortFr: "NUIT",
    icon: "☾",
  },
};

export function emptyLadder(): LadderSection {
  return {
    qty: "",
    outstanding: "",
    rush: "",
    superRush: "",
    other: "",
    typeQty: "",
  };
}

export function emptyGrill(): GrillSection {
  return {
    frameSD: "",
    frameDD: "",
    frameER: "",
    framePF: "",
    outstanding: "",
    rushSuperRush: "",
    frameSF: "",
    frameHF: "",
    typeQty: "",
  };
}

export function emptyOem(): OemSection {
  return {
    shortLongPanel: "",
    superLongPanel: "",
    extraLongPanel: "",
    shortLongFrame: "",
    superLongFrame: "",
    extraLongFrame: "",
  };
}

export function emptyLinear(): LinearSection {
  return {
    frames: "",
    cores: "",
    outstanding: "",
    rush: "",
    superRush: "",
    other: "",
    typeQty: "",
  };
}

export function emptyDiffuser(): DiffuserSection {
  return {
    size6: "",
    size8: "",
    size10: "",
    size12: "",
    size14: "",
    size0: "",
    autres: "",
    iso: "",
    smallCone: "",
    middleCone: "",
    largeCone: "",
    threeCupeCone: "",
    perf: "",
    dsw: "",
    autre2: "",
    outstanding: "",
    core12: "",
    iso12: "",
    shell12: "",
    alumDf: "",
    collets: "",
    rushSuperRush: "",
    autre3: "",
    typeQty: "",
  };
}

export function emptyOrder(date = ""): OrderList {
  return {
    date,
    ladder: emptyLadder(),
    grill: emptyGrill(),
    oem: emptyOem(),
    linear: emptyLinear(),
    diffuser: emptyDiffuser(),
    other: "",
    boxUsed: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyMeeting(): MeetingDay {
  return {
    topics: "",
    conclusions: "",
    nameA: "",
    nameB: "",
    signatureA: "",
    signatureB: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyRepaintRow(): RepaintRow {
  return {
    material: "",
    repaintQty: "",
    recyclingQty: "",
    badQty: "",
  };
}

export function emptyRepaintRows(count = 3): RepaintRow[] {
  return Array.from({ length: count }, () => emptyRepaintRow());
}

export function emptyRepaintDay(): RepaintDay {
  return {
    rows: emptyRepaintRows(),
    submitted: false,
    submittedAt: "",
  };
}

export function emptyShift(weekStart: string): ShiftReport {
  const orders = {} as Record<DayId, OrderList>;
  const meeting = {} as Record<DayId, MeetingDay>;
  for (const day of DAYS) {
    orders[day] = emptyOrder(isoDate(addDays(weekStart, DAY_META[day].offset)));
    meeting[day] = emptyMeeting();
  }
  const repaint = {} as Record<DayId, RepaintDay>;
  for (const day of DAYS) repaint[day] = emptyRepaintDay();
  return {
    orders,
    meeting,
    meetingSubmitted: false,
    meetingSubmittedAt: "",
    repaint,
    repaintSubmitted: false,
    repaintSubmittedAt: "",
  };
}

export function normalizeReport(
  raw: WeeklyReport | null | undefined,
  weekStart: string,
): WeeklyReport {
  const base = emptyReport(weekStart);
  if (!raw?.shifts) return base;
  const start = raw.weekStart || weekStart;
  for (const shift of SHIFTS) {
    const src = raw.shifts[shift];
    if (!src) continue;
    for (const day of DAYS) {
      const order = src.orders?.[day];
      if (order) {
        base.shifts[shift].orders[day] = {
          ...emptyOrder(
            order.date || isoDate(addDays(start, DAY_META[day].offset)),
          ),
          ...order,
          submitted: Boolean(order.submitted),
          submittedAt: order.submittedAt ?? "",
        };
      }
      const meet = src.meeting?.[day];
      if (meet) {
        const submitted =
          Boolean(meet.submitted) || Boolean(src.meetingSubmitted);
        base.shifts[shift].meeting[day] = {
          ...emptyMeeting(),
          ...meet,
          submitted,
          submittedAt:
            meet.submittedAt ||
            (submitted ? (src.meetingSubmittedAt ?? "") : ""),
        };
      } else if (src.meetingSubmitted) {
        base.shifts[shift].meeting[day] = {
          ...emptyMeeting(),
          submitted: true,
          submittedAt: src.meetingSubmittedAt ?? "",
        };
      }
    }
    applyRepaint(base.shifts[shift], src, start);
    const allMeetingsSubmitted = DAYS.every(
      (day) => base.shifts[shift].meeting[day].submitted,
    );
    base.shifts[shift].meetingSubmitted = allMeetingsSubmitted;
    base.shifts[shift].meetingSubmittedAt = allMeetingsSubmitted
      ? src.meetingSubmittedAt ||
        DAYS.map((day) => base.shifts[shift].meeting[day].submittedAt).find(
          Boolean,
        ) ||
        ""
      : "";
    const allRepaintSubmitted = DAYS.every(
      (day) => base.shifts[shift].repaint[day].submitted,
    );
    base.shifts[shift].repaintSubmitted = allRepaintSubmitted;
    base.shifts[shift].repaintSubmittedAt = allRepaintSubmitted
      ? src.repaintSubmittedAt ||
        DAYS.map((day) => base.shifts[shift].repaint[day].submittedAt).find(
          Boolean,
        ) ||
        ""
      : "";
  }
  return { ...base, weekStart: start };
}

export function emptyReport(weekStart: string): WeeklyReport {
  return {
    weekStart,
    shifts: {
      morning: emptyShift(weekStart),
      evening: emptyShift(weekStart),
      night: emptyShift(weekStart),
    },
  };
}

export function getMonday(from: Date): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

export function isoDate(d: Date | string): string {
  const date = typeof d === "string" ? parseIso(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(iso: string, days: number): Date {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatShort(iso: string, locale: "fr-CA" | "en-CA" = "en-CA"): string {
  return parseIso(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function formatLong(iso: string): string {
  const d = parseIso(iso);
  const fr = d.toLocaleDateString("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const en = d.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${fr} / ${en}`;
}

export function sundayOf(weekStart: string): string {
  return isoDate(addDays(weekStart, 6));
}

function cleanRepaintRow(row: Partial<RepaintRow> | null | undefined): RepaintRow {
  return {
    material: row?.material ?? "",
    repaintQty: row?.repaintQty ?? "",
    recyclingQty: row?.recyclingQty ?? "",
    badQty: row?.badQty ?? "",
  };
}

function repaintRowHasText(row: RepaintRow): boolean {
  return (
    row.material.trim().length > 0 ||
    row.repaintQty.trim().length > 0 ||
    row.recyclingQty.trim().length > 0 ||
    row.badQty.trim().length > 0
  );
}

function dayIdForDate(weekStart: string, date: string): DayId | null {
  if (!date) return null;
  const iso = date.slice(0, 10);
  for (const day of DAYS) {
    if (isoDate(addDays(weekStart, DAY_META[day].offset)) === iso) return day;
  }
  return null;
}

function applyRepaint(target: ShiftReport, src: ShiftReport, weekStart: string) {
  const raw = src.repaint as unknown;
  if (Array.isArray(raw)) {
    const buckets = {} as Record<DayId, RepaintRow[]>;
    for (const day of DAYS) buckets[day] = [];
    const legacySubmitted = Boolean(src.repaintSubmitted);
    for (const item of raw) {
      const row = cleanRepaintRow(item as Partial<RepaintRow>);
      if (!repaintRowHasText(row)) continue;
      const dated = dayIdForDate(weekStart, String((item as { date?: string }).date ?? ""));
      buckets[dated ?? "monday"].push(row);
    }
    for (const day of DAYS) {
      if (buckets[day].length > 0) target.repaint[day].rows = buckets[day];
      if (legacySubmitted) {
        target.repaint[day].submitted = true;
        target.repaint[day].submittedAt = src.repaintSubmittedAt ?? "";
      }
    }
    return;
  }
  if (!raw || typeof raw !== "object") return;
  const map = raw as Partial<Record<DayId, Partial<RepaintDay>>>;
  for (const day of DAYS) {
    const srcDay = map[day];
    if (!srcDay) continue;
    const rows = Array.isArray(srcDay.rows)
      ? srcDay.rows.map((row) => cleanRepaintRow(row))
      : emptyRepaintRows();
    target.repaint[day] = {
      rows: rows.length > 0 ? rows : emptyRepaintRows(),
      submitted: Boolean(srcDay.submitted) || Boolean(src.repaintSubmitted),
      submittedAt:
        srcDay.submittedAt ||
        (srcDay.submitted || src.repaintSubmitted ? (src.repaintSubmittedAt ?? "") : ""),
    };
  }
}

function hasText(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some(hasText);
  }
  return false;
}

export function orderHasContent(order: OrderList): boolean {
  const { date: _date, submitted: _submitted, submittedAt: _at, ...rest } =
    order;
  return hasText(rest);
}

export function orderSectionsHaveContent(order: OrderList): boolean {
  const {
    date: _date,
    submitted: _submitted,
    submittedAt: _at,
    boxUsed: _box,
    ...rest
  } = order;
  return hasText(rest);
}

export function orderCanSubmit(order: OrderList): boolean {
  return order.boxUsed.trim().length > 0 && orderSectionsHaveContent(order);
}

export function orderIsLocked(order: OrderList): boolean {
  return Boolean(order.submitted);
}

export function formatSubmittedAt(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function meetingIsFilled(day: MeetingDay): boolean {
  return day.topics.trim().length > 0 || day.conclusions.trim().length > 0;
}

export function meetingHasContent(day: MeetingDay): boolean {
  const { submitted: _submitted, submittedAt: _at, ...rest } = day;
  return hasText(rest);
}

export function meetingIsLocked(day: MeetingDay): boolean {
  return Boolean(day.submitted);
}

export function meetingSubmittedCount(
  meeting: Record<DayId, MeetingDay>,
): number {
  return DAYS.filter((day) => meeting[day].submitted).length;
}

export function withMeetingDaySubmitted(
  report: WeeklyReport,
  shift: ShiftId,
  day: DayId,
  submittedAt: string,
): WeeklyReport {
  const meeting = {
    ...report.shifts[shift].meeting,
    [day]: {
      ...report.shifts[shift].meeting[day],
      submitted: true,
      submittedAt,
    },
  };
  const allDone = DAYS.every((id) => meeting[id].submitted);
  return {
    ...report,
    shifts: {
      ...report.shifts,
      [shift]: {
        ...report.shifts[shift],
        meeting,
        meetingSubmitted: allDone,
        meetingSubmittedAt: allDone
          ? submittedAt
          : report.shifts[shift].meetingSubmittedAt,
      },
    },
  };
}

export function meetingPageHasContent(meeting: Record<DayId, MeetingDay>): boolean {
  return DAYS.some((day) => meetingHasContent(meeting[day]));
}

export function repaintRowHasContent(row: RepaintRow): boolean {
  return hasText(row);
}

export function repaintDayHasContent(day: RepaintDay): boolean {
  return day.rows.some(repaintRowHasContent);
}

export function repaintDayCanSubmit(day: RepaintDay): boolean {
  const touched = day.rows.filter(repaintRowHasContent);
  return (
    touched.length > 0 && touched.every((row) => row.material.trim().length > 0)
  );
}

export function repaintPageHasContent(
  repaint: Record<DayId, RepaintDay>,
): boolean {
  return DAYS.some((day) => repaintDayHasContent(repaint[day]));
}

export function repaintSubmittedCount(
  repaint: Record<DayId, RepaintDay>,
): number {
  return DAYS.filter((day) => repaint[day].submitted).length;
}

export function withRepaintDaySubmitted(
  report: WeeklyReport,
  shift: ShiftId,
  day: DayId,
  submittedAt: string,
): WeeklyReport {
  const repaint = {
    ...report.shifts[shift].repaint,
    [day]: {
      ...report.shifts[shift].repaint[day],
      submitted: true,
      submittedAt,
    },
  };
  const allDone = DAYS.every((id) => repaint[id].submitted);
  return {
    ...report,
    shifts: {
      ...report.shifts,
      [shift]: {
        ...report.shifts[shift],
        repaint,
        repaintSubmitted: allDone,
        repaintSubmittedAt: allDone
          ? submittedAt
          : report.shifts[shift].repaintSubmittedAt,
      },
    },
  };
}

export function shiftFillCount(shift: ShiftReport): { done: number; total: number } {
  const orderDone = DAYS.filter((d) => orderHasContent(shift.orders[d])).length;
  const meeting = meetingPageHasContent(shift.meeting) ? 1 : 0;
  const repaint = repaintPageHasContent(shift.repaint) ? 1 : 0;
  return { done: orderDone + meeting + repaint, total: DAYS.length + 2 };
}

export function signatureLabels(shift: ShiftId): {
  a: { fr: string; en: string };
  b: { fr: string; en: string };
} {
  if (shift === "morning") {
    return {
      a: { fr: "Quart de jour", en: "Day shift" },
      b: { fr: "Quart de soirée", en: "Evening shift" },
    };
  }
  if (shift === "evening") {
    return {
      a: { fr: "Quart de soirée", en: "Evening shift" },
      b: { fr: "Quart de nuit", en: "Night shift" },
    };
  }
  return {
    a: { fr: "Quart de nuit", en: "Night shift" },
    b: { fr: "Quart du matin", en: "Morning shift" },
  };
}
