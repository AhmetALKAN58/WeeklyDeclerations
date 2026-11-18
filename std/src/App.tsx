import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmSubmit } from "./components/ConfirmSubmit";
import { FaultyForm } from "./components/FaultyForm";
import { FiveSForm } from "./components/FiveSForm";
import { FormNav } from "./components/FormNav";
import { G11Form } from "./components/G11Form";
import { ShiftHome, ShiftMenu } from "./components/Overview";
import { PerformanceForm } from "./components/PerformanceForm";
import { SignatureForm } from "./components/SignatureForm";
import { SstForm } from "./components/SstForm";
import {
  addDays,
  dayIdOn,
  emptyReport,
  formatShort,
  getMonday,
  isoDate,
  mergeKeepSubmitted,
  nextWeekStart,
  parseIso,
  previousWeekStart,
  submitForm,
  weekHasPending,
  type DailyFormId,
  type DayId,
  type FaultyDay,
  type FormRef,
  type G11Day,
  type PerformanceDay,
  type Screen,
  type ShiftId,
  type ShiftReport,
  type SignatureDay,
  type WeeklyReport,
} from "./model";
import { getOpenWeek, loadReport, saveReport, setOpenWeek } from "./storage";

const PERFORMANCE_COPY: Record<
  "g4Performance" | "g3Performance" | "g10",
  { title: string; counter: string }
> = {
  g4Performance: {
    title: "Rendement G4 / G4 performance",
    counter: "Compteur de grilles G4 / Grille counter assembler G4",
  },
  g3Performance: {
    title: "Rendement G3 / G3 performance",
    counter: "Compteur de grilles G3 / Grille counter assembler G3",
  },
  g10: {
    title: "Rendement scie G10 / Saw G10 performance",
    counter: "Compteur de cadres — scie G10 / Frame counter — saw G10",
  },
};

function initialWeek(): string {
  const calendar = getMonday(new Date());
  const open = getOpenWeek();
  if (!open || !/^\d{4}-\d{2}-\d{2}$/.test(open)) return calendar;
  const monday = getMonday(parseIso(open));
  // A later save must not reopen a future week the tablet has not reached.
  if (monday > calendar) return calendar;
  return monday;
}

export default function App() {
  const [now, setNow] = useState(() => Date.now());
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [report, setReport] = useState<WeeklyReport>(() => emptyReport(weekStart));
  const [screen, setScreen] = useState<Screen>({ kind: "shifts" });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "loading" | "local">("loading");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState<FormRef | null>(null);
  const skipSave = useRef(true);
  const reportRef = useRef(report);
  reportRef.current = report;
  const navigating = useRef(false);

  const calendar = useMemo(() => getMonday(new Date(now)), [now]);
  const today = dayIdOn(weekStart, new Date(now));

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    skipSave.current = true;
    setSaveState("loading");
    setLoadFailed(false);
    setLoadError("");
    const giveUp = window.setTimeout(() => {
      if (cancelled) return;
      setLoadFailed(true);
      setSaveState((state) => (state === "loading" ? "local" : state));
    }, 15_000);
    loadReport(weekStart)
      .then((loaded) => {
        if (cancelled) return;
        const current = reportRef.current;
        const safe = mergeKeepSubmitted(
          loaded,
          current.weekStart === loaded.weekStart ? current : null,
          weekStart,
        );
        reportRef.current = safe;
        setReport(safe);
        setLoadFailed(false);
        setSaveState("saved");
        skipSave.current = false;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadFailed(true);
        setLoadError(err instanceof Error ? err.message : "load failed");
        setSaveState("local");
      })
      .finally(() => window.clearTimeout(giveUp));
    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
    };
  }, [weekStart]);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveReport(report)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("local"));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [report]);

  const pendingHold = weekHasPending(report);
  const ready = report.weekStart === weekStart && saveState !== "loading" && !loadFailed;
  const canLeaveWeek = saveState !== "saving" && (saveState !== "loading" || loadFailed);
  const canGoForward = nextWeekStart(weekStart) <= calendar;

  const friday = useMemo(() => {
    const end = isoDate(addDays(weekStart, 4));
    return `${formatShort(weekStart, "fr-CA")} – ${formatShort(end, "fr-CA")}  ·  ${formatShort(weekStart, "en-CA")} – ${formatShort(end, "en-CA")}`;
  }, [weekStart]);

  function openForm(ref: FormRef) {
    setScreen(ref);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function commit(next: WeeklyReport) {
    reportRef.current = next;
    setReport(next);
    setSaveState("saving");
    void saveReport(next)
      .then(() => setSaveState("saved"))
      .catch(() => setSaveState("local"));
  }

  function updateShift(shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) {
    setReport((prev) => {
      const next = {
        ...prev,
        shifts: { ...prev.shifts, [shift]: recipe(prev.shifts[shift]) },
      };
      reportRef.current = next;
      return next;
    });
  }

  function confirmSubmit() {
    if (!pending) return;
    const next = submitForm(reportRef.current, pending, new Date().toISOString());
    if (next !== reportRef.current) commit(next);
    setPending(null);
  }

  function goBack() {
    if (screen.kind === "menu") {
      setScreen({ kind: "shifts" });
      return;
    }
    if (screen.kind === "shifts") return;
    setScreen({ kind: "menu", shift: screen.shift });
  }

  async function goToWeek(next: string) {
    if (navigating.current || next === weekStart || next > calendar) return;
    navigating.current = true;
    try {
      // Write the open week before the week changes. Changing weekStart reloads
      // and cancels the debounced save, which used to drop the last submit.
      const current = reportRef.current;
      if (!loadFailed && current.weekStart === weekStart && saveState !== "loading") {
        skipSave.current = true;
        setSaveState("saving");
        try {
          await saveReport(current);
          setSaveState("saved");
        } catch {
          setSaveState("local");
        }
      }
      setOpenWeek(next);
      setScreen((currentScreen) =>
        currentScreen.kind === "sst" ||
        currentScreen.kind === "fiveS" ||
        currentScreen.kind === "daily"
          ? { kind: "menu", shift: currentScreen.shift }
          : currentScreen,
      );
      setWeekStart(next);
    } finally {
      navigating.current = false;
    }
  }

  return (
    <div className="app">
      <div className="app-head">
        <header className="chrome">
          <div className="chrome-top">
            <div className="chrome-leading">
              {screen.kind === "shifts" ? null : (
                <button type="button" className="back-btn" onClick={goBack}>
                  ← Retour / Back
                </button>
              )}
              <div>
                <p className="kicker">STD</p>
                <h1>Rapport hebdomadaire / Weekly report</h1>
              </div>
            </div>
            <div className="week-nav">
              <button
                type="button"
                className="icon-btn"
                aria-label="Semaine précédente / Previous week"
                disabled={!canLeaveWeek}
                onClick={() => {
                  void goToWeek(previousWeekStart(weekStart));
                }}
              >
                ‹
              </button>
              <div className="week-label">
                <span>
                  {weekStart === calendar
                    ? "Semaine en cours / Current week"
                    : "Autre semaine / Other week"}
                </span>
                <strong>{friday}</strong>
                {pendingHold && ready ? (
                  <em className="week-hold">
                    Formulaires commencés non envoyés. / Started forms are not
                    submitted.
                  </em>
                ) : null}
                {loadFailed ? (
                  <em className="week-hold">
                    Chargement interrompu — les formulaires déjà envoyés restent
                    fermés. / Loading stopped — forms already sent stay closed.
                  </em>
                ) : null}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Semaine suivante / Next week"
                disabled={!canLeaveWeek || !canGoForward}
                onClick={() => {
                  void goToWeek(nextWeekStart(weekStart));
                }}
              >
                ›
              </button>
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
            {weekStart !== calendar ? (
              <button
                type="button"
                className="ghost-btn"
                disabled={!canLeaveWeek}
                onClick={() => {
                  void goToWeek(calendar);
                }}
              >
                Cette semaine / This week
              </button>
            ) : null}
          </div>
        </header>
        {screen.kind !== "shifts" && screen.kind !== "menu" && ready ? (
          <FormNav screen={screen} report={report} today={today} onOpen={openForm} />
        ) : null}
      </div>

      {!ready ? (
        <main className="overview">
          <p className="overview-lead">
            {loadFailed
              ? `Impossible de charger cette semaine. / This week could not be loaded.${loadError ? ` (${loadError})` : ""}`
              : "Chargement de la semaine… / Loading the week…"}
          </p>
        </main>
      ) : screen.kind === "shifts" ? (
        <ShiftHome
          report={report}
          onOpen={(shift) => {
            setScreen({ kind: "menu", shift });
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
        />
      ) : screen.kind === "menu" ? (
        <ShiftMenu
          shift={screen.shift}
          report={report}
          today={today}
          onOpen={openForm}
        />
      ) : (
        <main className={`form-stage shift-${screen.shift}`}>
          <ActiveForm
            screen={screen}
            report={report}
            onShift={updateShift}
            onSubmit={() => setPending(screen)}
          />
        </main>
      )}

      <ConfirmSubmit
        open={pending !== null}
        onCancel={() => setPending(null)}
        onConfirm={confirmSubmit}
      />
    </div>
  );
}

function ActiveForm({
  screen,
  report,
  onShift,
  onSubmit,
}: {
  screen: FormRef;
  report: WeeklyReport;
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void;
  onSubmit: () => void;
}) {
  const shift = report.shifts[screen.shift];
  if (screen.kind === "sst") {
    return (
      <SstForm
        shift={screen.shift}
        weekStart={report.weekStart}
        value={shift.sst}
        onSubmit={onSubmit}
        onChange={(sst) => {
          if (shift.sst.submitted) return;
          onShift(screen.shift, (current) => ({ ...current, sst }));
        }}
      />
    );
  }
  if (screen.kind === "fiveS") {
    return (
      <FiveSForm
        shift={screen.shift}
        weekStart={report.weekStart}
        value={shift.fiveS}
        onSubmit={onSubmit}
        onChange={(fiveS) => {
          if (shift.fiveS.submitted) return;
          onShift(screen.shift, (current) => ({ ...current, fiveS }));
        }}
      />
    );
  }
  return (
    <DailyForm
      shiftId={screen.shift}
      form={screen.form}
      day={screen.day}
      weekStart={report.weekStart}
      data={shift}
      onSubmit={onSubmit}
      onShift={onShift}
    />
  );
}

function DailyForm({
  shiftId,
  form,
  day,
  weekStart,
  data,
  onSubmit,
  onShift,
}: {
  shiftId: ShiftId;
  form: DailyFormId;
  day: DayId;
  weekStart: string;
  data: ShiftReport;
  onSubmit: () => void;
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void;
}) {
  if (form === "signature") {
    return (
      <SignatureForm
        shift={shiftId}
        weekStart={weekStart}
        day={day}
        value={data.signature[day]}
        onSubmit={onSubmit}
        onChange={(value) => replaceDay(onShift, shiftId, "signature", day, value)}
      />
    );
  }
  if (form === "g4Faulty" || form === "g3Faulty") {
    return (
      <FaultyForm
        shift={shiftId}
        weekStart={weekStart}
        day={day}
        machine={form === "g4Faulty" ? "G4" : "G3"}
        value={data[form][day]}
        onSubmit={onSubmit}
        onChange={(value) => replaceDay(onShift, shiftId, form, day, value)}
      />
    );
  }
  if (form === "g11") {
    return (
      <G11Form
        shift={shiftId}
        weekStart={weekStart}
        day={day}
        value={data.g11[day]}
        onSubmit={onSubmit}
        onChange={(value) => replaceDay(onShift, shiftId, "g11", day, value)}
      />
    );
  }
  const copy = PERFORMANCE_COPY[form];
  return (
    <PerformanceForm
      shift={shiftId}
      weekStart={weekStart}
      day={day}
      title={copy.title}
      counterLabel={copy.counter}
      value={data[form][day]}
      onSubmit={onSubmit}
      onChange={(value) => replaceDay(onShift, shiftId, form, day, value)}
    />
  );
}

function replaceDay(
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void,
  shift: ShiftId,
  form: "signature",
  day: DayId,
  value: SignatureDay,
): void;
function replaceDay(
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void,
  shift: ShiftId,
  form: "g4Faulty" | "g3Faulty",
  day: DayId,
  value: FaultyDay,
): void;
function replaceDay(
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void,
  shift: ShiftId,
  form: "g11",
  day: DayId,
  value: G11Day,
): void;
function replaceDay(
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void,
  shift: ShiftId,
  form: "g4Performance" | "g3Performance" | "g10",
  day: DayId,
  value: PerformanceDay,
): void;
function replaceDay(
  onShift: (shift: ShiftId, recipe: (current: ShiftReport) => ShiftReport) => void,
  shift: ShiftId,
  form: DailyFormId,
  day: DayId,
  value: SignatureDay | FaultyDay | G11Day | PerformanceDay,
): void {
  onShift(shift, (current) => {
    if (current[form][day].submitted) return current;
    const days = { ...current[form], [day]: value };
    return { ...current, [form]: days };
  });
}
