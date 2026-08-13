import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, MessageSquareText, Save, X } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminSearch, AdminTabs } from "../../components/admin/AdminShared";
import { buildApiUrl } from "../../config/api";
import { openDocumentPreview } from "../../utils/documentPreview";

const tableHeaders = [
  "Usuario",
  "Tipo de documento",
  "Estado",
  "Fecha de carga",
  "Archivo",
  "Observaciones",
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

function buildFeedbackDrafts(documentList) {
  return Object.fromEntries(
    documentList.map((document) => [document.id, document.feedback || ""])
  );
}

function getUpdatedDocument(data, fallbackMessage) {
  if (!data.documento) {
    throw new Error(fallbackMessage);
  }

  return data.documento;
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [feedbackModalDocument, setFeedbackModalDocument] = useState(null);
  const [feedbackModalDraft, setFeedbackModalDraft] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revision, setRevision] = useState(0);

  const loadDocuments = useCallback((signal) => {
    const token = getAdminToken();
    setIsLoading(true);
    setError("");
    return fetch(buildApiUrl("/admin/documents"), {
      signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("No fue posible cargar los documentos.");
        return response.json();
      })
      .then((data) => {
        const nextDocuments = Array.isArray(data) ? data : data.documentos || [];
        setDocuments(nextDocuments);
        setFeedbackDrafts(buildFeedbackDrafts(nextDocuments));
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "No fue posible cargar los documentos.");
      })
      .finally(() => {
        if (!signal?.aborted) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);

    return () => controller.abort();
  }, [loadDocuments, revision]);

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const matchesStatus = statusFilter === "all" || document.estado === statusFilter;
    const text = `${document.nombre || ""} ${document.documento_key || ""} ${document.usuario?.nombre || ""} ${document.usuario?.correo || ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }), [documents, query, statusFilter]);
  const totals = useMemo(() => ({
    pending: documents.filter((item) => item.estado === "pending").length,
    review: documents.filter((item) => item.estado === "review").length,
    approved: documents.filter((item) => item.estado === "approved").length,
    correction: documents.filter((item) => item.estado === "correction" || item.estado === "rejected").length,
  }), [documents]);

  const replaceDocument = (updatedDocument) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document
      )
    );
    setFeedbackDrafts((currentDrafts) => ({
      ...currentDrafts,
      [updatedDocument.id]: updatedDocument.feedback || "",
    }));
    setFeedbackModalDocument((currentDocument) =>
      currentDocument?.id === updatedDocument.id ? updatedDocument : currentDocument
    );
  };

const updateDocumentStatus = async (documentId, status) => {
  const token = getAdminToken();
  setUpdatingId(documentId);
  setNotice(null);

  try {
    const payload = { status };

    const response = await fetch(buildApiUrl(`/admin/documents/${documentId}/status`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No fue posible actualizar el documento.");
    }

    replaceDocument(getUpdatedDocument(data, "No fue posible actualizar el documento."));
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

  const openFeedbackModal = (document) => {
    setFeedbackModalDocument(document);
    setFeedbackModalDraft(feedbackDrafts[document.id] ?? document.feedback ?? "");
  };

  const closeFeedbackModal = () => {
    if (savingFeedbackId) return;
    setFeedbackModalDocument(null);
    setFeedbackModalDraft("");
  };

  const saveDocumentFeedback = async () => {
    if (!feedbackModalDocument) return;

    const documentId = feedbackModalDocument.id;
    const token = getAdminToken();
    setSavingFeedbackId(documentId);
    setNotice(null);

    try {
      const response = await fetch(buildApiUrl(`/admin/documents/${documentId}/status`), {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
        body: JSON.stringify({ feedback: feedbackModalDraft }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "No fue posible guardar las observaciones.");
      }

      replaceDocument(getUpdatedDocument(data, "No fue posible guardar las observaciones."));
      setNotice({
        type: "success",
        text: "Observaciones guardadas correctamente.",
      });
      setFeedbackModalDocument(null);
      setFeedbackModalDraft("");
    } catch (requestError) {
      setNotice({
        type: "error",
        text: requestError.message || "No fue posible guardar las observaciones.",
      });
    } finally {
      setSavingFeedbackId(null);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader title="Documentos Globales" description="Supervisa todos los documentos en revisión en la plataforma." />
      <section className="admin-summary-grid" aria-label="Resumen de documentos">
        <article><strong>{totals.pending}</strong><small>Pendientes</small></article>
        <article><strong>{totals.review}</strong><small>En revisión</small></article>
        <article><strong>{totals.approved}</strong><small>Aprobados</small></article>
        <article><strong>{totals.correction}</strong><small>Corrección</small></article>
      </section>
      <AdminTabs value={statusFilter} onChange={setStatusFilter} label="Filtrar documentos por estado" items={[{ value: "all", label: "Todos" }, { value: "pending", label: "Pendiente" }, { value: "review", label: "En revisión" }, { value: "approved", label: "Aprobado" }, { value: "correction", label: "Corrección" }]} />
      <section className="admin-panel-card admin-documents">
        <div className="admin-panel-card__header">
          <AdminSearch value={query} onChange={setQuery} placeholder="Buscar por documento o solicitante..." />
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

              {!isLoading && (error || visibleDocuments.length === 0) && (
                <tr>
                  <td colSpan={tableHeaders.length}>
                    <div className={`admin-table-state${error ? " admin-table-state--error" : ""}`}>
                      <p>{error || (documents.length ? "No hay documentos que coincidan con los filtros." : "Todavía no hay documentos enviados por los usuarios.")}</p>
                      {error && <button type="button" className="admin-secondary-button" onClick={() => setRevision((value) => value + 1)}>Reintentar</button>}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !error && visibleDocuments.map((document) => {
                const savedFeedback = document.feedback || "";
                const hasFeedback = Boolean(savedFeedback.trim());
                const isUpdating = updatingId === document.id;
                const isSavingFeedback = savingFeedbackId === document.id;
                const isRowBusy = isUpdating || isSavingFeedback;

                return (
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
                      <span className={`admin-comment-indicator${hasFeedback ? "" : " admin-comment-indicator--empty"}`}>
                        <MessageSquareText size={14} strokeWidth={2.4} aria-hidden="true" />
                        {hasFeedback ? "Tiene observaciones" : "Sin observaciones"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions" aria-label={`Acciones para ${document.nombre || "documento"}`}>
                        <button
                          type="button"
                          className="admin-action-button admin-action-button--save"
                          disabled={isRowBusy}
                          onClick={() => openFeedbackModal(document)}
                        >
                          <MessageSquareText size={16} strokeWidth={2.4} aria-hidden="true" />
                          <span>Observaciones</span>
                        </button>
                        <button
                          type="button"
                          className="admin-action-button admin-action-button--approve"
                          disabled={isRowBusy || document.estado === "approved"}
                          onClick={() => updateDocumentStatus(document.id, "approved")}
                        >
                          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          type="button"
                          className="admin-action-button admin-action-button--reject"
                          disabled={
                            isRowBusy ||
                            document.estado === "correction" ||
                            document.estado === "rejected"
                          }
                          onClick={() => updateDocumentStatus(document.id, "correction")}
                        >
                          <X size={16} strokeWidth={2.4} aria-hidden="true" />
                          <span>Rechazar</span>
                        </button>
                        <button
                          type="button"
                          className="admin-action-button"
                          disabled={isRowBusy || !document.archivo_url}
                          onClick={() => openDocumentPreview(document)}
                        >
                          <Eye size={16} strokeWidth={2.4} aria-hidden="true" />
                          <span>Ver documento</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {feedbackModalDocument && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-observations-title"
          >
            <header className="admin-modal__header">
              <div>
                <p className="admin-section-kicker">Revision de documento</p>
                <h2 id="admin-observations-title">Observaciones</h2>
                <p>
                  {feedbackModalDocument.nombre || "Documento"} -{" "}
                  {feedbackModalDocument.usuario?.nombre || "Usuario sin nombre"}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Cerrar observaciones"
                disabled={Boolean(savingFeedbackId)}
                onClick={closeFeedbackModal}
              >
                <X size={20} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </header>

            <div className="admin-modal__body">
              <label className="admin-observation-field" htmlFor="admin-observations-textarea">
                Comentario para el usuario
                <textarea
                  id="admin-observations-textarea"
                  className="admin-observation-input admin-observation-input--modal"
                  rows={6}
                  value={feedbackModalDraft}
                  maxLength={1000}
                  placeholder="Ej. Documento ilegible. Sube nuevamente una imagen clara del pasaporte."
                  disabled={Boolean(savingFeedbackId)}
                  onChange={(event) => setFeedbackModalDraft(event.target.value)}
                />
              </label>
              <span className="admin-observation-counter">
                {feedbackModalDraft.length}/1000 caracteres
              </span>
            </div>

            <footer className="admin-modal__footer">
              <button
                type="button"
                className="admin-action-button"
                disabled={Boolean(savingFeedbackId)}
                onClick={closeFeedbackModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-action-button admin-action-button--save"
                disabled={Boolean(savingFeedbackId)}
                onClick={saveDocumentFeedback}
              >
                <Save size={15} strokeWidth={2.4} aria-hidden="true" />
                {savingFeedbackId ? "Guardando..." : "Guardar"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
