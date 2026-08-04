const PDFDocument = require("pdfkit");

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
  if (typeof value === "boolean") return value ? "Si" : "No";
  return String(value);
}

function ensureSpace(doc, neededHeight = 70) {
  if (doc.y + neededHeight < doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
}

function writeDivider(doc) {
  const y = doc.y + 6;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .stroke();
  doc.moveDown(1.1);
}

function writeField(doc, key, value, level = 0) {
  if (isPlainObject(value)) {
    ensureSpace(doc, 50);
    doc
      .font("Helvetica-Bold")
      .fontSize(level === 0 ? 12 : 10)
      .fillColor("#111827")
      .text(formatLabel(key), { indent: level * 12 });
    doc.moveDown(0.35);
    Object.entries(value).forEach(([childKey, childValue]) => {
      writeField(doc, childKey, childValue, level + 1);
    });
    return;
  }

  ensureSpace(doc, 38);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#374151")
    .text(formatLabel(key), { continued: true, indent: level * 12 });
  doc
    .font("Helvetica")
    .fillColor("#111827")
    .text(`: ${formatValue(value)}`);
  doc.moveDown(0.35);
}

function writeSection(doc, title, data) {
  ensureSpace(doc, 90);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#be123c")
    .text(formatLabel(title));
  doc.moveDown(0.5);

  if (!isPlainObject(data) || Object.keys(data).length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#111827").text(EMPTY_VALUE);
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
  if (!isPlainObject(datos) || Object.keys(datos).length === 0) {
    return [["Datos del formulario", {}]];
  }

  const entries = Object.entries(datos);
  const hasNestedSections = entries.some(([, value]) => isPlainObject(value));
  if (!hasNestedSections) return [["Datos del formulario", datos]];
  return entries;
}

function streamDs160Pdf({ usuario, formulario }, outputStream) {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, right: 54, bottom: 54, left: 54 },
    bufferPages: true,
    info: {
      Title: "Formulario DS-160",
      Author: "VisaGuide",
      Subject: "Exportacion del formulario DS-160",
    },
  });

  doc.pipe(outputStream);

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#111827")
    .text("Formulario DS-160", { align: "center" });
  doc.moveDown(0.4);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#4b5563")
    .text(`Fecha de generacion: ${new Date().toLocaleString("es-GT")}`, { align: "center" });
  doc.moveDown(1.5);

  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827").text("Identificacion del usuario");
  doc.moveDown(0.4);
  writeField(doc, "ID de usuario", usuario?.id_usuario);
  writeField(doc, "Correo", usuario?.correo);
  writeField(doc, "Seccion actual", formulario?.seccion_actual);
  writeField(doc, "Completado", formulario?.completado);
  writeDivider(doc);

  normalizeSections(formulario?.datos).forEach(([sectionTitle, sectionData]) => {
    writeSection(doc, sectionTitle, sectionData);
  });

  doc.end();
}

module.exports = {
  streamDs160Pdf,
};
