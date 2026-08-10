import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminResourceState } from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

export default function AdminProfile() {
  const resource = useAdminResource("/admin/profile"); const [draft, setDraft] = useState(null); const [notice, setNotice] = useState("");
  const form = draft || resource.data?.usuario || null;
  const save = async (event) => { event.preventDefault(); try { const data = await adminRequest("/admin/profile", { method: "PUT", body: JSON.stringify(form) }); setDraft(data.usuario); setNotice("Perfil actualizado correctamente."); } catch (error) { setNotice(error.message); } };
  return <AdminLayout><AdminPageHeader title="Mi Perfil" description="Tus datos como administrador global." /><AdminResourceState {...resource} isEmpty={!resource.data?.usuario && !resource.isLoading} empty="No se encontró el perfil administrativo." />{form && <section className="admin-profile-card"><div className="admin-profile-identity"><b>{form.nombre.slice(0,2).toUpperCase()}</b><h3>{form.nombre}</h3><p>{form.correo}</p></div><form className="admin-form admin-profile-form" onSubmit={save}><label>Nombre<input value={form.nombre} onChange={(e) => setDraft({ ...form, nombre: e.target.value })} /></label><label>Teléfono<input value={form.telefono} onChange={(e) => setDraft({ ...form, telefono: e.target.value })} /></label><label>Ciudad<input value={form.ciudad} onChange={(e) => setDraft({ ...form, ciudad: e.target.value })} /></label><label>País<input value={form.pais} onChange={(e) => setDraft({ ...form, pais: e.target.value })} /></label>{notice && <p role="status">{notice}</p>}<button className="admin-primary-button" type="submit">Guardar cambios</button></form></section>}</AdminLayout>;
}
