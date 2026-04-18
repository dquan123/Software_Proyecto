import DocumentCard from "../components/DocumentCard";

const documents = [
  {
    id: 1,
    title: "Pasaporte vigente",
    status: "pending",
  },
  {
    id: 2,
    title: "Fotografía 5x5 cm",
    status: "pending",
  },
  {
    id: 3,
    title: "Confirmación DS-160",
    status: "pending",
  },
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
    background: "#0f172a",
    color: "white",
    padding: "40px",
  },
  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: "30px",
  },
};