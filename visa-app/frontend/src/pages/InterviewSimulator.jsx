import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { buildApiUrl } from "../config/api";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import "../styles/interview.css";

const QUESTIONS = [
  {
    id: "purpose",
    text: "¿Cuál es el motivo principal de su viaje a los Estados Unidos?",
    english: "What is the main purpose of your trip to the United States?",
    weak:
      "Voy de turismo, a pasear un rato y ver qué pasa, tal vez visitar a unos amigos si me da tiempo.",
    strong:
      "Viajo a Orlando, Florida, por 10 días en diciembre con mi familia. Nuestro propósito principal es visitar los parques temáticos de Disney. Ya tenemos cotizados los vuelos y el hotel.",
    weakNotes: [
      "Suena improvisado y genera dudas sobre las intenciones reales.",
      "Mencionar amigos sin especificar puede abrir preguntas sobre lazos y residencia en EE. UU.",
    ],
    strongNotes: [
      "Muestra planificación concreta: destino específico y duración definida.",
      "Establece un motivo legítimo de turismo congruente con la visa B1/B2.",
    ],
  },
  {
    id: "stay",
    text: "¿Cuánto tiempo piensa quedarse y dónde se hospedará?",
    english: "How long do you plan to stay and where will you stay?",
    weak:
      "No estoy seguro, quizás dos o tres semanas. Depende de cómo me vaya allá.",
    strong:
      "Pienso quedarme 8 días. Me hospedaré en un hotel cerca de International Drive y regresaré a Guatemala el domingo siguiente.",
    weakNotes: [
      "La respuesta parece abierta y poco planificada.",
      "Decir que depende de cómo le vaya puede sonar a intención de permanecer más tiempo.",
    ],
    strongNotes: [
      "Da una duración concreta y una ubicación clara.",
      "Refuerza que existe un regreso definido al país.",
    ],
  },
  {
    id: "work",
    text: "¿A qué se dedica actualmente en Guatemala?",
    english: "What do you currently do in Guatemala?",
    weak:
      "Trabajo en algunas cosas y también estoy viendo oportunidades nuevas.",
    strong:
      "Trabajo como asistente administrativo en una empresa de logística desde hace 3 años. Tengo permiso de vacaciones aprobado para las fechas del viaje.",
    weakNotes: [
      "No demuestra estabilidad laboral.",
      "La palabra oportunidades puede abrir dudas sobre búsqueda de trabajo en EE. UU.",
    ],
    strongNotes: [
      "Presenta ocupación, empresa, tiempo y arraigo laboral.",
      "Conecta el viaje con vacaciones autorizadas.",
    ],
  },
  {
    id: "funds",
    text: "¿Quién pagará los gastos de su viaje?",
    english: "Who will pay for your trip?",
    weak:
      "Creo que yo, aunque si necesito apoyo, también me puede ayudar mi familia.",
    strong:
      "Yo pagaré mis gastos con mis ahorros personales. Tengo estados de cuenta que respaldan el presupuesto del viaje.",
    weakNotes: [
      "Muestra incertidumbre sobre capacidad financiera.",
      "No deja claro quién será responsable de los gastos.",
    ],
    strongNotes: [
      "Identifica una fuente de fondos clara.",
      "Menciona evidencia concreta para respaldar la respuesta.",
    ],
  },
  {
    id: "return",
    text: "¿Qué lo motiva a regresar a Guatemala después del viaje?",
    english: "What motivates you to return to Guatemala after your trip?",
    weak:
      "Pues aquí vive mi familia, aunque me gustaría ver si puedo quedarme más tiempo.",
    strong:
      "Regreso porque tengo mi empleo, mi familia y compromisos académicos en Guatemala. El viaje es solo por vacaciones y debo reincorporarme al trabajo al volver.",
    weakNotes: [
      "Sugiere posible intención de quedarse más tiempo.",
      "No comunica compromisos concretos de retorno.",
    ],
    strongNotes: [
      "Presenta lazos claros con Guatemala.",
      "Explica por qué el viaje tiene un inicio y fin definidos.",
    ],
  },
];

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 10a7 7 0 0 1-14 0m7 7v4m-4 0h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 5v14l11-7L8 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 18V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 12 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m9 9 6 6m0-6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function ProgressBars({ currentIndex, recordings }) {
  return (
    <div className="sim-progress" aria-label="Progreso del simulador">
      {QUESTIONS.map((question, index) => (
        <span
          className={`sim-progress__bar${
            index === currentIndex ? " sim-progress__bar--active" : ""
          }${recordings[question.id] ? " sim-progress__bar--done" : ""}`}
          key={question.id}
        />
      ))}
    </div>
  );
}

function AnalysisCard({ type, title, subtitle, quote, notes }) {
  const isStrong = type === "strong";

  return (
    <article
      className={`analysis-card ${
        isStrong ? "analysis-card--strong" : "analysis-card--weak"
      }`}
    >
      <div className="analysis-card__header">
        <span className="analysis-card__icon">
          {isStrong ? <CheckIcon /> : <XIcon />}
        </span>
        <div>
          <h3>{title}</h3>
          <strong>{subtitle}</strong>
        </div>
      </div>

      <blockquote>{quote}</blockquote>

      <h4>{isStrong ? "¿Por qué es fuerte?" : "¿Por qué es débil?"}</h4>
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}

export default function InterviewSimulator() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordings, setRecordings] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const recordingsRef = useRef({});

  const currentQuestion = QUESTIONS[currentIndex];
  const remaining = QUESTIONS.length - currentIndex - 1;
  const recordedCount = Object.keys(recordings).length;
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      Object.values(recordingsRef.current).forEach((recording) => {
        if (recording?.url) URL.revokeObjectURL(recording.url);
      });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Tu navegador no permite grabar audio desde esta pantalla.");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      elapsedRef.current = 0;
      setElapsed(0);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setRecordings((currentRecordings) => {
          const previousUrl = currentRecordings[currentQuestion.id]?.url;
          if (previousUrl) URL.revokeObjectURL(previousUrl);

          return {
            ...currentRecordings,
            [currentQuestion.id]: {
              blob,
              url,
              duration: elapsedRef.current,
              createdAt: new Date().toISOString(),
            },
          };
        });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch (recordingError) {
      setError(
        recordingError?.name === "NotAllowedError"
          ? "Activa el permiso del micrófono para grabar tu respuesta."
          : "No se pudo iniciar la grabación. Revisa tu micrófono."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  };

  const handleNext = () => {
    if (isRecording) return;

    setCurrentIndex((index) => Math.min(index + 1, QUESTIONS.length - 1));
    setElapsed(0);
    elapsedRef.current = 0;
    setError("");
  };

  const handleFinishSession = async () => {
    if (isRecording || submittingSession) return;

    if (recordedCount < QUESTIONS.length) {
      setError(
        "Graba las 5 respuestas para finalizar la entrevista y enviarla a retroalimentación."
      );
      return;
    }

    try {
      setSubmittingSession(true);
      setError("");

      const formData = new FormData();
      formData.append(
        "session",
        JSON.stringify({
          user: session,
          questions: QUESTIONS.map((question) => ({
            id: question.id,
            text: question.text,
            recorded: Boolean(recordings[question.id]),
            duration: recordings[question.id]?.duration || 0,
          })),
        })
      );

      QUESTIONS.forEach((question) => {
        const recording = recordings[question.id];
        if (recording?.blob) {
          formData.append(
            `audio_${question.id}`,
            recording.blob,
            `${question.id}.webm`
          );
        }
      });

      const response = await fetch(buildApiUrl("/interview-sessions"), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo enviar la entrevista a retroalimentación."
        );
      }

      window.location.href = `/entrevista/retroalimentacion?session=${data.session.id}`;
    } catch (submitError) {
      setError(
        submitError.message ||
          "No se pudo enviar la entrevista. Inténtalo de nuevo."
      );
    } finally {
      setSubmittingSession(false);
    }
  };

  const handlePrevious = () => {
    if (isRecording) return;

    setCurrentIndex((index) => Math.max(index - 1, 0));
    setElapsed(0);
    elapsedRef.current = 0;
    setError("");
  };

  const speakQuestion = () => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${currentQuestion.text}. ${currentQuestion.english}`
    );
    utterance.lang = "es-US";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

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
        className={`interview-main simulator-main${
          modoSenior ? " interview-main--senior" : ""
        }`}
      >
        <section className="sim-hero">
          <div>
            <span className="interview-pill">Simulador en curso</span>
            <h1>
              Pregunta <strong>{currentIndex + 1}</strong>{" "}
              <span>de {QUESTIONS.length}</span>
            </h1>
            <p>
              Faltan <strong>{remaining}</strong>{" "}
              {remaining === 1 ? "pregunta" : "preguntas"} para completar esta
              sesión de práctica.
            </p>
          </div>
          <ProgressBars currentIndex={currentIndex} recordings={recordings} />
        </section>

        <section className="question-card">
          <span className="question-card__speaker">
            <MessageIcon />
            Oficial consular
          </span>

          <h2>"{currentQuestion.text}"</h2>

          <button
            className="listen-button"
            type="button"
            onClick={speakQuestion}
          >
            <PlayIcon />
            Escuchar pronunciación (Inglés/Español)
          </button>

          {recordings[currentQuestion.id] && (
            <div className="recording-preview">
              <div>
                <strong>Respuesta grabada</strong>
                <span>
                  Duración: {formatTime(recordings[currentQuestion.id].duration)}
                </span>
              </div>
              <audio controls src={recordings[currentQuestion.id].url} />
            </div>
          )}

          {error && <p className="recording-error">{error}</p>}

          <div className="question-actions">
            <button
              className={`record-button${isRecording ? " record-button--active" : ""}`}
              type="button"
              onClick={handleRecordClick}
              disabled={submittingSession}
            >
              <MicIcon />
              {isRecording
                ? `Detener grabación ${formatTime(elapsed)}`
                : recordings[currentQuestion.id]
                  ? "Grabar de nuevo"
                  : "Grabar mi respuesta"}
            </button>

            <button
              className="next-button"
              type="button"
              onClick={isLastQuestion ? handleFinishSession : handleNext}
              disabled={isRecording || submittingSession}
            >
              {submittingSession
                ? "Enviando..."
                : isLastQuestion
                  ? "Finalizar entrevista"
                  : "Siguiente pregunta"}
              <span aria-hidden="true">&rsaquo;</span>
            </button>

            <button
              className="secondary-sim-button"
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isRecording || submittingSession}
            >
              Anterior
            </button>
          </div>
        </section>

        <section className="session-summary" aria-label="Resumen de práctica">
          <div>
            <span>{recordedCount} de {QUESTIONS.length}</span>
            <strong>respuestas grabadas</strong>
            {isLastQuestion && recordedCount < QUESTIONS.length && (
              <small className="session-summary__hint">
                Completa las 5 respuestas para enviar la entrevista a
                retroalimentación.
              </small>
            )}
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = "/entrevista")}
          >
            Volver a preparación
          </button>
        </section>

        <section className="analysis-section">
          <div className="analysis-title">
            <span />
            <h2>Análisis comparativo</h2>
            <span />
          </div>

          <div className="analysis-grid">
            <AnalysisCard
              type="weak"
              title="Respuesta Débil"
              subtitle="Falta de detalles"
              quote={currentQuestion.weak}
              notes={currentQuestion.weakNotes}
            />
            <AnalysisCard
              type="strong"
              title="Respuesta Fuerte"
              subtitle="Clara y específica"
              quote={currentQuestion.strong}
              notes={currentQuestion.strongNotes}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
