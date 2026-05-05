import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

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

export default function DocumentList({ usuarioId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!usuarioId) {
        setDocuments([]);
        setError("No se encontro un usuario para cargar documentos.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API}/documentos/${usuarioId}`);
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
  }, [usuarioId]);

  const handleOpenDocument = (url) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  if (loading) {
    return <p style={styles.message}>Cargando...</p>;
  }

  if (error) {
    return <p style={{ ...styles.message, ...styles.error }}>{error}</p>;
  }

  if (documents.length === 0) {
    return <p style={styles.message}>Todavia no hay documentos guardados.</p>;
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>Documentos guardados</h2>

      <div style={styles.list}>
        {documents.map((document) => (
          <article key={document.id} style={styles.card}>
            <div>
              <h3 style={styles.name}>{document.nombre}</h3>
              <p style={styles.meta}>
                {document.tipo || "Sin tipo"} - {formatDate(document.creado_en)}
              </p>
            </div>

            <button
              type="button"
              style={styles.button}
              onClick={() => handleOpenDocument(document.archivo_url)}
            >
              Ver documento
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    marginTop: "34px",
  },

  heading: {
    margin: "0 0 16px 0",
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "700",
  },

  list: {
    display: "grid",
    gap: "14px",
  },

  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
  },

  name: {
    margin: "0 0 6px 0",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "700",
  },

  meta: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  button: {
    border: "none",
    borderRadius: "8px",
    background: "#1e3a5f",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    padding: "10px 14px",
    whiteSpace: "nowrap",
  },

  message: {
    marginTop: "28px",
    color: "#475569",
    fontSize: "14px",
  },

  error: {
    color: "#dc2626",
  },
};
