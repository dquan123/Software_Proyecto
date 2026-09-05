const ExcelJS = require("exceljs");
const { buildAdminProcessWorkbook } = require("../services/adminExcelReport");

describe("admin Excel report", () => {
  test("creates a formatted workbook with summary, filters and typed process data", async () => {
    const buffer = await buildAdminProcessWorkbook([{
      id_tramite: 21,
      solicitante: "=Carlos Mendoza",
      correo: "carlos@example.com",
      perfil: "Turismo B1/B2",
      estado: "En proceso",
      etapa_actual: "Documentos",
      progreso: 45,
      asesor: "Laura Vásquez",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-06T11:30:00.000Z",
    }], { from: "2026-07-01", to: "2026-07-31", status: "En proceso", advisor: "7", days: null });

    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Resumen", "Solicitudes"]);
    const summary = workbook.getWorksheet("Resumen");
    expect(summary.getCell("B3").value).toBe("2026-07-01 a 2026-07-31");
    expect(summary.getCell("B8").value).toBe(1);
    expect(summary.getCell("B12").value).toBeCloseTo(0.45);

    const requests = workbook.getWorksheet("Solicitudes");
    expect(requests.autoFilter).toBe("A3:J3");
    expect(requests.getCell("B4").value).toBe("=Carlos Mendoza");
    expect(requests.getCell("G4").value).toBeCloseTo(0.45);
    expect(requests.getCell("I4").value).toBeInstanceOf(Date);
    expect(requests.views[0]).toEqual(expect.objectContaining({ state: "frozen", ySplit: 3 }));
  });

  test("creates usable sheets when no processes match", async () => {
    const buffer = await buildAdminProcessWorkbook([], { from: "", to: "", status: "", advisor: "unassigned", days: 30 });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    expect(workbook.getWorksheet("Resumen").getCell("B8").value).toBe(0);
    expect(workbook.getWorksheet("Solicitudes").rowCount).toBe(3);
  });
});
