import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";

// Datos de la cronología — al hardcodear los estados aquí seguimos el patrón
// del resto del repo (Documents, Informacion). Cuando exista un endpoint que
// devuelva la lista de 6 etapas con su estado individual, esto se reemplaza
// por un fetch + useState. El endpoint actual /estado-tramite solo devuelve
// la etapa actual general, no el detalle de cada paso.
const ETAPAS = [
  {
    numero: 1,
    titulo: "Creación de perfil",
    descripcion:
      "Información básica y registro inicial de la solicitud en la plataforma.",
    estado: "completada",
    fecha: "14 de Marzo, 2026",
  },
  {
    numero: 2,
    titulo: "Completar DS-160",
    descripcion:
      "Formulario oficial del gobierno de EE. UU. Requiere tu historial personal, familiar y laboral detallado. Es el paso más crítico.",
    estado: "actual",
    accion: { label: "Continuar llenando", path: "/ds160" },
  },
  {
    numero: 3,
    titulo: "Revisión experta",
    descripcion:
      "Nuestro equipo validará tu DS-160 para evitar errores comunes antes de enviarlo al sistema consular.",
    estado: "pendiente",
  },
  {
    numero: 4,
    titulo: "Pago de tarifa (MRV)",
    descripcion:
      "Abonar la tarifa consular de $185 USD. Este pago no es reembolsable.",
    estado: "pendiente",
    destacada: true,
  },
  {
    numero: 5,
    titulo: "Agendar cita consular",
    descripcion:
      "Seleccionar fecha y hora para el CAS (toma de huellas) y la entrevista en la embajada.",
    estado: "pendiente",
  },
  {
    numero: 6,
    titulo: "Entrevista en embajada",
    descripcion:
      "Presentación final ante el oficial consular para la decisión sobre tu visa.",
    estado: "pendiente",
  },
];

// ----- Sub-componentes -----

function Circulo({ numero, estado }) {
  if (estado === "completada") {
    return (
      <div style={{ ...styles.circuloBase, ...styles.circuloCompletada }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (estado === "actual") {
    return (
      <div style={{ ...styles.circuloBase, ...styles.circuloActual }}>
        <span style={styles.circuloNumeroActual}>{numero}</span>
      </div>
    );
  }
  return (
    <div style={{ ...styles.circuloBase, ...styles.circuloPendiente }}>
      <span style={styles.circuloNumeroPendiente}>{numero}</span>
    </div>
  );
}

function TarjetaCompletada({ etapa, modoSenior }) {
  return (
    <article style={styles.tarjetaCompletada}>
      <div style={styles.tarjetaHeader}>
        <h3
          style={{
            ...styles.tarjetaTitulo,
            fontSize: modoSenior ? "22px" : "18px",
          }}
        >
          {etapa.titulo}
        </h3>
        <span
          style={{
            ...styles.fechaCompletada,
            fontSize: modoSenior ? "16px" : "13px",
          }}
        >
          {etapa.fecha}
        </span>
      </div>
      <p
        style={{
          ...styles.tarjetaTexto,
          fontSize: modoSenior ? "16px" : "14px",
        }}
      >
        {etapa.descripcion}
      </p>
    </article>
  );
}

function TarjetaActual({ etapa, modoSenior }) {
  return (
    <article style={styles.tarjetaActual}>
      <span style={styles.badgeActual} aria-hidden="true">
        ▶ ACTUAL
      </span>
      <div style={styles.tarjetaActualHeader}>
        <h3
          style={{
            ...styles.tarjetaTituloActual,
            fontSize: modoSenior ? "28px" : "22px",
          }}
        >
          {etapa.titulo}
        </h3>
        <span
          style={{
            ...styles.badgeEnProgreso,
            fontSize: modoSenior ? "14px" : "12px",
          }}
        >
          En progreso
        </span>
      </div>
      <p
        style={{
          ...styles.tarjetaTexto,
          fontSize: modoSenior ? "17px" : "14px",
        }}
      >
        {etapa.descripcion}
      </p>
      {etapa.accion && (
        <button
          type="button"
          style={{
            ...styles.botonAccion,
            fontSize: modoSenior ? "16px" : "14px",
          }}
          onClick={() => (window.location.href = etapa.accion.path)}
        >
          {etapa.accion.label}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: "8px" }}
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      )}
    </article>
  );
}

function TarjetaPendienteDestacada({ etapa, modoSenior }) {
  return (
    <article style={styles.tarjetaPendienteDestacada}>
      <h3
        style={{
          ...styles.tarjetaTituloPendiente,
          fontSize: modoSenior ? "22px" : "18px",
        }}
      >
        {etapa.titulo}
      </h3>
      <p
        style={{
          ...styles.tarjetaTextoPendiente,
          fontSize: modoSenior ? "16px" : "14px",
        }}
      >
        {etapa.descripcion}
      </p>
    </article>
  );
}

function TextoPendiente({ etapa, modoSenior }) {
  return (
    <div style={styles.pendienteSimple}>
      <h3
        style={{
          ...styles.tarjetaTituloPendiente,
          fontSize: modoSenior ? "22px" : "18px",
        }}
      >
        {etapa.titulo}
      </h3>
      <p
        style={{
          ...styles.tarjetaTextoPendiente,
          fontSize: modoSenior ? "16px" : "14px",
        }}
      >
        {etapa.descripcion}
      </p>
    </div>
  );
}

function EtapaItem({ etapa, esUltima, modoSenior }) {
  // Color de la línea conectora: rojo cuando viene de una etapa completada,
  // gris en cualquier otro caso. Coincide con el comportamiento del Figma.
  const colorLinea =
    etapa.estado === "completada" ? "#e11d48" : "#cbd5e1";

  let contenido;
  if (etapa.estado === "completada") {
    contenido = <TarjetaCompletada etapa={etapa} modoSenior={modoSenior} />;
  } else if (etapa.estado === "actual") {
    contenido = <TarjetaActual etapa={etapa} modoSenior={modoSenior} />;
  } else if (etapa.destacada) {
    contenido = (
      <TarjetaPendienteDestacada etapa={etapa} modoSenior={modoSenior} />
    );
  } else {
    contenido = <TextoPendiente etapa={etapa} modoSenior={modoSenior} />;
  }

  return (
    <li style={styles.etapaItem}>
      <div style={styles.timelineCol}>
        <Circulo numero={etapa.numero} estado={etapa.estado} />
        {!esUltima && (
          <div
            style={{
              ...styles.lineaConectora,
              backgroundColor: colorLinea,
            }}
            aria-hidden="true"
          />
        )}
      </div>
      <div style={styles.contenidoCol}>{contenido}</div>
    </li>
  );
}

// ----- Página principal -----

export default function Cronologia() {
  const modoSenior = useModoSenior();

  return (
    <div style={styles.layout}>
      <Sidebar currentPage="cronologia" />
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <h1
            style={{
              ...styles.titulo,
              fontSize: modoSenior ? "44px" : "36px",
            }}
          >
            Cronología de solicitud
          </h1>
          <p
            style={{
              ...styles.subtitulo,
              fontSize: modoSenior ? "18px" : "15px",
            }}
          >
            Sigue el avance detallado de tu proceso. Cada etapa requiere
            completarse para habilitar la siguiente.
          </p>
        </header>

        <hr style={styles.divisor} />

        <ol style={styles.timeline} aria-label="Etapas del proceso">
          {ETAPAS.map((etapa, idx) => (
            <EtapaItem
              key={etapa.numero}
              etapa={etapa}
              esUltima={idx === ETAPAS.length - 1}
              modoSenior={modoSenior}
            />
          ))}
        </ol>
      </main>
    </div>
  );
}

// ----- Estilos -----

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },

  mainContent: {
    marginLeft: "250px",
    flex: 1,
    background: "#f1f5f9",
    padding: "40px 56px",
    fontFamily: "'Segoe UI', sans-serif",
    minHeight: "100vh",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "20px",
  },

  titulo: {
    margin: "0 0 12px 0",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  subtitulo: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.5,
    maxWidth: "780px",
  },

  divisor: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "24px 0 36px 0",
  },

  timeline: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  // ----- Cada etapa (li) -----
  etapaItem: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    marginBottom: "28px",
  },

  // Columna izquierda: círculo + línea conectora
  timelineCol: {
    position: "relative",
    width: "44px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "stretch",
  },

  contenidoCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: "2px",
  },

  // ----- Círculos -----
  circuloBase: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    zIndex: 1,
  },

  circuloCompletada: {
    backgroundColor: "#10b981",
    border: "3px solid #ffffff",
    boxShadow: "0 0 0 2px #10b981",
  },

  circuloActual: {
    backgroundColor: "#ffffff",
    border: "2.5px solid #e11d48",
    boxShadow: "0 0 0 4px rgba(225, 29, 72, 0.15)",
  },

  circuloNumeroActual: {
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "16px",
  },

  circuloPendiente: {
    backgroundColor: "#ffffff",
    border: "2px solid #cbd5e1",
  },

  circuloNumeroPendiente: {
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "16px",
  },

  // ----- Línea conectora -----
  lineaConectora: {
    width: "2px",
    flex: 1,
    minHeight: "40px",
    marginTop: "4px",
    marginBottom: "-28px",
  },

  // ----- Tarjeta completada -----
  tarjetaCompletada: {
    background: "#ffffff",
    border: "1.5px solid #a7f3d0",
    borderRadius: "14px",
    padding: "18px 22px",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
  },

  tarjetaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "12px",
    marginBottom: "6px",
    flexWrap: "wrap",
  },

  tarjetaTitulo: {
    margin: 0,
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  fechaCompletada: {
    color: "#10b981",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  tarjetaTexto: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.55,
  },

  // ----- Tarjeta actual (DS-160) -----
  tarjetaActual: {
    position: "relative",
    background: "#ffffff",
    border: "2.5px solid #0f172a",
    borderRadius: "14px",
    padding: "26px 28px 24px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },

  badgeActual: {
    position: "absolute",
    top: "-14px",
    right: "20px",
    background: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: "99px",
    letterSpacing: "0.5px",
    boxShadow: "0 4px 10px rgba(225, 29, 72, 0.30)",
  },

  tarjetaActualHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },

  tarjetaTituloActual: {
    margin: 0,
    color: "#0f172a",
    fontWeight: 800,
    lineHeight: 1.2,
  },

  badgeEnProgreso: {
    background: "#fce7f3",
    color: "#be185d",
    padding: "5px 12px",
    borderRadius: "99px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  botonAccion: {
    marginTop: "14px",
    display: "inline-flex",
    alignItems: "center",
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "background-color 0.15s",
  },

  // ----- Tarjeta pendiente destacada (Pago MRV) -----
  tarjetaPendienteDestacada: {
    background: "#eef2f7",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px 22px",
  },

  // ----- Pendiente simple (sin tarjeta, solo texto) -----
  pendienteSimple: {
    padding: "4px 4px",
  },

  tarjetaTituloPendiente: {
    margin: "0 0 6px 0",
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  tarjetaTextoPendiente: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.55,
  },
};
