import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminPlaceholderPage({ title, description, owner }) {
  return (
    <AdminLayout>
      <section className="admin-placeholder">
        <p className="admin-section-kicker">Modulo administrativo</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="admin-placeholder__box">
          <strong>Trabajo preparado para Sprint 6</strong>
          <span>
            Este modulo sera implementado por el equipo encargado de {owner}.
          </span>
        </div>
      </section>
    </AdminLayout>
  );
}
