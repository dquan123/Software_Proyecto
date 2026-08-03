import {
  BarChart3,
  ClipboardList,
  FileClock,
  Users,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";

const stats = [
  {
    label: "Usuarios registrados",
    value: "128",
    note: "Posteriormente consumira informacion del backend.",
    icon: <Users size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Documentos pendientes",
    value: "34",
    note: "Posteriormente consumira informacion del backend.",
    icon: <FileClock size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Tramites activos",
    value: "57",
    note: "Posteriormente consumira informacion del backend.",
    icon: <ClipboardList size={22} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Reportes",
    value: "12",
    note: "Posteriormente consumira informacion del backend.",
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
        {stats.map(({ label, value, note, icon }) => (
          <article className="admin-stat-card" key={label}>
            <span className="admin-stat-card__icon">
              {icon}
            </span>
            <div>
              <strong>{value}</strong>
              <h3>{label}</h3>
              <p>{note}</p>
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
