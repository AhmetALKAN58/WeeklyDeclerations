import {
  DAY_META,
  MACHINES,
  SHIFT_META,
  dayDate,
  formatShort,
  signatureCanSubmit,
  type MachineId,
  type ShiftId,
  type SignatureDay,
} from "../model";
import { PaperFrame, TextField } from "./Fields";
import { SignaturePad } from "./SignaturePad";

export function SignatureForm({
  shift,
  weekStart,
  day,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  day: keyof typeof DAY_META;
  value: SignatureDay;
  onChange: (next: SignatureDay) => void;
  onSubmit: () => void;
}) {
  const date = dayDate(weekStart, day);
  const meta = SHIFT_META[shift];
  const dayMeta = DAY_META[day];

  function patch(id: MachineId, next: Partial<SignatureDay["machines"][MachineId]>) {
    onChange({
      ...value,
      machines: {
        ...value.machines,
        [id]: { ...value.machines[id], ...next },
      },
    });
  }

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title="Signature d'entretien autonome / Autonomous maintenance signature"
      subtitle={`${dayMeta.fr} / ${dayMeta.en} · ${formatShort(date, "fr-CA")} · ${formatShort(date, "en-CA")}`}
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={signatureCanSubmit(value)}
      hint="Signez une machine ou inscrivez un nom. / Sign a machine or enter a name."
      onSubmit={onSubmit}
    >
      <p className="form-lead">
        G1, G3, G4, G10, G11 — une signature par machine pour cette journée. /
        One signature per machine for this day.
      </p>
      <div className="machine-list">
        {MACHINES.map((id) => (
          <section className="block" key={id}>
            <h2>{id}</h2>
            <TextField
              label="Nom / Name"
              value={value.machines[id].name}
              autoCapitalize="words"
              onChange={(name) => patch(id, { name })}
            />
            <SignaturePad
              label="Signature"
              locked={value.submitted}
              value={value.machines[id].signature}
              onChange={(signature) => patch(id, { signature })}
            />
          </section>
        ))}
      </div>
    </PaperFrame>
  );
}
