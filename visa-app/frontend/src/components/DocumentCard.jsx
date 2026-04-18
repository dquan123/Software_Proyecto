import { useState } from "react";

export default function DocumentCard({ doc }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(doc.status);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [preview, setPreview] = useState(null);

  const validateFile = (file) => {
    if (doc.type === "pdf" && file.type !== "application/pdf") {
      alert("Este documento requiere un archivo PDF");
      return false;
    }

    if (doc.type === "image" && !file.type.startsWith("image/")) {
      alert("Este documento requiere una imagen (.png, .jpg)");
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);

    // Preview PDF o imagen
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecciona un archivo");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setStatus("review");
      setUpdatedAt(new Date());
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

  const formatDate = (date) => {
    if (!date) return "-";
    return date.toLocaleString();
  };

  const currentStatus = getStatus();

  return (
    <div style={styles.card}>
      <div style={styles.mainRow}>
        
        {/* IZQUIERDA */}
        <div style={styles.left}>
          <h3 style={styles.title}>{doc.title}</h3>
          <p style={styles.subtitle}>
            Documento requerido • Actualizado: {formatDate(updatedAt)}
          </p>

          {/* PREVIEW */}
          {preview && (
            <div style={styles.previewContainer}>
              {file.type === "application/pdf" ? (
                <iframe
                  src={preview}
                  title="PDF Preview"
                  style={styles.pdfViewer}
                />
              ) : (
                <img src={preview} alt="preview" style={styles.imagePreview} />
              )}
            </div>
          )}
        </div>

        {/* DERECHA (como figma) */}
        <div style={styles.right}>
          <span style={styles.required}>REQUIRED</span>

          <span
            style={{
              ...styles.status,
              background: currentStatus.color,
            }}
          >
            {currentStatus.text}
          </span>

          <input type="file" onChange={handleFileChange} />

          <button style={styles.button} onClick={handleUpload}>
            Subir archivo
          </button>
        </div>
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

  mainRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "30px",
  },

  left: {
    flex: 1,
  },

  right: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "flex-end",
    minWidth: "180px",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "5px",
    fontSize: "14px",
    color: "#64748b",
  },

  required: {
    background: "#0f172a",
    color: "white",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
  },

  status: {
    padding: "6px 12px",
    borderRadius: "10px",
    color: "white",
    fontSize: "13px",
  },

  button: {
    background: "#e11d48",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  preview: {
    marginTop: "15px",
    maxWidth: "200px",
    borderRadius: "10px",
  },

  previewContainer: {
  marginTop: "15px",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
},

pdfViewer: {
  width: "100%",
  height: "400px",
  border: "none",
},

imagePreview: {
  maxWidth: "200px",
  borderRadius: "10px",
},

};