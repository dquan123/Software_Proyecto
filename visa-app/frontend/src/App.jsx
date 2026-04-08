import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./Upload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registro exitoso");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login exitoso");
      } else {
        alert("Credenciales incorrectas");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>VisaGuide</h1>
        <br />
        <p style={styles.subtitle}>
          Te acompañamos en cada paso de tu proceso de visa.
        </p>

        <input
          style={styles.input}
          placeholder="Nombre"
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Correo"
          onChange={(e) => setCorreo(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setContrasena(e.target.value)}
        />

        <button style={styles.primaryBtn} onClick={handleRegister}>
          Registrarse
        </button>

        <button style={styles.secondaryBtn} onClick={handleLogin}>
          Iniciar sesión
        </button>

        {/* 👇 BOTÓN NUEVO */}
        <button
          style={styles.secondaryBtn}
          onClick={() => (window.location.href = "/upload")}
        >
          Ir a subir documentos
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    width: "320px",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "5px",
    color: "#1e3a8a",
  },
  subtitle: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  primaryBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "white",
    cursor: "pointer",
  },
};

export default App;