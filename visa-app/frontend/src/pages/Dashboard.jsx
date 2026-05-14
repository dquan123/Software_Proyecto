import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

// Animación de pulso para el nodo activo del timeline
if (!document.getElementById("vg-dash-anim")) {
  const st = document.createElement("style");
  st.id = "vg-dash-anim";
  st.textContent = `
    @keyframes vgPulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(225,29,72,0.20); }
      50%       { box-shadow: 0 0 0 9px rgba(225,29,72,0.07); }
    }
  `;
  document.head.appendChild(st);
}

export default function Dashboard() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();
  const [tramite, setTramite] = useState(null);

  useEffect(() => {
    if (!session) return;
    const fetchTramite = async () => {
      try {
        const res = await fetch(
          `${buildApiUrl("/estado-tramite")}?correo=${encodeURIComponent(session.correo)}`
        );
        if (res.ok) setTramite(await res.json());
      } catch (e) {
        console.error("Error cargando tramite:", e);
      }
    };
    fetchTramite();
  }, [session]);

  if (isValidating) {
    return (
      <div style={s.layout}>
        <Sidebar currentPage="inicio" />
        <main style={s.main}>
          <p style={{ color: "#64748b", paddingTop: "40px" }}>Verificando sesion...</p>
        </main>
      </div>
    );
  }

  /* ---- Calculos de etapa ---- */
  const progreso  = tramite?.progreso || 10;
  let etapaActual = Math.ceil(progreso / 16.66);
  if (session?.perfil && etapaActual < 2) etapaActual = 2;
  const pct  = Math.round((etapaActual / 6) * 100);
  const r    = 26;
  const circ = 2 * Math.PI * r; // aprox 163.36

  const ETAPAS = [
    { n: 1, label: "Perfil",     done: etapaActual >= 2, active: etapaActual === 1 },
    { n: 2, label: "DS-160",     done: etapaActual >= 3, active: etapaActual === 2 },
    { n: 3, label: "Pago",       done: etapaActual >= 4, active: etapaActual === 3 },
    { n: 4, label: "Cita",       done: etapaActual >= 5, active: etapaActual === 4 },
    { n: 5, label: "Entrevista", done: etapaActual >= 6, active: etapaActual === 5 },
    { n: 6, label: "Decisi\u00f3n", done: false,         active: etapaActual === 6 },
  ];

  const tipoVisa = () => {
    const p = session?.perfil;
    if (p === "turismo_negocios") return "B1/B2";
    if (p === "estudiante")       return "F/M";
    if (p === "renovacion")       return "Renovaci\u00f3n";
    return "B1/B2";
  };

  const firstName = session?.nombre?.split(" ")[0] || "Usuario";

  // Construir nodos + lineas del timeline horizontalmente
  const timelineElements = [];
  ETAPAS.forEach((e, i) => {
    timelineElements.push(
      <div key={`node-${e.n}`} style={s.tlNodeCol}>
        <div style={{
          ...s.tlNode,
          ...(e.done   ? s.tlNodeDone   : {}),
          ...(e.active ? s.tlNodeActive : {}),
        }}>
          {e.done ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <span style={{
              ...s.tlNum,
              color: e.active ? "#fff" : "#94a3b8",
            }}>{e.n}</span>
          )}
        </div>
        <span style={{
          ...s.tlLabel,
          ...(e.active ? s.tlLabelActive : {}),
          fontSize: modoSenior ? "13px" : "11px",
        }}>{e.label}</span>
      </div>
    );
    if (i < ETAPAS.length - 1) {
      timelineElements.push(
        <div key={`line-${e.n}`} style={{
          ...s.tlLine,
          background: e.done ? "#0f172a" : "#e2e8f0",
        }} />
      );
    }
  });

  return (
    <div style={s.layout}>
      <Sidebar currentPage="inicio" />
      <main style={s.main}>

        {/* SALUDO */}
        <header style={s.header}>
          <h1 style={{ ...s.greeting, fontSize: modoSenior ? "36px" : "28px" }}>
            {"\u00a1"}Hola, {firstName}!
          </h1>
          <p style={{ ...s.subgreeting, fontSize: modoSenior ? "17px" : "14px" }}>
            Continuemos con tu solicitud de visa {tipoVisa()}.
          </p>
        </header>

        {/* PROGRESO GENERAL */}
        <section style={s.progressCard}>
          {/* Izquierda */}
          <div style={s.progressBody}>
            <div style={s.progressHeadRow}>
              {/* espacio para ícono de ubicación/progreso */}
              <h2 style={{ ...s.progressTitle, fontSize: modoSenior ? "21px" : "18px" }}>
                Progreso general
              </h2>
            </div>
            <p style={{ ...s.progressSub, fontSize: modoSenior ? "15px" : "13px" }}>
              Sigue estas etapas para completar tu proceso.
            </p>
            <div style={s.timeline}>
              {timelineElements}
            </div>
          </div>

          {/* Derecha — caja navy ETAPA ACTUAL */}
          <div style={s.etapaBox}>
            <span style={s.etapaBoxLabel}>ETAPA ACTUAL</span>
            <div style={s.etapaNumRow}>
              <span style={{ ...s.etapaNum, fontSize: modoSenior ? "50px" : "42px" }}>
                {etapaActual}
              </span>
              <span style={s.etapaDe}>de 6</span>
            </div>
            <div style={s.ringWrap}>
              <svg width="58" height="58" viewBox="0 0 60 60" aria-hidden="true">
                <circle cx="30" cy="30" r={r} fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
                <circle cx="30" cy="30" r={r} fill="none"
                  stroke="#e11d48" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                  transform="rotate(-90 30 30)" />
              </svg>
              <span style={s.ringPct}>{pct}%</span>
            </div>
          </div>
        </section>

        {/* SIGUIENTE ACCION REQUERIDA */}
        <section style={s.actionSection}>
          <div style={s.actionSectionLabel}>
            <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#94a3b8", display: "inline-block", flexShrink: 0 }} />
            <span style={{ ...s.actionSectionText, fontSize: modoSenior ? "13px" : "11px" }}>
              SIGUIENTE ACCI\u00d3N REQUERIDA
            </span>
          </div>

          {/* Card blanca con borde rojo izquierdo — segun Figma */}
          <div style={s.actionCard}>
            <div style={s.actionLeft}>
              <div style={s.actionBadgeRow}>
                <span style={s.priorityBadge}>PRIORIDAD ALTA</span>
                <span style={{ ...s.timeEstText, fontSize: modoSenior ? "14px" : "12px" }}>
                  Tiempo est.: 45 min
                </span>
              </div>
              <h3 style={{ ...s.actionTitle, fontSize: modoSenior ? "26px" : "21px" }}>
                Completar formulario DS-160
              </h3>
              <p style={{ ...s.actionDesc, fontSize: modoSenior ? "15px" : "13px" }}>
                El formulario oficial del gobierno requiere tu informaci\u00f3n personal,
                laboral y de viaje. Recomendamos hacerlo en una sola sesi\u00f3n.
              </p>
            </div>
            <button
              style={s.actionBtn}
              onClick={() => (window.location.href = "/ds160")}
            >
              Iniciar secci\u00f3n &rarr;
            </button>
          </div>
        </section>

        {/* CARDS DE ACCESO RAPIDO */}
        <section style={s.quickGrid}>

          {/* Card 1 — Revision documentos (amarilla) */}
          <article
            style={s.cardYellow}
            onClick={() => (window.location.href = "/documents")}
            role="button"
            tabIndex={0}
          >
            <span style={s.importantBadge}>IMPORTANTE</span>
            <div style={s.iconPlaceholder} aria-hidden="true" />
            <h4 style={{ ...s.cardTitleDark, fontSize: modoSenior ? "19px" : "16px" }}>
              Revisi\u00f3n de documentos
            </h4>
            <p style={{ ...s.cardDescDark, fontSize: modoSenior ? "14px" : "13px" }}>
              Tienes{" "}
              <strong style={{ color: "#d97706" }}>1 documento</strong>{" "}
              que requiere correcci\u00f3n antes de continuar.
            </p>
            <span style={{ ...s.cardCta, color: "#d97706", fontSize: modoSenior ? "14px" : "13px" }}>
              Corregir ahora &rarr;
            </span>
          </article>

          {/* Card 2 — Cronologia (blanca) */}
          <article
            style={s.cardWhite}
            onClick={() => (window.location.href = "/cronologia")}
            role="button"
            tabIndex={0}
          >
            <div style={s.iconPlaceholder} aria-hidden="true" />
            <h4 style={{ ...s.cardTitleDark, fontSize: modoSenior ? "19px" : "16px" }}>
              Ver cronolog\u00eda completa
            </h4>
            <p style={{ ...s.cardDescMuted, fontSize: modoSenior ? "14px" : "13px" }}>
              Revisa todos los pasos de tu proceso y qu\u00e9 esperar en cada uno.
            </p>
            <span style={{ ...s.cardCta, color: "#475569", fontSize: modoSenior ? "14px" : "13px" }}>
              Explorar &rarr;
            </span>
          </article>

          {/* Card 3 — Simulador (oscura) */}
          <article
            style={s.cardDark}
            onClick={() => (window.location.href = "/entrevista")}
            role="button"
            tabIndex={0}
          >
            <div style={s.iconPlaceholderLight} aria-hidden="true" />
            <h4 style={{ ...s.cardTitleLight, fontSize: modoSenior ? "19px" : "16px" }}>
              Simulador de entrevista
            </h4>
            <p style={{ ...s.cardDescLight, fontSize: modoSenior ? "14px" : "13px" }}>
              Practica con preguntas reales para ganar confianza antes de tu cita consular.
            </p>
            <span style={{ ...s.cardCta, color: "#10b981", fontSize: modoSenior ? "14px" : "13px" }}>
              Practicar &rarr;
            </span>
          </article>

        </section>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════
   ESTILOS
   ══════════════════════════════════════════ */
const s = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
  },

  main: {
    marginLeft: "250px",
    flex: 1,
    padding: "32px 40px 52px",
    fontFamily: "'Segoe UI', sans-serif",
    minHeight: "100vh",
  },

  /* ---- Saludo ---- */
  header:     { marginBottom: "28px" },
  greeting:   { margin: "0 0 6px 0", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" },
  subgreeting:{ margin: 0, color: "#64748b" },

  /* ════ Progreso general ════ */
  progressCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "32px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
  },

  progressBody: { flex: 1, minWidth: 0 },

  progressHeadRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },

  progressTitle: { margin: 0, fontWeight: 700, color: "#0f172a" },
  progressSub:   { margin: "0 0 24px 0", color: "#64748b" },

  /* ---- Timeline horizontal ---- */
  timeline: { display: "flex", alignItems: "flex-start" },

  tlNodeCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },

  tlNode: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s",
  },

  tlNodeDone:   { background: "#0f172a" },
  tlNodeActive: { background: "#e11d48", animation: "vgPulse 2s ease-in-out infinite" },

  tlNum: { fontWeight: 700, fontSize: "13px" },

  tlLabel: {
    color: "#64748b",
    fontWeight: 500,
    textAlign: "center",
    whiteSpace: "nowrap",
  },

  tlLabelActive: { color: "#e11d48", fontWeight: 700 },

  /* Linea que crece entre nodos */
  tlLine: {
    flex: 1,
    height: "2px",
    marginTop: "17px",   /* centro del nodo de 34px */
    minWidth: "8px",
    alignSelf: "flex-start",
  },

  /* ---- Caja navy: ETAPA ACTUAL ---- */
  etapaBox: {
    background: "#0f172a",
    borderRadius: "16px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    minWidth: "148px",
    flexShrink: 0,
  },

  etapaBoxLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },

  etapaNumRow: { display: "flex", alignItems: "baseline", gap: "5px" },
  etapaNum:    { fontWeight: 800, color: "#ffffff", lineHeight: 1 },
  etapaDe:     { fontSize: "15px", color: "#94a3b8", fontWeight: 500 },

  ringWrap: { position: "relative", width: "58px", height: "58px" },

  ringPct: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "12px",
    fontWeight: 700,
    color: "#ffffff",
  },

  /* ════ Siguiente accion ════ */
  actionSection: { marginBottom: "24px" },

  actionSectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },

  actionSectionText: {
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.8px",
  },

  /* Card blanca con borde rojo izquierdo — clave del Figma */
  actionCard: {
    background: "#ffffff",
    borderRadius: "16px",
    borderTop:    "1px solid #e2e8f0",
    borderRight:  "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    borderLeft:   "5px solid #e11d48",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
  },

  actionLeft: { flex: 1 },

  actionBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },

  priorityBadge: {
    background: "#fce7f3",
    color: "#be185d",
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },

  timeEstText: { color: "#64748b", fontWeight: 500 },
  actionTitle: { margin: "0 0 8px 0", fontWeight: 800, color: "#0f172a" },
  actionDesc:  { margin: 0, color: "#64748b", lineHeight: 1.55, maxWidth: "520px" },

  actionBtn: {
    background: "#e11d48",
    color: "#ffffff",
    border: "none",
    borderRadius: "30px",
    padding: "14px 26px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 14px rgba(225,29,72,0.28)",
    fontFamily: "'Segoe UI', sans-serif",
    flexShrink: 0,
  },

  /* ════ Cards de acceso rapido ════ */
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },

  /* Amarilla */
  cardYellow: {
    background: "#fffbeb",
    borderRadius: "18px",
    padding: "32px 22px 22px",
    border: "1px solid #fde68a",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "transform 0.15s, box-shadow 0.15s",
  },

  importantBadge: {
    position: "absolute",
    top: "-12px",
    left: "16px",
    background: "#f59e0b",
    color: "#ffffff",
    padding: "4px 12px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  /* Blanca */
  cardWhite: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px 22px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },

  /* Oscura */
  cardDark: {
    background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "18px",
    padding: "24px 22px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "transform 0.15s",
  },

  /* Placeholder para íconos — reemplazar con SVG cuando estén listos */
  iconPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#e2e8f0",
    marginBottom: "2px",
    flexShrink: 0,
  },

  iconPlaceholderLight: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.12)",
    marginBottom: "2px",
    flexShrink: 0,
  },
  cardTitleDark:  { margin: 0, fontWeight: 800, color: "#0f172a",  lineHeight: 1.3 },
  cardTitleLight: { margin: 0, fontWeight: 800, color: "#ffffff",  lineHeight: 1.3 },
  cardDescDark:   { margin: 0, color: "#64748b", lineHeight: 1.5, flex: 1 },
  cardDescMuted:  { margin: 0, color: "#64748b", lineHeight: 1.5, flex: 1 },
  cardDescLight:  { margin: 0, color: "#94a3b8", lineHeight: 1.5, flex: 1 },
  cardCta:        { fontWeight: 700, marginTop: "4px" },
};

