import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import ProfileSelection from "./pages/ProfileSelection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/perfil" element={<ProfileSelection />} />

        <Route path="/dashboard" element={<Dashboard />} />

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
        localStorage.setItem("correoUsuario", correo);
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

        <button
          style={styles.secondaryBtn}
          onClick={() => (window.location.href = "/upload")}
        >
          Ir a subir documentos
        </button>

        <button
          style={styles.secondaryBtn}
          onClick={() => (window.location.href = "/perfil")}
        >
          Ir a selección de perfil
        </button>


        <button
          style={styles.secondaryBtn}
          onClick={() => (window.location.href = "/dashboard")}
        >
          Ir al dashboard
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tramite, setTramite] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/estado-tramite")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo obtener el estado del trámite");
        }
        return res.json();
      })
      .then((data) => {
        setTramite(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar la información del trámite");
      });
  }, []);

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardCard}>
        <h1 style={styles.dashboardTitle}>Estado del trámite</h1>

        {error && <p style={styles.errorText}>{error}</p>}

        {!error && !tramite && <p>Cargando información...</p>}

        {!error && tramite && (
          <>
            <div style={styles.statusBox}>
              <span style={styles.statusLabel}>Estado actual</span>
              <span style={styles.statusValue}>{tramite.estado}</span>
            </div>

            <div style={styles.infoGroup}>
              <p>
                <strong>Etapa actual:</strong> {tramite.etapaActual}
              </p>
              <p>
                <strong>Siguiente paso:</strong> {tramite.siguientePaso}
              </p>
              <p>
                <strong>Mensaje:</strong> {tramite.mensaje}
              </p>
            </div>

            <div style={styles.progressSection}>
              <p>
                <strong>Progreso general</strong>
              </p>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${tramite.progreso}%`,
                  }}
                >
                  {tramite.progreso}%
                </div>
              </div>
            </div>
          </>
        )}

        <button
          style={styles.backBtn}
          onClick={() => (window.location.href = "/")}
        >
          Volver al inicio
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
    boxSizing: "border-box",
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

  dashboardContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    padding: "20px",
  },
  dashboardCard: {
    width: "420px",
    maxWidth: "95%",
    background: "white",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
  },
  dashboardTitle: {
    marginTop: 0,
    marginBottom: "20px",
    textAlign: "center",
    color: "#1e3a8a",
    fontSize: "32px",
    lineHeight: "1.1",
  },
  statusBox: {
    backgroundColor: "#e8f0fe",
    borderLeft: "6px solid #2563eb",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
  },
  statusLabel: {
    fontSize: "14px",
    color: "#4b5563",
    marginBottom: "4px",
  },
  statusValue: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  infoGroup: {
    color: "#374151",
    lineHeight: "1.8",
  },
  progressSection: {
    marginTop: "24px",
  },
  progressBar: {
    width: "100%",
    height: "30px",
    backgroundColor: "#d1d5db",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "10px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: "30px",
    transition: "width 0.3s ease",
  },
  backBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1e3a8a",
    color: "white",
    cursor: "pointer",
  },
  errorText: {
    color: "red",
  },
};

export default App;