import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminResourceState, AdminSearch } from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

function getWaitingTime(value) {
  if (!value) return "Fecha no disponible";
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 1) return "Menos de una hora";
  if (hours < 24) return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "día" : "días"}`;
}

function getPriority(value) {
  if (!value) return { label: "Media", tone: "review" };
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000);
  if (hours >= 24) return { label: "Alta", tone: "correction" };
  if (hours >= 4) return { label: "Media", tone: "review" };
  return { label: "Baja", tone: "progress" };
}

export default function AdminAssignments() {
  const resource = useAdminResource("/admin/assignments");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const cases = resource.data?.casos || [];
  const advisors = useMemo(() => resource.data?.asesores || [], [resource.data]);
  const filteredAdvisors = useMemo(() => advisors.filter((item) => item.nombre.toLowerCase().includes(query.toLowerCase())), [advisors, query]);
  const assign = async (advisor) => {
    if (!selected) return;
    try { await adminRequest("/admin/assignments", { method: "POST", body: JSON.stringify({ tramiteId: selected.id, asesorId: advisor.id }) }); setNotice("Solicitud asignada correctamente."); setSelected(null); resource.retry(); }
    catch (error) { setNotice(error.message); }
  };
  return <AdminLayout><AdminPageHeader title="Asignaciones" description="Asigna solicitudes pendientes a los asesores disponibles." />{notice && <p className="admin-feedback" role="status">{notice}</p>}<AdminResourceState {...resource} isEmpty={!cases.length && !advisors.length} empty="No hay solicitudes ni asesores disponibles." />
    {!resource.isLoading && !resource.error && <div className="admin-assignment-grid"><section className="admin-list-card"><header className="admin-card-title"><h3>Casos sin asignar <span>{cases.length}</span></h3></header>{cases.length ? <div className="admin-case-list">{cases.map((item) => { const priority = getPriority(item.created_at); return <button type="button" className={selected?.id === item.id ? "is-selected" : ""} key={item.id} onClick={() => setSelected(item)}><span className={`admin-status admin-status--${priority.tone}`}>{priority.label}</span><strong>{item.nombre}</strong><span>{item.perfil || "Sin perfil"}</span><small>{item.etapa_actual}</small><small>Esperando desde: {getWaitingTime(item.created_at)}</small></button>; })}</div> : <p className="admin-inline-empty">No hay casos sin asignar.</p>}</section><section className="admin-list-card"><header className="admin-card-title"><h3>Asesores disponibles</h3><AdminSearch value={query} onChange={setQuery} placeholder="Buscar asesor..." /></header><div className="admin-case-list">{filteredAdvisors.map((advisor) => { const load = Math.round(advisor.asignados / advisor.capacidad * 100); const disabled = !selected || !advisor.disponible || load >= 100; return <article className="admin-assignee" key={advisor.id}><b>{advisor.nombre.slice(0,2).toUpperCase()}</b><div><strong>{advisor.nombre}</strong><span>{advisor.disponible ? "Disponible" : "No disponible"}</span><span>{advisor.asignados} / {advisor.capacidad} casos · {load}%</span><span className="admin-load-track"><i style={{ width: `${Math.min(100, load)}%` }} /></span></div><button type="button" disabled={disabled} onClick={() => assign(advisor)}>{selected ? "Asignar" : "Selecciona un caso"}</button></article>; })}</div></section></div>}
  </AdminLayout>;
}
