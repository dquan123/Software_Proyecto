import { useEffect, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { buildApiUrl } from "../../config/api";

const tableHeaders = [
  "Usuario",
  "Tipo de documento",
  "Estado",
  "Fecha de carga",
  "Archivo",
  "Acciones",
];

const statusLabels = {
  approved: "Aprobado",
  review: "En revisión",
  rejected: "Rechazado",
  correction: "Corrección",
  pending: "Pendiente",
};

function getAdminToken() {
  const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
  return session?.token || "";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDocumentType(document) {
  return document.documento_key || document.tipo || "Documento";
}

function getStatusLabel(status) {
  return statusLabels[status] || status || "Pendiente";
}

function openDocument(document) {
  if (!document.archivo_url) return;
  window.open(document.archivo_url, "_blank", "noopener,noreferrer");
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = getAdminToken();

    fetch(buildApiUrl("/admin/documents"), {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("No fue posible cargar los documentos.");
        return response.json();
      })
      .then((data) => {
        const nextDocuments = Array.isArray(data) ? data : data.documentos || [];
        setDocuments(nextDocuments);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "No fue posible cargar los documentos.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const updateDocumentStatus = async (documentId, status) => {
    const token = getAdminToken();
    setUpdatingId(documentId);
    setNotice(null);

    try {
      const response = await fetch(buildApiUrl(`/admin/documents/${documentId}/status`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ estado: status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "No fue posible actualizar el documento.");
      }

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === documentId ? data.documento : document
        )
      );
      setNotice({
        type: "success",
        text: status === "approved"
          ? "Documento aprobado correctamente."
          : "Documento rechazado correctamente.",
      });
    } catch (requestError) {
      setNotice({
        type: "error",
        text: requestError.message || "No fue posible actualizar el documento.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

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

        {notice && (
          <p
            className={`admin-feedback admin-feedback--${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

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
                    <p className={`admin-table-state${error ? " admin-table-state--error" : ""}`}>
                      {error || "Todavía no hay documentos enviados por los usuarios."}
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading && !error && documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong className="admin-table-primary">
                      {document.usuario?.nombre || "Usuario sin nombre"}
                    </strong>
                    <span className="admin-table-secondary">
                      {document.usuario?.correo || "Correo no disponible"}
                    </span>
                  </td>
                  <td>{getDocumentType(document)}</td>
                  <td>
                    <span className={`admin-status admin-status--${document.estado || "pending"}`}>
                      {getStatusLabel(document.estado)}
                    </span>
                  </td>
                  <td>{formatDate(document.creado_en || document.actualizado_en)}</td>
                  <td>
                    <strong className="admin-table-primary">{document.nombre || "Archivo"}</strong>
                    <span className="admin-table-secondary">{document.tipo || "Tipo no especificado"}</span>
                  </td>
                  <td>
                    <div className="admin-table-actions" aria-label={`Acciones para ${document.nombre || "documento"}`}>
                      <button
                        type="button"
                        className="admin-action-button admin-action-button--approve"
                        disabled={updatingId === document.id || document.estado === "approved"}
                        onClick={() => updateDocumentStatus(document.id, "approved")}
                      >
                        <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        type="button"
                        className="admin-action-button admin-action-button--reject"
                        disabled={updatingId === document.id || document.estado === "rejected"}
                        onClick={() => updateDocumentStatus(document.id, "rejected")}
                      >
                        <X size={16} strokeWidth={2.4} aria-hidden="true" />
                        <span>Rechazar</span>
                      </button>
                      <button
                        type="button"
                        className="admin-action-button"
                        disabled={!document.archivo_url}
                        onClick={() => openDocument(document)}
                      >
                        <Eye size={16} strokeWidth={2.4} aria-hidden="true" />
                        <span>Ver documento</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
