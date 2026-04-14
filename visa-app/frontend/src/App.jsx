import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Upload from "./Upload";
import ProfileSelection from "./pages/ProfileSelection";

// Utilidades para manejo de sesión
const SessionManager = {
  saveSession: (userData) => {
    localStorage.setItem("visaguide_session", JSON.stringify({
      id: userData.id_usuario,
      nombre: userData.nombre,
      correo: userData.correo,
      perfil: userData.perfil || null,
      loginTime: new Date().toISOString()
    }));
  },

  getSession: () => {
    const session = localStorage.getItem("visaguide_session");
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem("visaguide_session");
    localStorage.removeItem("correoUsuario");
    localStorage.removeItem("perfilUsuario");
  },

  isLoggedIn: () => {
    return SessionManager.getSession() !== null;
  }
};

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verificar sesión al cargar la página
  useEffect(() => {
    const session = SessionManager.getSession();
    if (session) {
      setIsLoggedIn(true);
      setCurrentUser(session);
    }
  }, []);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Validar campos antes de enviar
  const validateFields = (isRegister = false) => {
    setError("");
    
    if (!correo.trim()) {
      setError("El correo es obligatorio");
      return false;
    }

    if (!correo.includes("@") || !correo.includes(".")) {
      setError("Ingresa un correo válido");
      return false;
    }

    if (!contrasena.trim()) {
      setError("La contraseña es obligatoria");
      return false;
    }

    if (contrasena.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return false;
    }

    if (isRegister && !nombre.trim()) {
      setError("El nombre es obligatorio para registrarse");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateFields(true)) return;

    setIsLoading(true);
    setError("");

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
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
        setNombre("");
        setContrasena("");
        // Mantener el correo para facilitar el login
      } else {
        // Manejar errores específicos del backend
        if (data.error?.includes("duplicate") || data.error?.includes("unique")) {
          setError("Este correo ya está registrado. Intenta iniciar sesión.");
        } else {
          setError(data.error || "Error al registrar. Intenta de nuevo.");
        }
      }
    } catch (err) {
      setError("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateFields(false)) return;

    setIsLoading(true);
    setError("");

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
        // Guardar sesión completa
        SessionManager.saveSession(data.user);
        
        // También mantener compatibilidad con el código existente
        localStorage.setItem("correoUsuario", correo);
        
        setCurrentUser(SessionManager.getSession());
        setIsLoggedIn(true);
        setSuccess("¡Bienvenido de vuelta!");
        
        // Limpiar campos
        setNombre("");
        setCorreo("");
        setContrasena("");
      } else {
        // Manejar errores específicos
        if (res.status === 401) {
          setError("Correo o contraseña incorrectos. Verifica tus datos.");
        } else if (res.status === 404) {
          setError("No existe una cuenta con este correo. ¿Quieres registrarte?");
        } else {
          setError(data.error || "Error al iniciar sesión. Intenta de nuevo.");
        }
      }
    } catch (err) {
      setError("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    SessionManager.clearSession();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSuccess("Sesión cerrada correctamente");
  };

  // Si está logueado, mostrar vista de usuario autenticado
  if (isLoggedIn && currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>VisaGuide</h1>
          <br></br>

          
          <div style={styles.welcomeBox}>
            <p style={styles.welcomeText}>
              ¡Hola, <strong>{currentUser.nombre}</strong>!
            </p>
            <p style={styles.emailText}>{currentUser.correo}</p>
          </div>

          {success && <div style={styles.successMessage}>{success}</div>}

          <button
            style={styles.primaryBtn}
            onClick={() => (window.location.href = "/dashboard")}
          >
            Ir al Dashboard
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() => (window.location.href = "/perfil")}
          >
            Seleccionar Perfil
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() => (window.location.href = "/upload")}
          >
            Subir Documentos
          </button>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Vista de login/registro
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>VisaGuide</h1>
        <p style={styles.subtitle}>
          Te acompañamos en cada paso de tu proceso de visa.
        </p>

        {/* Mensajes de error y éxito */}
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}

        <input
          style={styles.input}
          placeholder="Nombre (solo para registro)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={isLoading}
        />

        <input
          style={styles.input}
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={isLoading}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          disabled={isLoading}
        />

        <button
          style={{
            ...styles.primaryBtn,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Registrarse"}
        </button>

        <button
          style={{
            ...styles.secondaryBtn,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Iniciar Sesión"}
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tramite, setTramite] = useState(null);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Verificar sesión
    const session = SessionManager.getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(session);

    // Cargar estado del trámite
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

        {currentUser && (
          <p style={styles.userInfo}>
            Usuario: <strong>{currentUser.nombre}</strong>
          </p>
        )}

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
    width: "350px",
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
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "20px",
    borderRadius: "8px",
    border: "2px solid #ef4444",
    backgroundColor: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "13px",
  },
  successMessage: {
    backgroundColor: "#d1fae5",
    border: "1px solid #10b981",
    color: "#059669",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "13px",
  },
  welcomeBox: {
    backgroundColor: "#eff6ff",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  welcomeText: {
    margin: "0 0 5px 0",
    fontSize: "18px",
    color: "#1e3a8a",
  },
  emailText: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },
  userInfo: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "20px",
  },

  // Estilos del Dashboard
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