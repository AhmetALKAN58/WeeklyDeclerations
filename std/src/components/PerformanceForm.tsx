import {
  DAY_META,
  SHIFT_META,
  dayDate,
  formatShort,
  performanceCanSubmit,
  type DayId,
  type PerformanceDay,
  type ShiftId,
} from "../model";
import { PaperFrame, TextField, YesNoField } from "./Fields";

export function PerformanceForm({
  shift,
  weekStart,
  day,
  title,
  counterLabel,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  day: DayId;
  title: string;
  counterLabel: string;
  value: PerformanceDay;
  onChange: (next: PerformanceDay) => void;
  onSubmit: () => void;
}) {
  const date = dayDate(weekStart, day);
  const meta = SHIFT_META[shift];
  const dayMeta = DAY_META[day];

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title={title}
      subtitle={`${dayMeta.fr} / ${dayMeta.en} · ${formatShort(date, "fr-CA")} · ${formatShort(date, "en-CA")}`}
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={performanceCanSubmit(value)}
      hint="Inscrivez l'employé. / Enter the worker."
      onSubmit={onSubmit}
    >
      <TextField
        label="Employé / Worker"
        value={value.worker}
        autoCapitalize="words"
        onChange={(worker) => onChange({ ...value, worker })}
      />
      <section className="block">
        <h2>{counterLabel}</h2>
        <div className="pair">
          <TextField
            label="Compteur début / Start counter"
            inputMode="decimal"
            value={value.startCounter}
            onChange={(startCounter) => onChange({ ...value, startCounter })}
          />
          <TextField
            label="Compteur fin / Stop counter"
            inputMode="decimal"
            value={value.stopCounter}
            onChange={(stopCounter) => onChange({ ...value, stopCounter })}
          />
        </div>
      </section>
      <section className="block">
        <h2>Temps de production / Production time</h2>
        <div className="pair">
          <TextField
            label="Début / Time start"
            type="time"
            value={value.timeStart}
            onChange={(timeStart) => onChange({ ...value, timeStart })}
          />
          <TextField
            label="Fin / Time stop"
            type="time"
            value={value.timeStop}
            onChange={(timeStop) => onChange({ ...value, timeStop })}
          />
        </div>
      </section>
      <section className="block">
        <YesNoField
          label="Problème de machine (arrêt non planifié) ? / Machine problem (unplanned stop)?"
          value={value.unplanned}
          onChange={(unplanned) =>
            onChange({
              ...value,
              unplanned,
              unplannedHours: unplanned === "yes" ? value.unplannedHours : "",
              unplannedMinutes: unplanned === "yes" ? value.unplannedMinutes : "",
            })
          }
        />
        {value.unplanned === "yes" ? (
          <div className="pair">
            <TextField
              label="Heures / Hours"
              inputMode="numeric"
              value={value.unplannedHours}
              onChange={(unplannedHours) => onChange({ ...value, unplannedHours })}
            />
            <TextField
              label="Minutes"
              inputMode="numeric"
              value={value.unplannedMinutes}
              onChange={(unplannedMinutes) => onChange({ ...value, unplannedMinutes })}
            />
          </div>
        ) : null}
      </section>
      <section className="block">
        <YesNoField
          label="Entretien préventif (arrêt planifié) ? / Preventive maintenance (planned stop)?"
          value={value.planned}
          onChange={(planned) =>
            onChange({
              ...value,
              planned,
              plannedHours: planned === "yes" ? value.plannedHours : "",
              plannedMinutes: planned === "yes" ? value.plannedMinutes : "",
            })
          }
        />
        {value.planned === "yes" ? (
          <div className="pair">
            <TextField
              label="Heures / Hours"
              inputMode="numeric"
              value={value.plannedHours}
              onChange={(plannedHours) => onChange({ ...value, plannedHours })}
            />
            <TextField
              label="Minutes"
              inputMode="numeric"
              value={value.plannedMinutes}
              onChange={(plannedMinutes) => onChange({ ...value, plannedMinutes })}
            />
          </div>
        ) : null}
      </section>
    </PaperFrame>
  );
}
