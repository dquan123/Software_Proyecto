import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/api";
import { getAdminHeaders } from "../utils/adminHeaders";

function getErrorMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

function getSessionResponses(session) {
  return Array.isArray(session?.responses) ? session.responses : [];
}

function getRecordedCount(session) {
  return getSessionResponses(session).filter((response) => response.recorded)
    .length;
}

function formatSessionDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function InterviewReviewPanel({ showHeader = false, onToast }) {
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [selectedInterviewSession, setSelectedInterviewSession] =
    useState(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const notify = useCallback(
    (toast) => {
      if (onToast) {
        onToast(toast);
        return;
      }
      // Standalone admin views can still save feedback without requiring the
      // question bank toast stack.
    },
    [onToast]
  );

  const fetchInterviewSessions = useCallback(async (signal) => {
    try {
      setSessionsLoading(true);
      setSessionsError("");

      const response = await fetch(buildApiUrl("/interview-sessions"), {
        signal,
        headers: getAdminHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "No se pudieron cargar las entrevistas.")
        );
      }

      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      setInterviewSessions(sessions);
      setSelectedInterviewSession((current) => {
        if (sessions.length === 0) return null;
        if (!current) return sessions[0];
        return sessions.find((item) => item.id === current.id) || sessions[0];
      });
    } catch (fetchError) {
      if (fetchError.name === "AbortError") return;
      setSessionsError(
        fetchError.message || "No se pudieron cargar las entrevistas."
      );
    } finally {
      if (!signal?.aborted) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchInterviewSessions(controller.signal);
    return () => controller.abort();
  }, [fetchInterviewSessions]);

  useEffect(() => {
    setFeedbackDraft(selectedInterviewSession?.feedback || "");
    setRatingDraft(
      selectedInterviewSession?.rating ? String(selectedInterviewSession.rating) : ""
    );
  }, [selectedInterviewSession]);

  const pendingInterviewSessions = useMemo(
    () => interviewSessions.filter((item) => item.status !== "reviewed"),
    [interviewSessions]
  );
  const selectedResponses = useMemo(
    () => getSessionResponses(selectedInterviewSession),
    [selectedInterviewSession]
  );
  const selectedRecordedCount = selectedResponses.filter(
    (response) => response.recorded
  ).length;

  const handleSaveFeedback = async () => {
    if (!selectedInterviewSession) return;

    try {
      setSavingFeedback(true);

      const response = await fetch(
        buildApiUrl(`/interview-sessions/${selectedInterviewSession.id}/feedback`),
        {
          method: "PUT",
          headers: getAdminHeaders(true),
          body: JSON.stringify({
            feedback: feedbackDraft,
            rating: ratingDraft || null,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "No se pudo guardar la retroalimentacion.")
        );
      }

      setInterviewSessions((current) =>
        current.map((item) =>
          item.id === data.session.id ? data.session : item
        )
      );
      setSelectedInterviewSession(data.session);
      notify({
        type: "success",
        title: "Retroalimentacion guardada",
        message: "El usuario ya puede consultar las observaciones.",
      });
    } catch (feedbackError) {
      notify({
        type: "error",
        title: "No se pudo guardar",
        message:
          feedbackError.message ||
          "Revisa el contenido de la retroalimentacion e intentalo de nuevo.",
      });
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <>
      {showHeader && (
        <section className="question-bank-header">
          <div>
            <span className="question-bank-eyebrow">
              Administracion consular
            </span>
            <h2>Entrevistas</h2>
            <p>
              Revisa sesiones enviadas desde el simulador y registra
              retroalimentacion para los usuarios.
            </p>
          </div>
        </section>
      )}

      <section className="question-feedback-reference">
        <div className="question-feedback-reference__summary">
          <span>Historial de entrevistas</span>
          <strong>{interviewSessions.length}</strong>
          <p>
            {pendingInterviewSessions.length} sesiones pendientes por
            retroalimentar desde el simulador.
          </p>
        </div>

        <div className="question-feedback-reference__list">
          {sessionsLoading ? (
            <p>Cargando historial de entrevistas...</p>
          ) : sessionsError ? (
            <p>{sessionsError}</p>
          ) : interviewSessions.length === 0 ? (
            <p>No hay sesiones de entrevista registradas.</p>
          ) : (
            interviewSessions.slice(0, 8).map((item) => (
              <button
                className={
                  selectedInterviewSession?.id === item.id
                    ? "is-active"
                    : ""
                }
                key={item.id}
                type="button"
                onClick={() => setSelectedInterviewSession(item)}
              >
                <strong>{item.user_name || "Usuario"}</strong>
                <span>{item.user_email || "Sin correo"}</span>
                <small>
                  {item.status === "reviewed"
                    ? "Retroalimentada"
                    : "Pendiente"}{" "}
                  - {getRecordedCount(item)} de{" "}
                  {getSessionResponses(item).length} respuestas
                </small>
              </button>
            ))
          )}
        </div>

        {selectedInterviewSession && (
          <div className="question-feedback-reference__detail">
            <div className="question-feedback-reference__detail-heading">
              <div>
                <span>Sesion seleccionada</span>
                <strong>
                  {selectedInterviewSession.user_name || "Usuario"}
                </strong>
                <p>
                  {selectedInterviewSession.user_email || "Sin correo"} -{" "}
                  {formatSessionDate(selectedInterviewSession.created_at)}
                </p>
              </div>
              <em
                className={
                  selectedInterviewSession.status === "reviewed"
                    ? "is-reviewed"
                    : ""
                }
              >
                {selectedInterviewSession.status === "reviewed"
                  ? "Retroalimentada"
                  : "Pendiente"}
              </em>
            </div>

            <div className="question-feedback-reference__responses">
              <strong>
                Respuestas grabadas ({selectedRecordedCount} de{" "}
                {selectedResponses.length})
              </strong>
              {selectedResponses.map((response, index) => (
                <article key={`${selectedInterviewSession.id}-${response.id}`}>
                  <div>
                    <span>Pregunta {index + 1}</span>
                    <p>{response.text}</p>
                  </div>
                  {response.audio?.url ? (
                    <audio controls src={response.audio.url}>
                      Tu navegador no puede reproducir este audio.
                    </audio>
                  ) : (
                    <small>Sin audio grabado</small>
                  )}
                </article>
              ))}
            </div>

            <label>
              Retroalimentacion del administrador
              <textarea
                value={feedbackDraft}
                onChange={(event) => setFeedbackDraft(event.target.value)}
                placeholder="Escribe observaciones claras para el usuario..."
              />
            </label>

            <div className="question-feedback-reference__actions">
              <label>
                Calificacion
                <select
                  value={ratingDraft}
                  onChange={(event) => setRatingDraft(event.target.value)}
                >
                  <option value="">Sin calificacion</option>
                  <option value="1">1 - Necesita mejorar</option>
                  <option value="2">2 - Basica</option>
                  <option value="3">3 - Aceptable</option>
                  <option value="4">4 - Buena</option>
                  <option value="5">5 - Excelente</option>
                </select>
              </label>
              <button
                type="button"
                disabled={savingFeedback || !feedbackDraft.trim()}
                onClick={handleSaveFeedback}
              >
                {savingFeedback
                  ? "Guardando..."
                  : "Guardar retroalimentacion"}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
