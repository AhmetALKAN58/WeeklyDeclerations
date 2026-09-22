import {
  DAYS,
  DAY_META,
  meetingIsLocked,
  signatureLabels,
  type DayId,
  type MeetingDay,
  type ShiftId,
} from "../model";
import { FormLockBar } from "./FormLockBar";
import { SignaturePad } from "./SignaturePad";

interface DailyMeetingFormProps {
  shift: ShiftId;
  value: Record<DayId, MeetingDay>;
  highlightDay?: DayId;
  onChange: (next: Record<DayId, MeetingDay>) => void;
  onSubmitDay?: (day: DayId) => void;
}

export function DailyMeetingForm({
  shift,
  value,
  highlightDay,
  onChange,
  onSubmitDay,
}: DailyMeetingFormProps) {
  function patch(day: DayId, next: Partial<MeetingDay>) {
    if (meetingIsLocked(value[day])) return;
    onChange({ ...value, [day]: { ...value[day], ...next } });
  }

  return (
    <article className={`paper-form meeting-form shift-${shift}`}>
      <header className="meeting-header">
        <h1>
          Réunion quotidienne entre les quarts sur la ligne de peinture
          <small>Daily Meetings Between the Shifts in Paint Line</small>
        </h1>
        <p className="meeting-hint">
          Veuillez noter les sujets abordés lors du transfert de quart. / Please
          write down the topics that have been discussed during the shift
          transfer.
        </p>
      </header>

      <div className="meeting-table-head">
        <span>DAY</span>
        <span>Sujets / Topics</span>
        <span>Conclusions</span>
        <span>Signatures</span>
      </div>

      {DAYS.map((day) => (
        <MeetingDayFields
          key={day}
          shift={shift}
          day={day}
          value={value[day]}
          highlight={highlightDay === day}
          showDayLabel
          onChange={(next) => patch(day, next)}
          onSubmit={onSubmitDay ? () => onSubmitDay(day) : undefined}
        />
      ))}
    </article>
  );
}

export function MeetingDayFields({
  shift,
  day,
  value,
  highlight = false,
  showDayLabel = false,
  locked,
  onChange,
  onSubmit,
}: {
  shift: ShiftId;
  day: DayId;
  value: MeetingDay;
  highlight?: boolean;
  showDayLabel?: boolean;
  locked?: boolean;
  onChange: (next: Partial<MeetingDay>) => void;
  onSubmit?: () => void;
}) {
  const labels = signatureLabels(shift);
  const rowLocked = locked ?? meetingIsLocked(value);
  const meta = DAY_META[day];

  return (
    <fieldset
      className={`form-lock meeting-row ${highlight ? "is-due" : ""} ${rowLocked ? "is-locked" : ""}`}
      disabled={rowLocked}
    >
      {showDayLabel ? (
        <div className="meeting-day">
          <strong>{meta.fr}</strong>
          <span>{meta.en}</span>
        </div>
      ) : null}
      <textarea
        className="meeting-text"
        value={value.topics}
        placeholder="Sujets / Topics"
        onChange={(e) => onChange({ topics: e.target.value })}
      />
      <textarea
        className="meeting-text"
        value={value.conclusions}
        placeholder="Conclusions"
        onChange={(e) => onChange({ conclusions: e.target.value })}
      />
      <div className="meeting-signs">
        <label className="name-line">
          <span>
            {labels.a.fr} / {labels.a.en}
          </span>
          <input
            value={value.nameA}
            placeholder="Nom / Name"
            onChange={(e) => onChange({ nameA: e.target.value })}
          />
        </label>
        <SignaturePad
          label={`${labels.a.fr} / ${labels.a.en}`}
          value={value.signatureA}
          locked={rowLocked}
          onChange={(signatureA) => onChange({ signatureA })}
        />
        <label className="name-line">
          <span>
            {labels.b.fr} / {labels.b.en}
          </span>
          <input
            value={value.nameB}
            placeholder="Nom / Name"
            onChange={(e) => onChange({ nameB: e.target.value })}
          />
        </label>
        <SignaturePad
          label={`${labels.b.fr} / ${labels.b.en}`}
          value={value.signatureB}
          locked={rowLocked}
          onChange={(signatureB) => onChange({ signatureB })}
        />
        {rowLocked ? (
          <FormLockBar
            locked
            submittedAt={value.submittedAt}
            onSubmit={() => undefined}
          />
        ) : onSubmit ? (
          <FormLockBar locked={false} onSubmit={onSubmit} />
        ) : null}
      </div>
    </fieldset>
  );
}
