import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DocumentCard from "../components/DocumentCard";
import DocumentList from "../components/DocumentList";
import StatusCard from "../components/StatusCard";
import useModoSenior from "../hooks/useModoSenior";
import { buildApiUrl } from "../config/api";
import "../styles/documents.css";

const REQUIRED_DOCUMENTS = [
  {
    id: "passport",
    title: "Pasaporte vigente",
    category: "Identificación Oficial",
    type: "pdf",
    required: true,
  },
  {
    id: "photo",
    title: "Fotografía 5x5 cm (Fondo blanco)",
    category: "Requisito Consular",
    type: "image",
    required: true,
  },
  {
    id: "ds160",
    title: "Confirmación DS-160 (CEAC)",
    category: "Formulario",
    type: "pdf",
    required: true,
  },
  {
    id: "bank-statements",
    title: "Estados de cuenta bancarios",
    category: "Soporte Financiero",
    type: "pdf",
    required: true,
  },
];

const SUMMARY_CARDS = [
  { status: "approved", label: "APROBADO", tone: "approved" },
  { status: "review", label: "EN REVISIÓN", tone: "review" },
  { status: "correction", label: "CORRECCIÓN", tone: "correction" },
  { status: "pending", label: "PENDIENTE", tone: "pending" },
];

function getCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem("visaguide_session") || "null");
  } catch {
    return null;
  }
}

function formatDocumentDate(value) {
  if (!value) return "No subido";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No subido";

  return date.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitialDocuments() {
  return REQUIRED_DOCUMENTS.map((document) => ({
    ...document,
    status: "pending",
    updatedAt: "No subido",
    downloadUrl: "",
    storedDocumentId: null,
    feedback: "",
  }));
}

function mergeSavedDocuments(savedDocuments) {
  return REQUIRED_DOCUMENTS.map((document) => {
    const savedDocument = savedDocuments.find(
      (item) => item.documento_key === document.id || item.nombre === document.title
    );

    if (!savedDocument) {
      return {
        ...document,
        status: "pending",
        updatedAt: "No subido",
        downloadUrl: "",
        storedDocumentId: null,
        feedback: "",
      };
    }

    return {
      ...document,
      status: savedDocument.estado || "review",
      updatedAt: formatDocumentDate(
        savedDocument.actualizado_en || savedDocument.creado_en
      ),
      downloadUrl: savedDocument.archivo_url,
      storedDocumentId: savedDocument.id,
      feedback: savedDocument.feedback || "",
    };
  });
}

export default function Documents() {
  const modoSenior = useModoSenior();
  const session = getCurrentSession();
  const [documents, setDocuments] = useState(getInitialDocuments);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!session?.id) {
        setDocuments(getInitialDocuments());
        setLoadingDocuments(false);
        setDocumentsError("");
        return;
      }

      try {
        setLoadingDocuments(true);
        setDocumentsError("");

        const response = await fetch(buildApiUrl(`/documentos/${session.id}`));
        if (!response.ok) {
          throw new Error("No se pudieron cargar tus documentos.");
        }

        const data = await response.json();
        setDocuments(mergeSavedDocuments(Array.isArray(data) ? data : []));
      } catch (error) {
        setDocuments(getInitialDocuments());
        setDocumentsError(error.message || "No se pudieron cargar tus documentos.");
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchUserDocuments();
  }, [session?.id]);

  const statusCounts = useMemo(() => {
    return documents.reduce(
      (counts, document) => ({
        ...counts,
        [document.status]: (counts[document.status] || 0) + 1,
      }),
      { approved: 0, review: 0, correction: 0, pending: 0 }
    );
  }, [documents]);

  const handleDocumentStatusChange = (
    documentId,
    status,
    updatedAt,
    savedDocument
  ) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status,
              updatedAt: updatedAt || document.updatedAt,
              downloadUrl: savedDocument?.archivo_url || document.downloadUrl,
              storedDocumentId: savedDocument?.id || document.storedDocumentId,
              feedback:
                savedDocument?.feedback === undefined
                  ? document.feedback
                  : savedDocument.feedback || "",
            }
          : document
      )
    );
  };

  const handleUploadSuccess = (documentId, savedDocument) => {
    handleDocumentStatusChange(documentId, "review", "Ahora", savedDocument);
    setRefreshKey((key) => key + 1);
  };

  const handleDocumentDelete = (documentId) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: "pending",
              updatedAt: "No subido",
              downloadUrl: "",
              storedDocumentId: null,
              feedback: "",
            }
          : document
      )
    );
    setRefreshKey((key) => key + 1);
  };

  const handleHeaderUpload = () => {
    const pendingAction = document.querySelector(
      '[data-document-status="pending"] [data-document-upload-action="true"]'
    );
    const correctionAction = document.querySelector(
      '[data-document-status="correction"] [data-document-upload-action="true"]'
    );
    const target = pendingAction || correctionAction;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.click();
  };

  return (
    <div className="documents-shell">
      <Sidebar currentPage="documentos" />

      <main
        className={`documents-main${modoSenior ? " documents-main--senior" : ""}`}
      >
        <section className="documents-header">
          <div>
            <h1 className="documents-title">Gestor de Documentos</h1>
            <p className="documents-subtitle">
              Sube y administra los documentos de soporte para tu entrevista. Los
              archivos requeridos son obligatorios para continuar.
            </p>
          </div>

          <button
            className="documents-header__button"
            type="button"
            onClick={handleHeaderUpload}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16V5m0 0 4 4m-4-4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 16.5A4.5 4.5 0 0 0 15.5 12h-.7A6 6 0 1 0 5 17.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Subir archivo
          </button>
        </section>

        <section className="status-grid" aria-label="Resumen de documentos">
          {SUMMARY_CARDS.map((card) => (
            <StatusCard
              key={card.status}
              count={statusCounts[card.status] || 0}
              label={card.label}
              tone={card.tone}
            />
          ))}
        </section>

        <section className="documents-list" aria-label="Documentos requeridos">
          {loadingDocuments && (
            <p className="documents-message">Cargando estado de documentos...</p>
          )}

          {documentsError && (
            <p className="documents-message documents-message--error">
              {documentsError}
            </p>
          )}

          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              usuarioId={session?.id}
              onStatusChange={handleDocumentStatusChange}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDocumentDelete}
            />
          ))}
        </section>

        <DocumentList usuarioId={session?.id} refreshKey={refreshKey} />
      </main>
    </div>
  );
}
