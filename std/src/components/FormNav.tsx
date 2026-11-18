import {
  DAILY_FORMS,
  DAILY_META,
  DAYS,
  DAY_META,
  dailyHasContent,
  fiveSHasContent,
  slotStatus,
  sstHasContent,
  type DailyFormId,
  type DayId,
  type FormRef,
  type WeeklyReport,
} from "../model";

export function FormNav({
  screen,
  report,
  today,
  onOpen,
}: {
  screen: FormRef;
  report: WeeklyReport;
  today: DayId | null;
  onOpen: (ref: FormRef) => void;
}) {
  const data = report.shifts[screen.shift];
  const day: DayId = screen.kind === "daily" ? screen.day : (today ?? "monday");

  function openDaily(form: DailyFormId) {
    onOpen({ kind: "daily", shift: screen.shift, form, day });
  }

  return (
    <nav className="form-nav" aria-label="Forms">
      <div className="pill-row">
        <button
          type="button"
          className={`pill ${screen.kind === "sst" ? "active" : ""} ${pillClass(slotStatus(data.sst.submitted, sstHasContent(data.sst)))}`}
          onClick={() => onOpen({ kind: "sst", shift: screen.shift })}
        >
          SST
        </button>
        <button
          type="button"
          className={`pill ${screen.kind === "fiveS" ? "active" : ""} ${pillClass(slotStatus(data.fiveS.submitted, fiveSHasContent(data.fiveS)))}`}
          onClick={() => onOpen({ kind: "fiveS", shift: screen.shift })}
        >
          5S
        </button>
        {DAILY_FORMS.map((form) => {
          const status =
            screen.kind === "daily"
              ? slotStatus(data[form][day].submitted, dailyHasContent(data, form, day))
              : "empty";
          return (
            <button
              key={form}
              type="button"
              className={`pill ${screen.kind === "daily" && screen.form === form ? "active" : ""} ${screen.kind === "daily" ? pillClass(status) : ""}`}
              onClick={() => openDaily(form)}
            >
              {DAILY_META[form].en}
            </button>
          );
        })}
      </div>
      {screen.kind === "daily" ? (
        <div className="pill-row">
          {DAYS.map((id) => (
            <button
              key={id}
              type="button"
              className={`pill ${screen.day === id ? "active" : ""}`}
              onClick={() => onOpen({ ...screen, day: id })}
            >
              {DAY_META[id].short}
              <small>{DAY_META[id].en}</small>
            </button>
          ))}
        </div>
      ) : null}
    </nav>
  );
}

function pillClass(status: "empty" | "filled" | "submitted"): string {
  if (status === "submitted") return "locked";
  if (status === "filled") return "filled";
  return "";
}
