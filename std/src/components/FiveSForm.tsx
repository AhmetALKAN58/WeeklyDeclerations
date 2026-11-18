import {
  DAY_META,
  FIVE_S,
  SHIFT_META,
  dayDate,
  fiveSCanSubmit,
  formatShort,
  type FiveSForm as FiveSValue,
  type FiveSId,
  type ShiftId,
} from "../model";
import { AreaField, NameList, PaperFrame, TextField, YesNoField } from "./Fields";

export function FiveSForm({
  shift,
  weekStart,
  value,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  weekStart: string;
  value: FiveSValue;
  onChange: (next: FiveSValue) => void;
  onSubmit: () => void;
}) {
  const wednesday = dayDate(weekStart, "wednesday");
  const meta = SHIFT_META[shift];

  return (
    <PaperFrame
      kicker={`${meta.fr} / ${meta.en}`}
      title="Réunion 5S / Cleaning & organization meeting"
      subtitle={`${DAY_META.wednesday.fr} / ${DAY_META.wednesday.en} · ${formatShort(wednesday, "fr-CA")} · ${formatShort(wednesday, "en-CA")}`}
      locked={value.submitted}
      submittedAt={value.submittedAt}
      canSubmit={fiveSCanSubmit(value)}
      hint="Ajoutez une présence, une heure ou une note. / Add someone present, a time, or a note."
      onSubmit={onSubmit}
    >
      <TextField
        label="Département / Department"
        value={value.department}
        onChange={(department) => onChange({ ...value, department })}
      />
      <div className="pair">
        <TextField
          label="Début / Beginning"
          type="time"
          value={value.startTime}
          onChange={(startTime) => onChange({ ...value, startTime })}
        />
        <TextField
          label="Fin / End"
          type="time"
          value={value.endTime}
          onChange={(endTime) => onChange({ ...value, endTime })}
        />
      </div>
      <NameList
        label="Présences / Attendance"
        names={value.attendance}
        onChange={(attendance) => onChange({ ...value, attendance })}
      />
      <AreaField
        label="Revoir la liste quotidienne. Les employés connaissent-ils la routine de nettoyage ? / Review the everyday list. Are workers familiar with the cleaning routine?"
        value={value.everydayList}
        onChange={(everydayList) => onChange({ ...value, everydayList })}
      />
      <YesNoField
        label="Reste-t-il des outils ou de la quincaillerie sans rangement ? / Are there still tools or hardware without proper storage?"
        value={value.toolsAnswer}
        onChange={(toolsAnswer) => onChange({ ...value, toolsAnswer })}
      />
      <AreaField
        label="Détail / Detail"
        value={value.toolsNote}
        onChange={(toolsNote) => onChange({ ...value, toolsNote })}
      />
      <AreaField
        label="Sources de saleté ou de rayures sur les produits / Sources of dirt or scratches on products"
        value={value.dirtSources}
        onChange={(dirtSources) => onChange({ ...value, dirtSources })}
      />
      <div className="choice-block">
        <span className="field-title">
          Quel S a été revu ? / Which S was reviewed?
        </span>
        <div className="choice-row">
          {FIVE_S.map((item) => (
            <button
              key={item.id}
              type="button"
              className={value.reviewed === item.id ? "on" : ""}
              onClick={() =>
                onChange({
                  ...value,
                  reviewed: value.reviewed === item.id ? "" : (item.id as FiveSId),
                })
              }
            >
              {item.fr}
              <small>{item.en}</small>
            </button>
          ))}
        </div>
      </div>
      <AreaField
        label="Notes sur le S revu / Notes on the S reviewed"
        value={value.reviewNote}
        onChange={(reviewNote) => onChange({ ...value, reviewNote })}
      />
    </PaperFrame>
  );
}
