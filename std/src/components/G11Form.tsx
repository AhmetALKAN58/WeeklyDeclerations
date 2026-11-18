import {
  DAY_META,
  SHIFT_META,
  dayDate,
  emptyG11Row,
  formatShort,
  g11CanSubmit,
  type DayId,
  type G11Day,
  type ShiftId,
} from "../model";
import { PaperFrame, TextField } from "./Fields";

export function G11Form({
  shift,
  weekStart,
  day,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  day: DayId;
  value: G11Day;
  onChange: (next: G11Day) => void;
  onSubmit: () => void;
}) {
  const date = dayDate(weekStart, day);
  const meta = SHIFT_META[shift];
  const dayMeta = DAY_META[day];

  function patchRow(index: number, key: "frameType" | "qty", next: string) {
    const rows = value.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: next } : row,
    );
    onChange({ ...value, rows });
  }

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title="Rapport de scie G11 / Saw G11 performance"
      subtitle={`${dayMeta.fr} / ${dayMeta.en} · ${formatShort(date, "fr-CA")} · ${formatShort(date, "en-CA")}`}
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={g11CanSubmit(value)}
      hint="Ajoutez un type de cadre ou une quantité. / Enter a frame type or a quantity."
      onSubmit={onSubmit}
    >
      <div className="pair">
        <TextField
          label="Début / Time start"
          type="time"
          value={value.timeStart}
          onChange={(timeStart) => onChange({ ...value, timeStart })}
        />
        <TextField
          label="Fin / Time end"
          type="time"
          value={value.timeEnd}
          onChange={(timeEnd) => onChange({ ...value, timeEnd })}
        />
      </div>
      <div className="g11-table">
        <div className="g11-head">
          <span>Type de cadre / Frame type</span>
          <span>Qté / Qty</span>
        </div>
        {value.rows.map((row, index) => (
          <div className="g11-row" key={index}>
            <input
              value={row.frameType}
              autoComplete="off"
              aria-label={`Frame type ${index + 1}`}
              onChange={(event) => patchRow(index, "frameType", event.target.value)}
            />
            <input
              value={row.qty}
              inputMode="decimal"
              autoComplete="off"
              aria-label={`Quantity ${index + 1}`}
              onChange={(event) => patchRow(index, "qty", event.target.value)}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="ghost-btn add-rows"
        onClick={() =>
          onChange({
            ...value,
            rows: [...value.rows, emptyG11Row(), emptyG11Row(), emptyG11Row(), emptyG11Row()],
          })
        }
      >
        + Ajouter des lignes / Add rows
      </button>
    </PaperFrame>
  );
}
