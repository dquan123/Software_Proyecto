import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import "../styles/interview.css";

const PREP_CARDS = [
  {
    tone: "green",
    title: "Seguridad y Postura",
    text:
      "Mantén contacto visual. Los oficiales buscan congruencia y tranquilidad. Una postura recta y relajada transmite que no hay nada que ocultar.",
  },
  {
    tone: "pink",
    title: "Respuestas Breves",
    text:
      "Escucha la pregunta completa, respira y responde únicamente lo que te preguntan. No ofrezcas información extra ni justificaciones innecesarias.",
  },
  {
    tone: "yellow",
    title: "Honestidad Total",
    text:
      "Si no sabes algo, dilo. Es mejor decir que no lo recuerdas con exactitud que inventar un dato que contradiga tu formulario DS-160.",
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

function ChatIcon() {
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

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4l1.4 1.4L12 21l7.4-6.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m8 13 2 2 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TipIcon({ tone }) {
  if (tone === "green") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="m12 3 2.5 5 5.5.8-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.8L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "yellow") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3 5 6v5c0 4.5 2.9 8.6 7 10 4.1-1.4 7-5.5 7-10V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

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

export default function Entrevista() {
  const { isValidating } = useRequireAuth();
  const modoSenior = useModoSenior();

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
      <main className={`interview-main${modoSenior ? " interview-main--senior" : ""}`}>
        <header className="interview-header">
          <h1>Entrevista Consular</h1>
          <p>
            Prepárate mental, emocional y prácticamente para tu encuentro con el
            oficial consular.
          </p>
        </header>

        <section className="interview-hero">
          <div className="interview-hero__copy">
            <span className="interview-pill">Herramienta principal</span>
            <h2>Simulador de Entrevista</h2>
            <p>
              Practica con preguntas reales basadas en tu perfil. Graba tus
              respuestas y aprende a comunicarte de manera clara, concisa y
              segura.
            </p>

            <button
              className="interview-start-button"
              type="button"
              onClick={() => (window.location.href = "/entrevista/simulador")}
            >
              <MicIcon />
              Iniciar simulador
              <span aria-hidden="true">{"->"}</span>
            </button>
          </div>

          <div className="interview-hero__art" aria-hidden="true">
            <ChatIcon />
            <span />
          </div>
        </section>

        <section className="emotional-section">
          <div className="emotional-heading">
            <HeartIcon />
            <h2>Preparación Emocional</h2>
          </div>
          <p>
            Sabemos que este proceso puede generar nervios. Recuerda que la
            entrevista es solo una conversación breve para confirmar lo que ya
            está en tu DS-160.
          </p>

          <div className="prep-grid">
            {PREP_CARDS.map((card) => (
              <article
                className={`prep-card prep-card--${card.tone}`}
                key={card.title}
              >
                <div className="prep-card__icon">
                  <TipIcon tone={card.tone} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
