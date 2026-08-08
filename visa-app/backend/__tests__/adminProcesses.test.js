const express = require("express");
const request = require("supertest");
const { createRoleMiddleware, issueSessionToken } = require("../auth");
const createAdminProcessRoutes = require("../routes/adminProcessRoutes");

describe("admin process management", () => {
  const admin = { id_usuario: 1, correo: "admin@test.dev", rol: "admin" };
  const client = { id_usuario: 4, correo: "cliente@test.dev", rol: "cliente" };

  function createApp(query) {
    const pool = { query: jest.fn(query) };
    const app = express();
    app.use(express.json());
    app.use("/admin/processes", createAdminProcessRoutes(pool, {
      requireAdmin: createRoleMiddleware(pool, ["admin"]),
      schemaReady: Promise.resolve(),
    }));
    return { app, pool };
  }

  test("rejects unauthenticated and client requests", async () => {
    const { app } = createApp(async () => ({ rows: [client] }));
    await request(app).get("/admin/processes").expect(401);
    await request(app)
      .get("/admin/processes")
      .set("Authorization", `Bearer ${issueSessionToken(client)}`)
      .expect(403);
  });

  test("returns real processes and advisors to an admin", async () => {
    const processRow = {
      id_tramite: 21,
      id_usuario: 8,
      estado: "En proceso",
      etapa_actual: "Formulario DS-160",
      progreso: 17,
      siguiente_paso: "Completar formulario",
      mensaje: "",
      id_asesor: null,
      solicitante_nombre: "Carlos Mendoza",
      solicitante_correo: "carlos@example.com",
      solicitante_perfil: "Renovación B1/B2",
    };
    const { app } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario")) return { rows: [admin] };
      if (sql.includes("FROM tramite")) return { rows: [processRow] };
      if (sql.includes("WHERE rol = 'asesor'")) return { rows: [{ id: 5, nombre: "Laura Vásquez", correo: "laura@visaguide.com" }] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/admin/processes")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .expect(200);

    expect(response.body.tramites[0]).toMatchObject({
      id: 21,
      etapaActual: "Formulario DS-160",
      solicitante: { nombre: "Carlos Mendoza", perfil: "Renovación B1/B2" },
      asesor: null,
    });
    expect(response.body.asesores).toHaveLength(1);
  });

  test("assigns an advisor and updates status and stage", async () => {
    const refreshedRow = {
      id_tramite: 21,
      id_usuario: 8,
      estado: "Pendiente",
      etapa_actual: "Cita consular",
      progreso: 51,
      siguiente_paso: "Completar formulario",
      mensaje: "",
      id_asesor: 5,
      solicitante_nombre: "Carlos Mendoza",
      solicitante_correo: "carlos@example.com",
      solicitante_perfil: "Renovación B1/B2",
      asesor_nombre: "Laura Vásquez",
      asesor_correo: "laura@visaguide.com",
    };
    const { app, pool } = createApp(async (sql) => {
      if (sql.includes("FROM usuario WHERE id_usuario") && !sql.includes("rol = 'asesor'")) return { rows: [admin] };
      if (sql.includes("rol = 'asesor'")) return { rows: [{ id_usuario: 5 }] };
      if (sql.includes("UPDATE tramite")) return { rows: [{ id_tramite: 21 }] };
      if (sql.includes("FROM tramite")) return { rows: [refreshedRow] };
      return { rows: [] };
    });

    const response = await request(app)
      .put("/admin/processes/21")
      .set("Authorization", `Bearer ${issueSessionToken(admin)}`)
      .send({ estado: "Pendiente", etapaActual: "Cita consular", asesorId: 5 })
      .expect(200);

    expect(response.body.tramite).toMatchObject({
      estado: "Pendiente",
      etapaActual: "Cita consular",
      progreso: 51,
      asesor: { id: 5, nombre: "Laura Vásquez" },
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE tramite"),
      ["Pendiente", "Cita consular", 51, 5, 21]
    );
  });
});
