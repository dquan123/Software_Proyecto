import {
  BarChart3,
  ClipboardList,
  FileClock,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { buildApiUrl } from "../../config/api";

const statDefinitions = [
  {
    label: "Usuarios registrados",
    key: "usuarios_total",
    icon: <Users size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Documentos pendientes",
    key: "documentos_pendientes",
    icon: <FileClock size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Tramites activos",
    key: "tramites_activos",
    icon: <ClipboardList size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Entrevistas pendientes",
    key: "entrevistas_pendientes",
    icon: <BarChart3 size={22} strokeWidth={2} aria-hidden="true" />,
  },
];

const activity = [
  "Admin Norman reviso documentos de un solicitante.",
  "Se registro una nueva cuenta cliente.",
  "Un tramite cambio a etapa de entrevista.",
  "Reporte semanal pendiente de configuracion.",
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
          <p className="admin-section-kicker">Panel de control</p>
          <h2>Vista general administrativa</h2>
          <p>
            Base inicial para centralizar usuarios, documentos, tramites y reportes
            durante el Sprint 6.
          </p>
        </div>
      </section>

      <section className="admin-stats-grid" aria-label="Indicadores administrativos">
        {error && <p role="alert">{error}</p>}
        {!metrics && !error && <p role="status">Cargando indicadores…</p>}
        {metrics && statDefinitions.map(({ label, key, icon }) => (
          <article className="admin-stat-card" key={label}>
            <span className="admin-stat-card__icon">
              {icon}
            </span>
            <div>
              <strong>{metrics[key]}</strong>
              <h3>{label}</h3>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-panel-card">
        <div className="admin-panel-card__header">
          <div>
            <p className="admin-section-kicker">Seguimiento</p>
            <h2>Actividad reciente</h2>
          </div>
        </div>
        <ul className="admin-activity-list">
          {activity.map((item, index) => (
            <li key={item}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </section>
    </AdminLayout>
  );
}
