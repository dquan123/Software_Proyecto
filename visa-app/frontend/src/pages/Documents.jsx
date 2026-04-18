import DocumentCard from "../components/DocumentCard";

const mockDocuments = [
  {
    id: 1,
    title: "Pasaporte vigente",
    status: "correction",
    feedback: "La imagen está borrosa en la zona MRZ.",
    updatedAt: "Hace 2 días",
  },
  {
    id: 2,
    title: "Fotografía 5x5 cm",
    status: "approved",
    updatedAt: "Ayer",
  },
  {
    id: 3,
    title: "Confirmación DS-160",
    status: "pending",
    updatedAt: "No subido",
  },
];

export default function Documents() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Gestor de Documentos</h1>
      <p>Sube y administra tus documentos</p>

      {mockDocuments.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}