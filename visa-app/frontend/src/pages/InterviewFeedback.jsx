import { useMemo } from "react";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import {
  getInterviewFeedbackSession,
  getLatestInterviewFeedbackSession,
} from "../utils/interviewFeedbackStorage";
import "../styles/interview.css";

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(seconds) {
  const safeSeconds = Number(seconds) || 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function PendingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InterviewFeedback() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();

  const feedbackSession = useMemo(() => {
    if (isValidating) return null;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");

    return sessionId
      ? getInterviewFeedbackSession(sessionId, session?.id)
      : getLatestInterviewFeedbackSession(session?.id);
  }, [isValidating, session?.id]);

  if (isValidating) {
    return (
      <div className="interview-shell">
        <Sidebar currentPage="entrevista" />
        <main className="interview-main">
          <p className="interview-loading">Verificando sesión...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="interview-shell">
      <Sidebar currentPage="entrevista" />
      <main
        className={`interview-main feedback-main${
          modoSenior ? " interview-main--senior" : ""
        }`}
      >
        <header className="interview-header feedback-header">
          <h1>Retroalimentación de Entrevista</h1>
          <p>
            Aquí podrás revisar cómo te fue cuando el asesor procese tu sesión
            de práctica.
          </p>
        </header>

        {!feedbackSession ? (
          <section className="feedback-empty">
            <PendingIcon />
            <h2>No hay entrevistas enviadas</h2>
            <p>
              Completa el simulador para crear una sesión pendiente de
              retroalimentación.
            </p>
            <button
              type="button"
              onClick={() => (window.location.href = "/entrevista/simulador")}
            >
              Iniciar simulador
            </button>
          </section>
        ) : (
          <>
            <section className="feedback-status-card">
              <div className="feedback-status-card__icon">
                <PendingIcon />
              </div>
              <div>
                <span>Pendiente de retroalimentación</span>
                <h2>Tu entrevista fue enviada correctamente</h2>
                <p>
                  Aún no ha sido procesada. Cuando el asesor revise tus
                  respuestas, aquí aparecerán observaciones y recomendaciones.
                </p>
              </div>
            </section>

            <section className="feedback-summary-grid" aria-label="Resumen">
              <article>
                <span>Estado</span>
                <strong>Pendiente</strong>
              </article>
              <article>
                <span>Respuestas grabadas</span>
                <strong>
                  {feedbackSession.recordedCount} de{" "}
                  {feedbackSession.questionCount}
                </strong>
              </article>
              <article>
                <span>Fecha de envío</span>
                <strong>{formatDate(feedbackSession.createdAt)}</strong>
              </article>
            </section>

            <section className="feedback-question-list">
              <div className="feedback-section-heading">
                <h2>Preguntas enviadas</h2>
                <p>Referencia de la sesión que queda pendiente de revisión.</p>
              </div>

              {feedbackSession.questions.map((question, index) => (
                <article className="feedback-question-row" key={question.id}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{question.text}</h3>
                    <p>
                      {question.recorded
                        ? `Respuesta grabada · Duración ${formatTime(
                            question.duration
                          )}`
                        : "Sin grabación"}
                    </p>
                  </div>
                  <strong
                    className={
                      question.recorded
                        ? "feedback-question-row__done"
                        : "feedback-question-row__missing"
                    }
                  >
                    {question.recorded ? "Lista" : "Pendiente"}
                  </strong>
                </article>
              ))}
            </section>

            <section className="feedback-actions">
              <button
                type="button"
                onClick={() => (window.location.href = "/entrevista")}
              >
                Volver a entrevista
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/entrevista/simulador")}
              >
                Practicar de nuevo
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
