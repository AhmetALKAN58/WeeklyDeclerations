import {
  DAY_META,
  SHIFT_META,
  dayDate,
  formatShort,
  sstCanSubmit,
  type ShiftId,
  type SstForm,
} from "../model";
import { AreaField, NameList, PaperFrame, TextField } from "./Fields";

export function SstForm({
  shift,
  weekStart,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  value: SstForm;
  onChange: (next: SstForm) => void;
  onSubmit: () => void;
}) {
  const monday = dayDate(weekStart, "monday");
  const friday = dayDate(weekStart, "friday");
  const meta = SHIFT_META[shift];

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title="Réunion SST / Health and safety meeting"
      subtitle="Lundi et vendredi / Monday and Friday"
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={sstCanSubmit(value)}
      hint="Ajoutez une présence, une heure ou le sujet discuté. / Add someone present, a time, or what was discussed."
      onSubmit={onSubmit}
    >
      <TextField
        label="Département / Department"
        value={value.department}
        onChange={(department) => onChange({ ...value, department })}
      />
      <div className="split">
        <section className="block">
          <h2>
            {DAY_META.monday.fr} / {DAY_META.monday.en}
            <small>
              {formatShort(monday, "fr-CA")} · {formatShort(monday, "en-CA")}
            </small>
          </h2>
          <div className="pair">
            <TextField
              label="Début / Beginning"
              type="time"
              value={value.monday.startTime}
              onChange={(startTime) =>
                onChange({ ...value, monday: { ...value.monday, startTime } })
              }
            />
            <TextField
              label="Fin / End"
              type="time"
              value={value.monday.endTime}
              onChange={(endTime) =>
                onChange({ ...value, monday: { ...value.monday, endTime } })
              }
            />
          </div>
          <NameList
            label="Présences / Attendance"
            names={value.monday.attendance}
            onChange={(attendance) =>
              onChange({ ...value, monday: { ...value.monday, attendance } })
            }
          />
          <AreaField
            label="Quelle machine avez-vous discutée ? / Which machine did you discuss?"
            value={value.monday.note}
            onChange={(note) =>
              onChange({ ...value, monday: { ...value.monday, note } })
            }
          />
        </section>
        <section className="block">
          <h2>
            {DAY_META.friday.fr} / {DAY_META.friday.en}
            <small>
              {formatShort(friday, "fr-CA")} · {formatShort(friday, "en-CA")}
            </small>
          </h2>
          <div className="pair">
            <TextField
              label="Début / Beginning"
              type="time"
              value={value.friday.startTime}
              onChange={(startTime) =>
                onChange({ ...value, friday: { ...value.friday, startTime } })
              }
            />
            <TextField
              label="Fin / End"
              type="time"
              value={value.friday.endTime}
              onChange={(endTime) =>
                onChange({ ...value, friday: { ...value.friday, endTime } })
              }
            />
          </div>
          <NameList
            label="Présences / Attendance"
            names={value.friday.attendance}
            onChange={(attendance) =>
              onChange({ ...value, friday: { ...value.friday, attendance } })
            }
          />
          <AreaField
            label="Quel sujet avez-vous discuté ? / What subject did you discuss?"
            value={value.friday.note}
            onChange={(note) =>
              onChange({ ...value, friday: { ...value.friday, note } })
            }
          />
          <AreaField
            label="Problème de sécurité à soumettre au comité (optionnel) / Safety problem for the Health and Safety Committee (optional)"
            value={value.safetyProblem}
            onChange={(safetyProblem) => onChange({ ...value, safetyProblem })}
          />
        </section>
      </div>
    </PaperFrame>
  );
}
