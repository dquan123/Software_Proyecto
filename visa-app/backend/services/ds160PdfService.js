const PDFDocument = require("pdfkit");

// Constantes de diseño
const COLORS = {
  primary: "#0F2A47",
  accent: "#E63946",
  text: "#111827",
  textMuted: "#4b5563",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
};

const EMPTY_VALUE = "No proporcionado";

function formatLabel(key) {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  if (Array.isArray(value)) {
    const values = value.map(formatValue).filter((item) => item !== EMPTY_VALUE);
    return values.length ? values.join(", ") : EMPTY_VALUE;
  }
  if (isPlainObject(value)) return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function ensureSpace(doc, neededHeight = 70) {
  if (doc.y + neededHeight < doc.page.height - doc.page.margins.bottom - 30) return;
  doc.addPage();
}

// Header con branding VisaGuide
function writeHeader(doc) {
  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const headerHeight = 60;

  doc.rect(0, 0, pageWidth, headerHeight).fill(COLORS.primary);
  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.white).text("VISAGUIDE", marginLeft, 20);
  doc.rect(0, headerHeight, pageWidth, 4).fill(COLORS.accent);

  doc.y = headerHeight + 20;
  doc.fillColor(COLORS.text);
}

// Footer con número de página
function addPageNumbers(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const pageWidth = doc.page.width;
    const marginBottom = 30;

    doc.moveTo(doc.page.margins.left, doc.page.height - marginBottom - 10)
      .lineTo(pageWidth - doc.page.margins.right, doc.page.height - marginBottom - 10)
      .strokeColor(COLORS.border).lineWidth(1).stroke();

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted)
      .text(`Página ${i + 1} de ${pages.count}`, doc.page.margins.left, doc.page.height - marginBottom,
        { align: "center", width: pageWidth - doc.page.margins.left - doc.page.margins.right });

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.textMuted)
      .text("Documento generado por VisaGuide", doc.page.margins.left, doc.page.height - marginBottom + 12,
        { align: "center", width: pageWidth - doc.page.margins.left - doc.page.margins.right });
  }
}

function writeDivider(doc) {
  const y = doc.y + 8;
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.moveDown(1.2);
}

function writeField(doc, key, value, level = 0) {
  if (isPlainObject(value)) {
    ensureSpace(doc, 50);
    doc.font("Helvetica-Bold").fontSize(level === 0 ? 11 : 10).fillColor(COLORS.primary)
      .text(formatLabel(key), { indent: level * 14 });
    doc.moveDown(0.3);
    Object.entries(value).forEach(([childKey, childValue]) => {
      writeField(doc, childKey, childValue, level + 1);
    });
    return;
  }

  ensureSpace(doc, 38);
  const label = formatLabel(key);
  const formattedValue = formatValue(value);
  const indent = level * 14;
  const labelWidth = 180;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted)
    .text(label, doc.page.margins.left + indent, doc.y, { width: labelWidth, continued: false });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.text)
    .text(formattedValue, doc.page.margins.left + labelWidth + indent, doc.y - 12);
  doc.moveDown(0.5);
}

function writeSectionHeader(doc, title, sectionNumber) {
  ensureSpace(doc, 200);
  const marginLeft = doc.page.margins.left;
  const boxWidth = doc.page.width - marginLeft - doc.page.margins.right;

  doc.rect(marginLeft, doc.y, boxWidth, 28).fill(COLORS.background);
  doc.rect(marginLeft, doc.y, 4, 28).fill(COLORS.accent);

  if (sectionNumber) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.accent)
      .text(`SECCIÓN ${sectionNumber}`, marginLeft + 14, doc.y + 8, { continued: false });
  }

  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.primary)
    .text(formatLabel(title), marginLeft + 14, doc.y + (sectionNumber ? 0 : 8));

  doc.y += 28;
  doc.moveDown(0.6);
}

function writeSection(doc, title, data, sectionNumber) {
  writeSectionHeader(doc, title, sectionNumber);

  if (!isPlainObject(data) || Object.keys(data).length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.textMuted).text(EMPTY_VALUE);
    doc.moveDown(0.5);
    writeDivider(doc);
    return;
  }

  Object.entries(data).forEach(([key, value]) => {
    writeField(doc, key, value);
  });
  writeDivider(doc);
}

function normalizeSections(datos) {
  const SECTIONS = [
    {
      title: "Datos Personales",
      fields: ["apellidos", "nombres", "otrosNombres", "otrosNombresDetalle", "fechaNacimiento", "lugarNacimiento", "paisNacimiento"]
    },
    {
      title: "Información de Contacto",
      fields: ["direccion", "ciudad", "codigoPostal", "telefono", "email"]
    },
    {
      title: "Información del Pasaporte",
      fields: ["numeroPasaporte", "paisEmision", "fechaEmision", "fechaExpiracion"]
    },
    {
      title: "Información del Viaje",
      fields: ["proposito", "fechaViaje", "duracionEstancia", "direccionEEUU"]
    },
    {
      title: "Acompañantes de Viaje",
      fields: ["viajaAcompanado", "acompanantes", "relacionAcompanantes"]
    },
    {
      title: "Viajes Anteriores a EE.UU.",
      fields: ["haViajadoEEUU", "fechasViajes", "tiempoEstancia", "visaAnterior", "visaRechazada", "motivoRechazo"]
    },
    {
      title: "Información Laboral",
      fields: ["ocupacion", "empleador", "direccionTrabajo", "telefonoTrabajo", "ingresoMensual", "fechaInicioTrabajo"]
    },
    {
      title: "Información Educativa",
      fields: ["nivelEducativo", "institucion", "carrera", "fechaGraduacion"]
    },
    {
      title: "Información Familiar",
      fields: ["estadoCivil", "nombreConyuge", "nombrePadre", "nombreMadre", "tieneHijos", "cantidadHijos"]
    },
    {
      title: "Seguridad y Antecedentes",
      fields: ["antecedentePenal", "enfermedadContagiosa", "deportado", "fraudeMigratorio"]
    }
  ];

  if (!isPlainObject(datos) || Object.keys(datos).length === 0) {
    return SECTIONS.map(s => [s.title, {}]);
  }

  return SECTIONS.map(section => {
    const sectionData = {};
    section.fields.forEach(field => {
      if (datos[field] !== undefined && datos[field] !== null && datos[field] !== "") {
        sectionData[field] = datos[field];
      }
    });
    return [section.title, sectionData];
  });
}

function writeInfoBox(doc, usuario, formulario) {
  const marginLeft = doc.page.margins.left;
  const boxWidth = doc.page.width - marginLeft - doc.page.margins.right;

  doc.rect(marginLeft, doc.y, boxWidth, 70).lineWidth(1)
    .strokeColor(COLORS.border).fillAndStroke(COLORS.background, COLORS.border);

  const startY = doc.y + 12;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted);
  doc.text("ID de Usuario:", marginLeft + 15, startY);
  doc.text("Correo:", marginLeft + 15, startY + 18);

  doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
  doc.text(String(usuario?.id_usuario || "—"), marginLeft + 100, startY);
  doc.text(String(usuario?.correo || "—"), marginLeft + 100, startY + 18);

  const rightCol = marginLeft + boxWidth / 2 + 20;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted);
  doc.text("Sección actual:", rightCol, startY);
  doc.text("Estado:", rightCol, startY + 18);

  doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
  doc.text(String(formulario?.seccion_actual || "1"), rightCol + 85, startY);

  const completado = formulario?.completado;
  const estadoText = completado ? "Completado" : "En progreso";
  const estadoColor = completado ? "#10B981" : COLORS.accent;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(estadoColor).text(estadoText, rightCol + 85, startY + 18);

  doc.y += 82;
  doc.moveDown(0.8);
}

function streamDs160Pdf({ usuario, formulario }, outputStream) {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 80, right: 54, bottom: 60, left: 54 },
    bufferPages: true,
    info: {
      Title: "Formulario DS-160 - VisaGuide",
      Author: "VisaGuide",
      Subject: "Exportación del formulario DS-160",
      Creator: "VisaGuide PDF Generator",
    },
  });

  doc.pipe(outputStream);

  writeHeader(doc);

  doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.primary).text("Formulario DS-160", { align: "center" });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.textMuted).text("Solicitud de Visa de No Inmigrante", { align: "center" });
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted)
    .text(`Generado el ${new Date().toLocaleDateString("es-GT", { dateStyle: "long" })}`, { align: "center" });
  doc.moveDown(1.2);

  writeInfoBox(doc, usuario, formulario);

  const sections = normalizeSections(formulario?.datos);
  sections.forEach(([sectionTitle, sectionData], index) => {
    writeSection(doc, sectionTitle, sectionData, index + 1);
  });

  ensureSpace(doc, 60);
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.textMuted)
    .text("Este documento es una copia de la información ingresada en el sistema VisaGuide. " +
      "No constituye un documento oficial del gobierno de Estados Unidos. " +
      "Para su cita consular, debe completar el formulario DS-160 oficial en ceac.state.gov.", { align: "center" });

  //addPageNumbers(doc);
  doc.end();
}

module.exports = { streamDs160Pdf };