import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { FormLockBar } from "./FormLockBar";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextField({ label, value, onChange, className = "", ...rest }: TextFieldProps) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <input
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
    </label>
  );
}

interface AreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function AreaField({ label, value, onChange, ...rest }: AreaFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
    </label>
  );
}

export function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "" | "yes" | "no";
  onChange: (value: "" | "yes" | "no") => void;
}) {
  return (
    <div className="yes-no">
      <span>{label}</span>
      <div>
        <button
          type="button"
          className={value === "yes" ? "on" : ""}
          onClick={() => onChange(value === "yes" ? "" : "yes")}
        >
          Oui / Yes
        </button>
        <button
          type="button"
          className={value === "no" ? "on" : ""}
          onClick={() => onChange(value === "no" ? "" : "no")}
        >
          Non / No
        </button>
      </div>
    </div>
  );
}

export function NameList({
  label,
  names,
  onChange,
}: {
  label: string;
  names: string[];
  onChange: (names: string[]) => void;
}) {
  return (
    <div className="name-list">
      <span className="field-title">{label}</span>
      <div className="name-grid">
        {names.map((name, index) => (
          <input
            key={index}
            value={name}
            autoComplete="off"
            autoCapitalize="words"
            aria-label={`${label} ${index + 1}`}
            placeholder={`${index + 1}`}
            onChange={(event) => {
              const next = names.slice();
              next[index] = event.target.value;
              onChange(next);
            }}
          />
        ))}
      </div>
      <button
        type="button"
        className="text-btn add-name"
        onClick={() => onChange([...names, ""])}
      >
        + Ajouter un nom / Add a name
      </button>
    </div>
  );
}

export function PaperFrame({
  kicker,
  title,
  subtitle,
  locked,
  submittedAt,
  canSubmit,
  hint,
  onSubmit,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  locked: boolean;
  submittedAt?: string;
  canSubmit: boolean;
  hint: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <article className="paper-form">
      {locked ? (
        <FormLockBar locked submittedAt={submittedAt} onSubmit={onSubmit} />
      ) : null}
      <header className="form-header">
        <p>{kicker}</p>
        <h1>{title}</h1>
        {subtitle ? <p className="form-sub">{subtitle}</p> : null}
      </header>
      <fieldset className="form-lock" disabled={locked}>
        {children}
      </fieldset>
      {locked ? null : (
        <>
          {canSubmit ? null : <p className="form-need">{hint}</p>}
          <FormLockBar
            locked={false}
            disabled={!canSubmit}
            onSubmit={onSubmit}
          />
        </>
      )}
    </article>
  );
}
