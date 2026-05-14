import { useState, useEffect } from "react";
import { buildApiUrl } from "../config/api";
import Sidebar from "../components/Sidebar";
import useModoSenior from "../hooks/useModoSenior";
import useRequireAuth from "../hooks/useRequireAuth";

const secciones = [
  {
    id: 1,
    titulo: "Datos Personales",
    campos: [
      { name: "apellidos", label: "APELLIDOS (TAL COMO APARECEN EN TU PASAPORTE)", type: "text", placeholder: "Ej: C\u00e1rdenas", tip: "Si tu pasaporte tiene un solo apellido, ingresa solo ese apellido. No agregues el apellido de soltera si no est\u00e1 en el pasaporte.", porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios. Deben coincidir exactamente con los de tu pasaporte actual, letra por letra." },
      { name: "nombres", label: "NOMBRES (TAL COMO APARECEN EN TU PASAPORTE)", type: "text", placeholder: "Ej: Mar\u00eda", tip: "No uses tildes ni la letra '\u00f1'. El sistema oficial las transformar\u00e1 autom\u00e1ticamente (ej: N\u00fa\u00f1ez \u2192 Nunez).", porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios." },
      { name: "otrosNombres", label: "\u00bfHAS USADO OTROS NOMBRES? (DE SOLTERA, RELIGIOSO, ETC.)", type: "radio", opciones: ["S\u00ed", "No"] },
      { name: "otrosNombresDetalle", label: "ESPECIFICA LOS OTROS NOMBRES", type: "text", placeholder: "Ej: Mar\u00eda Garc\u00eda (nombre de soltera)", dependeDe: { campo: "otrosNombres", valor: "S\u00ed" } },
      { name: "fechaNacimiento", label: "FECHA DE NACIMIENTO", type: "date", porque: "Se usa para verificar tu identidad y calcular tu edad al momento de la solicitud." },
      { name: "lugarNacimiento", label: "CIUDAD DE NACIMIENTO", type: "text", placeholder: "Ej: Ciudad de Guatemala" },
      { name: "paisNacimiento", label: "PA\u00cdS DE NACIMIENTO", type: "text", placeholder: "Ej: Guatemala" },
    ],
  },
  { id: 2, titulo: "Informaci\u00f3n de Contacto", campos: [
    { name: "direccion", label: "DIRECCI\u00d3N DE RESIDENCIA", type: "text", placeholder: "Calle, n\u00famero, zona" },
    { name: "ciudad", label: "CIUDAD", type: "text", placeholder: "Ej: Ciudad de Guatemala" },
    { name: "codigoPostal", label: "C\u00d3DIGO POSTAL", type: "text", placeholder: "Ej: 01010" },
    { name: "telefono", label: "N\u00daMERO DE TEL\u00c9FONO", type: "tel", placeholder: "Ej: +502 1234 5678" },
    { name: "email", label: "CORREO ELECTR\u00d3NICO", type: "email", placeholder: "tu@correo.com" },
  ]},
  { id: 3, titulo: "Informaci\u00f3n del Pasaporte", campos: [
    { name: "numeroPasaporte", label: "N\u00daMERO DE PASAPORTE", type: "text", placeholder: "Ej: A12345678" },
    { name: "paisEmision", label: "PA\u00cdS DE EMISI\u00d3N", type: "text", placeholder: "Ej: Guatemala" },
    { name: "fechaEmision", label: "FECHA DE EMISI\u00d3N", type: "date" },
    { name: "fechaExpiracion", label: "FECHA DE EXPIRACI\u00d3N", type: "date", tip: "Tu pasaporte debe tener al menos 6 meses de vigencia al momento del viaje." },
  ]},
  { id: 4, titulo: "Informaci\u00f3n del Viaje", campos: [
    { name: "proposito", label: "PROP\u00d3SITO DEL VIAJE", type: "select", opciones: ["Turismo", "Negocios", "Estudio", "Trabajo", "Tr\u00e1nsito", "Tratamiento m\u00e9dico", "Otro"] },
    { name: "fechaViaje", label: "FECHA TENTATIVA DE VIAJE", type: "date" },
    { name: "duracionEstancia", label: "DURACI\u00d3N DE LA ESTANCIA (D\u00cdAS)", type: "number", placeholder: "Ej: 15" },
    { name: "direccionEEUU", label: "DIRECCI\u00d3N DONDE TE HOSPEDAR\u00c1S EN EE.UU.", type: "text", placeholder: "Hotel, direcci\u00f3n de familiar, etc." },
  ]},
  { id: 5, titulo: "Acompa\u00f1antes de Viaje", campos: [
    { name: "viajaAcompanado", label: "\u00bfVIAJAS CON ALGUIEN M\u00c1S?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "acompanantes", label: "NOMBRES DE LOS ACOMPA\u00d1ANTES", type: "text", placeholder: "Ej: Juan P\u00e9rez (esposo)", dependeDe: { campo: "viajaAcompanado", valor: "S\u00ed" } },
    { name: "relacionAcompanantes", label: "RELACI\u00d3N CON LOS ACOMPA\u00d1ANTES", type: "text", placeholder: "Ej: Familiar, amigo, colega", dependeDe: { campo: "viajaAcompanado", valor: "S\u00ed" } },
  ]},
  { id: 6, titulo: "Viajes Anteriores a EE.UU.", campos: [
    { name: "visitadoEEUU", label: "\u00bfHAS VISITADO EE.UU. ANTES?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "fechasVisitas", label: "FECHAS DE VISITAS ANTERIORES", type: "text", placeholder: "Ej: Junio 2019, Diciembre 2021", dependeDe: { campo: "visitadoEEUU", valor: "S\u00ed" } },
    { name: "visaAnterior", label: "\u00bfHAS TENIDO VISA AMERICANA ANTES?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "visaRechazada", label: "\u00bfTE HAN RECHAZADO UNA VISA ANTES?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "motivoRechazo", label: "MOTIVO DEL RECHAZO", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "visaRechazada", valor: "S\u00ed" } },
  ]},
  { id: 7, titulo: "Informaci\u00f3n Laboral", campos: [
    { name: "ocupacion", label: "OCUPACI\u00d3N ACTUAL", type: "text", placeholder: "Ej: Ingeniero, Estudiante, Empresario" },
    { name: "empleador", label: "NOMBRE DEL EMPLEADOR O INSTITUCI\u00d3N", type: "text", placeholder: "Ej: Empresa S.A." },
    { name: "direccionTrabajo", label: "DIRECCI\u00d3N DEL TRABAJO", type: "text", placeholder: "Direcci\u00f3n completa" },
    { name: "telefonoTrabajo", label: "TEL\u00c9FONO DEL TRABAJO", type: "tel", placeholder: "Ej: +502 2222 3333" },
    { name: "ingresoMensual", label: "INGRESO MENSUAL APROXIMADO (USD)", type: "number", placeholder: "Ej: 1500" },
  ]},
  { id: 8, titulo: "Informaci\u00f3n Educativa", campos: [
    { name: "nivelEducativo", label: "NIVEL EDUCATIVO M\u00c1S ALTO", type: "select", opciones: ["Primaria", "Secundaria", "Diversificado", "Universidad (incompleta)", "Universidad (completa)", "Maestr\u00eda", "Doctorado"] },
    { name: "institucion", label: "NOMBRE DE LA INSTITUCI\u00d3N", type: "text", placeholder: "Ej: Universidad del Valle de Guatemala" },
    { name: "carrera", label: "CARRERA O \u00c1REA DE ESTUDIO", type: "text", placeholder: "Ej: Ingenier\u00eda en Sistemas" },
  ]},
  { id: 9, titulo: "Informaci\u00f3n Familiar", campos: [
    { name: "estadoCivil", label: "ESTADO CIVIL", type: "select", opciones: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Uni\u00f3n libre"] },
    { name: "nombreConyuge", label: "NOMBRE DEL C\u00d3NYUGE", type: "text", placeholder: "Nombre completo", dependeDe: { campo: "estadoCivil", valor: "Casado/a" } },
    { name: "nombrePadre", label: "NOMBRE COMPLETO DEL PADRE", type: "text", placeholder: "Nombre completo" },
    { name: "nombreMadre", label: "NOMBRE COMPLETO DE LA MADRE", type: "text", placeholder: "Nombre completo" },
    { name: "familiaresEEUU", label: "\u00bfTIENES FAMILIARES EN EE.UU.?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "detallesFamiliares", label: "DETALLE DE FAMILIARES EN EE.UU.", type: "text", placeholder: "Nombre, relaci\u00f3n, estatus migratorio", dependeDe: { campo: "familiaresEEUU", valor: "S\u00ed" } },
  ]},
  { id: 10, titulo: "Seguridad y Antecedentes", campos: [
    { name: "enfermedadContagiosa", label: "\u00bfTIENES ALGUNA ENFERMEDAD CONTAGIOSA?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "arrestos", label: "\u00bfHAS SIDO ARRESTADO O CONDENADO POR ALG\u00daN DELITO?", type: "radio", opciones: ["S\u00ed", "No"] },
    { name: "detalleArrestos", label: "DETALLE DE ARRESTOS", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "arrestos", valor: "S\u00ed" } },
    { name: "deportado", label: "\u00bfHAS SIDO DEPORTADO DE ALG\u00daN PA\u00cdS?", type: "radio", opciones: ["S\u00ed", "No"] },
  ]},
];

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="#10b981" strokeWidth="1.8" />
      <polyline points="7,12.5 10.5,16 17,8.5"
        stroke="#10b981" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#d97706" strokeWidth="1.8" />
      <line x1="12" y1="8"  x2="12" y2="12" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export default function DS160Form() {
  const { isValidating: authValidating } = useRequireAuth();
  const [seccionActual,   setSeccionActual]   = useState(1);
  const [formData,        setFormData]        = useState({});
  const [guardando,       setGuardando]       = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [cargando,        setCargando]        = useState(true);
  const modoSenior = useModoSenior();

  const seccion        = secciones.find(s => s.id === seccionActual);
  const totalSecciones = secciones.length;
  const progreso       = (seccionActual / totalSecciones) * 100;

  useEffect(() => {
    const cargar = async () => {
      const sessionRaw = localStorage.getItem("visaguide_session");
      const correo = sessionRaw
        ? JSON.parse(sessionRaw).correo
        : localStorage.getItem("correoUsuario");
      if (!correo) { setCargando(false); return; }
      try {
        const res  = await fetch(`${buildApiUrl("/ds160")}?correo=${encodeURIComponent(correo)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData(data.datos || {});
        setSeccionActual(data.seccion_actual || 1);
      } catch { /* ignorar */ } finally { setCargando(false); }
    };
    cargar();
  }, []);

  const handleChange = (name, value) => setFormData(p => ({ ...p, [name]: value }));

  const getCorreo = () => {
    const sessionRaw = localStorage.getItem("visaguide_session");
    return sessionRaw
      ? JSON.parse(sessionRaw).correo
      : localStorage.getItem("correoUsuario");
  };

  const guardarProgreso = async () => {
    const correo = getCorreo();
    if (!correo) return;
    setGuardando(true);
    try {
      const res = await fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, datos: formData, seccion_actual: seccionActual, completado: false }),
      });
      if (!res.ok) throw new Error();
      setMensajeGuardado("\u2713 Progreso guardado");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } catch {
      setMensajeGuardado("Error al guardar. Intenta de nuevo.");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } finally { setGuardando(false); }
  };

  const finalizarFormulario = async () => {
    const correo = getCorreo();
    if (!correo) return;
    setGuardando(true);
    try {
      await fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, datos: formData, seccion_actual: seccionActual, completado: true }),
      });
      alert("\u00a1Formulario completado! Los datos han sido guardados.");
      window.location.href = "/dashboard";
    } catch { alert("Error al finalizar el formulario. Intenta de nuevo."); }
    finally { setGuardando(false); }
  };

  const siguienteSeccion = () => {
    if (seccionActual < totalSecciones) {
      setSeccionActual(s => s + 1);
      guardarProgreso();
      window.scrollTo(0, 0);
    }
  };

  const anteriorSeccion = () => {
    if (seccionActual > 1) { setSeccionActual(s => s - 1); window.scrollTo(0, 0); }
  };

  const debeMostrar = (campo) =>
    !campo.dependeDe || formData[campo.dependeDe.campo] === campo.dependeDe.valor;

  const renderCampo = (campo) => {
    if (!debeMostrar(campo)) return null;

    if (campo.type === "radio") return (
      <div key={campo.name} style={st.campoContainer}>
        <label style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>{campo.label}</label>
        <div style={st.radioGroup}>
          {campo.opciones.map(op => (
            <button key={op} type="button"
              style={{ ...st.radioBtn, ...(formData[campo.name] === op ? st.radioBtnSel : {}), fontSize: modoSenior ? "16px" : "14px" }}
              onClick={() => handleChange(campo.name, op)}>{op}</button>
          ))}
        </div>
      </div>
    );

    if (campo.type === "select") return (
      <div key={campo.name} style={st.campoContainer}>
        <label style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>{campo.label}</label>
        <select style={{ ...st.input, fontSize: modoSenior ? "17px" : "15px" }}
          value={formData[campo.name] || ""} onChange={e => handleChange(campo.name, e.target.value)}>
          <option value="">Selecciona una opci\u00f3n</option>
          {campo.opciones.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
      </div>
    );

    return (
      <div key={campo.name} style={st.campoContainer}>
        <label style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>{campo.label}</label>
        <input type={campo.type}
          style={{ ...st.input, fontSize: modoSenior ? "17px" : "15px", padding: modoSenior ? "15px 18px" : "12px 16px" }}
          placeholder={campo.placeholder || ""} value={formData[campo.name] || ""}
          onChange={e => handleChange(campo.name, e.target.value)} />
      </div>
    );
  };

  const campoConAyuda = seccion?.campos.find(c => c.tip || c.porque);

  if (authValidating || cargando) return (
    <div style={st.layout}>
      <Sidebar currentPage="ds160" />
      <div style={st.page}>
        <div style={st.headerCard}>
          <p style={{ textAlign: "center", color: "#64748b", margin: 0 }}>Cargando formulario...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={st.layout}>
      <Sidebar currentPage="ds160" />
      <div style={st.page}>

        {/* HEADER */}
        <div style={st.headerCard}>
          <div style={st.headerRow}>
            <div>
              <h1 style={{ ...st.titulo, fontSize: modoSenior ? "28px" : "22px" }}>Formulario DS-160</h1>
              <p style={{ ...st.subtitulo, fontSize: modoSenior ? "15px" : "13px" }}>
                Secci\u00f3n {seccionActual}: {seccion?.titulo} ({seccionActual} de {totalSecciones})
              </p>
            </div>
            <button style={st.guardarBtn} onClick={guardarProgreso} disabled={guardando} aria-label="Guardar progreso">
              <SaveIcon />
              {guardando ? "Guardando..." : "Guardar progreso"}
            </button>
          </div>
          <div style={st.barTrack} role="progressbar" aria-valuenow={Math.round(progreso)} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ ...st.barFill, width: `${progreso}%` }} />
          </div>
        </div>

        {mensajeGuardado && (
          <div style={{ ...st.toast, background: mensajeGuardado.startsWith("\u2713") ? "#f0fdf4" : "#fef2f2", borderColor: mensajeGuardado.startsWith("\u2713") ? "#bbf7d0" : "#fecaca", color: mensajeGuardado.startsWith("\u2713") ? "#15803d" : "#dc2626" }}>
            {mensajeGuardado}
          </div>
        )}

        {/* MAIN */}
        <div style={st.mainContent}>

          {/* Formulario */}
          <div style={st.formCard}>
            {seccion?.campos.map(c => renderCampo(c))}
            <div style={st.navegacion}>
              <button style={{ ...st.navBtn, ...st.navBack, fontSize: modoSenior ? "15px" : "13px", opacity: seccionActual === 1 ? 0.4 : 1 }}
                onClick={anteriorSeccion} disabled={seccionActual === 1}>&larr; Anterior</button>
              {seccionActual < totalSecciones ? (
                <button style={{ ...st.navBtn, ...st.navNext, fontSize: modoSenior ? "16px" : "14px" }} onClick={siguienteSeccion}>Siguiente &rarr;</button>
              ) : (
                <button style={{ ...st.navBtn, ...st.navNext, fontSize: modoSenior ? "16px" : "14px", opacity: guardando ? 0.7 : 1 }}
                  onClick={finalizarFormulario} disabled={guardando}>
                  {guardando ? "Finalizando..." : "Finalizar \u2713"}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar de ayuda */}
          <div style={st.helpSidebar}>

            {campoConAyuda?.porque && (
              <div style={st.helpBox}>
                <div style={st.helpTitleRow}>
                  <InfoCircleIcon />
                  <h4 style={{ ...st.helpTitle, fontSize: modoSenior ? "15px" : "13px" }}>
                    \u00bfPor qu\u00e9 preguntan esto?
                  </h4>
                </div>
                <p style={{ ...st.helpText, fontSize: modoSenior ? "15px" : "13px" }}>
                  {campoConAyuda.porque}
                </p>
              </div>
            )}

            {campoConAyuda?.tip && (
              <div style={st.tipBox}>
                <div style={st.tipTitleRow}>
                  {/* espacio para ícono de tip */}
                  <h4 style={{ ...st.tipTitle, fontSize: modoSenior ? "15px" : "13px" }}>Tip del Asesor</h4>
                </div>
                {campoConAyuda.tip.split(". ").filter(t => t.trim()).map((linea, i) => (
                  <div key={i} style={st.tipItem}>
                    <CheckCircleIcon />
                    <span style={{ ...st.tipText, fontSize: modoSenior ? "14px" : "13px" }}>
                      {linea.trim().replace(/\.$/, "")}.
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={st.seccionesBox}>
              <h4 style={{ ...st.seccionesTitle, fontSize: modoSenior ? "13px" : "11px" }}>
                SECCIONES DEL FORMULARIO
              </h4>
              <ul style={st.seccionesList}>
                {secciones.map(sc => (
                  <li key={sc.id}
                    style={{ ...st.seccionItem, ...(sc.id === seccionActual ? st.seccionActual : {}), ...(sc.id < seccionActual ? st.seccionDone : {}), fontSize: modoSenior ? "14px" : "13px" }}
                    onClick={() => setSeccionActual(sc.id)}>
                    {sc.id < seccionActual && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        style={{ marginRight: "6px", flexShrink: 0 }} aria-hidden="true">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                    {sc.titulo}
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

const st = {
  layout: { display: "flex", minHeight: "100vh" },

  page: {
    marginLeft: "250px",
    flex: 1,
    minHeight: "100vh",
    background: "#f1f3f6",
    padding: "28px 32px",
    fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  headerCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "20px 26px 16px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
    marginBottom: "20px",
    border: "1px solid #e2e8f0",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },

  titulo:   { margin: 0, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" },
  subtitulo:{ margin: "3px 0 0 0", color: "#64748b" },

  guardarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
    fontFamily: "'Segoe UI', sans-serif",
    flexShrink: 0,
  },

  barTrack: { width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" },
  barFill:  { height: "100%", background: "#e11d48", borderRadius: "99px", transition: "width 0.4s ease" },

  toast: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid",
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: 500,
  },

  mainContent: { display: "flex", gap: "20px", alignItems: "flex-start" },

  formCard: {
    flex: 1,
    background: "#ffffff",
    borderRadius: "14px",
    padding: "28px 28px 24px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },

  helpSidebar: { width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" },

  campoContainer: { marginBottom: "20px" },

  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "7px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#0f172a",
    background: "#ffffff",
  },

  radioGroup: { display: "flex", gap: "10px" },

  radioBtn: {
    flex: 1,
    padding: "12px 20px",
    fontSize: "14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    background: "#ffffff",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#0f172a",
    fontWeight: 500,
  },

  radioBtnSel: { background: "#0f172a", color: "#ffffff", borderColor: "#0f172a" },

  navegacion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
    paddingTop: "18px",
    borderTop: "1px solid #f1f5f9",
  },

  navBtn: {
    padding: "12px 28px",
    fontWeight: 600,
    borderRadius: "99px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
    border: "none",
  },

  navNext: { background: "linear-gradient(135deg,#e11d48 0%,#f43f5e 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(225,29,72,0.28)" },
  navBack: { background: "transparent", color: "#64748b", padding: "12px 4px", fontWeight: 400 },

  /* Caja amarilla */
  helpBox: {
    background: "#fffbeb",
    borderRadius: "12px",
    padding: "16px 18px",
    border: "1px solid #fde68a",
  },

  helpTitleRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" },
  helpTitle:    { margin: 0, fontWeight: 700, color: "#92400e" },
  helpText:     { margin: 0, color: "#78350f", lineHeight: 1.65 },

  /* Caja navy con borde rojo */
  tipBox: {
    background: "#0f172a",
    borderRadius: "12px",
    padding: "18px 20px",
    border: "2px solid #e11d48",
  },

  tipTitleRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" },
  tipTitle:    { margin: 0, fontWeight: 700, color: "#f8fafc" },
  tipItem:     { display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" },
  tipText:     { margin: 0, color: "#94a3b8", lineHeight: 1.6 },

  /* Lista de secciones */
  seccionesBox: { background: "#1e3a5f", borderRadius: "12px", padding: "18px 20px" },

  seccionesTitle: {
    margin: "0 0 12px 0",
    fontWeight: 700,
    color: "#e2e8f0",
    letterSpacing: "0.5px",
  },

  seccionesList: { listStyle: "none", padding: 0, margin: 0 },

  seccionItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px 0",
    color: "#7fb3d3",
    cursor: "pointer",
    transition: "color 0.15s",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    lineHeight: 1.4,
  },

  seccionActual: { color: "#ffffff", fontWeight: 700 },
  seccionDone:   { color: "#34d399" },
};
