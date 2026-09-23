import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmSubmit } from "./components/ConfirmSubmit";
import { DailyMeetingForm } from "./components/DailyMeetingForm";
import { DailyOrderForm } from "./components/DailyOrderForm";
import { MeetingHandover } from "./components/MeetingHandover";
import { RepaintForm } from "./components/RepaintForm";
import { RepaintHandover } from "./components/RepaintHandover";
import {
  clockNow,
  dueMeetingCandidates,
  dueRepaintCandidates,
  previousWeekStart,
  weekHasPendingSubmissions,
  type DueSlot,
} from "./meetingSchedule";
import {
  DAYS,
  DAY_META,
  SHIFTS,
  SHIFT_META,
  addDays,
  emptyReport,
  formatShort,
  getMonday,
  isoDate,
  meetingPageHasContent,
  meetingSubmittedCount,
  orderCanSubmit,
  orderHasContent,
  orderIsLocked,
  parseIso,
  repaintDayCanSubmit,
  repaintPageHasContent,
  repaintSubmittedCount,
  shiftFillCount,
  sundayOf,
  withMeetingDaySubmitted,
  withRepaintDaySubmitted,
  type DayId,
  type MeetingDay,
  type RepaintDay,
  type Screen,
  type ShiftId,
  type WeeklyReport,
} from "./model";
import { getLastWeek, loadReport, saveReport } from "./storage";

type PendingSubmit =
  | { kind: "orders" }
  | { kind: "repaint-day"; shift: ShiftId; day: DayId; weekStart: string }
  | { kind: "meeting-day"; shift: ShiftId; day: DayId; weekStart: string };

function firstOpenSlot(
  candidates: DueSlot[],
  weekStart: string,
  report: WeeklyReport,
  handover: WeeklyReport | null,
  isSubmitted: (source: WeeklyReport, slot: DueSlot) => boolean,
): DueSlot | null {
  for (const candidate of candidates) {
    if (candidate.weekStart === weekStart) {
      if (!isSubmitted(report, candidate)) return candidate;
      continue;
    }
    if (handover?.weekStart === candidate.weekStart) {
      if (!isSubmitted(handover, candidate)) return candidate;
      continue;
    }
    return candidate;
  }
  return null;
}

function initialWeek(): string {
  const calendar = getMonday(clockNow());
  const previous = previousWeekStart(calendar);
  const last = getLastWeek();
  if (last === previous) return previous;
  return calendar;
}

export default function App() {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [report, setReport] = useState<WeeklyReport>(() =>
    emptyReport(weekStart),
  );
  const [screen, setScreen] = useState<Screen>("overview");
  const [shift, setShift] = useState<ShiftId>("morning");
  const [day, setDay] = useState<DayId>("monday");
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "loading" | "local"
  >("loading");
  const skipSave = useRef(true);
  const [pendingSubmit, setPendingSubmit] = useState<PendingSubmit | null>(
    null,
  );
  const [handoverReport, setHandoverReport] = useState<WeeklyReport | null>(
    null,
  );
  const [nowTick, setNowTick] = useState(() => clockNow().getTime());

  useEffect(() => {
    let cancelled = false;
    skipSave.current = true;
    setSaveState("loading");
    loadReport(weekStart).then((loaded) => {
      if (cancelled) return;
      setReport(loaded);
      setSaveState("saved");
      skipSave.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveReport(report)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("local"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [report]);

  useEffect(() => {
    if (!handoverReport || handoverReport.weekStart === weekStart) return;
    const timer = window.setTimeout(() => {
      saveReport(handoverReport)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("local"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [handoverReport, weekStart]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(clockNow().getTime()), 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") setNowTick(clockNow().getTime());
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  const pendingHold = useMemo(
    () => weekHasPendingSubmissions(report, clockNow()),
    [report, nowTick],
  );
  const calendarWeek = useMemo(() => getMonday(clockNow()), [nowTick]);
  const holdingLastWeek = weekStart < calendarWeek;

  useEffect(() => {
    if (saveState === "loading") return;
    const previous = previousWeekStart(calendarWeek);

    if (weekStart === previous) {
      if (report.weekStart === previous && !pendingHold) {
        setWeekStart(calendarWeek);
        setScreen("overview");
      }
      return;
    }

    if (weekStart < previous) {
      setWeekStart(previous);
      setScreen("overview");
    }
  }, [weekStart, saveState, pendingHold, calendarWeek, report.weekStart]);

  useEffect(() => {
    if (saveState === "loading") return;
    if (weekStart !== calendarWeek) return;
    let cancelled = false;
    const previous = previousWeekStart(calendarWeek);
    loadReport(previous).then((previousReport) => {
      if (cancelled) return;
      if (weekHasPendingSubmissions(previousReport, clockNow())) {
        setWeekStart(previous);
        setScreen("overview");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [weekStart, saveState, calendarWeek]);

  const dueRepaint = useMemo(() => {
    void nowTick;
    return firstOpenSlot(
      dueRepaintCandidates(clockNow(), weekStart),
      weekStart,
      report,
      handoverReport,
      (source, slot) => source.shifts[slot.shift].repaint[slot.day].submitted,
    );
  }, [nowTick, report, handoverReport, weekStart]);

  const dueMeeting = useMemo(() => {
    void nowTick;
    return firstOpenSlot(
      dueMeetingCandidates(clockNow(), weekStart),
      weekStart,
      report,
      handoverReport,
      (source, slot) => source.shifts[slot.shift].meeting[slot.day].submitted,
    );
  }, [nowTick, report, handoverReport, weekStart]);

  const blockingSlot = dueRepaint ?? dueMeeting;
  const blockingKind = dueRepaint ? "repaint" : dueMeeting ? "meeting" : null;

  useEffect(() => {
    if (!blockingSlot || blockingSlot.weekStart === weekStart) {
      setHandoverReport((prev) => (prev ? null : prev));
      return;
    }
    const targetWeek = blockingSlot.weekStart;
    let cancelled = false;
    loadReport(targetWeek).then((loaded) => {
      if (cancelled) return;
      setHandoverReport((prev) =>
        prev && prev.weekStart === loaded.weekStart ? prev : loaded,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [blockingSlot?.weekStart, weekStart]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "meeting-handover-open",
      Boolean(blockingSlot) && saveState !== "loading",
    );
    return () => document.documentElement.classList.remove("meeting-handover-open");
  }, [blockingSlot, saveState]);

  const openForm = useCallback(
    (nextShift: ShiftId, nextScreen: Screen, nextDay: DayId = "monday") => {
      setShift(nextShift);
      setDay(nextDay);
      setScreen(nextScreen);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [],
  );

  const weekLabel = useMemo(() => {
    const start = formatShort(weekStart, "en-CA");
    const end = formatShort(sundayOf(weekStart), "en-CA");
    const startFr = formatShort(weekStart, "fr-CA");
    const endFr = formatShort(sundayOf(weekStart), "fr-CA");
    return `${startFr} – ${endFr}  ·  ${start} – ${end}`;
  }, [weekStart]);

  function confirmSubmit() {
    if (!pendingSubmit) return;
    const submittedAt = new Date().toISOString();
    if (pendingSubmit.kind === "orders") {
      if (!orderCanSubmit(report.shifts[shift].orders[day])) {
        setPendingSubmit(null);
        return;
      }
      setReport((prev) => ({
        ...prev,
        shifts: {
          ...prev.shifts,
          [shift]: {
            ...prev.shifts[shift],
            orders: {
              ...prev.shifts[shift].orders,
              [day]: {
                ...prev.shifts[shift].orders[day],
                submitted: true,
                submittedAt,
              },
            },
          },
        },
      }));
    } else if (pendingSubmit.kind === "meeting-day") {
      const target = pendingSubmit;
      if (target.weekStart === weekStart) {
        setReport((prev) =>
          withMeetingDaySubmitted(
            prev,
            target.shift,
            target.day,
            submittedAt,
          ),
        );
      } else {
        setHandoverReport((prev) =>
          prev
            ? withMeetingDaySubmitted(
                prev,
                target.shift,
                target.day,
                submittedAt,
              )
            : prev,
        );
      }
    } else if (pendingSubmit.kind === "repaint-day") {
      const target = pendingSubmit;
      const source =
        target.weekStart === weekStart
          ? report
          : handoverReport?.weekStart === target.weekStart
            ? handoverReport
            : null;
      if (
        !source ||
        !repaintDayCanSubmit(source.shifts[target.shift].repaint[target.day])
      ) {
        setPendingSubmit(null);
        return;
      }
      if (target.weekStart === weekStart) {
        setReport((prev) =>
          withRepaintDaySubmitted(prev, target.shift, target.day, submittedAt),
        );
      } else {
        setHandoverReport((prev) =>
          prev
            ? withRepaintDaySubmitted(prev, target.shift, target.day, submittedAt)
            : prev,
        );
      }
    }
    setPendingSubmit(null);
  }

  function patchDueMeeting(next: Partial<MeetingDay>) {
    if (!dueMeeting) return;
    const apply = (prev: WeeklyReport): WeeklyReport => {
      const current = prev.shifts[dueMeeting.shift].meeting[dueMeeting.day];
      if (current.submitted) return prev;
      return {
        ...prev,
        shifts: {
          ...prev.shifts,
          [dueMeeting.shift]: {
            ...prev.shifts[dueMeeting.shift],
            meeting: {
              ...prev.shifts[dueMeeting.shift].meeting,
              [dueMeeting.day]: { ...current, ...next },
            },
          },
        },
      };
    };
    if (dueMeeting.weekStart === weekStart) setReport(apply);
    else setHandoverReport((prev) => (prev ? apply(prev) : prev));
  }

  function patchDueRepaint(next: RepaintDay) {
    if (!dueRepaint) return;
    const apply = (prev: WeeklyReport): WeeklyReport => {
      const current = prev.shifts[dueRepaint.shift].repaint[dueRepaint.day];
      if (current.submitted) return prev;
      return {
        ...prev,
        shifts: {
          ...prev.shifts,
          [dueRepaint.shift]: {
            ...prev.shifts[dueRepaint.shift],
            repaint: {
              ...prev.shifts[dueRepaint.shift].repaint,
              [dueRepaint.day]: next,
            },
          },
        },
      };
    };
    if (dueRepaint.weekStart === weekStart) setReport(apply);
    else setHandoverReport((prev) => (prev ? apply(prev) : prev));
  }

  const currentShift = report.shifts[shift];
  const orderLocked = orderIsLocked(currentShift.orders[day]);

  return (
    <div className={`app shift-theme-${shift}`}>
      <div className="app-head no-print">
      <header className="chrome">
        <div className="chrome-top">
          <div className="chrome-leading">
            {screen === "overview" ? null : (
              <button
                type="button"
                className="back-btn"
                onClick={() => setScreen("overview")}
              >
                ← Retour / Back
              </button>
            )}
            <div>
              <p className="kicker">Ligne de peinture / Paint Line</p>
              <h1>Rapport hebdomadaire / Weekly Report</h1>
            </div>
          </div>
          <div className="week-label">
            <span>
              {holdingLastWeek
                ? "Semaine précédente / Previous week"
                : "Semaine en cours / Current week"}
            </span>
            <strong>{weekLabel}</strong>
            {holdingLastWeek ? (
              <em className="week-hold">
                Envoyez les formulaires restants pour ouvrir la nouvelle
                semaine. / Submit remaining forms to open the new week.
              </em>
            ) : null}
          </div>
        </div>

        <div className="chrome-actions">
          <span className={`save-pill ${saveState}`}>
            {saveState === "loading"
              ? "Chargement / Loading"
              : saveState === "saving"
                ? "Enregistrement… / Saving"
                : saveState === "local"
                ? "Tablette seulement / Saved on tablet"
                : "Enregistré / Saved"}
          </span>
        </div>
      </header>

      </div>

      {screen === "overview" ? (
        <Overview report={report} onOpen={openForm} />
      ) : (
        <>
          <main className={`form-stage shift-${shift}`}>
            {screen === "orders" ? (
              <DailyOrderForm
                shift={shift}
                value={currentShift.orders[day]}
                locked={orderLocked}
                onSubmit={() => setPendingSubmit({ kind: "orders" })}
                onChange={(orders) => {
                  if (orderIsLocked(currentShift.orders[day])) return;
                  setReport((prev) => ({
                    ...prev,
                    shifts: {
                      ...prev.shifts,
                      [shift]: {
                        ...prev.shifts[shift],
                        orders: { ...prev.shifts[shift].orders, [day]: orders },
                      },
                    },
                  }));
                }}
              />
            ) : null}
            {screen === "meeting" ? (
              <DailyMeetingForm
                shift={shift}
                value={currentShift.meeting}
                highlightDay={
                  dueMeeting &&
                  dueMeeting.weekStart === weekStart &&
                  dueMeeting.shift === shift
                    ? dueMeeting.day
                    : undefined
                }
                onSubmitDay={(meetingDay) =>
                  setPendingSubmit({
                    kind: "meeting-day",
                    shift,
                    day: meetingDay,
                    weekStart,
                  })
                }
                onChange={(meeting) => {
                  setReport((prev) => ({
                    ...prev,
                    shifts: {
                      ...prev.shifts,
                      [shift]: { ...prev.shifts[shift], meeting },
                    },
                  }));
                }}
              />
            ) : null}
            {screen === "repaint" ? (
              <RepaintForm
                shift={shift}
                value={currentShift.repaint}
                highlightDay={
                  dueRepaint &&
                  dueRepaint.weekStart === weekStart &&
                  dueRepaint.shift === shift
                    ? dueRepaint.day
                    : undefined
                }
                onSubmitDay={(repaintDay) =>
                  setPendingSubmit({
                    kind: "repaint-day",
                    shift,
                    day: repaintDay,
                    weekStart,
                  })
                }
                onChange={(repaint) => {
                  setReport((prev) => ({
                    ...prev,
                    shifts: {
                      ...prev.shifts,
                      [shift]: { ...prev.shifts[shift], repaint },
                    },
                  }));
                }}
              />
            ) : null}
          </main>
        </>
      )}

      <ConfirmSubmit
        open={pendingSubmit !== null}
        onCancel={() => setPendingSubmit(null)}
        onConfirm={confirmSubmit}
      />

      {blockingKind === "repaint" && dueRepaint && saveState !== "loading" ? (
        <RepaintHandover
          key={`${dueRepaint.weekStart}-${dueRepaint.shift}-${dueRepaint.day}`}
          due={dueRepaint}
          loading={dueRepaint.weekStart !== weekStart && handoverReport === null}
          value={
            dueRepaint.weekStart === weekStart
              ? report.shifts[dueRepaint.shift].repaint[dueRepaint.day]
              : (handoverReport?.shifts[dueRepaint.shift].repaint[dueRepaint.day] ??
                null)
          }
          onChange={patchDueRepaint}
          onSubmit={() =>
            setPendingSubmit({
              kind: "repaint-day",
              shift: dueRepaint.shift,
              day: dueRepaint.day,
              weekStart: dueRepaint.weekStart,
            })
          }
        />
      ) : null}

      {blockingKind === "meeting" && dueMeeting && saveState !== "loading" ? (
        <MeetingHandover
          key={`${dueMeeting.weekStart}-${dueMeeting.shift}-${dueMeeting.day}`}
          due={dueMeeting}
          loading={
            dueMeeting.weekStart !== weekStart && handoverReport === null
          }
          value={
            dueMeeting.weekStart === weekStart
              ? report.shifts[dueMeeting.shift].meeting[dueMeeting.day]
              : (handoverReport?.shifts[dueMeeting.shift].meeting[
                  dueMeeting.day
                ] ?? null)
          }
          onChange={patchDueMeeting}
          onSubmit={() =>
            setPendingSubmit({
              kind: "meeting-day",
              shift: dueMeeting.shift,
              day: dueMeeting.day,
              weekStart: dueMeeting.weekStart,
            })
          }
        />
      ) : null}

    </div>
  );
}

function Overview({
  report,
  onOpen,
}: {
  report: WeeklyReport;
  onOpen: (shift: ShiftId, screen: Screen, day?: DayId) => void;
}) {
  return (
    <main className="overview">
      <p className="overview-lead">
        Chaque quart a 7 listes de commandes (lundi–dimanche), 1 réunion
        quotidienne et 1 formulaire de repeinture / matériel défectueux par jour.
        <br />
        Each shift has 7 daily order lists (Monday–Sunday), 1 daily meeting page
        and a daily repaint &amp; bad material form.
      </p>
      <div className="shift-columns">
        {SHIFTS.map((id) => {
          const data = report.shifts[id];
          const fill = shiftFillCount(data);
          return (
            <section className={`shift-card shift-${id}`} key={id}>
              <header>
                <h2>
                  {SHIFT_META[id].icon} {SHIFT_META[id].fr}
                  <small>{SHIFT_META[id].en}</small>
                </h2>
                <span className="fill-count">
                  {fill.done}/{fill.total}
                </span>
              </header>
              <ol>
                {DAYS.map((dayId) => {
                  const date = isoDate(
                    addDays(report.weekStart, DAY_META[dayId].offset),
                  );
                  const filled = orderHasContent(data.orders[dayId]);
                  const locked = orderIsLocked(data.orders[dayId]);
                  return (
                    <li key={dayId}>
                      <button
                        type="button"
                        className={locked ? "submitted" : filled ? "filled" : ""}
                        onClick={() => onOpen(id, "orders", dayId)}
                      >
                        <span>
                          {DAY_META[dayId].fr} / {DAY_META[dayId].en}
                          <small>{parseIso(date).toLocaleDateString("en-CA")}</small>
                        </span>
                        <em>
                          {locked
                            ? "Soumis / Submitted"
                            : filled
                              ? "Saisi / Filled"
                              : "Vide / Empty"}
                        </em>
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    className={
                      meetingSubmittedCount(data.meeting) === DAYS.length
                        ? "submitted"
                        : meetingPageHasContent(data.meeting) ||
                            meetingSubmittedCount(data.meeting) > 0
                          ? "filled"
                          : ""
                    }
                    onClick={() => onOpen(id, "meeting")}
                  >
                    <span>Réunion quotidienne / Daily Meeting</span>
                    <em>
                      {meetingSubmittedCount(data.meeting) === DAYS.length
                        ? "Soumis / Submitted"
                        : meetingSubmittedCount(data.meeting) > 0
                          ? `${meetingSubmittedCount(data.meeting)}/${DAYS.length} soumis / submitted`
                          : meetingPageHasContent(data.meeting)
                            ? "Saisi / Filled"
                            : "Vide / Empty"}
                    </em>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={
                      repaintSubmittedCount(data.repaint) === DAYS.length
                        ? "submitted"
                        : repaintSubmittedCount(data.repaint) > 0 ||
                            repaintPageHasContent(data.repaint)
                          ? "filled"
                          : ""
                    }
                    onClick={() => onOpen(id, "repaint")}
                  >
                    <span>Repeinture et matériel défectueux / Repaint &amp; Bad material</span>
                    <em>
                      {repaintSubmittedCount(data.repaint) === DAYS.length
                        ? "Soumis / Submitted"
                        : repaintSubmittedCount(data.repaint) > 0
                          ? `${repaintSubmittedCount(data.repaint)}/${DAYS.length} soumis / submitted`
                          : repaintPageHasContent(data.repaint)
                            ? "Saisi / Filled"
                            : "Vide / Empty"}
                    </em>
                  </button>
                </li>
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}
