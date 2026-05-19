export default function QuestionBankConfirmDialog({
  isDeleting,
  question,
  onCancel,
  onConfirm,
}) {
  if (!question) return null;

  return (
    <div className="question-modal-backdrop" role="presentation">
      <section
        aria-modal="true"
        className="question-confirm"
        role="dialog"
        aria-labelledby="question-confirm-title"
      >
        <span className="question-confirm__icon" aria-hidden="true">
          !
        </span>
        <h2 id="question-confirm-title">Eliminar pregunta</h2>
        <p>
          Esta acción eliminará la pregunta del banco y no podrá recuperarse.
        </p>
        <blockquote>{question.question}</blockquote>
        <div className="question-confirm__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar pregunta"}
          </button>
        </div>
      </section>
    </div>
  );
}
