import DocumentCard from "../components/DocumentCard";

const documents = [
  { id: 1, title: "Pasaporte vigente", type: "pdf", status: "pending" },
  { id: 2, title: "Fotografía 5x5 cm", type: "image", status: "pending" },
  { id: 3, title: "Confirmación DS-160", type: "pdf", status: "pending" },
  { id: 4, title: "Estados de Cuenta Bancarios", type: "pdf", status: "pending" },
];

export default function Documents() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestor de Documentos</h1>
      <p style={styles.subtitle}>
        Sube tus documentos requeridos para continuar el proceso.
      </p>

      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "40px",
    fontFamily: "Segoe UI, sans-serif",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "30px",
  },
};