const ExcelJS = require("exceljs");

const COLORS = {
  navy: "FF111827",
  red: "FFE11D48",
  white: "FFFFFFFF",
  slate: "FF64748B",
  light: "FFF1F5F9",
};

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterDescription(filter) {
  if (filter.from || filter.to) {
    return `${filter.from || "Inicio"} a ${filter.to || "Hoy"}`;
  }
  if (filter.days) return `Últimos ${filter.days} días`;
  return "Todo el historial";
}

function advisorDescription(filter) {
  if (filter.advisor === "unassigned") return "Sin asignar";
  return filter.advisor ? `ID ${filter.advisor}` : "Todos";
}

function styleTitle(sheet, range) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.font = { bold: true, color: { argb: COLORS.white }, size: 16 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
  cell.alignment = { vertical: "middle" };
  sheet.getRow(cell.row).height = 30;
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: COLORS.white } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.red } };
  row.alignment = { vertical: "middle" };
  row.height = 24;
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {{from: string, to: string, status: string, advisor: string, days: number|null}} filter
 * @returns {Promise<Buffer>}
 */
async function buildAdminProcessWorkbook(rows, filter) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VisaGuide";
  workbook.created = new Date();
  workbook.modified = new Date();

  const completed = rows.filter((row) => row.estado === "Aprobado" || Number(row.progreso) >= 100).length;
  const unassigned = rows.filter((row) => !row.asesor).length;
  const averageProgress = rows.length
    ? rows.reduce((total, row) => total + (Number(row.progreso) || 0), 0) / rows.length / 100
    : 0;

  const summary = workbook.addWorksheet("Resumen", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { tabColor: { argb: COLORS.red } },
  });
  summary.columns = [{ width: 28 }, { width: 30 }];
  summary.getCell("A1").value = "Reporte administrativo de solicitudes";
  styleTitle(summary, "A1:B1");
  summary.addRow(["Generado", new Date()]);
  summary.addRow(["Periodo", filterDescription(filter)]);
  summary.addRow(["Estado", filter.status || "Todos"]);
  summary.addRow(["Asesor", advisorDescription(filter)]);
  summary.addRow([]);
  const metricHeader = summary.addRow(["Métrica", "Valor"]);
  styleHeader(metricHeader);
  summary.addRow(["Total de solicitudes", rows.length]);
  summary.addRow(["Solicitudes activas", Math.max(0, rows.length - completed)]);
  summary.addRow(["Solicitudes completadas", completed]);
  summary.addRow(["Solicitudes sin asignar", unassigned]);
  summary.addRow(["Progreso promedio", averageProgress]);
  summary.getCell("B2").numFmt = "yyyy-mm-dd hh:mm";
  summary.getCell("B12").numFmt = "0.0%";
  summary.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1 && rowNumber !== metricHeader.number) {
      row.getCell(1).font = { bold: true, color: { argb: COLORS.navy } };
      row.getCell(2).alignment = { horizontal: "left" };
    }
  });

  const requests = workbook.addWorksheet("Solicitudes", {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { tabColor: { argb: COLORS.navy } },
  });
  requests.getCell("A1").value = "Detalle de solicitudes";
  styleTitle(requests, "A1:J1");
  requests.getCell("A2").value = `${filterDescription(filter)} · Estado: ${filter.status || "Todos"} · Asesor: ${advisorDescription(filter)}`;
  requests.mergeCells("A2:J2");
  requests.getCell("A2").font = { italic: true, color: { argb: COLORS.slate } };
  requests.getCell("A2").alignment = { vertical: "middle" };

  const columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Solicitante", key: "applicant", width: 26 },
    { header: "Correo", key: "email", width: 32 },
    { header: "Perfil", key: "profile", width: 24 },
    { header: "Estado", key: "status", width: 18 },
    { header: "Etapa", key: "stage", width: 24 },
    { header: "Progreso", key: "progress", width: 14 },
    { header: "Asesor", key: "advisor", width: 24 },
    { header: "Fecha de creación", key: "createdAt", width: 21 },
    { header: "Última actualización", key: "updatedAt", width: 21 },
  ];
  requests.getRow(3).values = columns.map((column) => column.header);
  columns.forEach((column, index) => { requests.getColumn(index + 1).width = column.width; });
  styleHeader(requests.getRow(3));

  rows.forEach((row) => {
    requests.addRow([
      Number(row.id_tramite),
      row.solicitante || "",
      row.correo || "",
      row.perfil || "",
      row.estado || "",
      row.etapa_actual || "",
      (Number(row.progreso) || 0) / 100,
      row.asesor || "Sin asignar",
      asDate(row.created_at),
      asDate(row.updated_at),
    ]);
  });
  requests.autoFilter = { from: "A3", to: "J3" };
  requests.getColumn(7).numFmt = "0%";
  requests.getColumn(9).numFmt = "yyyy-mm-dd hh:mm";
  requests.getColumn(10).numFmt = "yyyy-mm-dd hh:mm";
  for (let rowNumber = 4; rowNumber <= requests.rowCount; rowNumber += 1) {
    const row = requests.getRow(rowNumber);
    row.alignment = { vertical: "top" };
    if (rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light } };
  }

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

module.exports = { buildAdminProcessWorkbook };
