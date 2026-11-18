import {
  DAILY_FORMS,
  DAILY_META,
  DAYS,
  DAY_META,
  SHIFTS,
  SHIFT_META,
  dailyHasContent,
  dayDate,
  fiveSHasContent,
  formatShort,
  shiftProgress,
  slotStatus,
  sstHasContent,
  weekHasPending,
  type DailyFormId,
  type DayId,
  type FormRef,
  type ShiftId,
  type SlotStatus,
  type WeeklyReport,
} from "../model";

function label(status: SlotStatus): string {
  if (status === "submitted") return "Soumis / Submitted";
  if (status === "filled") return "Saisi / Filled";
  return "Vide / Empty";
}

export function ShiftHome({
  report,
  onOpen,
}: {
  report: WeeklyReport;
  onOpen: (shift: ShiftId) => void;
}) {
  return (
    <main className="overview">
      <p className="overview-lead">
        Choisissez le quart. Chaque quart a son propre menu : SST et 5S pour la
        semaine, puis les formulaires de chaque jour.
        <br />
        Choose the shift. Each shift has its own menu: SST and 5S for the week,
        then the forms for each day.
      </p>
      {weekHasPending(report) ? (
        <p className="overview-note">
          Des formulaires commencés ne sont pas encore envoyés. / Some started
          forms are not submitted yet.
        </p>
      ) : null}
      <div className="shift-picker">
        {SHIFTS.map((shift) => {
          const meta = SHIFT_META[shift];
          const progress = shiftProgress(report.shifts[shift]);
          return (
            <button
              key={shift}
              type="button"
              className={`shift-pick shift-${shift}`}
              onClick={() => onOpen(shift)}
            >
              <span className="shift-pick-icon">{meta.icon}</span>
              <span>
                <strong>{meta.fr}</strong>
                <small>{meta.en}</small>
              </span>
              <em>
                {progress.done}/{progress.total}
              </em>
            </button>
          );
        })}
      </div>
    </main>
  );
}

export function ShiftMenu({
  shift,
  report,
  today,
  onOpen,
}: {
  shift: ShiftId;
  report: WeeklyReport;
  today: DayId | null;
  onOpen: (ref: FormRef) => void;
}) {
  const data = report.shifts[shift];
  const progress = shiftProgress(data);
  const meta = SHIFT_META[shift];
  return (
    <main className="overview">
      <section className={`shift-card shift-menu shift-${shift}`}>
        <header>
          <h2>
            {meta.icon} {meta.fr}
            <small>{meta.en}</small>
          </h2>
          <span className="fill-count">
            {progress.done}/{progress.total}
          </span>
        </header>
        <div className="shift-body">
          <FormButton
            title="Réunion SST / SST meeting"
            detail="Semaine / Week"
            status={slotStatus(data.sst.submitted, sstHasContent(data.sst))}
            onClick={() => onOpen({ kind: "sst", shift })}
          />
          <FormButton
            title="Réunion 5S / 5S meeting"
            detail="Mercredi / Wednesday"
            status={slotStatus(data.fiveS.submitted, fiveSHasContent(data.fiveS))}
            onClick={() => onOpen({ kind: "fiveS", shift })}
          />
          {DAYS.map((day) => (
            <DayForms
              key={day}
              shift={shift}
              day={day}
              weekStart={report.weekStart}
              today={today === day}
              report={report}
              onOpen={onOpen}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function DayForms({
  shift,
  day,
  weekStart,
  today,
  report,
  onOpen,
}: {
  shift: ShiftId;
  day: DayId;
  weekStart: string;
  today: boolean;
  report: WeeklyReport;
  onOpen: (ref: FormRef) => void;
}) {
  const date = dayDate(weekStart, day);
  const meta = DAY_META[day];
  return (
    <div className={`day-group ${today ? "is-today" : ""}`}>
      <h3>
        {meta.fr} / {meta.en}
        <small>
          {formatShort(date, "fr-CA")} · {formatShort(date, "en-CA")}
          {today ? " · Aujourd'hui / Today" : ""}
        </small>
      </h3>
      {DAILY_FORMS.map((form) => (
        <DailyButton
          key={form}
          shift={shift}
          day={day}
          form={form}
          report={report}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function DailyButton({
  shift,
  day,
  form,
  report,
  onOpen,
}: {
  shift: ShiftId;
  day: DayId;
  form: DailyFormId;
  report: WeeklyReport;
  onOpen: (ref: FormRef) => void;
}) {
  const data = report.shifts[shift];
  const meta = DAILY_META[form];
  const status = slotStatus(
    data[form][day].submitted,
    dailyHasContent(data, form, day),
  );
  return (
    <FormButton
      title={`${meta.fr} / ${meta.en}`}
      status={status}
      onClick={() => onOpen({ kind: "daily", shift, form, day })}
    />
  );
}

function FormButton({
  title,
  detail,
  status,
  onClick,
}: {
  title: string;
  detail?: string;
  status: SlotStatus;
  onClick: () => void;
}) {
  return (
    <button type="button" className={status === "empty" ? "" : status} onClick={onClick}>
      <span>
        {title}
        {detail ? <small>{detail}</small> : null}
      </span>
      <em>{label(status)}</em>
    </button>
  );
}
