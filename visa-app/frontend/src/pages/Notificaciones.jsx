import { useState } from "react";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import "../styles/notificaciones.css";

const NOTIFICACIONES_INICIALES = [
  {
    id: 1,
    tipo: "urgente",
    titulo: "Pasaporte próximo a expirar",
    descripcion:
      "Tu pasaporte vence en 4 meses. Las autoridades estadounidenses exigen al menos 6 meses de vigencia para tu viaje. Renueva tu pasaporte antes de programar la entrevista consular.",
    hora: "Hace 2 horas",
    badge: "REQUIERE ATENCIÓN",
    accion: { label: "Renovar documento", href: "/documents" },
    leida: false,
  },
  {
    id: 2,
    tipo: "advertencia",
    titulo: "Documento rechazado",
    descripcion:
      "Tu fotografía 5×5 cm no cumple con los requisitos del fondo blanco. Por favor, sube una nueva imagen.",
    hora: "Ayer, 14:30",
    badge: "ACCIÓN NECESARIA",
    accion: { label: "Corregir documento", href: "/documents" },
    leida: false,
  },
  {
    id: 3,
    tipo: "info",
    titulo: "Tarifa MRV pendiente",
    descripcion:
      "Recuerda que debes pagar la tarifa consular de $185 USD antes de agendar tu cita. El pago se realiza en los bancos autorizados.",
    hora: "Ayer, 09:15",
    badge: "RECORDATORIO",
    accion: { label: "Ver instrucciones", href: "/informacion" },
    leida: false,
  },
  {
    id: 4,
    tipo: "exito",
    titulo: "Fotografía aprobada",
    descripcion:
      "Tu fotografía 5×5 cm fue revisada y cumple con todos los requisitos consulares. ¡Excelente!",
    hora: "Hace 3 días",
    badge: "APROBADO",
    accion: null,
    leida: true,
  },
];

const TIPO_CONFIG = {
  urgente:    { iconBg: "#fce7f3", iconColor: "#e11d48", badgeBg: "#fee2e2",  badgeColor: "#b91c1c",  borderColor: "#fca5a5", cardBg: "#fff5f5" },
  advertencia:{ iconBg: "#fffbeb", iconColor: "#d97706", badgeBg: "#fef3c7",  badgeColor: "#92400e",  borderColor: "#fcd34d", cardBg: "#fffdf0" },
  info:       { iconBg: "#eff6ff", iconColor: "#2563eb", badgeBg: "#dbeafe",  badgeColor: "#1d4ed8",  borderColor: "#93c5fd", cardBg: "#f8faff" },
  exito:      { iconBg: "#ecfdf5", iconColor: "#059669", badgeBg: "#d1fae5",  badgeColor: "#047857",  borderColor: "#6ee7b7", cardBg: "#f0fdf9" },
};

function AlertIcon({ tipo }) {
  const color = TIPO_CONFIG[tipo]?.iconColor || "#64748b";
  if (tipo === "urgente") return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke={color} strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (tipo === "advertencia") return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke={color} strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
  if (tipo === "exito") return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke={color} strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9,12 11,14 15,10"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="32" height="32" stroke="white" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}

export default function Notificaciones() {
  const { isValidating } = useRequireAuth();
  const senior = useModoSenior();
  const [notifs, setNotifs] = useState(NOTIFICACIONES_INICIALES);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const marcarLeida = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const marcarTodasLeidas = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <div className="vg-layout">
      <Sidebar currentPage="notificaciones" />

      <main className={`vg-main notif-main${senior ? " notif-main--senior" : ""}`}>
        {/* Header */}
        <header className="notif-header">
          <div className="notif-header__icon">
            <BellIcon />
          </div>
          <div className="notif-header__info">
            <h1 className="notif-titulo">Notificaciones</h1>
            <p className="notif-subtitulo">
              Avisos importantes sobre tu proceso de visa B1/B2.
            </p>
          </div>
          {noLeidas > 0 && (
            <button className="notif-marcar-todas" onClick={marcarTodasLeidas}>
              Marcar todas como leídas
            </button>
          )}
        </header>

        <hr className="notif-divisor" />

        {isValidating ? (
          <div className="notif-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="notif-skeleton">
                <div className="sk-notification">
                  <div className="sk-notification__icon" />
                  <div style={{ flex: 1 }}>
                    <div className="sk-line sk-line--lg" style={{ marginBottom: 10 }} />
                    <div className="sk-line sk-line--md" style={{ marginBottom: 8 }} />
                    <div className="sk-line sk-line--sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="notif-empty">
            <BellIcon />
            <h2>Sin notificaciones</h2>
            <p>No tienes avisos pendientes por el momento.</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifs.map((n) => {
              const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
              return (
                <article
                  key={n.id}
                  className={`notif-card notif-card--${n.tipo}${n.leida ? " notif-card--leida" : ""}`}
                  style={{
                    "--notif-border": cfg.borderColor,
                    "--notif-bg":     cfg.cardBg,
                  }}
                >
                  {!n.leida && <div className="notif-unread-dot" />}

                  <div className="notif-card__body">
                    <div className="notif-card__left">
                      <div
                        className="notif-card__icon"
                        style={{ background: cfg.iconBg }}
                      >
                        <AlertIcon tipo={n.tipo} />
                      </div>
                    </div>

                    <div className="notif-card__content">
                      <div className="notif-card__meta">
                        <h2 className="notif-card__titulo">{n.titulo}</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            className="notif-card__badge"
                            style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                          >
                            ● {n.badge}
                          </span>
                          <span className="notif-card__hora">
                            <ClockIcon />
                            {n.hora}
                          </span>
                        </div>
                      </div>

                      <p className="notif-card__desc">{n.descripcion}</p>

                      {(n.accion || !n.leida) && (
                        <div className="notif-card__actions">
                          {n.accion && (
                            <a
                              href={n.accion.href}
                              className="notif-card__btn"
                              style={{ background: cfg.iconColor }}
                            >
                              {n.accion.label}
                            </a>
                          )}
                          {!n.leida && (
                            <button
                              className="notif-card__btn-secondary"
                              onClick={() => marcarLeida(n.id)}
                            >
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
