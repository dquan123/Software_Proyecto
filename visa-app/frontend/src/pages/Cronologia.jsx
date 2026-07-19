import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";
import { SkeletonList } from "../components/SkeletonCard";
import "../styles/cronologia.css";

const ETAPAS = [
  {
    numero: 1,
    titulo: "Creación de perfil",
    descripcion: "Información básica y registro inicial de la solicitud en la plataforma.",
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
    descripcion: "Abonar la tarifa consular de $185 USD. Este pago no es reembolsable.",
    estado: "pendiente",
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

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function Nodo({ numero, estado }) {
  if (estado === "completada") {
    return (
      <div className="cron-nodo cron-nodo--done">
        <CheckIcon />
      </div>
    );
  }
  if (estado === "actual") {
    return (
      <div className="cron-nodo cron-nodo--actual">
        <span className="cron-nodo__num">{numero}</span>
      </div>
    );
  }
  return (
    <div className="cron-nodo cron-nodo--pendiente">
      <span className="cron-nodo__num cron-nodo__num--muted">{numero}</span>
    </div>
  );
}

function TarjetaCompletada({ etapa, senior }) {
  return (
    <article className="cron-card cron-card--done">
      <div className="cron-card__head">
        <h3 className={`cron-card__title${senior ? " cron-card__title--senior" : ""}`}>
          {etapa.titulo}
        </h3>
        <span className={`cron-card__fecha${senior ? " cron-card__fecha--senior" : ""}`}>
          {etapa.fecha}
        </span>
      </div>
      <p className={`cron-card__desc${senior ? " cron-card__desc--senior" : ""}`}>
        {etapa.descripcion}
      </p>
    </article>
  );
}

function TarjetaActual({ etapa, senior }) {
  return (
    <article className="cron-card cron-card--actual">
      <span className="cron-badge-actual">▶ ACTUAL</span>
      <div className="cron-card__head cron-card__head--actual">
        <h3 className={`cron-card__title cron-card__title--actual${senior ? " cron-card__title--senior" : ""}`}>
          {etapa.titulo}
        </h3>
        <span className="cron-badge-progreso">En progreso</span>
      </div>
      <p className={`cron-card__desc${senior ? " cron-card__desc--senior" : ""}`}>
        {etapa.descripcion}
      </p>
      {etapa.accion && (
        <button
          className={`cron-btn-accion${senior ? " cron-btn-accion--senior" : ""}`}
          onClick={() => (window.location.href = etapa.accion.path)}
        >
          {etapa.accion.label}
          <ExternalIcon />
        </button>
      )}
    </article>
  );
}

function TarjetaPendiente({ etapa, senior }) {
  return (
    <div className="cron-pendiente">
      <h3 className={`cron-pendiente__title${senior ? " cron-pendiente__title--senior" : ""}`}>
        {etapa.titulo}
      </h3>
      <p className={`cron-pendiente__desc${senior ? " cron-pendiente__desc--senior" : ""}`}>
        {etapa.descripcion}
      </p>
    </div>
  );
}

function EtapaItem({ etapa, esUltima, senior }) {
  const lineColor = etapa.estado === "completada" ? "#e11d48" : "#e2e8f0";

  let contenido;
  if (etapa.estado === "completada") {
    contenido = <TarjetaCompletada etapa={etapa} senior={senior} />;
  } else if (etapa.estado === "actual") {
    contenido = <TarjetaActual etapa={etapa} senior={senior} />;
  } else {
    contenido = <TarjetaPendiente etapa={etapa} senior={senior} />;
  }

  return (
    <li className="cron-item">
      <div className="cron-timeline-col">
        <Nodo numero={etapa.numero} estado={etapa.estado} />
        {!esUltima && (
          <div className="cron-linea" style={{ backgroundColor: lineColor }} />
        )}
      </div>
      <div className="cron-content-col">{contenido}</div>
    </li>
  );
}

export default function Cronologia() {
  const { isValidating } = useRequireAuth();
  const senior = useModoSenior();

  return (
    <div className="vg-layout">
      <Sidebar currentPage="cronologia" />

      <main id="main-content" tabIndex="-1" className="vg-main cron-main">
        <header className="cron-header">
          <h1 className={`cron-titulo${senior ? " cron-titulo--senior" : ""}`}>
            Cronología de solicitud
          </h1>
          <p className={`cron-subtitulo${senior ? " cron-subtitulo--senior" : ""}`}>
            Sigue el avance detallado de tu proceso. Cada etapa requiere completarse
            para habilitar la siguiente.
          </p>
        </header>

        <hr className="cron-divisor" />

        {isValidating ? (
          <SkeletonList variant="timeline" count={1} />
        ) : (
          <ol className="cron-timeline" aria-label="Etapas del proceso">
            {ETAPAS.map((etapa, idx) => (
              <EtapaItem
                key={etapa.numero}
                etapa={etapa}
                esUltima={idx === ETAPAS.length - 1}
                senior={senior}
              />
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
