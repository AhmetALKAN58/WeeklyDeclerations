import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface QtyFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function QtyField({ label, value, onChange, className = "", ...rest }: QtyFieldProps) {
  return (
    <label className={`qty-field ${className}`.trim()}>
      <span className="qty-label">{label}</span>
      <input
        className="qty-input"
        value={value}
        inputMode="decimal"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}

interface NoteFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function NoteField({
  label,
  value,
  onChange,
  className = "",
  ...rest
}: NoteFieldProps) {
  return (
    <label className={`note-field ${className}`.trim()}>
      {label ? <span className="qty-label">{label}</span> : null}
      <textarea
        className="note-input"
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}
