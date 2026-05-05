import { useState, useEffect } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

// Estructura de las 10 secciones del DS-160
const secciones = [
  {
    id: 1,
    titulo: "Datos Personales",
    campos: [
      { 
        name: "apellidos", 
        label: "APELLIDOS (TAL COMO APARECEN EN TU PASAPORTE)", 
        type: "text",
        placeholder: "Ej: García López",
        tip: "Si tu pasaporte tiene un solo apellido, ingresa solo ese apellido. No agregues el apellido de soltera si no está en el pasaporte.",
        porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios. Deben coincidir exactamente con los de tu pasaporte actual, letra por letra."
      },
      { 
        name: "nombres", 
        label: "NOMBRES (TAL COMO APARECEN EN TU PASAPORTE)", 
        type: "text",
        placeholder: "Ej: María José",
        tip: "No uses tildes ni la letra 'ñ'. El sistema oficial las transformará automáticamente (ej: Núñez → Nunez).",
        porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios."
      },
      { 
        name: "otrosNombres", 
        label: "¿HAS USADO OTROS NOMBRES? (DE SOLTERA, RELIGIOSO, ETC.)", 
        type: "radio",
        opciones: ["Sí", "No"]
      },
      { 
        name: "otrosNombresDetalle", 
        label: "ESPECIFICA LOS OTROS NOMBRES", 
        type: "text",
        placeholder: "Ej: María García (nombre de soltera)",
        dependeDe: { campo: "otrosNombres", valor: "Sí" }
      },
      { 
        name: "fechaNacimiento", 
        label: "FECHA DE NACIMIENTO", 
        type: "date",
        porque: "Se usa para verificar tu identidad y calcular tu edad al momento de la solicitud."
      },
      { 
        name: "lugarNacimiento", 
        label: "CIUDAD DE NACIMIENTO", 
        type: "text",
        placeholder: "Ej: Ciudad de Guatemala"
      },
      { 
        name: "paisNacimiento", 
        label: "PAÍS DE NACIMIENTO", 
        type: "text",
        placeholder: "Ej: Guatemala"
      },
    ]
  },
  {
    id: 2,
    titulo: "Información de Contacto",
    campos: [
      { name: "direccion", label: "DIRECCIÓN DE RESIDENCIA", type: "text", placeholder: "Calle, número, zona" },
      { name: "ciudad", label: "CIUDAD", type: "text", placeholder: "Ej: Ciudad de Guatemala" },
      { name: "codigoPostal", label: "CÓDIGO POSTAL", type: "text", placeholder: "Ej: 01010" },
      { name: "telefono", label: "NÚMERO DE TELÉFONO", type: "tel", placeholder: "Ej: +502 1234 5678" },
      { name: "email", label: "CORREO ELECTRÓNICO", type: "email", placeholder: "tu@correo.com" },
    ]
  },
  {
    id: 3,
    titulo: "Información del Pasaporte",
    campos: [
      { name: "numeroPasaporte", label: "NÚMERO DE PASAPORTE", type: "text", placeholder: "Ej: A12345678" },
      { name: "paisEmision", label: "PAÍS DE EMISIÓN", type: "text", placeholder: "Ej: Guatemala" },
      { name: "fechaEmision", label: "FECHA DE EMISIÓN", type: "date" },
      { name: "fechaExpiracion", label: "FECHA DE EXPIRACIÓN", type: "date", tip: "Tu pasaporte debe tener al menos 6 meses de vigencia al momento del viaje." },
    ]
  },
  {
    id: 4,
    titulo: "Información del Viaje",
    campos: [
      { name: "proposito", label: "PROPÓSITO DEL VIAJE", type: "select", opciones: ["Turismo", "Negocios", "Estudio", "Trabajo", "Tránsito", "Tratamiento médico", "Otro"] },
      { name: "fechaViaje", label: "FECHA TENTATIVA DE VIAJE", type: "date" },
      { name: "duracionEstancia", label: "DURACIÓN DE LA ESTANCIA (DÍAS)", type: "number", placeholder: "Ej: 15" },
      { name: "direccionEEUU", label: "DIRECCIÓN DONDE TE HOSPEDARÁS EN EE.UU.", type: "text", placeholder: "Hotel, dirección de familiar, etc." },
    ]
  },
  {
    id: 5,
    titulo: "Acompañantes de Viaje",
    campos: [
      { name: "viajaAcompanado", label: "¿VIAJAS CON ALGUIEN MÁS?", type: "radio", opciones: ["Sí", "No"] },
      { name: "acompanantes", label: "NOMBRES DE LOS ACOMPAÑANTES", type: "text", placeholder: "Ej: Juan Pérez (esposo)", dependeDe: { campo: "viajaAcompanado", valor: "Sí" } },
      { name: "relacionAcompanantes", label: "RELACIÓN CON LOS ACOMPAÑANTES", type: "text", placeholder: "Ej: Familiar, amigo, colega", dependeDe: { campo: "viajaAcompanado", valor: "Sí" } },
    ]
  },
  {
    id: 6,
    titulo: "Viajes Anteriores a EE.UU.",
    campos: [
      { name: "visitadoEEUU", label: "¿HAS VISITADO EE.UU. ANTES?", type: "radio", opciones: ["Sí", "No"] },
      { name: "fechasVisitas", label: "FECHAS DE VISITAS ANTERIORES", type: "text", placeholder: "Ej: Junio 2019, Diciembre 2021", dependeDe: { campo: "visitadoEEUU", valor: "Sí" } },
      { name: "visaAnterior", label: "¿HAS TENIDO VISA AMERICANA ANTES?", type: "radio", opciones: ["Sí", "No"] },
      { name: "visaRechazada", label: "¿TE HAN RECHAZADO UNA VISA ANTES?", type: "radio", opciones: ["Sí", "No"] },
      { name: "motivoRechazo", label: "MOTIVO DEL RECHAZO", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "visaRechazada", valor: "Sí" } },
    ]
  },
  {
    id: 7,
    titulo: "Información Laboral",
    campos: [
      { name: "ocupacion", label: "OCUPACIÓN ACTUAL", type: "text", placeholder: "Ej: Ingeniero, Estudiante, Empresario" },
      { name: "empleador", label: "NOMBRE DEL EMPLEADOR O INSTITUCIÓN", type: "text", placeholder: "Ej: Empresa S.A. o Universidad del Valle" },
      { name: "direccionTrabajo", label: "DIRECCIÓN DEL TRABAJO", type: "text", placeholder: "Dirección completa" },
      { name: "telefonoTrabajo", label: "TELÉFONO DEL TRABAJO", type: "tel", placeholder: "Ej: +502 2222 3333" },
      { name: "ingresoMensual", label: "INGRESO MENSUAL APROXIMADO (USD)", type: "number", placeholder: "Ej: 1500" },
    ]
  },
  {
    id: 8,
    titulo: "Información Educativa",
    campos: [
      { name: "nivelEducativo", label: "NIVEL EDUCATIVO MÁS ALTO", type: "select", opciones: ["Primaria", "Secundaria", "Diversificado", "Universidad (incompleta)", "Universidad (completa)", "Maestría", "Doctorado"] },
      { name: "institucion", label: "NOMBRE DE LA INSTITUCIÓN", type: "text", placeholder: "Ej: Universidad del Valle de Guatemala" },
      { name: "carrera", label: "CARRERA O ÁREA DE ESTUDIO", type: "text", placeholder: "Ej: Ingeniería en Sistemas" },
    ]
  },
  {
    id: 9,
    titulo: "Información Familiar",
    campos: [
      { name: "estadoCivil", label: "ESTADO CIVIL", type: "select", opciones: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"] },
      { name: "nombreConyuge", label: "NOMBRE DEL CÓNYUGE", type: "text", placeholder: "Nombre completo", dependeDe: { campo: "estadoCivil", valor: "Casado/a" } },
      { name: "nombrePadre", label: "NOMBRE COMPLETO DEL PADRE", type: "text", placeholder: "Nombre completo" },
      { name: "nombreMadre", label: "NOMBRE COMPLETO DE LA MADRE", type: "text", placeholder: "Nombre completo" },
      { name: "familiaresEEUU", label: "¿TIENES FAMILIARES EN EE.UU.?", type: "radio", opciones: ["Sí", "No"] },
      { name: "detallesFamiliares", label: "DETALLE DE FAMILIARES EN EE.UU.", type: "text", placeholder: "Nombre, relación, estatus migratorio", dependeDe: { campo: "familiaresEEUU", valor: "Sí" } },
    ]
  },
  {
    id: 10,
    titulo: "Seguridad y Antecedentes",
    campos: [
      { name: "enfermedadContagiosa", label: "¿TIENES ALGUNA ENFERMEDAD CONTAGIOSA?", type: "radio", opciones: ["Sí", "No"] },
      { name: "arrestos", label: "¿HAS SIDO ARRESTADO O CONDENADO POR ALGÚN DELITO?", type: "radio", opciones: ["Sí", "No"] },
      { name: "detalleArrestos", label: "DETALLE DE ARRESTOS", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "arrestos", valor: "Sí" } },
      { name: "deportado", label: "¿HAS SIDO DEPORTADO DE ALGÚN PAÍS?", type: "radio", opciones: ["Sí", "No"] },
    ]
  },
];

export default function DS160Form() {
  const { isValidating: authValidating } = useRequireAuth();
  const [seccionActual, setSeccionActual] = useState(1);
  const [formData, setFormData] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [cargando, setCargando] = useState(true);
  const modoSenior = useModoSenior();

  const seccion = secciones.find(s => s.id === seccionActual);
  const totalSecciones = secciones.length;
  const progreso = (seccionActual / totalSecciones) * 100;

  // Cargar datos guardados
  // Cargar datos del formulario desde el backend
  useEffect(() => {
    const cargarFormulario = async () => {
      const sessionRaw = localStorage.getItem("visaguide_session");
      const correo = sessionRaw
        ? JSON.parse(sessionRaw).correo
        : localStorage.getItem("correoUsuario");

      if (!correo) {
        return;
      }

      try {
        const res = await fetch(
          `${buildApiUrl("/ds160")}?correo=${encodeURIComponent(correo)}`
        );

        if (!res.ok) {
          throw new Error("Error al cargar el formulario");
        }

        const data = await res.json();
        setFormData(data.datos || {});
        setSeccionActual(data.seccion_actual || 1);
      } catch (err) {
        console.error("Error cargando DS-160:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarFormulario();
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarProgreso = async () => {
    // Obtener correo del usuario desde la sesión
    const sessionRaw = localStorage.getItem("visaguide_session");
    const correo = sessionRaw
      ? JSON.parse(sessionRaw).correo
      : localStorage.getItem("correoUsuario");

    if (!correo) {
      return;
    }

    setGuardando(true);

    try {
      const res = await fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo,
          datos: formData,
          seccion_actual: seccionActual,
          completado: false,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al guardar el formulario");
      }

      setMensajeGuardado("Progreso guardado");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } catch (err) {
      console.error("Error guardando DS-160:", err);
      setMensajeGuardado("Error al guardar. Intenta de nuevo.");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } finally {
      setGuardando(false);
    }
  };
  const finalizarFormulario = async () => {
    const sessionRaw = localStorage.getItem("visaguide_session");
    const correo = sessionRaw
      ? JSON.parse(sessionRaw).correo
      : localStorage.getItem("correoUsuario");

    if (!correo) {
      return;
    }

    setGuardando(true);

    try {
      const res = await fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo,
          datos: formData,
          seccion_actual: seccionActual,
          completado: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al finalizar el formulario");
      }

      alert("¡Formulario completado! Los datos han sido guardados.");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error finalizando DS-160:", err);
      alert("Error al finalizar el formulario. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const siguienteSeccion = () => {
    if (seccionActual < totalSecciones) {
      setSeccionActual(seccionActual + 1);
      guardarProgreso();
      window.scrollTo(0, 0);
    }
  };

  const anteriorSeccion = () => {
    if (seccionActual > 1) {
      setSeccionActual(seccionActual - 1);
      window.scrollTo(0, 0);
    }
  };

  const debeMostrarCampo = (campo) => {
    if (!campo.dependeDe) return true;
    return formData[campo.dependeDe.campo] === campo.dependeDe.valor;
  };

  const renderCampo = (campo) => {
    if (!debeMostrarCampo(campo)) return null;

    switch (campo.type) {
      case "radio":
        return (
          <div key={campo.name} style={styles.campoContainer}>
            <label style={styles.label}>{campo.label}</label>
            <div style={styles.radioGroup}>
              {campo.opciones.map(opcion => (
                <button
                  key={opcion}
                  type="button"
                  style={{
                    ...styles.radioBtn,
                    ...(formData[campo.name] === opcion ? styles.radioBtnSelected : {})
                  }}
                  onClick={() => handleChange(campo.name, opcion)}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>
        );

      case "select":
        return (
          <div key={campo.name} style={styles.campoContainer}>
            <label style={styles.label}>{campo.label}</label>
            <select
              style={styles.input}
              value={formData[campo.name] || ""}
              onChange={(e) => handleChange(campo.name, e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              {campo.opciones.map(opcion => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </div>
        );

      default:
        return (
          <div key={campo.name} style={styles.campoContainer}>
            <label style={{
              ...styles.label,
              fontSize: modoSenior ? "14px" : "11px"
            }}>{campo.label}</label>
            <input
              type={campo.type}
              style={{
                ...styles.input,
                fontSize: modoSenior ? "18px" : "15px",
                padding: modoSenior ? "16px 18px" : "13px 16px"
              }}
              placeholder={campo.placeholder || ""}
              value={formData[campo.name] || ""}
              onChange={(e) => handleChange(campo.name, e.target.value)}
            />
          </div>
        );
    }
  };

  // Obtener el primer campo con tip o porque para mostrar en el sidebar
  const campoConAyuda = seccion?.campos.find(c => c.tip || c.porque);

  if (authValidating || cargando) {
    return (
      <div style={styles.layout}>
        <Sidebar currentPage="ds160" />
        <div style={styles.pageContainer}>
        <div style={styles.headerCard}>
          <p style={{ textAlign: "center", color: "#64748b", margin: 0 }}>
            Cargando formulario...
          </p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <Sidebar currentPage="ds160" />
      <div style={styles.pageContainer}>
        {/* Header card */}
        <div style={styles.headerCard}>
        <div style={styles.header}>
          <div>
            <h1 style={{
              ...styles.titulo,
              fontSize: modoSenior ? "30px" : "24px"
            }}>Formulario DS-160</h1>
            <p style={{
              ...styles.subtitulo,
              fontSize: modoSenior ? "16px" : "13px"
            }}>Sección {seccionActual}: {seccion?.titulo} ({seccionActual} de {totalSecciones})</p>
          </div>
          <button
            style={styles.guardarBtn}
            onClick={guardarProgreso}
            disabled={guardando}
          >
            <span style={styles.btnIcon} />
            {guardando ? "Guardando..." : "Guardar progreso"}
          </button>
        </div>
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progreso}%`}} />
        </div>
      </div>

      {mensajeGuardado && (
        <div style={styles.mensajeGuardado}>{mensajeGuardado}</div>
      )}

      {/* Contenido principal */}
      <div style={styles.mainContent}>
        {/* Formulario */}
        <div style={styles.formSection}>
          {seccion?.campos.map(campo => renderCampo(campo))}

          {/* Navegación */}
          <div style={styles.navegacion}>
            <button
              style={{...styles.navBtn, ...styles.navBtnSecondary}}
              onClick={anteriorSeccion}
              disabled={seccionActual === 1}
            >
              Anterior
            </button>
            
            {seccionActual < totalSecciones ? (
              <button
                style={{...styles.navBtn, ...styles.navBtnPrimary}}
                onClick={siguienteSeccion}
              >
                Siguiente
              </button>
            ) : (
              <button
                style={{...styles.navBtn, ...styles.navBtnPrimary}}
                onClick={finalizarFormulario}
                disabled={guardando}
              >
                {guardando ? "Finalizando..." : "Finalizar"}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar de ayuda */}
        <div style={styles.sidebar}>
          {campoConAyuda?.porque && (
            <div style={styles.helpBox}>
              <h4 style={styles.helpTitle}>
                <span style={styles.helpIcon} />
                ¿Por qué preguntan esto?
              </h4>
              <p style={styles.helpText}>{campoConAyuda.porque}</p>
            </div>
          )}

          {campoConAyuda?.tip && (
            <div style={styles.tipBox}>
              <h4 style={styles.tipTitle}>
                <span style={styles.tipIcon} />
                Tip del Asesor
              </h4>
              {campoConAyuda.tip.split(". ").filter(t => t.trim()).map((linea, i) => (
                <div key={i} style={styles.tipItem}>
                  <span style={styles.tipCheck} />
                  <span style={styles.tipText}>{linea.trim().replace(/\.$/, "")}.</span>
                </div>
              ))}
            </div>
          )}

          <div style={styles.seccionesBox}>
            <h4 style={styles.seccionesTitle}>Secciones del formulario</h4>
            <ul style={styles.seccionesList}>
              {secciones.map(s => (
                <li 
                  key={s.id} 
                  style={{
                    ...styles.seccionItem,
                    ...(s.id === seccionActual ? styles.seccionItemActual : {}),
                    ...(s.id < seccionActual ? styles.seccionItemCompletada : {})
                  }}
                  onClick={() => setSeccionActual(s.id)}
                >
                  {s.id < seccionActual ? "" : ""}
                  {s.titulo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    marginLeft: "250px",
    flex: 1,
    minHeight: "100vh",
    background: "#f1f3f6",
    padding: "28px 32px",
    fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "22px 28px 18px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
    marginBottom: "22px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },

  titulo: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },

  subtitulo: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  guardarBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "'Segoe UI', sans-serif",
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
  },

  // Espacio para ícono del botón guardar
  btnIcon: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    backgroundColor: "#94a3b8",
    borderRadius: "2px",
    flexShrink: 0,
  },

  progressContainer: {
    width: "100%",
    height: "5px",
    backgroundColor: "#e2e8f0",
    borderRadius: "99px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#e11d48",
    borderRadius: "99px",
    transition: "width 0.4s ease",
  },

  mensajeGuardado: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "18px",
    fontSize: "13px",
    fontWeight: "500",
  },

  mainContent: {
    display: "flex",
    gap: "22px",
    alignItems: "flex-start",
  },

  formSection: {
    flex: "1",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "28px 30px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
  },

  sidebar: {
    width: "310px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  campoContainer: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "7px",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
  },

  input: {
    width: "100%",
    padding: "13px 16px",
    fontSize: "15px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  radioGroup: {
    display: "flex",
    gap: "10px",
  },

  radioBtn: {
    flex: 1,
    padding: "13px 20px",
    fontSize: "14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#0f172a",
    fontWeight: "500",
  },

  radioBtnSelected: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderColor: "#0f172a",
  },

  navegacion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9",
  },

  navBtn: {
    padding: "13px 30px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "99px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
  },

  navBtnPrimary: {
    backgroundColor: "#e11d48",
    background: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 12px rgba(225,29,72,0.30)",
  },

  navBtnSecondary: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    padding: "13px 8px",
    fontWeight: "400",
  },

  // ¿Por qué preguntan esto? — ámbar suave
  helpBox: {
    backgroundColor: "#fffbeb",
    borderRadius: "12px",
    padding: "16px 18px",
    border: "1px solid #fde68a",
  },

  helpTitle: {
    margin: "0 0 10px 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // Espacio para ícono de ayuda (ⓘ)
  helpIcon: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "1.5px solid #d97706",
    flexShrink: 0,
  },

  helpText: {
    margin: 0,
    fontSize: "13px",
    color: "#78350f",
    lineHeight: "1.65",
  },

  // Tip del Asesor — navy oscuro
  tipBox: {
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    padding: "18px 20px",
    border: "2px solid #e11d48",
  },

  tipTitle: {
    margin: "0 0 14px 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // Espacio para ícono de tip (bombilla)
  tipIcon: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#334155",
    flexShrink: 0,
  },

  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
  },

  // Espacio para checkmark verde
  tipCheck: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "1.5px solid #10b981",
    flexShrink: 0,
    marginTop: "2px",
  },

  tipText: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.6",
  },

  seccionesBox: {
    backgroundColor: "#1e3a5f",
    borderRadius: "12px",
    padding: "18px 20px",
  },

  seccionesTitle: {
    margin: "0 0 14px 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: "0.3px",
  },

  seccionesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  seccionItem: {
    padding: "8px 0",
    fontSize: "13px",
    color: "#7fb3d3",
    cursor: "pointer",
    transition: "color 0.15s",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  seccionItemActual: {
    color: "#ffffff",
    fontWeight: "600",
  },

  seccionItemCompletada: {
    color: "#34d399",
  },

  volverBtn: {
    marginTop: "22px",
    padding: "11px 18px",
    fontSize: "13px",
    color: "#64748b",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },

  layout: {
    display: "flex",
    minHeight: "100vh",
  },
};