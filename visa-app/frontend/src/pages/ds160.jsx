import { useState, useEffect } from "react";

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
  const [seccionActual, setSeccionActual] = useState(1);
  const [formData, setFormData] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");

  const seccion = secciones.find(s => s.id === seccionActual);
  const totalSecciones = secciones.length;
  const progreso = (seccionActual / totalSecciones) * 100;

  // Cargar datos guardados
  useEffect(() => {
    const datosGuardados = localStorage.getItem("ds160_datos");
    if (datosGuardados) {
      setFormData(JSON.parse(datosGuardados));
    }
    const seccionGuardada = localStorage.getItem("ds160_seccion");
    if (seccionGuardada) {
      setSeccionActual(parseInt(seccionGuardada));
    }
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarProgreso = () => {
    setGuardando(true);
    localStorage.setItem("ds160_datos", JSON.stringify(formData));
    localStorage.setItem("ds160_seccion", seccionActual.toString());
    
    setTimeout(() => {
      setGuardando(false);
      setMensajeGuardado("✓ Progreso guardado");
      setTimeout(() => setMensajeGuardado(""), 3000);
    }, 500);
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
            <label style={styles.label}>{campo.label}</label>
            <input
              type={campo.type}
              style={styles.input}
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

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Formulario DS-160</h1>
          <p style={styles.subtitulo}>Sección {seccionActual}: {seccion?.titulo} ({seccionActual} de {totalSecciones})</p>
        </div>
        <button 
          style={styles.guardarBtn} 
          onClick={guardarProgreso}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "💾 Guardar progreso"}
        </button>
      </div>

      {/* Barra de progreso */}
      <div style={styles.progressContainer}>
        <div style={{...styles.progressBar, width: `${progreso}%`}} />
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
              ← Anterior
            </button>
            
            {seccionActual < totalSecciones ? (
              <button
                style={{...styles.navBtn, ...styles.navBtnPrimary}}
                onClick={siguienteSeccion}
              >
                Siguiente →
              </button>
            ) : (
              <button
                style={{...styles.navBtn, ...styles.navBtnPrimary}}
                onClick={() => {
                  guardarProgreso();
                  alert("¡Formulario completado! Los datos han sido guardados.");
                }}
              >
                ✓ Finalizar
              </button>
            )}
          </div>
        </div>

        {/* Sidebar de ayuda */}
        <div style={styles.sidebar}>
          {campoConAyuda?.porque && (
            <div style={styles.helpBox}>
              <h4 style={styles.helpTitle}>❓ ¿Por qué preguntan esto?</h4>
              <p style={styles.helpText}>{campoConAyuda.porque}</p>
            </div>
          )}

          {campoConAyuda?.tip && (
            <div style={styles.tipBox}>
              <h4 style={styles.tipTitle}>💡 Tip del Asesor</h4>
              <p style={styles.tipText}>✅ {campoConAyuda.tip}</p>
            </div>
          )}

          <div style={styles.helpBox}>
            <h4 style={styles.helpTitle}>📋 Secciones del formulario</h4>
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
                  {s.id < seccionActual ? "✓ " : s.id === seccionActual ? "● " : "○ "}
                  {s.titulo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Botón volver */}
      <button
        style={styles.volverBtn}
        onClick={() => window.location.href = "/dashboard"}
      >
        ← Volver al Dashboard
      </button>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "30px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  titulo: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
  },

  subtitulo: {
    margin: "5px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  guardarBtn: {
    background: "transparent",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  progressContainer: {
    width: "100%",
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "3px",
    marginBottom: "20px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#e11d48",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },

  mensajeGuardado: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  mainContent: {
    display: "flex",
    gap: "30px",
  },

  formSection: {
    flex: "1",
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  sidebar: {
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  campoContainer: {
    marginBottom: "24px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  },

  radioGroup: {
    display: "flex",
    gap: "12px",
  },

  radioBtn: {
    flex: 1,
    padding: "14px 20px",
    fontSize: "15px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  radioBtnSelected: {
    backgroundColor: "#1e293b",
    color: "white",
    borderColor: "#1e293b",
  },

  navegacion: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
  },

  navBtn: {
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  navBtnPrimary: {
    backgroundColor: "#e11d48",
    color: "white",
    border: "none",
  },

  navBtnSecondary: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  },

  helpBox: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  helpTitle: {
    margin: "0 0 10px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },

  helpText: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.6",
  },

  tipBox: {
    backgroundColor: "#fef9c3",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #fde047",
  },

  tipTitle: {
    margin: "0 0 10px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#854d0e",
  },

  tipText: {
    margin: 0,
    fontSize: "14px",
    color: "#713f12",
    lineHeight: "1.6",
  },

  seccionesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  seccionItem: {
    padding: "8px 0",
    fontSize: "13px",
    color: "#64748b",
    cursor: "pointer",
    transition: "color 0.2s",
  },

  seccionItemActual: {
    color: "#e11d48",
    fontWeight: "600",
  },

  seccionItemCompletada: {
    color: "#10b981",
  },

  volverBtn: {
    marginTop: "30px",
    padding: "12px 20px",
    fontSize: "14px",
    color: "#64748b",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
  },
};