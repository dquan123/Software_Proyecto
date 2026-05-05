import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

// Inyectar estilos de animación
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.2);
    }
    50% {
      transform: scale(1.1);
      box-shadow: 0 0 0 8px rgba(225, 29, 72, 0.15);
    }
  }
`;
if (!document.getElementById("dashboard-animations")) {
  styleSheet.id = "dashboard-animations";
  document.head.appendChild(styleSheet);
}

export default function Dashboard() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();
  const [tramite, setTramite] = useState(null);

  useEffect(() => {
    if (!session) return;

    const cargarTramite = async () => {
      try {
        const res = await fetch(
          `${buildApiUrl("/estado-tramite")}?correo=${encodeURIComponent(session.correo)}`
        );
        if (res.ok) {
          const data = await res.json();
          setTramite(data);
        }
      } catch (err) {
        console.error("Error cargando trámite:", err);
      }
    };

    cargarTramite();
  }, [session]);

  if (isValidating) {
    return (
      <div style={styles.layout}>
        <Sidebar currentPage="inicio" />
        <main style={styles.mainContent}>
          <p>Verificando sesión...</p>
        </main>
      </div>
    );
  }

    // Determinar etapa actual basado en el perfil y progreso
    // Si tiene perfil, mínimo está en etapa 2
    const tienePerfl = session?.perfil ? true : false;
    const progresoReal = tramite?.progreso || 10;
    let etapaActual = Math.ceil(progresoReal / 16.66);
    if (tienePerfl && etapaActual < 2) {
    etapaActual = 2;
    }
    const porcentaje = Math.round((etapaActual / 6) * 100);

const etapas = [
  { numero: 1, nombre: "Perfil", completada: etapaActual >= 2, actual: etapaActual === 1 },
  { numero: 2, nombre: "DS-160", completada: etapaActual >= 3, actual: etapaActual === 2 },
  { numero: 3, nombre: "Pago", completada: etapaActual >= 4, actual: etapaActual === 3 },
  { numero: 4, nombre: "Cita", completada: etapaActual >= 5, actual: etapaActual === 4 },
  { numero: 5, nombre: "Entrevista", completada: etapaActual >= 6, actual: etapaActual === 5 },
  { numero: 6, nombre: "Decisión", completada: false, actual: etapaActual === 6 },
];

  const getTipoVisa = () => {
    const perfil = session?.perfil;
    if (perfil === "turismo_negocios") return "B1/B2";
    if (perfil === "estudiante") return "F/M";
    if (perfil === "renovacion") return "Renovación";
    return "B1/B2";
  };

  return (
    <div style={styles.layout}>
      <Sidebar currentPage="inicio" />
      <main style={styles.mainContent}>
        {/* Header de bienvenida */}
        <header style={styles.header}>
          <h1 style={{
            ...styles.greeting,
            fontSize: modoSenior ? "36px" : "28px"
          }}>
            ¡Hola, {session?.nombre?.split(" ")[0] || "Usuario"}!
          </h1>
          <p style={{
            ...styles.subgreeting,
            fontSize: modoSenior ? "18px" : "15px"
          }}>
            Continuemos con tu solicitud de visa {getTipoVisa()}.
          </p>
        </header>

        {/* Card de Progreso General */}
        <section style={styles.progressCard}>
          <div style={styles.progressLeft}>
            <div style={styles.progressHeader}>
              <span style={styles.progressIcon}>📍</span>
              <h2 style={{
                ...styles.progressTitle,
                fontSize: modoSenior ? "24px" : "20px"
              }}>Progreso general</h2>
            </div>
            <p style={{
              ...styles.progressSubtitle,
              fontSize: modoSenior ? "16px" : "14px"
            }}>
              Sigue estas etapas para completar tu proceso.
            </p>

            {/* Timeline de etapas */}
            <div style={styles.timeline}>
              {etapas.map((etapa, index) => (
                <div key={etapa.numero} style={styles.timelineItem}>
                  <div style={{
                    ...styles.timelineNode,
                    ...(etapa.completada ? styles.timelineNodeCompleted : {}),
                    ...(etapa.actual ? styles.timelineNodeActive : {}),
                  }}>
                    {etapa.completada ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    ) : (
                      <span style={styles.timelineNumber}>{etapa.numero}</span>
                    )}
                  </div>
                  {index < etapas.length - 1 && (
                    <div style={styles.timelineLineContainer}>
                        <div style={{
                        ...styles.timelineLine,
                        ...(etapa.completada ? styles.timelineLineCompleted : {}),
                        }} />
                        {etapa.actual && (
                        <div style={styles.timelineLineProgress} />
                        )}
                    </div>
                    )}
                  <span style={{
                    ...styles.timelineLabel,
                    ...(etapa.actual ? styles.timelineLabelActive : {}),
                    fontSize: modoSenior ? "14px" : "12px"
                  }}>
                    {etapa.nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicador circular de etapa */}
          <div style={styles.progressRight}>
            <p style={styles.etapaLabel}>ETAPA ACTUAL</p>
            <div style={styles.etapaDisplay}>
              <span style={styles.etapaNumero}>{etapaActual}</span>
              <span style={styles.etapaDe}>de 6</span>
            </div>
            <div style={styles.circularProgress}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(porcentaje / 100) * 163.36} 163.36`}
                  transform="rotate(-90 30 30)"
                />
              </svg>
              <span style={styles.circularText}>{porcentaje}%</span>
            </div>
          </div>
        </section>

        {/* Siguiente Acción Requerida */}
        <section style={styles.actionSection}>
          <div style={styles.actionHeader}>
            <span style={styles.actionIcon}>⊙</span>
            <span style={{
              ...styles.actionTitle,
              fontSize: modoSenior ? "14px" : "12px"
            }}>SIGUIENTE ACCIÓN REQUERIDA</span>
          </div>

          <div style={styles.actionCard}>
            <div style={styles.actionCardLeft}>
              <div style={styles.actionBadges}>
                <span style={styles.priorityBadge}>PRIORIDAD ALTA</span>
                <span style={styles.timeBadge}>Tiempo est.: 45 min</span>
              </div>
              <h3 style={{
                ...styles.actionCardTitle,
                fontSize: modoSenior ? "26px" : "22px"
              }}>Completar formulario DS-160</h3>
              <p style={{
                ...styles.actionCardDesc,
                fontSize: modoSenior ? "16px" : "14px"
              }}>
                El formulario oficial del gobierno requiere tu información personal, laboral y de viaje. 
                Recomendamos hacerlo en una sola sesión.
              </p>
            </div>
            <button 
              style={styles.actionButton}
              onClick={() => window.location.href = "/ds160"}
            >
              Iniciar sección →
            </button>
          </div>
        </section>

        {/* Cards de acciones rápidas */}
        <section style={styles.quickActions}>
          {/* Card Documentos - Amarilla */}
          <article 
            style={styles.quickCardWarning}
            onClick={() => window.location.href = "/documents"}
          >
            <span style={styles.importantBadge}>⚠ IMPORTANTE</span>
            <div style={styles.quickCardIcon}>📄</div>
            <h4 style={{
              ...styles.quickCardTitle,
              fontSize: modoSenior ? "20px" : "17px"
            }}>Revisión de documentos</h4>
            <p style={{
              ...styles.quickCardDesc,
              fontSize: modoSenior ? "15px" : "13px"
            }}>
              Tienes <span style={styles.highlight}>1 documento</span> que requiere corrección antes de continuar.
            </p>
            <span style={styles.quickCardLink}>Corregir ahora →</span>
          </article>

          {/* Card Cronología */}
          <article 
            style={styles.quickCard}
            onClick={() => window.location.href = "/cronologia"}
          >
            <div style={styles.quickCardIconGray}>📋</div>
            <h4 style={{
              ...styles.quickCardTitle,
              fontSize: modoSenior ? "20px" : "17px"
            }}>Ver cronología completa</h4>
            <p style={{
              ...styles.quickCardDesc,
              fontSize: modoSenior ? "15px" : "13px"
            }}>
              Revisa todos los pasos de tu proceso y qué esperar en cada uno.
            </p>
            <span style={styles.quickCardLinkDark}>Explorar →</span>
          </article>

          {/* Card Simulador - Oscura */}
          <article 
            style={styles.quickCardDark}
            onClick={() => window.location.href = "/entrevista"}
          >
            <div style={styles.quickCardIconLight}>💬</div>
            <h4 style={{
              ...styles.quickCardTitleLight,
              fontSize: modoSenior ? "20px" : "17px"
            }}>Simulador de entrevista</h4>
            <p style={{
              ...styles.quickCardDescLight,
              fontSize: modoSenior ? "15px" : "13px"
            }}>
              Practica con preguntas reales para ganar confianza antes de tu cita consular.
            </p>
            <span style={styles.quickCardLinkGreen}>Practicar →</span>
          </article>
        </section>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },

  mainContent: {
    marginLeft: "250px",
    flex: 1,
    background: "#f8fafc",
    padding: "32px 40px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Header
  header: {
    marginBottom: "28px",
  },

  greeting: {
    margin: "0 0 6px 0",
    fontWeight: "700",
    color: "#0f172a",
  },

  subgreeting: {
    margin: 0,
    color: "#64748b",
  },

  // Progress Card
  progressCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },

  progressLeft: {
    flex: 1,
  },

  progressHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },

  progressIcon: {
    fontSize: "20px",
  },

  progressTitle: {
    margin: 0,
    fontWeight: "700",
    color: "#0f172a",
  },

  progressSubtitle: {
    margin: "0 0 24px 0",
    color: "#64748b",
  },

  // Timeline
  timeline: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0",
  },

  timelineItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },

  timelineNode: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: "600",
    fontSize: "13px",
    position: "relative",
    zIndex: 2,
  },

  timelineNodeCompleted: {
    background: "#0f172a",
    color: "white",
  },

  timelineNodeActive: {
    background: "#e11d48",
    color: "white",
    boxShadow: "0 0 0 4px rgba(225, 29, 72, 0.2)",
    animation: "pulse 2s ease-in-out infinite",
  },

  timelineNumber: {
    fontSize: "13px",
    fontWeight: "600",
  },

  timelineLineContainer: {
  position: "absolute",
  top: "16px",
  left: "32px",
  width: "60px",
  height: "3px",
  zIndex: 1,
    },

    timelineLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "#e2e8f0",
    },

    timelineLineCompleted: {
    background: "#0f172a",
    },

    timelineLineProgress: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    background: "#0f172a",
    borderRadius: "0 2px 2px 0",
    },

  timelineLabel: {
    marginTop: "10px",
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
    width: "80px",
  },

  timelineLabelActive: {
    color: "#e11d48",
    fontWeight: "600",
  },

  // Progress Right (circular indicator)
  progressRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginLeft: "40px",
  },

  etapaLabel: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: "0.5px",
  },

  etapaDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },

  etapaNumero: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#0f172a",
  },

  etapaDe: {
    fontSize: "16px",
    color: "#64748b",
  },

  circularProgress: {
    position: "relative",
    width: "60px",
    height: "60px",
  },

  circularText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },

  // Action Section
  actionSection: {
    marginBottom: "28px",
  },

  actionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  },

  actionIcon: {
    fontSize: "16px",
    color: "#64748b",
  },

  actionTitle: {
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: "0.5px",
  },

  actionCard: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #fde68a",
  },

  actionCardLeft: {
    flex: 1,
  },

  actionBadges: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },

  priorityBadge: {
    background: "#dc2626",
    color: "white",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },

  timeBadge: {
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "500",
  },

  actionCardTitle: {
    margin: "0 0 8px 0",
    fontWeight: "700",
    color: "#0f172a",
  },

  actionCardDesc: {
    margin: 0,
    color: "#57534e",
    lineHeight: "1.5",
    maxWidth: "500px",
  },

  actionButton: {
    background: "#e11d48",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.2s",
  },

  // Quick Actions
  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },

  quickCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "box-shadow 0.2s",
  },

  quickCardWarning: {
    background: "#fffbeb",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #fde68a",
    cursor: "pointer",
    position: "relative",
  },

  quickCardDark: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
  },

  importantBadge: {
    position: "absolute",
    top: "-10px",
    left: "16px",
    background: "#f59e0b",
    color: "white",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },

  quickCardIcon: {
    fontSize: "28px",
    marginBottom: "14px",
  },

  quickCardIconGray: {
    fontSize: "28px",
    marginBottom: "14px",
    opacity: 0.7,
  },

  quickCardIconLight: {
    fontSize: "28px",
    marginBottom: "14px",
  },

  quickCardTitle: {
    margin: "0 0 8px 0",
    fontWeight: "700",
    color: "#0f172a",
  },

  quickCardTitleLight: {
    margin: "0 0 8px 0",
    fontWeight: "700",
    color: "#ffffff",
  },

  quickCardDesc: {
    margin: "0 0 14px 0",
    color: "#64748b",
    lineHeight: "1.5",
  },

  quickCardDescLight: {
    margin: "0 0 14px 0",
    color: "#94a3b8",
    lineHeight: "1.5",
  },

  highlight: {
    color: "#dc2626",
    fontWeight: "600",
  },

  quickCardLink: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: "14px",
  },

  quickCardLinkDark: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: "14px",
  },

  quickCardLinkGreen: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: "14px",
  },
};