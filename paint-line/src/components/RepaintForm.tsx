import {
  DAYS,
  DAY_META,
  SHIFT_META,
  emptyRepaintRow,
  repaintDayCanSubmit,
  repaintRowHasContent,
  type DayId,
  type RepaintDay,
  type RepaintRow,
  type ShiftId,
} from "../model";
import { FormLockBar } from "./FormLockBar";

interface RepaintFormProps {
  shift: ShiftId;
  value: Record<DayId, RepaintDay>;
  onlyDay?: DayId;
  highlightDay?: DayId;
  onChange: (next: Record<DayId, RepaintDay>) => void;
  onSubmitDay?: (day: DayId) => void;
}

export function RepaintForm({
  shift,
  value,
  onlyDay,
  highlightDay,
  onChange,
  onSubmitDay,
}: RepaintFormProps) {
  const meta = SHIFT_META[shift];
  const days = onlyDay ? [onlyDay] : DAYS;

  function patch(day: DayId, next: RepaintDay) {
    if (value[day].submitted) return;
    onChange({ ...value, [day]: next });
  }

  return (
    <article className={`paper-form repaint-form shift-${shift}`}>
      <header className="repaint-header">
        <h1>
          Formulaire de repeinture et matériel défectueux ({meta.fr})
          <small>
            PAINTLINE REPAINT AND BAD MATERIAL FORM ({meta.en.toUpperCase()})
          </small>
        </h1>
        <p className="meeting-hint">
          Une déclaration par jour. La fenêtre s&apos;ouvre 30 minutes avant la
          fin du quart et doit être remplie. / One declaration per day. The
          window opens 30 minutes before the shift ends and must be filled.
        </p>
      </header>

      {days.map((day) => (
        <RepaintDayFields
          key={day}
          day={day}
          value={value[day]}
          highlight={highlightDay === day}
          onChange={(next) => patch(day, next)}
          onSubmit={onSubmitDay ? () => onSubmitDay(day) : undefined}
        />
      ))}
    </article>
  );
}

export function repaintSubmitHint(day: RepaintDay): string {
  const touched = day.rows.filter(repaintRowHasContent);
  if (touched.length === 0) {
    return "Ajoutez au moins une déclaration avant d'envoyer. / Add at least one declaration before submitting.";
  }
  if (touched.some((row) => row.material.trim().length === 0)) {
    return "Indiquez le matériel pour chaque ligne remplie. / Enter the material for every filled row.";
  }
  return "Vérifiez, puis envoyez. / Review, then submit.";
}

export function RepaintDayFields({
  day,
  value,
  highlight = false,
  onChange,
  onSubmit,
}: {
  day: DayId;
  value: RepaintDay;
  highlight?: boolean;
  onChange: (next: RepaintDay) => void;
  onSubmit?: () => void;
}) {
  const meta = DAY_META[day];
  const locked = value.submitted;
  const canSubmit = repaintDayCanSubmit(value);

  function patchRow(index: number, next: Partial<RepaintRow>) {
    if (locked) return;
    onChange({
      ...value,
      rows: value.rows.map((row, i) => (i === index ? { ...row, ...next } : row)),
    });
  }

  return (
    <section
      className={`repaint-day ${highlight ? "is-due" : ""} ${locked ? "is-locked" : ""}`}
    >
      <header className="repaint-day-head">
        <h2>
          {meta.fr} / {meta.en}
        </h2>
      </header>
      {locked ? (
        <FormLockBar locked submittedAt={value.submittedAt} onSubmit={() => undefined} />
      ) : null}
      <fieldset className="form-lock" disabled={locked}>
        <div className="repaint-table">
          <div className="repaint-head">
            <span>Matériel / Material</span>
            <span>
              Repeindre / Repaint
              <small>QTY</small>
            </span>
            <span>
              Repeindre recyclage / Repaint recycling
              <small>QTY</small>
            </span>
            <span>
              Matériel défectueux
              <small>Bad Material QTY</small>
            </span>
          </div>
          {value.rows.map((row, index) => (
            <div className="repaint-row" key={index}>
              <input
                aria-label={`Matériel / Material – ligne ${index + 1}`}
                placeholder="Matériel / Material"
                value={row.material}
                onChange={(e) => patchRow(index, { material: e.target.value })}
              />
              <input
                inputMode="decimal"
                aria-label={`Repeindre / Repaint QTY – ligne ${index + 1}`}
                placeholder="Repaint QTY"
                value={row.repaintQty}
                onChange={(e) => patchRow(index, { repaintQty: e.target.value })}
              />
              <input
                inputMode="decimal"
                aria-label={`Repeindre recyclage / Repaint recycling QTY – ligne ${index + 1}`}
                placeholder="Recycling QTY"
                value={row.recyclingQty}
                onChange={(e) => patchRow(index, { recyclingQty: e.target.value })}
              />
              <input
                inputMode="decimal"
                aria-label={`Matériel défectueux / Bad material QTY – ligne ${index + 1}`}
                placeholder="Bad material QTY"
                value={row.badQty}
                onChange={(e) => patchRow(index, { badQty: e.target.value })}
              />
            </div>
          ))}
        </div>
      </fieldset>
      {locked ? null : (
        <div className="repaint-actions no-print">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onChange({ ...value, rows: [...value.rows, emptyRepaintRow()] })}
          >
            + Ajouter une ligne / Add a row
          </button>
        </div>
      )}
      {locked || !onSubmit ? null : (
        <>
          <p className="form-need">{repaintSubmitHint(value)}</p>
          <FormLockBar locked={false} disabled={!canSubmit} onSubmit={onSubmit} />
        </>
      )}
    </section>
  );
}
