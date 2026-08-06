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
      return { rows: [{ usuarios_total: "8", clientes: "5", asesores: "2", documentos_pendientes: "3", tramites_activos: "4", entrevistas_pendientes: "1" }] };
    });
    const response = await request(app)
      .get("/admin/metrics/overview")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);
    expect(response.body).toEqual({ usuarios_total: 8, clientes: 5, asesores: 2, documentos_pendientes: 3, tramites_activos: 4, entrevistas_pendientes: 1 });
  });
});
