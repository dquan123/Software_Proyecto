const express = require("express");
const request = require("supertest");
const { createRoleMiddleware, issueSessionToken } = require("../auth");
const createAdminMetricsRoutes = require("../routes/adminMetricsRoutes");

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
      if (sql.includes("progreso_promedio")) return { rows: [{ total: "5", progreso_promedio: "46.4", completados: "1", sin_asignar: "2" }] };
      if (sql.includes("advisor.rol = 'asesor'")) return { rows: [{ id: 7, nombre: "Laura", asignados: "3", pendientes: "2" }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/metrics/processes")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(response.body).toEqual({
      porEstado: [{ label: "En proceso", total: 3 }],
      porEtapa: [{ label: "Documentos", total: 2 }],
      totalTramites: 5,
      progresoPromedio: 46.4,
      completados: 1,
      sinAsignar: 2,
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
});
