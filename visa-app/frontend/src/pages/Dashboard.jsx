import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import { SkeletonCard, SkeletonList } from "../components/SkeletonCard";
import InformationSection from "../components/InformationSection";
import "../styles/dashboard.css";

// Pulse animation for active node
if (!document.getElementById("vg-dash-anim")) {
  const st = document.createElement("style");
  st.id = "vg-dash-anim";
  st.textContent = `
    @keyframes vgPulse {
      0%,100% { box-shadow: 0 0 0 4px rgba(225,29,72,0.20); }
      50%      { box-shadow: 0 0 0 9px rgba(225,29,72,0.07); }
    }
  `;
  document.head.appendChild(st);
}

export default function Dashboard() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();
  const activarTarjeta = (event, path) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = path;
    }
  };
  const [tramite, setTramite]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (isValidating || window.location.hash !== "#informacion") return;
    requestAnimationFrame(() => {
      document.getElementById("informacion")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isValidating]);

  useEffect(() => {
    if (!session) return;
    const fetchTramite = async () => {
      try {
        const res = await fetch(
          `${buildApiUrl("/estado-tramite")}?correo=${encodeURIComponent(session.correo)}`
        );
        if (res.ok) setTramite(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchTramite();
  }, [session]);

  if (isValidating) {
    return (
      <div className="vg-layout">
        <Sidebar currentPage="inicio" />
        <main id="main-content" tabIndex="-1" className="vg-main dash-main">
          <DashSkeleton />
        </main>
      </div>
    );
  }

  /* ─── Calculations ─── */
  const progreso  = tramite?.progreso || 10;
  let etapaActual = Math.ceil(progreso / 16.66);
  if (session?.perfil && etapaActual < 2) etapaActual = 2;
  const pct  = Math.round((etapaActual / 6) * 100);
  const r    = 26;
  const circ = 2 * Math.PI * r;

  const ETAPAS = [
    { n: 1, label: "Perfil",     done: etapaActual >= 2, active: etapaActual === 1 },
    { n: 2, label: "DS-160",     done: etapaActual >= 3, active: etapaActual === 2 },
    { n: 3, label: "Pago",       done: etapaActual >= 4, active: etapaActual === 3 },
    { n: 4, label: "Cita",       done: etapaActual >= 5, active: etapaActual === 4 },
    { n: 5, label: "Entrevista", done: etapaActual >= 6, active: etapaActual === 5 },
    { n: 6, label: "Decisión",   done: false,            active: etapaActual === 6 },
  ];

  const tipoVisa = () => {
    const p = session?.perfil;
    if (p === "turismo_negocios") return "B1/B2";
    if (p === "estudiante")       return "F/M";
    if (p === "renovacion")       return "Renovación";
    return "B1/B2";
  };

  const firstName = session?.nombre?.split(" ")[0] || "Usuario";

  const timelineEls = [];
  ETAPAS.forEach((e, i) => {
    timelineEls.push(
      <div key={`n${e.n}`} className="dash-tl-node-col">
        <div className={`dash-tl-node${e.done ? " dash-tl-node--done" : ""}${e.active ? " dash-tl-node--active" : ""}`}>
          {e.done ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <span className={`dash-tl-num${e.active ? " dash-tl-num--active" : ""}`}>{e.n}</span>
          )}
        </div>
        <span className={`dash-tl-label${e.active ? " dash-tl-label--active" : ""}`}
          style={{ fontSize: modoSenior ? "13px" : "11px" }}>
          {e.label}
        </span>
      </div>
    );
    if (i < ETAPAS.length - 1) {
      timelineEls.push(
        <div key={`l${e.n}`} className="dash-tl-line" style={{ background: e.done ? "var(--vg-navy)" : "var(--vg-border)" }} />
      );
    }
  });

  return (
    <div className="vg-layout">
      <Sidebar currentPage="inicio" />
      <main id="main-content" tabIndex="-1" className="vg-main dash-main">

        {/* GREETING */}
        <header className="dash-greeting">
          <h1 style={{ fontSize: modoSenior ? "36px" : "28px" }}>
            ¡Hola, {firstName}!
          </h1>
          <p style={{ fontSize: modoSenior ? "17px" : "14px" }}>
            Continuemos con tu solicitud de visa {tipoVisa()}.
          </p>
        </header>

        {loading ? (
          <DashSkeleton />
        ) : (
          <>
            {/* PROGRESS CARD */}
            <section className="dash-progress-card">
              <div className="dash-progress-body">
                <div className="dash-progress-head">
                  <h2 style={{ fontSize: modoSenior ? "21px" : "18px" }}>Progreso general</h2>
                </div>
                <p className="dash-progress-sub" style={{ fontSize: modoSenior ? "15px" : "13px" }}>
                  Sigue estas etapas para completar tu proceso.
                </p>
                <div className="dash-timeline">{timelineEls}</div>
              </div>

              {/* Etapa actual ring */}
              <div className="dash-etapa-box">
                <span className="dash-etapa-label">ETAPA ACTUAL</span>
                <div className="dash-etapa-num-row">
                  <span className="dash-etapa-num" style={{ fontSize: modoSenior ? "50px" : "42px" }}>
                    {etapaActual}
                  </span>
                  <span className="dash-etapa-de">de 6</span>
                </div>
                <div className="dash-ring-wrap">
                  <svg width="58" height="58" viewBox="0 0 60 60" aria-hidden="true">
                    <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5"/>
                    <circle cx="30" cy="30" r={r} fill="none" stroke="var(--vg-red)" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct/100)*circ} ${circ}`}
                      transform="rotate(-90 30 30)"/>
                  </svg>
                  <span className="dash-ring-pct">{pct}%</span>
                </div>
              </div>
            </section>

            {/* NEXT ACTION */}
            <section className="dash-action-section">
              <div className="dash-action-label">
                <span className="dash-action-dot" />
                <span style={{ fontSize: modoSenior ? "13px" : "11px" }}>SIGUIENTE ACCIÓN REQUERIDA</span>
              </div>
              <div className="dash-action-card">
                <div className="dash-action-left">
                  <div className="dash-action-badges">
                    <span className="dash-priority-badge">PRIORIDAD ALTA</span>
                    <span className="dash-time-est" style={{ fontSize: modoSenior ? "14px" : "12px" }}>
                      Tiempo est.: 45 min
                    </span>
                  </div>
                  <h3 style={{ fontSize: modoSenior ? "26px" : "21px" }}>
                    Completar formulario DS-160
                  </h3>
                  <p style={{ fontSize: modoSenior ? "15px" : "13px" }}>
                    El formulario oficial del gobierno requiere tu información personal, laboral y de viaje.
                    Recomendamos hacerlo en una sola sesión.
                  </p>
                </div>
                <button className="dash-action-btn" onClick={() => (window.location.href = "/ds160")}>
                  Iniciar sección &rarr;
                </button>
              </div>
            </section>

            {/* QUICK CARDS */}
            <section className="dash-quick-grid">
              <article className="dash-card dash-card--yellow" onClick={() => (window.location.href = "/documents")} onKeyDown={(event) => activarTarjeta(event, "/documents")} role="button" tabIndex={0}>
                <span className="dash-important-badge">IMPORTANTE</span>
                <div className="dash-card-icon" aria-hidden="true" />
                <h4 style={{ fontSize: modoSenior ? "19px" : "16px" }}>Revisión de documentos</h4>
                <p style={{ fontSize: modoSenior ? "14px" : "13px" }}>
                  Tienes <strong style={{ color: "var(--vg-warning)" }}>1 documento</strong> que requiere corrección.
                </p>
                <span className="dash-card-cta" style={{ color: "var(--vg-warning)", fontSize: modoSenior ? "14px" : "13px" }}>
                  Corregir ahora &rarr;
                </span>
              </article>

              <article className="dash-card dash-card--white" onClick={() => (window.location.href = "/cronologia")} onKeyDown={(event) => activarTarjeta(event, "/cronologia")} role="button" tabIndex={0}>
                <div className="dash-card-icon" aria-hidden="true" />
                <h4 style={{ fontSize: modoSenior ? "19px" : "16px" }}>Ver cronología completa</h4>
                <p style={{ fontSize: modoSenior ? "14px" : "13px", color: "var(--vg-text-muted)" }}>
                  Revisa todos los pasos de tu proceso y qué esperar en cada uno.
                </p>
                <span className="dash-card-cta" style={{ color: "var(--vg-text-muted)", fontSize: modoSenior ? "14px" : "13px" }}>
                  Explorar &rarr;
                </span>
              </article>

              <article className="dash-card dash-card--dark" onClick={() => (window.location.href = "/entrevista")} onKeyDown={(event) => activarTarjeta(event, "/entrevista")} role="button" tabIndex={0}>
                <div className="dash-card-icon-light" aria-hidden="true" />
                <h4 style={{ fontSize: modoSenior ? "19px" : "16px", color: "white" }}>Simulador de entrevista</h4>
                <p style={{ fontSize: modoSenior ? "14px" : "13px", color: "var(--vg-text-light)", flex: 1 }}>
                  Practica con preguntas reales para ganar confianza antes de tu cita consular.
                </p>
                <span className="dash-card-cta" style={{ color: "var(--vg-success)", fontSize: modoSenior ? "14px" : "13px" }}>
                  Practicar &rarr;
                </span>
              </article>
            </section>
          </>
        )}
        <InformationSection modoSenior={modoSenior} />
      </main>
    </div>
  );
}

function DashSkeleton() {
  return (
    <>
      {/* Progress card skeleton */}
      <div className="dash-progress-card" style={{ marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div className="sk-line sk-line--sm" style={{ marginBottom: 12 }} />
          <div className="sk-line sk-line--md" style={{ marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <div className="sk-shimmer" style={{ width: 34, height: 34, borderRadius: "50%" }} />
                <div className="sk-line" style={{ width: "80%", height: 10 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="sk-shimmer" style={{ width: 148, height: 120, borderRadius: 16, flexShrink: 0 }} />
      </div>

      {/* Action card skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div className="sk-line sk-line--xs" style={{ marginBottom: 12, width: 180, height: 10 }} />
        <SkeletonCard variant="card" />
      </div>

      {/* Quick cards skeleton */}
      <div className="dash-quick-grid">
        <SkeletonList variant="card" count={3} />
      </div>
    </>
  );
}
