import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import ProfileSelection from "./pages/ProfileSelection/ProfileSelection";
import Documents from "./pages/Documents";
import DS160Form from "./pages/ds160";
import Informacion from "./pages/Informacion";
import Cronologia from "./pages/Cronologia";
import Entrevista from "./pages/Entrevista";
import InterviewSimulator from "./pages/InterviewSimulator";
import { buildApiUrl } from "./config/api";
import Dashboard from "./pages/Dashboard";


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

// Función para validar sesión contra la BD
const validateSession = async (session) => {
  if (!session || !session.correo) return false;
  
  try {
    const res = await fetch(
      `${buildApiUrl("/validar-sesion")}?correo=${encodeURIComponent(session.correo)}`
    );
    if (!res.ok) {
      SessionManager.clearSession();
      return false;
    }
    const data = await res.json();
    return data.valid;
  } catch {
    // Si hay error de conexión, asumimos que la sesión no es válida
    SessionManager.clearSession();
    return false;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/perfil" element={<ProfileSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/informacion" element={<Informacion />} />
        <Route path="/cronologia" element={<Cronologia />} />
        <Route path="/entrevista" element={<Entrevista />} />
        <Route path="/entrevista/simulador" element={<InterviewSimulator />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/ds160" element={<DS160Form />} />
      </Routes>
    </BrowserRouter>
  );
}

// Pantalla de Onboarding (la del Figma)
function Onboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = SessionManager.getSession();
      if (session) {
        const isValid = await validateSession(session);
        if (isValid) {
          setCurrentUser(session);
        }
      }
      setIsValidating(false);
    };
    checkSession();
  }, []);

  // Mostrar loading mientras valida
  if (isValidating) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>VG</div>
          <p style={styles.descriptionText}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está logueado, mostrar opciones
  if (currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>VG</div>
          <h1 style={styles.title}>VisaGuide</h1>
          <p style={styles.brandSubtitle}>Guevara Advisory Services</p>

          <div style={styles.welcomeBox}>
            <p style={styles.welcomeText}>
              ¡Hola, <strong>{currentUser.nombre}</strong>!
            </p>
            <p style={styles.welcomeEmail}>{currentUser.correo}</p>
          </div>

          <button
            style={styles.primaryBtn}
            onClick={() => (window.location.href = "/dashboard")}
          >
            Ir al Dashboard →
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() => (window.location.href = "/perfil")}
          >
            Seleccionar Perfil
          </button>

          <button
            style={styles.linkBtn}
            onClick={() => {
              SessionManager.clearSession();
              window.location.reload();
            }}
          >
            Cerrar sesión
          </button>
        </div>
        <p style={styles.footerText}>Proceso seguro, claro y profesional</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>VG</div>
        <h1 style={styles.title}>VisaGuide</h1>
        <p style={styles.brandSubtitle}>Guevara Advisory Services</p>

        <div style={styles.descriptionBox}>
          <p style={styles.descriptionText}>
            Te acompañamos en cada paso de tu proceso de visa estadounidense. 
            Organiza, prepara y entiende todo lo que necesitas con claridad y confianza.
          </p>
        </div>

        <button
          style={styles.primaryBtn}
          onClick={() => (window.location.href = "/registro")}
        >
          Comenzar →
        </button>

        <button
          style={styles.linkBtn}
          onClick={() => (window.location.href = "/login")}
        >
          Ya tengo una cuenta
        </button>
      </div>
      <p style={styles.footerText}>Proceso seguro, claro y profesional</p>
    </div>
  );
}

// Pantalla de Login
function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = SessionManager.getSession();
      if (session) {
        const isValid = await validateSession(session);
        if (isValid) {
          window.location.href = "/";
        }
        // Si no es válida, ya se limpió en validateSession
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateFields = () => {
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
    return true;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        SessionManager.saveSession(data.user);
        localStorage.setItem("correoUsuario", correo);
        if (data.user.perfil) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/perfil";
        }
      } else {
        if (res.status === 401) {
          setError("Correo o contraseña incorrectos");
        } else {
          setError(data.error || "Error al iniciar sesión");
        }
      }
    } catch {
      setError("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>VG</div>
        <h1 style={styles.title}>VisaGuide</h1>
        <p style={styles.brandSubtitle}>Guevara Advisory Services</p>

        <h2 style={styles.formTitle}>Iniciar Sesión</h2>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Correo electrónico</label>
          <input
            style={styles.input}
            type="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <button
          style={{
            ...styles.primaryBtn,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Ingresando..." : "Ingresar →"}
        </button>

        <button
          style={styles.linkBtn}
          onClick={() => (window.location.href = "/registro")}
        >
          ¿No tienes cuenta? Regístrate
        </button>

        <button
          style={styles.backLink}
          onClick={() => (window.location.href = "/")}
        >
          ← Volver al inicio
        </button>
      </div>
      <p style={styles.footerText}>Proceso seguro, claro y profesional</p>
    </div>
  );
}

// Pantalla de Registro
function Registro() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = SessionManager.getSession();
      if (session) {
        const isValid = await validateSession(session);
        if (isValid) {
          window.location.href = "/";
        }
        // Si no es válida, ya se limpió en validateSession
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const validateFields = () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
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
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("¡Registro exitoso! Redirigiendo al login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        if (data.error?.includes("duplicate") || data.error?.includes("unique")) {
          setError("Este correo ya está registrado");
        } else {
          setError(data.error || "Error al registrar");
        }
      }
    } catch {
      setError("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>VG</div>
        <h1 style={styles.title}>VisaGuide</h1>
        <p style={styles.brandSubtitle}>Guevara Advisory Services</p>

        <h2 style={styles.formTitle}>Crear Cuenta</h2>

        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nombre completo</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Correo electrónico</label>
          <input
            style={styles.input}
            type="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Confirmar contraseña</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        <button
          style={{
            ...styles.primaryBtn,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? "Creando cuenta..." : "Crear cuenta →"}
        </button>

        <button
          style={styles.linkBtn}
          onClick={() => (window.location.href = "/login")}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </button>

        <button
          style={styles.backLink}
          onClick={() => (window.location.href = "/")}
        >
          ← Volver al inicio
        </button>
      </div>
      <p style={styles.footerText}>Proceso seguro, claro y profesional</p>
    </div>
  );
}

// Estilos basados en el diseño de Figma
const styles = {
  // Contenedor principal con gradiente
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #4a1a3d 100%)",
    padding: "20px",
    position: "relative",
  },

  // Card principal
  card: {
    background: "white",
    padding: "40px 35px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0px 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },

  // Logo VG
  logo: {
    width: "60px",
    height: "60px",
    backgroundColor: "#c73e4e",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 15px auto",
    color: "white",
    fontSize: "24px",
    fontWeight: "bold",
    fontFamily: "'Segoe UI', sans-serif",
  },

  logoSmall: {
    width: "40px",
    height: "40px",
    backgroundColor: "#c73e4e",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Títulos
  title: {
    margin: "0 0 5px 0",
    color: "#1e2a3a",
    fontSize: "28px",
    fontWeight: "700",
    fontFamily: "'Segoe UI', sans-serif",
  },

  brandSubtitle: {
    margin: "0 0 25px 0",
    color: "#6b7280",
    fontSize: "14px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  formTitle: {
    margin: "0 0 20px 0",
    color: "#1e2a3a",
    fontSize: "20px",
    fontWeight: "600",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Caja de descripción
  descriptionBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "25px",
  },

  descriptionText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "1.6",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Inputs
  inputGroup: {
    marginBottom: "18px",
    textAlign: "left",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'Segoe UI', sans-serif",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: "15px",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },

  // Botones
  primaryBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#c73e4e",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "background-color 0.2s, transform 0.1s",
  },

  secondaryBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "2px solid #1e3a5f",
    backgroundColor: "transparent",
    color: "#1e3a5f",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  linkBtn: {
    background: "none",
    border: "none",
    color: "#c73e4e",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "18px",
    fontFamily: "'Segoe UI', sans-serif",
    display: "block",
    width: "100%",
  },

  backLink: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "13px",
    marginTop: "15px",
    fontFamily: "'Segoe UI', sans-serif",
    display: "block",
    width: "100%",
  },

  // Mensajes
  errorMessage: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "18px",
    fontSize: "14px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  successMessage: {
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#059669",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "18px",
    fontSize: "14px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Footer
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    marginTop: "25px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Welcome box (usuario logueado)
  welcomeBox: {
    backgroundColor: "#f0f7ff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "25px",
  },

  welcomeText: {
    margin: "0 0 5px 0",
    color: "#1e3a5f",
    fontSize: "18px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  welcomeEmail: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Dashboard
  dashboardContainer: {
    marginLeft: "250px",
    flex: 1,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #4a1a3d 100%)",
    padding: "20px",
  },

  dashboardCard: {
    width: "100%",
    maxWidth: "450px",
    background: "white",
    padding: "35px",
    borderRadius: "20px",
    boxShadow: "0px 20px 60px rgba(0,0,0,0.3)",
  },

  dashboardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  dashboardTitle: {
    margin: 0,
    color: "#1e2a3a",
    fontSize: "22px",
    fontWeight: "700",
    fontFamily: "'Segoe UI', sans-serif",
  },

  userInfo: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "25px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  loadingBox: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
  },

  statusBox: {
    backgroundColor: "#f0f7ff",
    borderLeft: "4px solid #c73e4e",
    padding: "18px 20px",
    borderRadius: "10px",
    marginBottom: "25px",
    display: "flex",
    flexDirection: "column",
  },

  statusLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "5px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  statusValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#c73e4e",
    fontFamily: "'Segoe UI', sans-serif",
  },

  infoGroup: {
    marginBottom: "25px",
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#374151",
  },

  progressSection: {
    marginBottom: "25px",
  },

  progressLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "10px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  progressBar: {
    width: "100%",
    height: "28px",
    backgroundColor: "#e5e7eb",
    borderRadius: "14px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#c73e4e",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    textAlign: "center",
    lineHeight: "28px",
    transition: "width 0.4s ease",
    fontFamily: "'Segoe UI', sans-serif",
  },

  layoutWithSidebar: {
    display: "flex",
    minHeight: "100vh",
  },
};

export default App;
