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
      { 
        name: "apellidos", 
        label: "APELLIDOS (TAL COMO APARECEN EN TU PASAPORTE)", 
        type: "text", 
        placeholder: "Ej: Cárdenas", 
        required: true,
        validation: { minLength: 2, maxLength: 50, pattern: "letras" },
        tip: "Si tu pasaporte tiene un solo apellido, ingresa solo ese apellido. No agregues el apellido de soltera si no está en el pasaporte.", 
        porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios. Deben coincidir exactamente con los de tu pasaporte actual, letra por letra." 
      },
      { 
        name: "nombres", 
        label: "NOMBRES (TAL COMO APARECEN EN TU PASAPORTE)", 
        type: "text", 
        placeholder: "Ej: María", 
        required: true,
        validation: { minLength: 2, maxLength: 50, pattern: "letras" },
        tip: "No uses tildes ni la letra 'ñ'. El sistema oficial las transformará automáticamente (ej: Núñez → Nunez).", 
        porque: "El consulado utiliza estos nombres exactos para verificar tus antecedentes penales y migratorios." 
      },
      { name: "otrosNombres", label: "¿HAS USADO OTROS NOMBRES? (DE SOLTERA, RELIGIOSO, ETC.)", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "otrosNombresDetalle", label: "ESPECIFICA LOS OTROS NOMBRES", type: "text", placeholder: "Ej: María García (nombre de soltera)", dependeDe: { campo: "otrosNombres", valor: "Sí" } },
      { 
        name: "fechaNacimiento", 
        label: "FECHA DE NACIMIENTO", 
        type: "date", 
        required: true,
        validation: { tipo: "fechaPasada" },
        porque: "Se usa para verificar tu identidad y calcular tu edad al momento de la solicitud." 
      },
      { name: "lugarNacimiento", label: "CIUDAD DE NACIMIENTO", type: "text", placeholder: "Ej: Ciudad de Guatemala", required: true },
      { name: "paisNacimiento", label: "PAÍS DE NACIMIENTO", type: "text", placeholder: "Ej: Guatemala", required: true },
    ],
  },
  { 
    id: 2, 
    titulo: "Información de Contacto", 
    campos: [
      { 
        name: "direccion", 
        label: "DIRECCIÓN DE RESIDENCIA", 
        type: "text", 
        placeholder: "Calle, número, zona", 
        required: true,
        validation: { minLength: 10, maxLength: 200 }
      },
      { name: "ciudad", label: "CIUDAD", type: "text", placeholder: "Ej: Ciudad de Guatemala", required: true },
      { name: "codigoPostal", label: "CÓDIGO POSTAL", type: "text", placeholder: "Ej: 01010" },
      { 
        name: "telefono", 
        label: "NÚMERO DE TELÉFONO", 
        type: "tel", 
        placeholder: "Ej: +502 1234 5678", 
        required: true,
        validation: { minLength: 8, pattern: "telefono" }
      },
      { 
        name: "email", 
        label: "CORREO ELECTRÓNICO", 
        type: "email", 
        placeholder: "tu@correo.com", 
        required: true,
        validation: { pattern: "email" }
      },
    ]
  },
  { 
    id: 3, 
    titulo: "Información del Pasaporte", 
    campos: [
      { 
        name: "numeroPasaporte", 
        label: "NÚMERO DE PASAPORTE", 
        type: "text", 
        placeholder: "Ej: A12345678", 
        required: true,
        validation: { minLength: 6, maxLength: 20 }
      },
      { name: "paisEmision", label: "PAÍS DE EMISIÓN", type: "text", placeholder: "Ej: Guatemala", required: true },
      { 
        name: "fechaEmision", 
        label: "FECHA DE EMISIÓN", 
        type: "date", 
        required: true,
        validation: { tipo: "fechaPasada" }
      },
      { 
        name: "fechaExpiracion", 
        label: "FECHA DE EXPIRACIÓN", 
        type: "date", 
        required: true,
        validation: { tipo: "fechaFutura" },
        tip: "Tu pasaporte debe tener al menos 6 meses de vigencia al momento del viaje." 
      },
    ]
  },
  { 
    id: 4, 
    titulo: "Información del Viaje", 
    campos: [
      { name: "proposito", label: "PROPÓSITO DEL VIAJE", type: "select", opciones: ["Turismo", "Negocios", "Estudio", "Trabajo", "Tránsito", "Tratamiento médico", "Otro"], required: true },
      { 
        name: "fechaViaje", 
        label: "FECHA TENTATIVA DE VIAJE", 
        type: "date", 
        required: true,
        validation: { tipo: "fechaFutura" }
      },
      { 
        name: "duracionEstancia", 
        label: "DURACIÓN DE LA ESTANCIA (DÍAS)", 
        type: "number", 
        placeholder: "Ej: 15", 
        required: true,
        validation: { min: 1, max: 180 }
      },
      { 
        name: "direccionEEUU", 
        label: "DIRECCIÓN DONDE TE HOSPEDARÁS EN EE.UU.", 
        type: "text", 
        placeholder: "Hotel, dirección de familiar, etc.", 
        required: true,
        validation: { minLength: 10 }
      },
    ]
  },
  { 
    id: 5, 
    titulo: "Acompañantes de Viaje", 
    campos: [
      { name: "viajaAcompanado", label: "¿VIAJAS CON ALGUIEN MÁS?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "acompanantes", label: "NOMBRES DE LOS ACOMPAÑANTES", type: "text", placeholder: "Ej: Juan Pérez (esposo)", dependeDe: { campo: "viajaAcompanado", valor: "Sí" }, required: true },
      { name: "relacionAcompanantes", label: "RELACIÓN CON LOS ACOMPAÑANTES", type: "text", placeholder: "Ej: Familiar, amigo, colega", dependeDe: { campo: "viajaAcompanado", valor: "Sí" }, required: true },
    ]
  },
  { 
    id: 6, 
    titulo: "Viajes Anteriores a EE.UU.", 
    campos: [
      { name: "visitadoEEUU", label: "¿HAS VISITADO EE.UU. ANTES?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "fechasVisitas", label: "FECHAS DE VISITAS ANTERIORES", type: "text", placeholder: "Ej: Junio 2019, Diciembre 2021", dependeDe: { campo: "visitadoEEUU", valor: "Sí" } },
      { name: "visaAnterior", label: "¿HAS TENIDO VISA AMERICANA ANTES?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "visaRechazada", label: "¿TE HAN RECHAZADO UNA VISA ANTES?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "motivoRechazo", label: "MOTIVO DEL RECHAZO", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "visaRechazada", valor: "Sí" }, required: true },
    ]
  },
  { 
    id: 7, 
    titulo: "Información Laboral", 
    campos: [
      { name: "ocupacion", label: "OCUPACIÓN ACTUAL", type: "text", placeholder: "Ej: Ingeniero, Estudiante, Empresario", required: true },
      { name: "empleador", label: "NOMBRE DEL EMPLEADOR O INSTITUCIÓN", type: "text", placeholder: "Ej: Empresa S.A.", required: true },
      { 
        name: "direccionTrabajo", 
        label: "DIRECCIÓN DEL TRABAJO", 
        type: "text", 
        placeholder: "Dirección completa",
        validation: { minLength: 10 }
      },
      { 
        name: "telefonoTrabajo", 
        label: "TELÉFONO DEL TRABAJO", 
        type: "tel", 
        placeholder: "Ej: +502 2222 3333",
        validation: { pattern: "telefono" }
      },
      { 
        name: "ingresoMensual", 
        label: "INGRESO MENSUAL APROXIMADO (USD)", 
        type: "number", 
        placeholder: "Ej: 1500",
        validation: { min: 0 }
      },
    ]
  },
  { 
    id: 8, 
    titulo: "Información Educativa", 
    campos: [
      { name: "nivelEducativo", label: "NIVEL EDUCATIVO MÁS ALTO", type: "select", opciones: ["Primaria", "Secundaria", "Diversificado", "Universidad (incompleta)", "Universidad (completa)", "Maestría", "Doctorado"], required: true },
      { name: "institucion", label: "NOMBRE DE LA INSTITUCIÓN", type: "text", placeholder: "Ej: Universidad del Valle de Guatemala", required: true },
      { name: "carrera", label: "CARRERA O ÁREA DE ESTUDIO", type: "text", placeholder: "Ej: Ingeniería en Sistemas" },
    ]
  },
  { 
    id: 9, 
    titulo: "Información Familiar", 
    campos: [
      { name: "estadoCivil", label: "ESTADO CIVIL", type: "select", opciones: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"], required: true },
      { name: "nombreConyuge", label: "NOMBRE DEL CÓNYUGE", type: "text", placeholder: "Nombre completo", dependeDe: { campo: "estadoCivil", valor: "Casado/a" }, required: true },
      { name: "nombrePadre", label: "NOMBRE COMPLETO DEL PADRE", type: "text", placeholder: "Nombre completo", required: true },
      { name: "nombreMadre", label: "NOMBRE COMPLETO DE LA MADRE", type: "text", placeholder: "Nombre completo", required: true },
      { name: "familiaresEEUU", label: "¿TIENES FAMILIARES EN EE.UU.?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "detallesFamiliares", label: "DETALLE DE FAMILIARES EN EE.UU.", type: "text", placeholder: "Nombre, relación, estatus migratorio", dependeDe: { campo: "familiaresEEUU", valor: "Sí" }, required: true },
    ]
  },
  { 
    id: 10, 
    titulo: "Seguridad y Antecedentes", 
    campos: [
      { name: "enfermedadContagiosa", label: "¿TIENES ALGUNA ENFERMEDAD CONTAGIOSA?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "arrestos", label: "¿HAS SIDO ARRESTADO O CONDENADO POR ALGÚN DELITO?", type: "radio", opciones: ["Sí", "No"], required: true },
      { name: "detalleArrestos", label: "DETALLE DE ARRESTOS", type: "text", placeholder: "Explica brevemente", dependeDe: { campo: "arrestos", valor: "Sí" }, required: true },
      { name: "deportado", label: "¿HAS SIDO DEPORTADO DE ALGÚN PAÍS?", type: "radio", opciones: ["Sí", "No"], required: true },
    ]
  },
];

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="var(--vg-success)" strokeWidth="1.8" />
      <polyline points="7,12.5 10.5,16 17,8.5"
        stroke="var(--vg-success)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="var(--vg-warning)" strokeWidth="1.8" />
      <line x1="12" y1="8"  x2="12" y2="12" stroke="var(--vg-warning)" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="var(--vg-warning)" strokeWidth="2.5" strokeLinecap="round" />
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
  const st = getSt();
  const [seccionActual,   setSeccionActual]   = useState(1);
  const [formData,        setFormData]        = useState({});
  const [errores,         setErrores]         = useState({});
  const [guardando,       setGuardando]       = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [cargando,        setCargando]        = useState(true);
  const modoSenior = useModoSenior();

  const seccion        = secciones.find(s => s.id === seccionActual);
  const totalSecciones = secciones.length;
  const progreso       = (seccionActual / totalSecciones) * 100;

  // IMPORTANTE: debeMostrar debe estar definido ANTES de las funciones que lo usan
  const debeMostrar = (campo) =>
    !campo.dependeDe || formData[campo.dependeDe.campo] === campo.dependeDe.valor;

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

  // Auto-guardado cada 30 segundos
useEffect(() => {
  // No iniciar el auto-guardado hasta que termine de cargar
  if (cargando) return;
  
  const intervalo = setInterval(() => {
    const correo = getCorreo();
    if (correo && Object.keys(formData).length > 0) {
      // Guardar silenciosamente (sin mostrar mensaje)
      fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          correo, 
          datos: formData, 
          seccion_actual: seccionActual, 
          completado: false 
        }),
      }).catch(() => {}); // Ignorar errores silenciosamente
    }
  }, 30000); // 30 segundos

  return () => clearInterval(intervalo);
}, [formData, seccionActual, cargando]);

  const getCorreo = () => {
    const sessionRaw = localStorage.getItem("visaguide_session");
    return sessionRaw
      ? JSON.parse(sessionRaw).correo
      : localStorage.getItem("correoUsuario");
  };

  // Funciones de validación
  const validarCampo = (campo, valor) => {
    // Si el campo depende de otro y ese otro no cumple la condición, no validar
    if (campo.dependeDe && formData[campo.dependeDe.campo] !== campo.dependeDe.valor) {
      return null;
    }

    // Si no es requerido y está vacío, no hay error
    if (!campo.required && (!valor || String(valor).trim() === "")) {
      return null;
    }

    // Si es requerido y está vacío
    if (campo.required && (!valor || String(valor).trim() === "")) {
      return "Este campo es obligatorio";
    }

    // Validaciones específicas
    if (campo.validation) {
      const v = campo.validation;
      const valorStr = String(valor);

      // Longitud mínima
      if (v.minLength && valorStr.length < v.minLength) {
        return `Debe tener al menos ${v.minLength} caracteres`;
      }

      // Longitud máxima
      if (v.maxLength && valorStr.length > v.maxLength) {
        return `No puede exceder ${v.maxLength} caracteres`;
      }

      // Valores numéricos
      if (v.min !== undefined && Number(valor) < v.min) {
        return `El valor mínimo es ${v.min}`;
      }

      if (v.max !== undefined && Number(valor) > v.max) {
        return `El valor máximo es ${v.max}`;
      }

      // Patrones
      if (v.pattern === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valorStr)) {
          return "Ingresa un correo electrónico válido";
        }
      }

      if (v.pattern === "telefono") {
        const telRegex = /^[\d\s+()-]{8,20}$/;
        if (!telRegex.test(valorStr)) {
          return "Ingresa un número de teléfono válido";
        }
      }

      if (v.pattern === "letras") {
        const letrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/;
        if (!letrasRegex.test(valorStr)) {
          return "Solo se permiten letras";
        }
      }

      // Fechas
      if (v.tipo === "fechaPasada") {
        const fecha = new Date(valor);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fecha >= hoy) {
          return "La fecha debe ser anterior a hoy";
        }
      }

      if (v.tipo === "fechaFutura") {
        const fecha = new Date(valor);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fecha <= hoy) {
          return "La fecha debe ser posterior a hoy";
        }
      }
    }

    return null; // Sin errores
  };

  const validarSeccionActual = () => {
    const camposSeccion = seccion?.campos || [];
    const nuevosErrores = {};
    let hayErrores = false;

    camposSeccion.forEach(campo => {
      // Solo validar campos visibles
      if (!debeMostrar(campo)) return;

      const error = validarCampo(campo, formData[campo.name]);
      if (error) {
        nuevosErrores[campo.name] = error;
        hayErrores = true;
      }
    });

    // Limpiar errores anteriores de esta sección y agregar los nuevos
    setErrores(nuevosErrores);
    return !hayErrores;
  };

  const handleChange = (name, value) => {
    setFormData(p => ({ ...p, [name]: value }));
    
    // Validar en tiempo real
    const campo = seccion?.campos.find(c => c.name === name);
    if (campo) {
      const error = validarCampo(campo, value);
      setErrores(prev => {
        const nuevos = { ...prev };
        if (error) {
          nuevos[name] = error;
        } else {
          delete nuevos[name];
        }
        return nuevos;
      });
    }
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
      setMensajeGuardado("✓ Progreso guardado");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } catch {
      setMensajeGuardado("Error al guardar. Intenta de nuevo.");
      setTimeout(() => setMensajeGuardado(""), 3000);
    } finally { setGuardando(false); }
  };

  const finalizarFormulario = async () => {
    // Validar sección actual antes de finalizar
    const esValida = validarSeccionActual();
    if (!esValida) {
      setMensajeGuardado("Completa los campos obligatorios antes de finalizar");
      setTimeout(() => setMensajeGuardado(""), 3000);
      return;
    }

    const correo = getCorreo();
    if (!correo) return;
    setGuardando(true);
    try {
      await fetch(buildApiUrl("/ds160"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, datos: formData, seccion_actual: seccionActual, completado: true }),
      });
      alert("¡Formulario completado! Los datos han sido guardados.");
      window.location.href = "/dashboard";
    } catch { alert("Error al finalizar el formulario. Intenta de nuevo."); }
    finally { setGuardando(false); }
  };

const siguienteSeccion = () => {
  if (seccionActual < totalSecciones) {
    const esValida = validarSeccionActual();
    if (!esValida) {
      setMensajeGuardado("Completa los campos obligatorios antes de continuar");
      setTimeout(() => setMensajeGuardado(""), 3000);
      return;
    }
    setErrores({});
    setSeccionActual(s => s + 1);
    guardarProgreso();
    window.scrollTo(0, 0);
  }
};

  const anteriorSeccion = () => {
    if (seccionActual > 1) { 
      setErrores({}); // Limpiar errores al cambiar de sección
      setSeccionActual(s => s - 1); 
      window.scrollTo(0, 0); 
    }
  };

  const renderCampo = (campo) => {
    if (!debeMostrar(campo)) return null;
    const tieneError = errores[campo.name];
    const inputId = `campo-${campo.name}`;

    if (campo.type === "radio") return (
      <div key={campo.name} style={st.campoContainer}>
        <div id={`${inputId}-label`} style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>
          {campo.label}
          {campo.required && <span style={st.required}>*</span>}
        </div>
        <div style={st.radioGroup} role="group" aria-labelledby={`${inputId}-label`}>
          {campo.opciones.map(op => (
            <button key={op} type="button"
              style={{ 
                ...st.radioBtn, 
                ...(formData[campo.name] === op ? st.radioBtnSel : {}), 
                ...(tieneError && !formData[campo.name] ? st.radioBtnError : {}),
                fontSize: modoSenior ? "16px" : "14px" 
              }}
              aria-pressed={formData[campo.name] === op}
              onClick={() => handleChange(campo.name, op)}>{op}</button>
          ))}
        </div>
        {tieneError && <span role="alert" style={st.errorText}>{tieneError}</span>}
      </div>
    );

    if (campo.type === "select") return (
      <div key={campo.name} style={st.campoContainer}>
        <label htmlFor={inputId} style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>
          {campo.label}
          {campo.required && <span style={st.required}>*</span>}
        </label>
        <select
          id={inputId}
          style={{ 
            ...st.input, 
            fontSize: modoSenior ? "17px" : "15px",
            ...(tieneError ? st.inputError : {})
          }}
          value={formData[campo.name] || ""} 
          aria-invalid={!!tieneError}
          aria-describedby={tieneError ? `${inputId}-error` : undefined}
          onChange={e => handleChange(campo.name, e.target.value)}>
          <option value="">Selecciona una opción</option>
          {campo.opciones.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
        {tieneError && <span id={`${inputId}-error`} role="alert" style={st.errorText}>{tieneError}</span>}
      </div>
    );

    return (
      <div key={campo.name} style={st.campoContainer}>
        <label htmlFor={inputId} style={{ ...st.label, fontSize: modoSenior ? "13px" : "11px" }}>
          {campo.label}
          {campo.required && <span style={st.required}>*</span>}
        </label>
        <input id={inputId} type={campo.type}
          style={{ 
            ...st.input, 
            fontSize: modoSenior ? "17px" : "15px", 
            padding: modoSenior ? "15px 18px" : "12px 16px",
            ...(tieneError ? st.inputError : {})
          }}
          placeholder={campo.placeholder || ""} 
          value={formData[campo.name] || ""}
          aria-invalid={!!tieneError}
          aria-describedby={tieneError ? `${inputId}-error` : undefined}
          onChange={e => handleChange(campo.name, e.target.value)} />
        {tieneError && <span id={`${inputId}-error`} role="alert" style={st.errorText}>{tieneError}</span>}
      </div>
    );
  };

  const campoConAyuda = seccion?.campos.find(c => c.tip || c.porque);

  if (authValidating || cargando) return (
    <div style={st.layout}>
      <Sidebar currentPage="ds160" />
      <main id="main-content" tabIndex="-1" style={st.page}>
        <div style={st.headerCard}>
          <p style={{ textAlign: "center", color: "var(--vg-text-muted)", margin: 0 }}>Cargando formulario...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div style={st.layout}>
      <Sidebar currentPage="ds160" />
      <main id="main-content" tabIndex="-1" style={st.page}>

        {/* HEADER */}
        <div style={st.headerCard}>
          <div style={st.headerRow}>
            <div>
              <h1 style={{ ...st.titulo, fontSize: modoSenior ? "28px" : "22px" }}>Formulario DS-160</h1>
              <p style={{ ...st.subtitulo, fontSize: modoSenior ? "15px" : "13px" }}>
                Sección {seccionActual}: {seccion?.titulo} ({seccionActual} de {totalSecciones})
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
          <div style={{ ...st.toast, background: mensajeGuardado.startsWith("✓") ? "var(--vg-success-bg)" : "var(--vg-danger-bg)", borderColor: "var(--vg-border)", color: mensajeGuardado.startsWith("✓") ? "var(--vg-success)" : "var(--vg-danger-text)" }}>
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
                onClick={anteriorSeccion} disabled={seccionActual === 1}>← Anterior</button>
              {seccionActual < totalSecciones ? (
                <button style={{ ...st.navBtn, ...st.navNext, fontSize: modoSenior ? "16px" : "14px" }} onClick={siguienteSeccion}>Siguiente →</button>
              ) : (
                <button style={{ ...st.navBtn, ...st.navNext, fontSize: modoSenior ? "16px" : "14px", opacity: guardando ? 0.7 : 1 }}
                  onClick={finalizarFormulario} disabled={guardando}>
                  {guardando ? "Finalizando..." : "Finalizar ✓"}
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
                    ¿Por qué preguntan esto?
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
                    onClick={() => {
                      setErrores({});
                      setSeccionActual(sc.id);
                    }}>
                    {sc.id < seccionActual && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="var(--vg-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
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
      </main>
    </div>
  );
}

function getSt() {
  const bg      = "var(--vg-bg)";
  const card    = "var(--vg-card)";
  const border  = "var(--vg-border)";
  const text    = "var(--vg-text)";
  const muted   = "var(--vg-text-muted)";

  return {
  layout: { display: "flex", minHeight: "100vh" },

  page: {
    marginLeft: "var(--vg-sidebar-w)",
    flex: 1,
    minHeight: "100vh",
    background: bg,
    padding: "28px 32px",
    fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  headerCard: {
    background: card,
    borderRadius: "14px",
    padding: "20px 26px 16px",
    boxShadow: "var(--vg-shadow-sm)",
    marginBottom: "20px",
    border: `1px solid ${border}`,
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },

  titulo:   { margin: 0, fontWeight: 700, color: text, letterSpacing: "-0.3px" },
  subtitulo:{ margin: "3px 0 0 0", color: muted },

  guardarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: card,
    border: `1px solid ${border}`,
    borderRadius: "10px",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: muted,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
    fontFamily: "'Segoe UI', sans-serif",
    flexShrink: 0,
  },

  barTrack: { width: "100%", height: "5px", background: border, borderRadius: "99px", overflow: "hidden" },
  barFill:  { height: "100%", background: "var(--vg-red)", borderRadius: "99px", transition: "width 0.4s ease" },

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
    background: card,
    borderRadius: "14px",
    padding: "28px 28px 24px",
    boxShadow: "var(--vg-shadow-sm)",
    border: `1px solid ${border}`,
  },

  helpSidebar: { width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" },

  campoContainer: { marginBottom: "20px" },

  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: muted,
    marginBottom: "7px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  required: { color: "var(--vg-red)", marginLeft: "4px" },

  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: `1.5px solid ${border}`,
    borderRadius: "10px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
    color: text,
    background: "var(--vg-input)",
  },

  inputError: {
    borderColor: "var(--vg-red)",
    background: "var(--vg-danger-bg)",
  },

  errorText: {
    display: "block",
    marginTop: "6px",
    fontSize: "12px",
    color: "var(--vg-danger-text)",
    fontWeight: 500,
  },

  radioGroup: { display: "flex", gap: "10px" },

  radioBtn: {
    flex: 1,
    padding: "12px 20px",
    fontSize: "14px",
    border: `1.5px solid ${border}`,
    borderRadius: "10px",
    background: "var(--vg-input)",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Segoe UI', sans-serif",
    color: text,
    fontWeight: 500,
  },

  radioBtnSel: { background: "var(--vg-red)", color: "#ffffff", borderColor: "var(--vg-red)" },
  radioBtnError: { borderColor: "var(--vg-red)" },

  navegacion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
    paddingTop: "18px",
    borderTop: `1px solid ${border}`,
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
  navBack: { background: "transparent", color: muted, padding: "12px 4px", fontWeight: 400 },

  helpBox: {
    background: "var(--vg-amber-bg)",
    borderRadius: "12px",
    padding: "16px 18px",
    border: "1px solid var(--vg-amber-border)",
  },

  helpTitleRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" },
  helpTitle:    { margin: 0, fontWeight: 700, color: "var(--vg-amber-text)" },
  helpText:     { margin: 0, color: "var(--vg-amber-text)", lineHeight: 1.65 },

  tipBox: {
    background: "var(--vg-strong-surface)",
    borderRadius: "12px",
    padding: "18px 20px",
    border: "2px solid var(--vg-red)",
  },

  tipTitleRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" },
  tipTitle:    { margin: 0, fontWeight: 700, color: "var(--vg-on-strong)" },
  tipItem:     { display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" },
  tipText:     { margin: 0, color: "var(--vg-strong-muted)", lineHeight: 1.6 },

  seccionesBox: { background: "var(--vg-navy-blue)", borderRadius: "12px", padding: "18px 20px" },

  seccionesTitle: {
    margin: "0 0 12px 0",
    fontWeight: 700,
    color: "var(--vg-on-strong)",
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

  seccionActual: { color: "var(--vg-on-strong)", fontWeight: 700 },
  seccionDone:   { color: "var(--vg-success)" },
  };
}
