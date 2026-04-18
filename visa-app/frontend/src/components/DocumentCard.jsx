export default function DocumentCard({ doc }) {
  const getStatusColor = () => {
    switch (doc.status) {
      case "approved":
        return "green";
      case "review":
        return "orange";
      case "correction":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <h3>{doc.title}</h3>
      <p>Actualizado: {doc.updatedAt}</p>

      <span style={{ color: getStatusColor() }}>
        {doc.status.toUpperCase()}
      </span>

      {doc.feedback && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <strong>Feedback:</strong> {doc.feedback}
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button>Subir archivo</button>
        <button style={{ marginLeft: "10px" }}>Reemplazar</button>
      </div>
    </div>
  );
}