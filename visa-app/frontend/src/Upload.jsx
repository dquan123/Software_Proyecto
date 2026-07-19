import { useState } from "react";
import { buildApiUrl } from "./config/api";

function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona un archivo PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(buildApiUrl("/upload"), {
        method: "POST",
        body: formData,
      });

      await res.json();
      setMessage("Archivo subido correctamente");
    } catch {
      setMessage("Error al subir archivo");
    }
  };

  return (
    <main id="main-content" tabIndex="-1" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Subir Documento</h1>

        <p style={styles.subtitle}>
          Sube tu archivo PDF para continuar con el proceso
        </p>

        <label htmlFor="documento-pdf">Seleccionar documento PDF</label>
        <input
          id="documento-pdf"
          type="file"
          accept="application/pdf"
          style={styles.input}
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button style={styles.button} onClick={handleUpload}>
          Subir archivo
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </main>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    width: "350px",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  title: {
  color: "#1e3a8a",
  marginBottom: "10px",
  fontSize: "28px",
  lineHeight: "1.2",
},
  subtitle: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "20px",
  },
  input: {
    marginBottom: "15px",
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  message: {
    marginTop: "15px",
    fontSize: "14px",
  },
};

export default Upload;
