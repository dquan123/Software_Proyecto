import { BriefcaseBusiness, ClipboardCheck, UserRoundPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminResourceState } from "../../components/admin/AdminShared";
import useAdminResource from "../../hooks/useAdminResource";

const stats = [
  ["Solicitudes activas", "solicitudesActivas", "/admin/processes", "blue", <Users aria-hidden="true" />],
  ["Sin asignar", "sinAsignar", "/admin/assignments", "red", <UserRoundPlus aria-hidden="true" />],
  ["Asesores activos", "asesoresActivos", "/admin/advisors", "green", <BriefcaseBusiness aria-hidden="true" />],
  ["DS-160 pendientes", "ds160Pendientes", "/admin/ds160", "amber", <ClipboardCheck aria-hidden="true" />],
];
export default function AdminDashboard() {
  const resource = useAdminResource("/admin/dashboard");
  const candidate = resource.data;
  const data = candidate?.resumen && Array.isArray(candidate.cargaAsesores) && Array.isArray(candidate.actividad) && Array.isArray(candidate.atencion)
    ? candidate
    : null;
  return <AdminLayout><section className="admin-hero"><h2>Panel de Administración Global</h2><p>Supervisa el rendimiento, la carga de trabajo y el estado general de la plataforma.</p></section><AdminResourceState {...resource} />{data && <><section className="admin-stats-grid" aria-label="Indicadores administrativos">{stats.map(([label, key, path, tone, icon]) => <article className={`admin-stat-card admin-stat-card--${tone}`} key={key}><span className="admin-stat-card__icon">{icon}</span><div><strong>{data.resumen[key]}</strong><h3>{label}</h3><Link to={path}>Ver detalles →</Link></div></article>)}</section><div className="admin-dashboard-grid"><section className="admin-panel-card"><div className="admin-panel-card__header"><h2>Carga de trabajo por asesor (Top 4)</h2><Link to="/admin/reports">Ver reporte completo</Link></div>{data.cargaAsesores.length ? <div className="admin-workload-bars">{data.cargaAsesores.map((item) => <article key={item.id}><strong>{item.nombre}</strong><span><i style={{ width: `${Math.min(100, item.asignados * 2)}%` }} /></span><b>{item.asignados} / {item.pendientes}</b></article>)}</div> : <div className="admin-empty-state"><strong>Sin cargas registradas</strong><p>Las asignaciones aparecerán aquí.</p></div>}</section><section className="admin-panel-card"><div className="admin-panel-card__header"><h2>Actividad de la plataforma</h2></div>{data.actividad.length ? <ol className="admin-activity-list">{data.actividad.map((item) => <li key={item.id}><strong>{item.accion}</strong><span>{item.detalle}</span><small>{new Date(item.created_at).toLocaleString("es-GT")}</small></li>)}</ol> : <div className="admin-empty-state"><strong>Sin actividad registrada</strong><p>Las acciones administrativas aparecerán aquí.</p></div>}</section></div><section className="admin-panel-card"><div className="admin-panel-card__header"><h2>Casos que requieren atención</h2><Link to="/admin/processes">Ver todos</Link></div>{data.atencion.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Solicitante</th><th>Tipo / etapa</th><th>Motivo</th><th>Acción</th></tr></thead><tbody>{data.atencion.map((item) => <tr key={item.id}><td><strong>{item.nombre}</strong><small>{item.correo}</small></td><td>{item.perfil || "Sin perfil"}<small>{item.etapa_actual}</small></td><td><span className="admin-status admin-status--correction">{item.asesor ? item.estado : "Sin asignar"}</span></td><td><Link className="admin-secondary-button" to="/admin/processes">Resolver</Link></td></tr>)}</tbody></table></div> : <div className="admin-empty-state admin-empty-state--compact"><strong>No hay casos que requieran atención</strong></div>}</section></>}</AdminLayout>;
}
