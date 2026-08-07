import AdminLayout from "../../components/admin/AdminLayout";

const tableHeaders = [
  "Usuario",
  "Tipo de documento",
  "Estado",
  "Fecha de carga",
  "Acciones",
];

export default function AdminDocuments() {
  const isLoading = false;
  const documents = [];

  return (
    <AdminLayout>
      <section className="admin-panel-card admin-documents">
        <div className="admin-panel-card__header">
          <div>
            <p className="admin-section-kicker">Administracion</p>
            <h2>Gestión de Documentos</h2>
            <p>
              Visualiza y revisa los documentos enviados por los solicitantes desde un
              solo lugar.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} scope="col">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={tableHeaders.length}>
                    <p className="admin-table-state" role="status">
                      Cargando documentos...
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading && documents.length === 0 && (
                <tr>
                  <td colSpan={tableHeaders.length}>
                    <p className="admin-table-state">
                      Todavía no hay documentos enviados por los usuarios.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
