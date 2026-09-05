const express = require("express");
const request = require("supertest");
const ExcelJS = require("exceljs");
const { createRoleMiddleware, issueSessionToken } = require("../auth");
const createAdminMetricsRoutes = require("../routes/adminMetricsRoutes");

function binaryParser(response, callback) {
  const chunks = [];
  response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  response.on("end", () => callback(null, Buffer.concat(chunks)));
}

describe("admin authorization and metrics", () => {
  const previousEnv = process.env.NODE_ENV;
  beforeAll(() => { process.env.NODE_ENV = "test"; });
  afterAll(() => { process.env.NODE_ENV = previousEnv; });

  function createApp(query) {
    const pool = { query: jest.fn(query) };
    const app = express();
    app.use("/admin/metrics", createAdminMetricsRoutes(pool, {
      requireAdmin: createRoleMiddleware(pool, ["admin"]),
    }));
    return { app, pool };
  }

  test("rejects requests without a signed session", async () => {
    const { app } = createApp();
    await request(app).get("/admin/metrics/overview").expect(401);
  });

  test("rejects an invalid signed session", async () => {
    const { app } = createApp();
    await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", "Bearer fabricated.token")
      .expect(401);
  });

  test("rejects an expired signed session", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const issuedAt = Date.now();
    const token = issueSessionToken(admin);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(issuedAt + (9 * 60 * 60 * 1000));
    const { app } = createApp();
    await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
    dateSpy.mockRestore();
  });

  test("rejects a session for a deactivated user", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin", activo: false };
    const { app } = createApp(async () => ({ rows: [admin] }));
    await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(401);
  });

  test("rejects an authenticated client", async () => {
    const client = { id_usuario: 4, correo: "cliente@test.dev", rol: "cliente" };
    const { app } = createApp(async () => ({ rows: [client] }));
    await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", `Bearer ${issueSessionToken(client)}`)
      .expect(403);
  });

  test("returns database-backed overview metrics to an admin", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      return { rows: [{ usuarios_total: "8", clientes: "5", asesores: "2", documentos_pendientes: "3", tramites_activos: "4", ds160_pendientes: "6", entrevistas_pendientes: "1" }] };
    });
    const response = await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);
    expect(response.body).toEqual({ usuarios_total: 8, clientes: 5, asesores: 2, documentos_pendientes: 3, tramites_activos: 4, ds160_pendientes: 6, entrevistas_pendientes: 1 });
  });

  test("returns database-backed basic reports to an admin", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("GROUP BY estado")) return { rows: [{ label: "En proceso", total: "3" }] };
      if (sql.includes("GROUP BY etapa_actual")) return { rows: [{ label: "Documentos", total: "2" }] };
      if (sql.includes("progreso_promedio")) return { rows: [{ total: "5", progreso_promedio: "46.4", completados: "1", sin_asignar: "2", tiempo_promedio_dias: "14", revisiones_pendientes: "4" }] };
      if (sql.includes("advisor.rol = 'asesor'")) return { rows: [{ id: 7, nombre: "Laura", asignados: "3", pendientes: "2" }] };
      if (sql.includes("months AS")) return { rows: [{ label: "2026-08", total: "2" }] };
      if (sql.includes("FROM documentos d")) return { rows: [{ label: "approved", total: "3" }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/metrics/processes")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(response.body).toEqual({
      porEstado: [{ label: "En proceso", total: 3 }],
      porEtapa: [{ label: "Documentos", total: 2 }],
      nuevasSolicitudes: [{ label: "2026-08", total: 2 }],
      documentosPorEstado: [{ label: "approved", total: 3 }],
      totalTramites: 5,
      totalActivas: 4,
      progresoPromedio: 46.4,
      completados: 1,
      sinAsignar: 2,
      tiempoPromedioDias: 14,
      revisionesPendientes: 4,
      tasaExito: 20,
      periodo: { days: null, from: null, to: null },
      cargaAsesores: [{ id: 7, nombre: "Laura", asignados: 3, pendientes: 2 }],
    });
  });

  test("applies the selected report period to process metrics", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app, pool } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("progreso_promedio")) return { rows: [{ total: 0, progreso_promedio: 0, completados: 0, sin_asignar: 0 }] };
      return { rows: [] };
    });

    await request(app)
      .get("/admin/metrics/processes?days=30")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("created_at >= CURRENT_TIMESTAMP"),
      [30]
    );
  });

  test("applies an inclusive custom date range to every process metric", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app, pool } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("progreso_promedio")) return { rows: [{ total: 0, progreso_promedio: 0, completados: 0, sin_asignar: 0 }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/metrics/processes?from=2026-07-01&to=2026-07-31")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(response.body.periodo).toEqual({ days: null, from: "2026-07-01", to: "2026-07-31" });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("created_at < ($2::date + INTERVAL '1 day')"),
      ["2026-07-01", "2026-07-31"]
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("d.usuario_id IN (SELECT id_usuario FROM filtered_processes)"),
      ["2026-07-01", "2026-07-31"]
    );
  });

  test("rejects invalid or reversed custom date ranges", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      return { rows: [] };
    });
    const token = issueSessionToken(admin);

    await request(app)
      .get("/admin/metrics/processes?from=2026-02-30")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    await request(app)
      .get("/admin/metrics/processes?from=2026-08-10&to=2026-08-01")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });

  test("exports filtered process rows as a safe UTF-8 CSV", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app, pool } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("applicant.nombre AS solicitante")) return { rows: [{
        id_tramite: 21,
        solicitante: "=Carlos Mendoza",
        correo: "carlos@example.com",
        perfil: "Turismo B1/B2",
        estado: "En proceso",
        etapa_actual: "Documentos",
        progreso: 45,
        asesor: "Laura Vásquez",
        created_at: "2026-07-05T10:00:00.000Z",
        updated_at: "2026-07-06T10:00:00.000Z",
      }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/metrics/processes.csv?from=2026-07-01&to=2026-07-31")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.headers["content-disposition"]).toMatch(/visaguide-reporte-\d{4}-\d{2}-\d{2}\.csv/);
    expect(response.text).toContain("Solicitante");
    expect(response.text).toContain("'=Carlos Mendoza");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM tramite t"),
      ["2026-07-01", "2026-07-31"]
    );
  });

  test("exports filtered process rows as a valid Excel workbook", async () => {
    const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
    const { app, pool } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("applicant.nombre AS solicitante")) return { rows: [{
        id_tramite: 21,
        solicitante: "Carlos Mendoza",
        correo: "carlos@example.com",
        perfil: "Turismo B1/B2",
        estado: "En proceso",
        etapa_actual: "Documentos",
        progreso: 45,
        asesor: "Laura Vásquez",
        created_at: "2026-07-05T10:00:00.000Z",
        updated_at: "2026-07-06T10:00:00.000Z",
      }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/metrics/processes.xlsx?from=2026-07-01&to=2026-07-31")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(response.headers["content-disposition"]).toMatch(/visaguide-reporte-\d{4}-\d{2}-\d{2}\.xlsx/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    expect(workbook.getWorksheet("Solicitudes").getCell("B4").value).toBe("Carlos Mendoza");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM filtered_processes t"),
      ["2026-07-01", "2026-07-31"]
    );
  });
});
