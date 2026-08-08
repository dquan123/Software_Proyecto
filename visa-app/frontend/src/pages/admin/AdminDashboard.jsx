import {
  BriefcaseBusiness,
  ClipboardCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { buildApiUrl } from "../../config/api";

const statDefinitions = [
  {
    label: "Solicitudes activas",
    key: "tramites_activos",
    path: "/admin/processes",
    tone: "blue",
    icon: <Users size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Sin asignar",
    key: "sin_asignar",
    path: "/admin/processes",
    tone: "red",
    icon: <UserRoundPlus size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Asesores activos",
    key: "asesores",
    path: "/admin/users",
    tone: "green",
    icon: <BriefcaseBusiness size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "DS-160 pendientes",
    key: "ds160_pendientes",
    path: "/admin/reports",
    tone: "amber",
    icon: <ClipboardCheck size={22} strokeWidth={2} aria-hidden="true" />,
  },
];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
    fetch(buildApiUrl("/admin/metrics/overview"), {
      signal: controller.signal,
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("No fue posible cargar los indicadores");
        return response.json();
      })
      .then(setMetrics)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h2>Panel de Administración Global</h2>
          <p>Supervisa el rendimiento, la carga de trabajo y el estado general de la plataforma.</p>
        </div>
      </section>

      <section className="admin-stats-grid" aria-label="Indicadores administrativos">
        {error && <p role="alert">{error}</p>}
        {!metrics && !error && <p role="status">Cargando indicadores…</p>}
        {metrics && statDefinitions.map(({ label, key, icon, path, tone }) => (
          <article className={`admin-stat-card admin-stat-card--${tone}`} key={label}>
            <span className="admin-stat-card__icon">
              {icon}
            </span>
            <div>
              <strong>{key === "sin_asignar" ? "—" : metrics[key]}</strong>
              <h3>{label}</h3>
              <Link to={path}>Ver detalles <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel-card admin-workload-card">
          <div className="admin-panel-card__header">
            <h2>Carga de trabajo por asesor (Top 4)</h2>
            <Link to="/admin/reports">Ver reporte completo</Link>
          </div>
          <div className="admin-empty-state">
            <BriefcaseBusiness size={34} aria-hidden="true" />
            <strong>Aún no hay cargas de trabajo registradas</strong>
            <p>Este gráfico se habilitará cuando existan asignaciones entre asesores y solicitudes.</p>
          </div>
        </section>

        <section className="admin-panel-card admin-platform-activity">
          <div className="admin-panel-card__header"><h2>Actividad de la plataforma</h2></div>
          <div className="admin-empty-state">
            <ClipboardCheck size={34} aria-hidden="true" />
            <strong>Sin actividad registrada</strong>
            <p>La actividad aparecerá cuando exista un historial de eventos.</p>
          </div>
        </section>
      </div>

      <section className="admin-panel-card admin-attention-card">
        <div className="admin-panel-card__header">
          <h2>Casos que requieren atención</h2>
          <Link to="/admin/processes">Ver todos</Link>
        </div>
        <div className="admin-empty-state admin-empty-state--compact">
          <strong>No hay casos que requieran atención</strong>
          <p>Los casos pendientes o atrasados se mostrarán aquí.</p>
        </div>
      </section>
    </AdminLayout>
  );
}
