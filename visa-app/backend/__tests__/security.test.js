const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");
const { Readable } = require("stream");
const { createRoleMiddleware, createSessionMiddleware, issueSessionToken } = require("../auth");
const createAuthRoutes = require("../routes/authRoutes");
const createDocumentRoutes = require("../routes/documentRoutes");
const createAdminDocumentRoutes = require("../routes/adminDocumentRoutes");
const createAdminProcessRoutes = require("../routes/adminProcessRoutes");
const createAdminManagementRoutes = require("../routes/adminManagementRoutes");
const createNotificacionRoutes = require("../routes/notificacionRoutes");
const createNotificacionService = require("../services/notificacionService");

var mockUploadStoredFile = jest.fn(async () => ({
  key: "local/security-document.pdf",
  url: "http://localhost/local-files/security-document.pdf",
  provider: "local",
}));
var mockDeleteStoredFile = jest.fn(async () => undefined);
var mockGetStoredFile = jest.fn(async () => ({
  stream: Readable.from(["pdf seguro"]),
  contentType: "application/pdf",
  contentLength: 10,
}));

jest.mock("../storage", () => ({
  LOCAL_STORAGE_DIR: "/tmp/visa-app-security-test-uploads",
  uploadStoredFile: mockUploadStoredFile,
  deleteStoredFile: mockDeleteStoredFile,
  getStoredFile: mockGetStoredFile,
}));

describe("pruebas de seguridad", () => {
  const passwordHash = bcrypt.hashSync("clave-segura", 10);
  const users = {
    admin: {
      id_usuario: 1,
      nombre: "Admin Seguridad",
      correo: "admin.security@test.dev",
      perfil: null,
      rol: "admin",
      activo: true,
      contrasena: passwordHash,
      email_verificado: true,
    },
    client: {
      id_usuario: 2,
      nombre: "Cliente Seguridad",
      correo: "cliente.security@test.dev",
      perfil: "turismo_negocios",
      rol: "cliente",
      activo: true,
      contrasena: passwordHash,
      email_verificado: true,
    },
    otherClient: {
      id_usuario: 3,
      nombre: "Otro Cliente",
      correo: "otro.security@test.dev",
      perfil: "estudiante",
      rol: "cliente",
      activo: true,
      contrasena: passwordHash,
      email_verificado: true,
    },
  };
  const documents = [
    {
      id: 10,
      nombre: "pasaporte.pdf",
      tipo: "application/pdf",
      archivo_url: "http://localhost/local-files/security-document.pdf",
      usuario_id: 2,
      documento_key: "passport",
      estado: "review",
      feedback: null,
      storage_key: "local/security-document.pdf",
      creado_en: "2026-09-01T10:00:00.000Z",
      actualizado_en: "2026-09-01T10:00:00.000Z",
      usuario_nombre: "Cliente Seguridad",
      usuario_correo: "cliente.security@test.dev",
    },
    {
      id: 11,
      nombre: "visa-ajena.pdf",
      tipo: "application/pdf",
      archivo_url: "http://localhost/local-files/other-document.pdf",
      usuario_id: 3,
      documento_key: "previous_visa",
      estado: "approved",
      feedback: null,
      storage_key: "local/other-document.pdf",
      creado_en: "2026-09-01T10:00:00.000Z",
      actualizado_en: "2026-09-01T10:00:00.000Z",
      usuario_nombre: "Otro Cliente",
      usuario_correo: "otro.security@test.dev",
    },
  ];

  function createSecurityApp() {
    const pool = { query: jest.fn(queryHandler) };
    const app = express();
    const requireSession = createSessionMiddleware(pool);
    const requireAdmin = createRoleMiddleware(pool, ["admin"]);
    const notificacionService = createNotificacionService(pool);
    const activityLogService = { logActivity: jest.fn(async () => null) };
    const schemaReady = Promise.resolve();

    app.use(express.json());
    app.use("/", createAuthRoutes(pool, {
      userSchemaReady: schemaReady,
      tramiteSchemaReady: schemaReady,
      passwordResetSchemaReady: schemaReady,
      emailVerificationSchemaReady: schemaReady,
      testUsersReady: schemaReady,
      requireSession,
      activityLogService,
      sendEmail: jest.fn(async () => null),
    }));
    app.use("/", createDocumentRoutes(pool, {
      documentSchemaReady: schemaReady,
      requireSession,
      activityLogService,
    }));
    app.use("/notificaciones", createNotificacionRoutes(pool, { requireSession, requireAdmin }));
    app.use("/admin/documents", createAdminDocumentRoutes(pool, {
      requireAdmin,
      schemaReady,
      notificacionService,
      activityLogService,
    }));
    app.use("/admin/processes", createAdminProcessRoutes(pool, {
      requireAdmin,
      schemaReady,
      notificacionService,
      activityLogService,
    }));
    app.use("/admin", createAdminManagementRoutes(pool, {
      requireAdmin,
      schemaReady,
      notificacionService,
      activityLogService,
      emailReminderService: {
        listReminderCandidates: jest.fn(async () => []),
        sendReminder: jest.fn(async () => ({ status: "dry_run" })),
      },
    }));

    return { app, pool };
  }

  async function queryHandler(sql, values = []) {
    const normalized = String(sql).replace(/\s+/g, " ").trim();

    if (normalized.includes("FROM usuario WHERE correo = $1")) {
      const user = Object.values(users).find((candidate) => candidate.correo === values[0]);
      return { rows: user ? [user] : [] };
    }

    if (normalized.includes("FROM usuario WHERE id_usuario = $1")) {
      const user = Object.values(users).find((candidate) => candidate.id_usuario === values[0]);
      return { rows: user ? [user] : [] };
    }

    if (normalized.includes("INSERT INTO activity_logs")) return { rows: [{ id: 1 }] };
    if (normalized.includes("CREATE TABLE") || normalized.includes("CREATE INDEX")) return { rows: [] };
    if (normalized.includes("SELECT notificaciones_automaticas")) return { rows: [{ notificaciones_automaticas: true }] };

    if (
      normalized.includes("SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key") &&
      normalized.includes("FROM documentos") &&
      normalized.includes("WHERE usuario_id = $1")
    ) {
      return { rows: documents.filter((document) => document.usuario_id === values[0]) };
    }

    if (normalized.includes("SELECT * FROM documentos WHERE id = $1")) {
      return { rows: documents.filter((document) => document.id === values[0]) };
    }

    if (normalized.includes("WITH updated AS") && normalized.includes("UPDATE documentos")) {
      const document = documents.find((candidate) => candidate.id === values[values.length - 1]);
      if (!document) return { rows: [] };
      const feedback = normalized.includes("feedback = $1") ? values[0] : document.feedback;
      const estado = normalized.includes("estado = $1") ? values[0] : document.estado;
      return {
        rows: [{
          ...document,
          estado,
          feedback,
          usuario_nombre: "Cliente Seguridad",
          usuario_correo: "cliente.security@test.dev",
        }],
      };
    }

    if (normalized.includes("SELECT id_tramite") && normalized.includes("FROM tramite")) return { rows: [] };

    if (normalized.includes("FROM notificaciones") && normalized.includes("WHERE id_usuario = $1")) {
      return {
        rows: [{
          id: 30,
          id_usuario: values[0],
          titulo: "Aviso",
          mensaje: "Mensaje privado",
          tipo: "info",
          leido: false,
          etapa_relacionada: null,
          created_at: "2026-09-01T10:00:00.000Z",
          updated_at: "2026-09-01T10:00:00.000Z",
        }],
      };
    }

    if (normalized.includes("INSERT INTO notificaciones")) return { rows: [{ id: 40 }] };
    return { rows: [] };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("login rechaza credenciales invalidas y payloads de SQL injection", async () => {
    const { app, pool } = createSecurityApp();
    const payloads = ["' OR 1=1--", "admin'--", "1 OR 1=1"];

    for (const payload of payloads) {
      const response = await request(app).post("/login").send({
        correo: payload,
        contrasena: payload,
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "El correo o la contraseña son incorrectos" });
    }

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM usuario WHERE correo = $1"),
      ["' OR 1=1--"]
    );
  });

  test("login valido no expone contrasena y emite solo el token de sesion esperado", async () => {
    const { app } = createSecurityApp();

    const response = await request(app).post("/login").send({
      correo: users.client.correo,
      contrasena: "clave-segura",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("contrasena");
    expect(JSON.stringify(response.body)).not.toContain(passwordHash);
    expect(response.body.usuario).toMatchObject({
      id_usuario: 2,
      correo: users.client.correo,
      rol: "cliente",
    });
  });

  test("rutas protegidas rechazan token ausente o invalido", async () => {
    const { app } = createSecurityApp();

    await request(app).get("/validar-sesion").expect(401);
    await request(app)
      .get("/validar-sesion")
      .set("Authorization", "Bearer token.invalido")
      .expect(401);
  });

  test("usuario normal no puede acceder a endpoints admin de documentos, procesos, logs ni recordatorios", async () => {
    const { app } = createSecurityApp();
    const clientToken = issueSessionToken(users.client);

    await request(app).get("/admin/documents").set("Authorization", `Bearer ${clientToken}`).expect(403);
    await request(app).get("/admin/processes").set("Authorization", `Bearer ${clientToken}`).expect(403);
    await request(app).get("/admin/activity-logs").set("Authorization", `Bearer ${clientToken}`).expect(403);
    await request(app).post("/admin/email-reminders/run").set("Authorization", `Bearer ${clientToken}`).expect(403);
  });

  test("usuario no puede listar ni descargar documentos de otro usuario", async () => {
    const { app } = createSecurityApp();
    const clientToken = issueSessionToken(users.client);

    await request(app)
      .get("/documentos/3")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);

    await request(app)
      .get("/documentos/11/archivo")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);

    expect(mockGetStoredFile).not.toHaveBeenCalled();
  });

  test("usuario autenticado solo lista sus documentos sin exponer storage_key interno", async () => {
    const { app } = createSecurityApp();
    const clientToken = issueSessionToken(users.client);

    const response = await request(app)
      .post("/documentos/listar")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ usuario_id: 2 })
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 10,
      usuario_id: 2,
      archivo_url: "/documentos/10/archivo",
    });
    expect(response.body[0]).not.toHaveProperty("storage_key");
    expect(JSON.stringify(response.body)).not.toContain("local/security-document.pdf");
  });

  test("notificaciones privadas rechazan acceso cruzado entre usuarios", async () => {
    const { app } = createSecurityApp();
    const clientToken = issueSessionToken(users.client);

    await request(app)
      .get("/notificaciones/3")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);
  });

  test("payload XSS en observaciones se conserva como texto y no altera el contrato JSON", async () => {
    const { app, pool } = createSecurityApp();
    const adminToken = issueSessionToken(users.admin);
    const payload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

    const response = await request(app)
      .put("/admin/documents/10/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ feedback: payload })
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.documento.feedback).toBe(payload);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE documentos"),
      [payload, 10]
    );
  });

  test("IDs y estados invalidos devuelven errores controlados", async () => {
    const { app } = createSecurityApp();
    const adminToken = issueSessionToken(users.admin);

    await request(app)
      .get("/documentos/abc")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    await request(app)
      .get("/admin/processes/1%20OR%201=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    await request(app)
      .put("/admin/documents/10/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "review" })
      .expect(400);
  });
});
