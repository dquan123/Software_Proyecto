function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m14 8 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m-9 0 1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 3v4m8-4v4M4 10h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDifficultyTone(difficulty) {
  if (difficulty === "Fácil") return "easy";
  if (difficulty === "Alta") return "hard";
  return "medium";
}

export default function QuestionBankCard({ question, onEdit, onDelete }) {
  const difficultyTone = getDifficultyTone(question.difficulty);

  return (
    <article className="question-card-admin">
      <div className="question-card-admin__top">
        <span className="question-card-admin__category">
          {question.category || "General"}
        </span>
        <span
          className={`question-card-admin__difficulty question-card-admin__difficulty--${difficultyTone}`}
        >
          {question.difficulty || "Media"}
        </span>
      </div>

      <h3>{question.question}</h3>

      <div className="question-card-admin__meta">
        <span>
          <CalendarIcon />
          {formatDate(question.created_at)}
        </span>
        <span
          className={`question-card-admin__required${
            question.is_required ? " question-card-admin__required--active" : ""
          }`}
        >
          {question.is_required ? "Pregunta requerida" : "Pregunta opcional"}
        </span>
      </div>

      <div className="question-card-admin__actions">
        <button type="button" onClick={() => onEdit(question)}>
          <PencilIcon />
          Editar
        </button>
        <button
          className="question-card-admin__delete"
          type="button"
          onClick={() => onDelete(question)}
        >
          <TrashIcon />
          Eliminar
        </button>
      </div>
    </article>
  );
}
