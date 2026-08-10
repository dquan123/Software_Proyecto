import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminPagination, AdminResourceState, AdminSearch, AdminTabs } from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

const PAGE_SIZE = 8;
const tabs = [{ value: "todos", label: "Todos" }, { value: "cliente", label: "Solicitante" }, { value: "asesor", label: "Asesor" }, { value: "admin", label: "Administrador" }];

export default function AdminUsers() {
  const resource = useAdminResource("/admin/users");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "", rol: "cliente" });
  const [notice, setNotice] = useState("");
  const users = useMemo(() => resource.data?.usuarios || [], [resource.data]);
  const filtered = useMemo(() => users.filter((user) => (tab === "todos" || user.rol === tab) && `${user.nombre} ${user.correo}`.toLowerCase().includes(query.toLowerCase())), [query, tab, users]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await adminRequest("/admin/users", { method: "POST", body: JSON.stringify(form) });
      setModal(false); setForm({ nombre: "", correo: "", contrasena: "", rol: "cliente" }); setNotice("Usuario creado correctamente."); resource.retry();
    } catch (error) { setNotice(error.message); }
  };
  const toggleUser = async (user) => {
    setNotice("");
    try {
      await adminRequest(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ activo: !user.activo }) });
      setNotice("Estado del usuario actualizado.");
      resource.retry();
    } catch (error) {
      setNotice(error.message);
    }
  };

  return <AdminLayout>
    <AdminPageHeader title="Usuarios" description="Gestión global de solicitantes, asesores y administradores." action={<button className="admin-primary-button" type="button" onClick={() => setModal(true)}><Plus aria-hidden="true" />Crear usuario</button>} />
    {notice && <p className="admin-feedback" role="status">{notice}</p>}
    <AdminTabs value={tab} onChange={(value) => { setTab(value); setPage(1); }} items={tabs} label="Filtrar usuarios por rol" />
    <section className="admin-list-card">
      <div className="admin-list-toolbar"><AdminSearch value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar por nombre o correo..." /></div>
      <AdminResourceState {...resource} isEmpty={!users.length} empty="No hay usuarios registrados." />
      {!resource.isLoading && !resource.error && users.length > 0 && <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Usuario</th><th>Rol / tipo</th><th>Estado</th><th>Actividad / asesor</th><th>Acción</th></tr></thead><tbody>{visible.length ? visible.map((user) => <tr key={user.id}><td><span className="admin-user-cell"><b>{user.nombre.slice(0,2).toUpperCase()}</b><span><strong>{user.nombre}</strong><small>{user.correo}</small></span></span></td><td><strong>{user.rol === "cliente" ? "Solicitante" : user.rol === "asesor" ? "Asesor" : "Administrador"}</strong><small>{user.perfil || "N/A"}</small></td><td><span className={`admin-status admin-status--${user.activo ? "approved" : "correction"}`}>{user.activo ? "Activo" : "Inactivo"}</span></td><td><small>{user.rol === "asesor" ? `${user.asignados} casos asignados` : user.actividad ? new Date(user.actividad).toLocaleDateString("es-GT") : "Sin actividad"}</small>{user.rol === "cliente" && <strong>{user.asesor || "Sin asignar"}</strong>}</td><td><button className="admin-secondary-button" type="button" onClick={() => toggleUser(user)}>{user.activo ? "Desactivar" : "Activar"}</button></td></tr>) : <tr><td colSpan="5" className="admin-table-state">No hay usuarios que coincidan con los filtros.</td></tr>}</tbody></table></div><AdminPagination page={page} pages={pages} onChange={setPage} total={filtered.length} visible={visible.length} /></>}
    </section>
    {modal && <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-user-title"><header className="admin-modal__header"><h2 id="new-user-title">Crear usuario</h2><button className="admin-modal__close" type="button" onClick={() => setModal(false)} aria-label="Cerrar"><X aria-hidden="true" /></button></header><form className="admin-form" onSubmit={createUser}><label>Nombre<input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label><label>Correo<input required type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></label><label>Contraseña<input required type="password" autoComplete="new-password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} /></label><label>Rol<select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}><option value="cliente">Solicitante</option><option value="asesor">Asesor</option><option value="admin">Administrador</option></select></label><footer><button className="admin-primary-button" type="submit">Crear usuario</button></footer></form></section></div>}
  </AdminLayout>;
}
