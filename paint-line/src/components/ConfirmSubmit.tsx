interface ConfirmSubmitProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmSubmit({ open, onCancel, onConfirm }: ConfirmSubmitProps) {
  if (!open) return null;

  return (
    <div
      className="confirm-overlay no-print"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">Envoyer ce formulaire ? / Submit this form?</h2>
        <p>
          Êtes-vous sûr ? Après l&apos;envoi, ce formulaire ne pourra plus être
          modifié.
          <br />
          Are you sure? After submitting, this form cannot be edited later.
        </p>
        <div className="confirm-actions">
          <button type="button" className="ghost-btn confirm-cancel" onClick={onCancel}>
            Annuler / Cancel
          </button>
          <button type="button" className="submit-btn" onClick={onConfirm}>
            Oui, envoyer / Yes, submit
          </button>
        </div>
      </div>
    </div>
  );
}
