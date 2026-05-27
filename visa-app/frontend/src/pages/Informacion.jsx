import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import useTheme from "../hooks/useTheme";

// Datos de la pantalla — separados del JSX para legibilidad y para
// facilitar moverlos a i18n más adelante si hace falta.
const HIGHLIGHT = {
  titulo: "¿Por qué es importante el DS-160?",
  texto:
    "Es el documento oficial sobre el cual el oficial consular basará el 90% de su decisión. Cada respuesta es evaluada algorítmicamente antes de tu entrevista. La precisión y consistencia son fundamentales.",
};

const ETAPAS = [
  {
    numero: 1,
    titulo: "Perfil",
    descripcion:
      "Comienza creando tu perfil en nuestra plataforma. Esto nos ayuda a adaptar los requisitos a tu situación específica (estudiante, turista, etc.).",
  },
  {
    numero: 2,
    titulo: "Formulario DS-160",
    descripcion:
      "El formulario oficial y más importante. Aquí recopilamos tus datos personales, de viaje y antecedentes. Debe llenarse con honestidad absoluta.",
  },
  {
    numero: 3,
    titulo: "Revisión Experta",
    descripcion:
      "Nuestro equipo de asesores revisará tu DS-160 buscando inconsistencias, omisiones o posibles alertas que puedan causar rechazo.",
  },
  {
    numero: 4,
    titulo: "Pago y Citas",
    descripcion:
      "Deberás pagar la tarifa MRV ($185 USD) en el banco autorizado y agendar dos citas: una para huellas (CAS) y otra para entrevista consular.",
  },
  {
    numero: 5,
    titulo: "Preparación (Entrevista)",
    descripcion:
      "Te guiamos para recolectar los documentos necesarios y usamos nuestro simulador para prepararte emocional y mentalmente para la entrevista.",
  },
];

// ----- Sub-componentes locales -----

function InfoHighlightCard({ titulo, texto, modoSenior, styles }) {
  return (
    <article style={styles.highlightCard}>
      <div style={styles.highlightIcon} aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div style={styles.highlightBody}>
        <h2
          style={{
            ...styles.highlightTitle,
            fontSize: modoSenior ? "24px" : "20px",
          }}
        >
          {titulo}
        </h2>
        <p
          style={{
            ...styles.highlightText,
            fontSize: modoSenior ? "17px" : "15px",
          }}
        >
          {texto}
        </p>
      </div>
    </article>
  );
}

function InfoCard({ numero, titulo, descripcion, modoSenior, styles }) {
  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardBadge} aria-hidden="true">
          {numero}
        </span>
        <h3
          style={{
            ...styles.cardTitle,
            fontSize: modoSenior ? "20px" : "17px",
          }}
        >
          {titulo}
        </h3>
      </div>
      <p
        style={{
          ...styles.cardText,
          fontSize: modoSenior ? "16px" : "14px",
        }}
      >
        {descripcion}
      </p>
    </article>
  );
}

// ----- Página principal -----

export default function Informacion() {
  const { isValidating } = useRequireAuth();
  const modoSenior = useModoSenior();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  if (isValidating) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar currentPage="informacion" />
        <main style={{ marginLeft: "var(--vg-sidebar-w)", padding: "40px" }}>
          <p>Verificando sesión...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <Sidebar currentPage="informacion" />
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <h1
            style={{
              ...styles.title,
              fontSize: modoSenior ? "40px" : "32px",
            }}
          >
            Información del proceso
          </h1>
          <p
            style={{
              ...styles.subtitle,
              fontSize: modoSenior ? "18px" : "14px",
            }}
          >
            Conoce los detalles de cada etapa para obtener tu visa B1/B2 sin
            contratiempos.
          </p>
        </header>

        <InfoHighlightCard
          titulo={HIGHLIGHT.titulo}
          texto={HIGHLIGHT.texto}
          modoSenior={modoSenior}
          styles={styles}
        />

        <section style={styles.cardsGrid} aria-label="Etapas del proceso">
          {ETAPAS.map((etapa) => (
            <InfoCard
              key={etapa.numero}
              numero={etapa.numero}
              titulo={etapa.titulo}
              descripcion={etapa.descripcion}
              modoSenior={modoSenior}
              styles={styles}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

// ----- Estilos dinámicos con soporte para dark mode -----

function getStyles(isDark) {
  return {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },

  mainContent: {
    marginLeft: "var(--vg-sidebar-w)",
    flex: 1,
    background: isDark ? "#0b1120" : "#f1f5f9",
    padding: "40px",
    fontFamily: "'Segoe UI', sans-serif",
    minHeight: "100vh",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "28px",
  },

  title: {
    margin: "0 0 10px 0",
    fontWeight: 700,
    color: isDark ? "#f1f5f9" : "#0f172a",
    lineHeight: 1.15,
  },

  subtitle: {
    margin: 0,
    color: isDark ? "#94a3b8" : "#64748b",
    lineHeight: 1.5,
    maxWidth: "640px",
  },

  highlightCard: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
    borderRadius: "18px",
    padding: "24px 28px",
    marginBottom: "28px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
    border: "1.5px solid rgba(225, 29, 72, 0.35)",
  },

  highlightIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.30)",
  },

  highlightBody: {
    minWidth: 0,
  },

  highlightTitle: {
    margin: "0 0 8px 0",
    color: "#ffffff",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  highlightText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  card: {
    background: isDark ? "#1e293b" : "#ffffff",
    borderRadius: "16px",
    padding: "22px 22px 24px",
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    boxShadow: isDark
      ? "0 1px 3px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },

  cardBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(225, 29, 72, 0.25)",
  },

  cardTitle: {
    margin: 0,
    color: isDark ? "#f1f5f9" : "#0f172a",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  cardText: {
    margin: 0,
    color: isDark ? "#94a3b8" : "#64748b",
    lineHeight: 1.6,
  },
  };
}
