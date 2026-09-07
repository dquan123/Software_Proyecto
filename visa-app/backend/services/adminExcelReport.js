const ExcelJS = require("exceljs");

const COLORS = {
  navy: "FF111827", red: "FFE11D48", white: "FFFFFFFF", slate: "FF64748B",
  light: "FFF1F5F9", border: "FFE2E8F0", blue: "FF2563EB", green: "FF16A34A", amber: "FFD97706",
};

const DOCUMENT_LABELS = {
  approved: "Aprobados", review: "En revisión", correction: "Corrección",
  rejected: "Corrección", pending: "Pendientes",
};

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterDescription(filter) {
  if (filter.from || filter.to) return `${filter.from || "Inicio"} a ${filter.to || "Hoy"}`;
  if (filter.days) return `Últimos ${filter.days} días`;
  return "Todo el historial";
}

function advisorDescription(filter) {
  if (filter.advisor === "unassigned") return "Sin asignar";
  return filter.advisor ? `Asesor #${filter.advisor}` : "Todos";
}

function groupRows(rows, value) {
  const counts = new Map();
  rows.forEach((row) => {
    const label = value(row) || "Sin información";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label, "es"));
}

function topGroups(groups, limit = 8) {
  if (groups.length <= limit) return groups;
  const visible = groups.slice(0, limit - 1);
  visible.push({ label: "Otros", total: groups.slice(limit - 1).reduce((sum, item) => sum + item.total, 0) });
  return visible;
}

function styleTitle(sheet, range) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.font = { name: "Arial", bold: true, color: { argb: COLORS.white }, size: 16 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
  cell.alignment = { vertical: "middle" };
  sheet.getRow(cell.row).height = 30;
}

function styleRangeHeader(sheet, range) {
  const [from, to] = range.split(":").map((address) => sheet.getCell(address));
  for (let column = from.col; column <= to.col; column += 1) {
    const cell = sheet.getCell(from.row, column);
    cell.font = { name: "Arial", bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.red } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    if (column < to.col) cell.border = { right: { style: "thin", color: { argb: COLORS.white } } };
  }
}

function applyBaseFont(sheet, maxRow, maxColumn) {
  for (let row = 1; row <= maxRow; row += 1) {
    for (let column = 1; column <= maxColumn; column += 1) {
      sheet.getCell(row, column).font = { name: "Arial", size: 10 };
    }
  }
}

function addBreakdown(sheet, { title, row, column, groups, total, color = COLORS.blue }) {
  const displayGroups = groups.length ? groups : [{ label: "Sin datos", total: 0 }];
  const endColumn = column + 2;
  sheet.mergeCells(row, column, row, endColumn);
  const titleCell = sheet.getCell(row, column);
  titleCell.value = title;
  titleCell.font = { name: "Arial", bold: true, color: { argb: COLORS.navy }, size: 11 };
  titleCell.border = { bottom: { style: "medium", color: { argb: COLORS.red } } };

  const headerRow = row + 1;
  sheet.getCell(headerRow, column).value = "Categoría";
  sheet.getCell(headerRow, column + 1).value = "Total";
  sheet.getCell(headerRow, column + 2).value = "%";
  styleRangeHeader(sheet, `${sheet.getCell(headerRow, column).address}:${sheet.getCell(headerRow, endColumn).address}`);

  displayGroups.forEach((item, index) => {
    const targetRow = headerRow + index + 1;
    sheet.getCell(targetRow, column).value = item.label;
    sheet.getCell(targetRow, column + 1).value = item.total;
    sheet.getCell(targetRow, column + 2).value = total ? item.total / total : 0;
    sheet.getCell(targetRow, column + 2).numFmt = "0.0%";
    sheet.getCell(targetRow, column + 1).alignment = { horizontal: "right" };
    sheet.getCell(targetRow, column + 2).alignment = { horizontal: "right" };
    if (index % 2 === 1) {
      for (let targetColumn = column; targetColumn <= endColumn; targetColumn += 1) {
        sheet.getCell(targetRow, targetColumn).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light } };
      }
    }
  });

  if (groups.length) {
    const firstValueRow = headerRow + 1;
    const lastValueRow = headerRow + groups.length;
    sheet.addConditionalFormatting({
      ref: `${sheet.getCell(firstValueRow, column + 1).address}:${sheet.getCell(lastValueRow, column + 1).address}`,
      rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color }],
    });
  }
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {{from: string, to: string, status: string, advisor: string, days: number|null}} filter
 * @param {{documentsByStatus?: Array<{label: string, total: number}>}} [options]
 * @returns {Promise<Buffer>}
 */
async function buildAdminProcessWorkbook(rows, filter, { documentsByStatus = [] } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VisaGuide";
  workbook.created = new Date();
  workbook.modified = new Date();

  const completed = rows.filter((row) => row.estado === "Aprobado" || Number(row.progreso) >= 100).length;
  const unassigned = rows.filter((row) => !row.asesor).length;
  const averageProgress = rows.length
    ? rows.reduce((total, row) => total + (Number(row.progreso) || 0), 0) / rows.length / 100
    : 0;
  const statusGroups = groupRows(rows, (row) => row.estado);
  const stageGroups = topGroups(groupRows(rows, (row) => row.etapa_actual));
  const advisorGroups = topGroups(groupRows(rows, (row) => row.asesor || "Sin asignar"));
  const monthlyGroups = groupRows(rows, (row) => {
    const date = asDate(row.created_at);
    return date ? date.toISOString().slice(0, 7) : "Sin fecha";
  }).sort((left, right) => left.label.localeCompare(right.label)).slice(-12);
  const normalizedDocuments = documentsByStatus.map((item) => ({
    label: DOCUMENT_LABELS[item.label] || item.label,
    total: Number(item.total) || 0,
  }));
  const documentTotal = normalizedDocuments.reduce((sum, item) => sum + item.total, 0);

  const summary = workbook.addWorksheet("Resumen", {
    views: [{ showGridLines: false, zoomScale: 90 }],
    properties: { tabColor: { argb: COLORS.red } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  [24, 10, 10, 4, 24, 10, 10, 24, 10, 10].forEach((width, index) => { summary.getColumn(index + 1).width = width; });
  applyBaseFont(summary, 45, 10);
  summary.getCell("A1").value = "Reporte administrativo de solicitudes";
  styleTitle(summary, "A1:J1");
  summary.mergeCells("A2:J2");
  summary.getCell("A2").value = "Indicadores y distribuciones del conjunto de solicitudes seleccionado";
  summary.getCell("A2").font = { name: "Arial", italic: true, color: { argb: COLORS.slate } };

  [["Generado", new Date()], ["Periodo", filterDescription(filter)], ["Estado", filter.status || "Todos"], ["Asesor", advisorDescription(filter)]]
    .forEach(([label, value], index) => {
      const row = index + 4;
      summary.getCell(row, 1).value = label;
      summary.getCell(row, 1).font = { name: "Arial", bold: true, color: { argb: COLORS.navy } };
      summary.mergeCells(row, 2, row, 4);
      summary.getCell(row, 2).value = value;
      summary.getCell(row, 2).alignment = { horizontal: "left", vertical: "middle" };
    });
  summary.getCell("B4").numFmt = "yyyy-mm-dd hh:mm";

  [["Total", rows.length, "0"], ["Activas", Math.max(0, rows.length - completed), "0"], ["Completadas", completed, "0"],
    ["Sin asignar", unassigned, "0"], ["Progreso promedio", averageProgress, "0.0%"]]
    .forEach(([label, value, format], index) => {
      const startColumn = index * 2 + 1;
      summary.mergeCells(9, startColumn, 9, startColumn + 1);
      summary.mergeCells(10, startColumn, 12, startColumn + 1);
      const labelCell = summary.getCell(9, startColumn);
      const valueCell = summary.getCell(10, startColumn);
      labelCell.value = label;
      labelCell.font = { name: "Arial", bold: true, color: { argb: COLORS.slate } };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.value = value;
      valueCell.numFmt = format;
      valueCell.font = { name: "Arial", bold: true, color: { argb: index === 2 ? COLORS.green : COLORS.navy }, size: 18 };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light } };
      valueCell.border = {
        top: { style: "thin", color: { argb: COLORS.border } }, bottom: { style: "thin", color: { argb: COLORS.border } },
        left: { style: "thin", color: { argb: COLORS.border } }, right: { style: "thin", color: { argb: COLORS.border } },
      };
    });

  addBreakdown(summary, { title: "Solicitudes por estado", row: 15, column: 1, groups: statusGroups, total: rows.length, color: COLORS.red });
  addBreakdown(summary, { title: "Solicitudes por etapa (top 8)", row: 15, column: 5, groups: stageGroups, total: rows.length, color: COLORS.blue });
  addBreakdown(summary, { title: "Carga por asesor (top 8)", row: 15, column: 8, groups: advisorGroups, total: rows.length, color: COLORS.amber });
  addBreakdown(summary, { title: "Solicitudes por mes (últimos 12)", row: 28, column: 1, groups: monthlyGroups, total: rows.length, color: COLORS.blue });
  addBreakdown(summary, { title: "Documentos por estado", row: 28, column: 5, groups: normalizedDocuments, total: documentTotal, color: COLORS.green });
  summary.pageSetup.printArea = "A1:J45";

  const requests = workbook.addWorksheet("Solicitudes", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: false, zoomScale: 90 }],
    properties: { tabColor: { argb: COLORS.navy } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  requests.getCell("A1").value = "Detalle de solicitudes";
  styleTitle(requests, "A1:J1");
  requests.getCell("A2").value = `${filterDescription(filter)} · Estado: ${filter.status || "Todos"} · Asesor: ${advisorDescription(filter)}`;
  requests.mergeCells("A2:J2");
  requests.getCell("A2").font = { name: "Arial", italic: true, color: { argb: COLORS.slate } };

  const columns = [
    ["ID", 10], ["Solicitante", 26], ["Correo", 32], ["Perfil", 24], ["Estado", 18],
    ["Etapa", 24], ["Progreso", 14], ["Asesor", 24], ["Fecha de creación", 21], ["Última actualización", 21],
  ];
  requests.getRow(3).values = columns.map(([header]) => header);
  columns.forEach(([, width], index) => { requests.getColumn(index + 1).width = width; });
  styleRangeHeader(requests, "A3:J3");
  requests.getRow(3).height = 24;

  rows.forEach((row) => requests.addRow([
    Number(row.id_tramite), row.solicitante || "", row.correo || "", row.perfil || "", row.estado || "",
    row.etapa_actual || "", (Number(row.progreso) || 0) / 100, row.asesor || "Sin asignar",
    asDate(row.created_at), asDate(row.updated_at),
  ]));
  requests.autoFilter = { from: "A3", to: "J3" };
  requests.getColumn(7).numFmt = "0%";
  requests.getColumn(7).alignment = { horizontal: "right" };
  requests.getColumn(8).alignment = { horizontal: "left", indent: 1 };
  requests.getColumn(9).numFmt = "yyyy-mm-dd hh:mm";
  requests.getColumn(10).numFmt = "yyyy-mm-dd hh:mm";
  for (let rowNumber = 4; rowNumber <= requests.rowCount; rowNumber += 1) {
    const row = requests.getRow(rowNumber);
    row.font = { name: "Arial", size: 10 };
    row.alignment = { vertical: "top" };
    for (let column = 1; column < 10; column += 1) {
      row.getCell(column).border = { right: { style: "thin", color: { argb: COLORS.border } } };
    }
    if (rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light } };
  }
  if (requests.rowCount >= 4) {
    requests.addConditionalFormatting({
      ref: `G4:G${requests.rowCount}`,
      rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: COLORS.green }],
    });
  }

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

module.exports = { buildAdminProcessWorkbook };
