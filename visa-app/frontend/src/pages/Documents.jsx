import Sidebar from "../components/Sidebar";
import DocumentCard from "../components/DocumentCard";
import DocumentList from "../components/DocumentList";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

const documents = [
  { id: 1, title: "Pasaporte vigente", type: "pdf", status: "pending" },
  { id: 2, title: "Fotografía 5x5 cm", type: "image", status: "pending" },
  { id: 3, title: "Confirmación DS-160", type: "pdf", status: "pending" },
  { id: 4, title: "Estados de Cuenta Bancarios", type: "pdf", status: "pending" },
];

export default function Documents() {
  const { isValidating, session } = useRequireAuth();
  const modoSenior = useModoSenior();

  if (isValidating) {
    return (
      <div style={styles.layout}>
        <Sidebar currentPage="documentos" />
        <main style={styles.mainContent}>
          <p>Verificando sesión...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <Sidebar currentPage="documentos" />
      <main style={styles.mainContent}>
        <h1 style={{
          ...styles.title,
          fontSize: modoSenior ? "40px" : "32px"
        }}>Gestor de Documentos</h1>
        <p style={{
          ...styles.subtitle,
          fontSize: modoSenior ? "18px" : "14px"
        }}>
          Sube tus documentos requeridos para continuar el proceso.
        </p>

        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}

        <DocumentList usuarioId={session?.id} />
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },

  mainContent: {
    marginLeft: "250px",
    flex: 1,
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