import { formatSubmittedAt } from "../model";

interface FormLockBarProps {
  locked: boolean;
  submittedAt?: string;
  disabled?: boolean;
  onSubmit: () => void;
}

export function FormLockBar({
  locked,
  submittedAt,
  disabled = false,
  onSubmit,
}: FormLockBarProps) {
  if (locked) {
    return (
      <p className="locked-banner no-print">
        Soumis et verrouillé / Submitted and locked
        {submittedAt ? <small>{formatSubmittedAt(submittedAt)}</small> : null}
      </p>
    );
  }

  return (
    <div className="form-actions no-print">
      <button
        type="button"
        className="submit-btn"
        disabled={disabled}
        onClick={onSubmit}
      >
        Envoyer / Submit
      </button>
    </div>
  );
}
