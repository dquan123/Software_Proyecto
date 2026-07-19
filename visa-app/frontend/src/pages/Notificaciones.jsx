import { useEffect, useState, useCallback } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

const TIPO_CONFIG = {
  etapa:       { label: "Etapa",       bg: "#ede9fe", color: "#7c3aed" },
  documento:   { label: "Documento",   bg: "#ffedd5", color: "#ea580c" },
  entrevista:  { label: "Entrevista",  bg: "#dcfce7", color: "#16a34a" },
  alerta:      { label: "Alerta",      bg: "#fee2e2", color: "#dc2626" },
  info:        { label: "Info",        bg: "#dbeafe", color: "#2563eb" },
};

function formatFecha(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notificaciones() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const fs = (base) => (modoSenior ? base + 3 : base);

  const cargarNotificaciones = useCallback(async () => {
    if (!session?.id) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`/notificaciones/${session.id}`));
      if (!res.ok) throw new Error("No se pudieron cargar las notificaciones");
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isValidating && session) cargarNotificaciones();
  }, [isValidating, session, cargarNotificaciones]);

  const marcarLeida = async (id) => {
    try {
      const res = await fetch(buildApiUrl(`/notificaciones/${id}/leer`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id }),
      });
      if (!res.ok) throw new Error("Error al marcar notificación");
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
      );
      window.dispatchEvent(new CustomEvent("notificacionesLeidas"));
    } catch (e) {
      console.error(e);
    }
  };

  const marcarTodasLeidas = async () => {
    setMarcandoTodas(true);
    try {
      const res = await fetch(buildApiUrl(`/notificaciones/${session.id}/leer-todas`), {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Error al marcar todas");
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      window.dispatchEvent(new CustomEvent("notificacionesLeidas"));
    } catch (e) {
      console.error(e);
    } finally {
      setMarcandoTodas(false);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  if (isValidating) {
    return (
      <div style={s.layout}>
        <Sidebar currentPage="notificaciones" />
        <main id="main-content" tabIndex="-1" style={s.main}>
          <p style={{ color: "#64748b", paddingTop: "40px", fontSize: fs(14) }}>
            Verificando sesión...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={s.layout}>
      <Sidebar currentPage="notificaciones" />
      <main id="main-content" tabIndex="-1" style={s.main}>
        {/* Encabezado */}
        <div style={s.header}>
          <div>
            <h1 style={{ ...s.titulo, fontSize: fs(22) }}>Notificaciones</h1>
            {noLeidas > 0 && (
              <p style={{ ...s.subtitulo, fontSize: fs(13) }}>
                Tienes{" "}
                <span style={s.badge}>{noLeidas}</span>{" "}
                notificación{noLeidas !== 1 ? "es" : ""} sin leer
              </p>
            )}
          </div>
          {noLeidas > 0 && (
            <button
              style={{
                ...s.btnTodas,
                opacity: marcandoTodas ? 0.6 : 1,
                fontSize: fs(13),
              }}
              onClick={marcarTodasLeidas}
              disabled={marcandoTodas}
            >
              {marcandoTodas ? "Marcando..." : "Marcar todas como leídas"}
            </button>
          )}
        </div>

        {/* Estados */}
        {cargando && (
          <div style={s.centrado}>
            <p style={{ color: "#64748b", fontSize: fs(14) }}>Cargando notificaciones...</p>
          </div>
        )}

        {!cargando && error && (
          <div style={s.errorBox}>
            <p style={{ color: "#dc2626", fontSize: fs(14), margin: 0 }}>{error}</p>
            <button style={s.btnReintentar} onClick={cargarNotificaciones}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && notificaciones.length === 0 && (
          <div style={s.vacio}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p style={{ color: "#94a3b8", fontSize: fs(15), marginTop: "16px" }}>
              No tienes notificaciones
            </p>
          </div>
        )}

        {/* Lista */}
        {!cargando && !error && notificaciones.length > 0 && (
          <div style={s.lista}>
            {notificaciones.map((n) => {
              const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
              return (
                <div
                  key={n.id}
                  style={{
                    ...s.card,
                    backgroundColor: n.leido ? "#ffffff" : "#f0f9ff",
                    borderLeft: n.leido ? "4px solid #e2e8f0" : "4px solid #dc2649",
                  }}
                >
                  {!n.leido && <span style={s.puntoPendiente} />}

                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <span style={{ ...s.tipoBadge, background: cfg.bg, color: cfg.color, fontSize: fs(11) }}>
                        {cfg.label}
                      </span>
                      <span style={{ ...s.fecha, fontSize: fs(12) }}>
                        {formatFecha(n.created_at)}
                      </span>
                    </div>

                    <p style={{ ...s.cardTitulo, fontSize: fs(15) }}>{n.titulo}</p>
                    <p style={{ ...s.cardMensaje, fontSize: fs(13) }}>{n.mensaje}</p>

                    {n.etapa_relacionada && (
                      <p style={{ ...s.etapaTag, fontSize: fs(12) }}>
                        Etapa: {n.etapa_relacionada}
                      </p>
                    )}
                  </div>

                  {!n.leido && (
                    <button
                      style={{ ...s.btnLeer, fontSize: fs(12) }}
                      onClick={() => marcarLeida(n.id)}
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Segoe UI', sans-serif",
  },
  main: {
    marginLeft: "250px",
    flex: 1,
    padding: "32px",
    maxWidth: "860px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "12px",
  },
  titulo: {
    color: "#0f172a",
    fontWeight: "700",
    margin: 0,
  },
  subtitulo: {
    color: "#64748b",
    margin: "6px 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  badge: {
    backgroundColor: "#dc2649",
    color: "white",
    borderRadius: "999px",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnTodas: {
    backgroundColor: "transparent",
    border: "1px solid #dc2649",
    color: "#dc2649",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "500",
    fontFamily: "'Segoe UI', sans-serif",
  },
  centrado: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "60px",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  btnReintentar: {
    backgroundColor: "#dc2649",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  vacio: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "80px",
    color: "#94a3b8",
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    position: "relative",
    transition: "box-shadow 0.15s ease",
  },
  puntoPendiente: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#dc2649",
    flexShrink: 0,
    marginTop: "6px",
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  tipoBadge: {
    borderRadius: "6px",
    padding: "2px 8px",
    fontWeight: "600",
  },
  fecha: {
    color: "#94a3b8",
  },
  cardTitulo: {
    color: "#0f172a",
    fontWeight: "600",
    margin: "0 0 4px 0",
  },
  cardMensaje: {
    color: "#475569",
    margin: 0,
    lineHeight: "1.5",
  },
  etapaTag: {
    marginTop: "8px",
    color: "#7c3aed",
    fontWeight: "500",
  },
  btnLeer: {
    flexShrink: 0,
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    padding: "6px 12px",
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
    whiteSpace: "nowrap",
  },
};
