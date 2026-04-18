import { useState } from "react";

export default function DocumentCard({ doc }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(doc.status);

  const handleUpload = async () => {
    if (!file) return alert("Selecciona un archivo");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", doc.id);

    try {
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("review");
        alert("Archivo subido correctamente");
      } else {
        alert("Error al subir archivo");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "review":
        return "EN REVISIÓN";
      case "approved":
        return "APROBADO";
      default:
        return "PENDIENTE";
    }
  };

  return (
    <div style={styles.card}>
      <h3>{doc.title}</h3>
      <p>{getStatusText()}</p>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>
        Subir archivo
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: "#020617",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
};