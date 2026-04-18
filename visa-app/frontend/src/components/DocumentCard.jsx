import { useState } from "react";

export default function DocumentCard({ doc }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(doc.status);

  const handleUpload = async () => {
    if (!file) return alert("Selecciona un archivo");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", doc.id);

    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setStatus("review");
    }
  };

  const getStatus = () => {
    switch (status) {
      case "review":
        return { text: "En revisión", color: "#f59e0b" };
      case "approved":
        return { text: "Aprobado", color: "#22c55e" };
      default:
        return { text: "Pendiente", color: "#64748b" };
    }
  };

  const currentStatus = getStatus();

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>{doc.title}</h3>
          <p style={styles.subtitle}>
            Documento requerido • Actualizado: -
          </p>
        </div>

        <span style={styles.required}>REQUIRED</span>
      </div>

      {/* STATUS */}
      <div style={styles.statusRow}>
        <span
          style={{
            ...styles.statusBadge,
            background: currentStatus.color,
          }}
        >
          {currentStatus.text}
        </span>
      </div>

      {/* INPUT */}
      <div style={styles.uploadRow}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button style={styles.button} onClick={handleUpload}>
          Subir archivo
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },

  required: {
    background: "#0f172a",
    color: "white",
    padding: "5px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  },

  statusRow: {
    marginTop: "15px",
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: "10px",
    color: "white",
    fontSize: "13px",
  },

  uploadRow: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  button: {
    background: "#e11d48",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};