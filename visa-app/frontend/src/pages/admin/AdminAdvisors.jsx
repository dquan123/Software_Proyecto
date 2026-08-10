import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminResourceState, AdminSearch } from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

export default function AdminAdvisors() {
  const resource = useAdminResource("/admin/advisors");
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("all");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "" });
  const [notice, setNotice] = useState("");
  const advisors = useMemo(() => resource.data?.asesores || [], [resource.data]);
  const filtered = useMemo(() => advisors.filter((item) => {
    const available = item.disponible && item.activo;
    return (availability === "all" || (availability === "available" ? available : !available)) && `${item.nombre} ${item.correo}`.toLowerCase().includes(query.toLowerCase());
  }), [advisors, availability, query]);
  const average = advisors.length ? Math.round(advisors.reduce((sum, item) => sum + item.asignados, 0) / advisors.length) : 0;
  const createAdvisor = async (event) => {
    event.preventDefault();
    setNotice("");
    try {
      await adminRequest("/admin/advisors", { method: "POST", body: JSON.stringify(form) });
      setForm({ nombre: "", correo: "", contrasena: "" });
      setModal(false);
      setNotice("Asesor creado correctamente.");
      resource.retry();
    } catch (error) {
      setNotice(error.message);
    }
  };
  const toggleAvailability = async (advisor) => {
    setNotice("");
    try {
      await adminRequest(`/admin/users/${advisor.id}`, { method: "PATCH", body: JSON.stringify({ disponible: !advisor.disponible }) });
      setNotice("Disponibilidad actualizada.");
      resource.retry();
    } catch (error) {
      setNotice(error.message);
    }
  };
  return <AdminLayout>
    <AdminPageHeader title="Asesores" description="Gestiona el equipo de asesores, su carga de trabajo y disponibilidad." action={<button className="admin-primary-button" type="button" onClick={() => setModal(true)}><Plus aria-hidden="true" />Nuevo asesor</button>} />
    {notice && <p className="admin-feedback" role="status">{notice}</p>}
    <section className="admin-summary-grid"><article><small>Total asesores</small><strong>{advisors.length}</strong></article><article><small>Casos promedio</small><strong>{average}</strong></article><article className="admin-summary-wide"><small>Carga general del equipo</small><strong>{advisors.length ? `${Math.round(advisors.reduce((sum, item) => sum + item.asignados / item.capacidad, 0) / advisors.length * 100)}%` : "0%"}</strong></article></section>
    <section className="admin-list-card"><div className="admin-list-toolbar"><AdminSearch value={query} onChange={setQuery} placeholder="Buscar asesor..." /><label className="admin-filter-select"><span>Disponibilidad</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Todos</option><option value="available">Disponibles</option><option value="unavailable">No disponibles</option></select></label></div><AdminResourceState {...resource} isEmpty={!advisors.length} empty="No hay asesores registrados." />
      {!resource.isLoading && !resource.error && (filtered.length ? <div className="admin-advisor-grid">{filtered.map((advisor) => <article className="admin-advisor-card" key={advisor.id}><header><b>{advisor.nombre.slice(0,2).toUpperCase()}</b><div><h3>{advisor.nombre}</h3><span>{advisor.correo}</span></div></header><dl><div><dt>Casos asignados</dt><dd>{advisor.asignados}</dd></div><div><dt>Acciones pendientes</dt><dd>{advisor.pendientes}</dd></div></dl><footer><span className={`admin-status admin-status--${advisor.disponible && advisor.activo ? "approved" : "correction"}`}>{advisor.disponible && advisor.activo ? "Disponible" : "No disponible"}</span><button type="button" onClick={() => toggleAvailability(advisor)}>Cambiar estado</button></footer></article>)}</div> : advisors.length > 0 && <div className="admin-resource-state">No hay asesores que coincidan con los filtros.</div>)}
    </section>
    {modal && <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-advisor-title"><header className="admin-modal__header"><h2 id="new-advisor-title">Nuevo asesor</h2><button className="admin-modal__close" type="button" onClick={() => setModal(false)} aria-label="Cerrar"><X aria-hidden="true" /></button></header><form className="admin-form" onSubmit={createAdvisor}><label>Nombre<input required autoComplete="name" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label><label>Correo<input required type="email" autoComplete="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} /></label><label>Contraseña<input required type="password" autoComplete="new-password" value={form.contrasena} onChange={(event) => setForm({ ...form, contrasena: event.target.value })} /></label><footer><button className="admin-primary-button" type="submit">Crear asesor</button></footer></form></section></div>}
  </AdminLayout>;
}
