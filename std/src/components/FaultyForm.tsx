import {
  DAY_META,
  SHIFT_META,
  dayDate,
  faultyCanSubmit,
  formatShort,
  type DayId,
  type FaultyDay,
  type ShiftId,
} from "../model";
import { PaperFrame, TextField } from "./Fields";

export function FaultyForm({
  shift,
  weekStart,
  day,
  machine,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  day: DayId;
  machine: "G4" | "G3";
  value: FaultyDay;
  onChange: (next: FaultyDay) => void;
  onSubmit: () => void;
}) {
  const date = dayDate(weekStart, day);
  const meta = SHIFT_META[shift];
  const dayMeta = DAY_META[day];

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title={`Grilles défectueuses ${machine} / ${machine} faulty grilles`}
      subtitle={`${dayMeta.fr} / ${dayMeta.en} · ${formatShort(date, "fr-CA")} · ${formatShort(date, "en-CA")}`}
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={faultyCanSubmit(value)}
      hint="Inscrivez l'employé. Les quantités peuvent rester vides s'il n'y a pas de défaut. / Enter the worker. Quantities can stay empty when there are no faults."
      onSubmit={onSubmit}
    >
      <TextField
        label="Employé / Worker"
        value={value.worker}
        autoCapitalize="words"
        onChange={(worker) => onChange({ ...value, worker })}
      />
      <div className="split">
        <section className="block">
          <h2>Coin / Corner</h2>
          <TextField
            label="Ouvert / Open — Qté / Qty"
            inputMode="decimal"
            value={value.cornerOpen}
            onChange={(cornerOpen) => onChange({ ...value, cornerOpen })}
          />
          <TextField
            label="Cadre / Frame — Qté / Qty"
            inputMode="decimal"
            value={value.cornerFrame}
            onChange={(cornerFrame) => onChange({ ...value, cornerFrame })}
          />
          <TextField
            label="Opérateur / Operator — Qté / Qty"
            inputMode="decimal"
            value={value.cornerOperator}
            onChange={(cornerOperator) => onChange({ ...value, cornerOperator })}
          />
          <div className="pair">
            <TextField
              label="Autre / Other"
              value={value.cornerOther}
              onChange={(cornerOther) => onChange({ ...value, cornerOther })}
            />
            <TextField
              label="Qté / Qty"
              inputMode="decimal"
              value={value.cornerOtherQty}
              onChange={(cornerOtherQty) => onChange({ ...value, cornerOtherQty })}
            />
          </div>
        </section>
        <section className="block">
          <h2>Cadre / Frame</h2>
          <TextField
            label="Peinture / Paint — Qté / Qty"
            inputMode="decimal"
            value={value.framePaint}
            onChange={(framePaint) => onChange({ ...value, framePaint })}
          />
          <TextField
            label="Coupe / Cutting — Qté / Qty"
            inputMode="decimal"
            value={value.frameCutting}
            onChange={(frameCutting) => onChange({ ...value, frameCutting })}
          />
          <div className="pair">
            <TextField
              label="Autre / Other"
              value={value.frameOther}
              onChange={(frameOther) => onChange({ ...value, frameOther })}
            />
            <TextField
              label="Qté / Qty"
              inputMode="decimal"
              value={value.frameOtherQty}
              onChange={(frameOtherQty) => onChange({ ...value, frameOtherQty })}
            />
          </div>
        </section>
      </div>
    </PaperFrame>
  );
}
