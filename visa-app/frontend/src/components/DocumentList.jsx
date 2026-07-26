import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function OpenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 17 17 8m0 0H9m8 0v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DocumentList({ usuarioId, refreshKey = 0 }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!usuarioId) {
        setDocuments([]);
        setError("No se encontró un usuario para cargar documentos.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(buildApiUrl(`/documentos/${usuarioId}`));
        if (!response.ok) {
          throw new Error("No se pudieron cargar los documentos.");
        }

        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data.documentos || []);
      } catch (err) {
        setError(err.message || "Error al cargar documentos.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [usuarioId, refreshKey]);

  const handleOpenDocument = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <section className="saved-documents-section">
        <p className="documents-message">Cargando documentos guardados...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="saved-documents-section">
        <p className="documents-message documents-message--error">{error}</p>
      </section>
    );
  }

  if (documents.length === 0) {
    return (
      <section className="saved-documents-section">
        <p className="documents-message">Todavía no hay documentos guardados.</p>
      </section>
    );
  }

  return (
    <section className="saved-documents-section">
      <div className="saved-documents-header">
        <span>Archivo histórico</span>
        <h2>Documentos guardados</h2>
      </div>

      <div className="saved-documents-list">
        {documents.map((document) => (
          <article key={document.id} className="saved-document-card">
            <div>
              <h3>{document.nombre}</h3>
              <p>
                {document.tipo || "Sin tipo"} • Guardado:{" "}
                {formatDate(document.creado_en)}
              </p>
            </div>

            <button
              type="button"
              className="saved-document-card__button"
              onClick={() => handleOpenDocument(document.archivo_url)}
            >
              <OpenIcon />
              Ver documento
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
