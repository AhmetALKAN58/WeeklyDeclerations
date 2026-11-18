export const SHIFTS = ["day", "evening"] as const;
export type ShiftId = (typeof SHIFTS)[number];

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;
export type DayId = (typeof DAYS)[number];

/** Overview and toolbar order for one shift. */
export const DAILY_FORMS = [
  "signature",
  "g4Performance",
  "g4Faulty",
  "g3Performance",
  "g3Faulty",
  "g10",
  "g11",
] as const;
export type DailyFormId = (typeof DAILY_FORMS)[number];

/** Machines on the autonomous maintenance signature sheet, in sheet order. */
export const MACHINES = ["G1", "G3", "G4", "G10", "G11"] as const;
export type MachineId = (typeof MACHINES)[number];

export const FIVE_S = [
  { id: "sort", fr: "Trier", en: "Sort" },
  { id: "straighten", fr: "Ranger", en: "Straighten" },
  { id: "shine", fr: "Faire briller", en: "Shine" },
  { id: "standardize", fr: "Standardiser", en: "Standardize" },
  { id: "sustain", fr: "Maintenir", en: "Sustain" },
] as const;
export type FiveSId = (typeof FIVE_S)[number]["id"];

export const NAME_SLOTS = 10;
export const G11_START_ROWS = 8;

export type Screen =
  | { kind: "shifts" }
  | { kind: "menu"; shift: ShiftId }
  | { kind: "sst"; shift: ShiftId }
  | { kind: "fiveS"; shift: ShiftId }
  | { kind: "daily"; shift: ShiftId; form: DailyFormId; day: DayId };

export type FormRef =
  | { kind: "sst"; shift: ShiftId }
  | { kind: "fiveS"; shift: ShiftId }
  | { kind: "daily"; shift: ShiftId; form: DailyFormId; day: DayId };

export interface SstPart {
  startTime: string;
  endTime: string;
  attendance: string[];
  note: string;
}

export interface SstForm {
  department: string;
  monday: SstPart;
  friday: SstPart;
  safetyProblem: string;
  submitted: boolean;
  submittedAt: string;
}

export interface FiveSForm {
  department: string;
  startTime: string;
  endTime: string;
  attendance: string[];
  everydayList: string;
  toolsAnswer: "" | "yes" | "no";
  toolsNote: string;
  dirtSources: string;
  reviewed: FiveSId | "";
  reviewNote: string;
  submitted: boolean;
  submittedAt: string;
}

export interface MachineSign {
  name: string;
  signature: string;
}

export interface SignatureDay {
  machines: Record<MachineId, MachineSign>;
  submitted: boolean;
  submittedAt: string;
}

export interface PerformanceDay {
  worker: string;
  startCounter: string;
  stopCounter: string;
  timeStart: string;
  timeStop: string;
  unplanned: "" | "yes" | "no";
  unplannedHours: string;
  unplannedMinutes: string;
  planned: "" | "yes" | "no";
  plannedHours: string;
  plannedMinutes: string;
  submitted: boolean;
  submittedAt: string;
}

export interface FaultyDay {
  worker: string;
  cornerOpen: string;
  cornerFrame: string;
  cornerOperator: string;
  cornerOther: string;
  cornerOtherQty: string;
  framePaint: string;
  frameCutting: string;
  frameOther: string;
  frameOtherQty: string;
  submitted: boolean;
  submittedAt: string;
}

export interface G11Row {
  frameType: string;
  qty: string;
}

export interface G11Day {
  timeStart: string;
  timeEnd: string;
  rows: G11Row[];
  submitted: boolean;
  submittedAt: string;
}

export interface ShiftReport {
  sst: SstForm;
  fiveS: FiveSForm;
  signature: Record<DayId, SignatureDay>;
  g4Performance: Record<DayId, PerformanceDay>;
  g4Faulty: Record<DayId, FaultyDay>;
  g3Performance: Record<DayId, PerformanceDay>;
  g3Faulty: Record<DayId, FaultyDay>;
  g10: Record<DayId, PerformanceDay>;
  g11: Record<DayId, G11Day>;
}

export interface WeeklyReport {
  weekStart: string;
  shifts: Record<ShiftId, ShiftReport>;
}

export const DAY_META: Record<
  DayId,
  { fr: string; en: string; short: string; offset: number }
> = {
  monday: { fr: "Lundi", en: "Monday", short: "Lun", offset: 0 },
  tuesday: { fr: "Mardi", en: "Tuesday", short: "Mar", offset: 1 },
  wednesday: { fr: "Mercredi", en: "Wednesday", short: "Mer", offset: 2 },
  thursday: { fr: "Jeudi", en: "Thursday", short: "Jeu", offset: 3 },
  friday: { fr: "Vendredi", en: "Friday", short: "Ven", offset: 4 },
};

export const SHIFT_META: Record<
  ShiftId,
  { fr: string; en: string; icon: string }
> = {
  day: { fr: "Quart de jour", en: "Day shift", icon: "☀" },
  evening: { fr: "Quart de soirée", en: "Evening shift", icon: "◐" },
};

export const DAILY_META: Record<DailyFormId, { fr: string; en: string }> = {
  signature: {
    fr: "Signature",
    en: "Signature",
  },
  g4Performance: {
    fr: "Rendement G4",
    en: "G4 Performance",
  },
  g4Faulty: {
    fr: "Grilles défectueuses G4",
    en: "G4 Faulty",
  },
  g3Performance: {
    fr: "Rendement G3",
    en: "G3 Performance",
  },
  g3Faulty: {
    fr: "Grilles défectueuses G3",
    en: "G3 Faulty",
  },
  g10: {
    fr: "Scie G10",
    en: "G10",
  },
  g11: {
    fr: "Scie G11",
    en: "G11",
  },
};

const FIVE_IDS: ReadonlySet<string> = new Set(FIVE_S.map((item) => item.id));

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function filled(value: string): boolean {
  return value.trim().length > 0;
}

function choiceOf(value: unknown): "" | "yes" | "no" {
  return value === "yes" || value === "no" ? value : "";
}

function namesOf(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  const names = source.slice(0, 30).map((item) => textOf(item));
  while (names.length < NAME_SLOTS) names.push("");
  return names;
}

function fiveOf(value: unknown): FiveSId | "" {
  return typeof value === "string" && FIVE_IDS.has(value)
    ? (value as FiveSId)
    : "";
}

export function emptyNames(): string[] {
  return Array.from({ length: NAME_SLOTS }, () => "");
}

export function emptySstPart(): SstPart {
  return { startTime: "", endTime: "", attendance: emptyNames(), note: "" };
}

export function emptySst(): SstForm {
  return {
    department: "STD",
    monday: emptySstPart(),
    friday: emptySstPart(),
    safetyProblem: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyFiveS(): FiveSForm {
  return {
    department: "STD",
    startTime: "",
    endTime: "",
    attendance: emptyNames(),
    everydayList: "",
    toolsAnswer: "",
    toolsNote: "",
    dirtSources: "",
    reviewed: "",
    reviewNote: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyMachine(): MachineSign {
  return { name: "", signature: "" };
}

export function emptySignatureDay(): SignatureDay {
  return {
    machines: {
      G1: emptyMachine(),
      G3: emptyMachine(),
      G4: emptyMachine(),
      G10: emptyMachine(),
      G11: emptyMachine(),
    },
    submitted: false,
    submittedAt: "",
  };
}

export function emptyPerformance(): PerformanceDay {
  return {
    worker: "",
    startCounter: "",
    stopCounter: "",
    timeStart: "",
    timeStop: "",
    unplanned: "",
    unplannedHours: "",
    unplannedMinutes: "",
    planned: "",
    plannedHours: "",
    plannedMinutes: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyFaulty(): FaultyDay {
  return {
    worker: "",
    cornerOpen: "",
    cornerFrame: "",
    cornerOperator: "",
    cornerOther: "",
    cornerOtherQty: "",
    framePaint: "",
    frameCutting: "",
    frameOther: "",
    frameOtherQty: "",
    submitted: false,
    submittedAt: "",
  };
}

export function emptyG11Row(): G11Row {
  return { frameType: "", qty: "" };
}

export function emptyG11Rows(count = G11_START_ROWS): G11Row[] {
  return Array.from({ length: count }, () => emptyG11Row());
}

export function emptyG11(): G11Day {
  return {
    timeStart: "",
    timeEnd: "",
    rows: emptyG11Rows(),
    submitted: false,
    submittedAt: "",
  };
}

function dayRecord<T>(make: () => T): Record<DayId, T> {
  const out = {} as Record<DayId, T>;
  for (const day of DAYS) out[day] = make();
  return out;
}

export function emptyShift(): ShiftReport {
  return {
    sst: emptySst(),
    fiveS: emptyFiveS(),
    signature: dayRecord(emptySignatureDay),
    g4Performance: dayRecord(emptyPerformance),
    g4Faulty: dayRecord(emptyFaulty),
    g3Performance: dayRecord(emptyPerformance),
    g3Faulty: dayRecord(emptyFaulty),
    g10: dayRecord(emptyPerformance),
    g11: dayRecord(emptyG11),
  };
}

export function emptyReport(weekStart: string): WeeklyReport {
  return {
    weekStart,
    shifts: { day: emptyShift(), evening: emptyShift() },
  };
}

function cleanSstPart(raw: unknown): SstPart {
  const src = raw && typeof raw === "object" ? (raw as Partial<SstPart>) : {};
  return {
    startTime: textOf(src.startTime),
    endTime: textOf(src.endTime),
    attendance: namesOf(src.attendance),
    note: textOf(src.note),
  };
}

function cleanSst(raw: unknown): SstForm {
  const src = raw && typeof raw === "object" ? (raw as Partial<SstForm>) : {};
  const base = emptySst();
  return {
    ...base,
    department: textOf(src.department) || "STD",
    monday: cleanSstPart(src.monday),
    friday: cleanSstPart(src.friday),
    safetyProblem: textOf(src.safetyProblem),
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanFiveS(raw: unknown): FiveSForm {
  const src = raw && typeof raw === "object" ? (raw as Partial<FiveSForm>) : {};
  const base = emptyFiveS();
  return {
    ...base,
    department: textOf(src.department) || "STD",
    startTime: textOf(src.startTime),
    endTime: textOf(src.endTime),
    attendance: namesOf(src.attendance),
    everydayList: textOf(src.everydayList),
    toolsAnswer: choiceOf(src.toolsAnswer),
    toolsNote: textOf(src.toolsNote),
    dirtSources: textOf(src.dirtSources),
    reviewed: fiveOf(src.reviewed),
    reviewNote: textOf(src.reviewNote),
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanSignature(raw: unknown): SignatureDay {
  const src =
    raw && typeof raw === "object" ? (raw as Partial<SignatureDay>) : {};
  const machines = emptySignatureDay().machines;
  const incoming: Partial<Record<MachineId, Partial<MachineSign>>> =
    src.machines && typeof src.machines === "object" ? src.machines : {};
  for (const id of MACHINES) {
    const row = incoming[id];
    machines[id] = {
      name: textOf(row?.name),
      signature: textOf(row?.signature),
    };
  }
  return {
    machines,
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanPerformance(raw: unknown): PerformanceDay {
  const src =
    raw && typeof raw === "object" ? (raw as Partial<PerformanceDay>) : {};
  const base = emptyPerformance();
  return {
    ...base,
    worker: textOf(src.worker),
    startCounter: textOf(src.startCounter),
    stopCounter: textOf(src.stopCounter),
    timeStart: textOf(src.timeStart),
    timeStop: textOf(src.timeStop),
    unplanned: choiceOf(src.unplanned),
    unplannedHours: textOf(src.unplannedHours),
    unplannedMinutes: textOf(src.unplannedMinutes),
    planned: choiceOf(src.planned),
    plannedHours: textOf(src.plannedHours),
    plannedMinutes: textOf(src.plannedMinutes),
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanFaulty(raw: unknown): FaultyDay {
  const src = raw && typeof raw === "object" ? (raw as Partial<FaultyDay>) : {};
  const base = emptyFaulty();
  return {
    ...base,
    worker: textOf(src.worker),
    cornerOpen: textOf(src.cornerOpen),
    cornerFrame: textOf(src.cornerFrame),
    cornerOperator: textOf(src.cornerOperator),
    cornerOther: textOf(src.cornerOther),
    cornerOtherQty: textOf(src.cornerOtherQty),
    framePaint: textOf(src.framePaint),
    frameCutting: textOf(src.frameCutting),
    frameOther: textOf(src.frameOther),
    frameOtherQty: textOf(src.frameOtherQty),
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanG11(raw: unknown): G11Day {
  const src = raw && typeof raw === "object" ? (raw as Partial<G11Day>) : {};
  const rows = Array.isArray(src.rows)
    ? src.rows.slice(0, 80).map((row) => ({
        frameType: textOf(row?.frameType),
        qty: textOf(row?.qty),
      }))
    : [];
  while (rows.length < G11_START_ROWS) rows.push(emptyG11Row());
  return {
    timeStart: textOf(src.timeStart),
    timeEnd: textOf(src.timeEnd),
    rows,
    submitted: Boolean(src.submitted),
    submittedAt: textOf(src.submittedAt),
  };
}

function cleanDayMap<T>(
  raw: unknown,
  clean: (value: unknown) => T,
): Record<DayId, T> {
  const src =
    raw && typeof raw === "object" ? (raw as Partial<Record<DayId, unknown>>) : {};
  const out = {} as Record<DayId, T>;
  for (const day of DAYS) out[day] = clean(src[day]);
  return out;
}

function cleanShift(raw: unknown): ShiftReport {
  const src = raw && typeof raw === "object" ? (raw as Partial<ShiftReport>) : {};
  return {
    sst: cleanSst(src.sst),
    fiveS: cleanFiveS(src.fiveS),
    signature: cleanDayMap(src.signature, cleanSignature),
    g4Performance: cleanDayMap(src.g4Performance, cleanPerformance),
    g4Faulty: cleanDayMap(src.g4Faulty, cleanFaulty),
    g3Performance: cleanDayMap(src.g3Performance, cleanPerformance),
    g3Faulty: cleanDayMap(src.g3Faulty, cleanFaulty),
    g10: cleanDayMap(src.g10, cleanPerformance),
    g11: cleanDayMap(src.g11, cleanG11),
  };
}

export function normalizeReport(
  raw: WeeklyReport | null | undefined,
  weekStart: string,
): WeeklyReport {
  const shifts = raw?.shifts;
  return {
    weekStart,
    shifts: {
      day: cleanShift(shifts?.day),
      evening: cleanShift(shifts?.evening),
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
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function addDays(iso: string, days: number): Date {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return d;
}

export function previousWeekStart(weekStart: string): string {
  return isoDate(addDays(weekStart, -7));
}

export function nextWeekStart(weekStart: string): string {
  return isoDate(addDays(weekStart, 7));
}

export function formatShort(iso: string, locale: "fr-CA" | "en-CA"): string {
  return parseIso(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
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

export function dayDate(weekStart: string, day: DayId): string {
  return isoDate(addDays(weekStart, DAY_META[day].offset));
}

export function dayIdOn(weekStart: string, when: Date): DayId | null {
  const iso = isoDate(when);
  for (const day of DAYS) {
    if (dayDate(weekStart, day) === iso) return day;
  }
  return null;
}

function namesHaveText(names: string[]): boolean {
  return names.some(filled);
}

export function sstHasContent(form: SstForm): boolean {
  return (
    namesHaveText(form.monday.attendance) ||
    namesHaveText(form.friday.attendance) ||
    filled(form.monday.note) ||
    filled(form.friday.note) ||
    filled(form.monday.startTime) ||
    filled(form.monday.endTime) ||
    filled(form.friday.startTime) ||
    filled(form.friday.endTime) ||
    filled(form.safetyProblem)
  );
}

export function fiveSHasContent(form: FiveSForm): boolean {
  return (
    namesHaveText(form.attendance) ||
    filled(form.startTime) ||
    filled(form.endTime) ||
    filled(form.everydayList) ||
    form.toolsAnswer !== "" ||
    filled(form.toolsNote) ||
    filled(form.dirtSources) ||
    form.reviewed !== "" ||
    filled(form.reviewNote)
  );
}

export function signatureHasContent(form: SignatureDay): boolean {
  return MACHINES.some(
    (id) => filled(form.machines[id].name) || filled(form.machines[id].signature),
  );
}

export function performanceHasContent(form: PerformanceDay): boolean {
  return (
    filled(form.worker) ||
    filled(form.startCounter) ||
    filled(form.stopCounter) ||
    filled(form.timeStart) ||
    filled(form.timeStop) ||
    form.unplanned !== "" ||
    filled(form.unplannedHours) ||
    filled(form.unplannedMinutes) ||
    form.planned !== "" ||
    filled(form.plannedHours) ||
    filled(form.plannedMinutes)
  );
}

export function faultyHasContent(form: FaultyDay): boolean {
  const { submitted: _submitted, submittedAt: _at, ...rest } = form;
  return Object.values(rest).some(filled);
}

export function g11HasContent(form: G11Day): boolean {
  return (
    filled(form.timeStart) ||
    filled(form.timeEnd) ||
    form.rows.some((row) => filled(row.frameType) || filled(row.qty))
  );
}

export function sstCanSubmit(form: SstForm): boolean {
  return sstHasContent(form);
}

export function fiveSCanSubmit(form: FiveSForm): boolean {
  return fiveSHasContent(form);
}

export function signatureCanSubmit(form: SignatureDay): boolean {
  return signatureHasContent(form);
}

export function performanceCanSubmit(form: PerformanceDay): boolean {
  return filled(form.worker);
}

export function faultyCanSubmit(form: FaultyDay): boolean {
  return filled(form.worker);
}

export function g11CanSubmit(form: G11Day): boolean {
  return form.rows.some((row) => filled(row.frameType) || filled(row.qty));
}

export type SlotStatus = "empty" | "filled" | "submitted";

export function slotStatus(submitted: boolean, content: boolean): SlotStatus {
  if (submitted) return "submitted";
  if (content) return "filled";
  return "empty";
}

export function dailyHasContent(shift: ShiftReport, form: DailyFormId, day: DayId): boolean {
  if (form === "signature") return signatureHasContent(shift.signature[day]);
  if (form === "g4Faulty" || form === "g3Faulty") return faultyHasContent(shift[form][day]);
  if (form === "g11") return g11HasContent(shift.g11[day]);
  return performanceHasContent(shift[form][day]);
}

export function dailyCanSubmit(shift: ShiftReport, form: DailyFormId, day: DayId): boolean {
  if (form === "signature") return signatureCanSubmit(shift.signature[day]);
  if (form === "g4Faulty" || form === "g3Faulty") return faultyCanSubmit(shift[form][day]);
  if (form === "g11") return g11CanSubmit(shift.g11[day]);
  return performanceCanSubmit(shift[form][day]);
}

export function shiftProgress(shift: ShiftReport): { done: number; total: number } {
  const total = 2 + DAYS.length * DAILY_FORMS.length;
  let done = 0;
  if (shift.sst.submitted) done += 1;
  if (shift.fiveS.submitted) done += 1;
  for (const day of DAYS) {
    for (const form of DAILY_FORMS) {
      if (shift[form][day].submitted) done += 1;
    }
  }
  return { done, total };
}

export function weekWasStarted(report: WeeklyReport): boolean {
  return SHIFTS.some((id) => {
    const shift = report.shifts[id];
    if (shift.sst.submitted || sstHasContent(shift.sst)) return true;
    if (shift.fiveS.submitted || fiveSHasContent(shift.fiveS)) return true;
    return DAYS.some((day) =>
      DAILY_FORMS.some(
        (form) => shift[form][day].submitted || dailyHasContent(shift, form, day),
      ),
    );
  });
}

/** A started entry that is not locked yet. Empty forms do not hold the week. */
export function weekHasPending(report: WeeklyReport): boolean {
  return SHIFTS.some((id) => {
    const shift = report.shifts[id];
    if (sstHasContent(shift.sst) && !shift.sst.submitted) return true;
    if (fiveSHasContent(shift.fiveS) && !shift.fiveS.submitted) return true;
    return DAYS.some((day) =>
      DAILY_FORMS.some(
        (form) => dailyHasContent(shift, form, day) && !shift[form][day].submitted,
      ),
    );
  });
}

function keepSubmitted<T extends { submitted: boolean }>(primary: T, extra: T): T {
  return extra.submitted && !primary.submitted ? extra : primary;
}

/**
 * A stale copy must not clear `submitted`. Open days keep the newer text.
 */
export function mergeKeepSubmitted(
  primary: WeeklyReport | null | undefined,
  secondary: WeeklyReport | null | undefined,
  weekStart?: string,
): WeeklyReport {
  const week = weekStart || primary?.weekStart || secondary?.weekStart || "";
  const base = normalizeReport(primary, week);
  if (!secondary) return base;
  const extra = normalizeReport(secondary, week);
  for (const shift of SHIFTS) {
    const left = base.shifts[shift];
    const right = extra.shifts[shift];
    left.sst = keepSubmitted(left.sst, right.sst);
    left.fiveS = keepSubmitted(left.fiveS, right.fiveS);
    for (const day of DAYS) {
      left.signature[day] = keepSubmitted(left.signature[day], right.signature[day]);
      left.g4Performance[day] = keepSubmitted(
        left.g4Performance[day],
        right.g4Performance[day],
      );
      left.g4Faulty[day] = keepSubmitted(left.g4Faulty[day], right.g4Faulty[day]);
      left.g3Performance[day] = keepSubmitted(
        left.g3Performance[day],
        right.g3Performance[day],
      );
      left.g3Faulty[day] = keepSubmitted(left.g3Faulty[day], right.g3Faulty[day]);
      left.g10[day] = keepSubmitted(left.g10[day], right.g10[day]);
      left.g11[day] = keepSubmitted(left.g11[day], right.g11[day]);
    }
  }
  return normalizeReport(base, week);
}

export function submitForm(
  report: WeeklyReport,
  ref: FormRef,
  submittedAt: string,
): WeeklyReport {
  const shift = report.shifts[ref.shift];
  if (ref.kind === "sst") {
    if (shift.sst.submitted || !sstCanSubmit(shift.sst)) return report;
    return {
      ...report,
      shifts: {
        ...report.shifts,
        [ref.shift]: {
          ...shift,
          sst: { ...shift.sst, submitted: true, submittedAt },
        },
      },
    };
  }
  if (ref.kind === "fiveS") {
    if (shift.fiveS.submitted || !fiveSCanSubmit(shift.fiveS)) return report;
    return {
      ...report,
      shifts: {
        ...report.shifts,
        [ref.shift]: {
          ...shift,
          fiveS: { ...shift.fiveS, submitted: true, submittedAt },
        },
      },
    };
  }
  const current = shift[ref.form][ref.day];
  if (current.submitted || !dailyCanSubmit(shift, ref.form, ref.day)) return report;
  return {
    ...report,
    shifts: {
      ...report.shifts,
      [ref.shift]: {
        ...shift,
        [ref.form]: {
          ...shift[ref.form],
          [ref.day]: { ...current, submitted: true, submittedAt },
        },
      },
    },
  };
}
