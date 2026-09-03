const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const cors = require("cors");
const { createCorsOptions } = require("./config/cors");
const upload = require("./upload");
const createInterviewSessionRoutes = require("./routes/interviewSessionRoutes");
const createQuestionBankRoutes = require("./routes/questionBankRoutes");
const createNotificacionRoutes = require("./routes/notificacionRoutes");
const createAdminMetricsRoutes = require("./routes/adminMetricsRoutes");
const createAdminDocumentRoutes = require("./routes/adminDocumentRoutes");
const createAdminProcessRoutes = require("./routes/adminProcessRoutes");
const createAdminManagementRoutes = require("./routes/adminManagementRoutes");
const { createRoleMiddleware, createSessionMiddleware, issueSessionToken } = require("./auth");
const createInterviewSessionService = require("./services/interviewSessionService");
const { createQuestionBankService } = require("./services/questionBankService");
const createNotificacionService = require("./services/notificacionService");
const createActivityLogService = require("./services/activityLogService");
const createEmailReminderService = require("./services/emailReminderService");
const { streamDs160Pdf } = require("./services/ds160PdfService");
const { LOCAL_STORAGE_DIR, uploadStoredFile, deleteStoredFile, getStoredFile } = require("./storage");

const app = express();

app.set("trust proxy", 1);
app.use(cors(createCorsOptions()));

app.use(express.json());
if (process.env.NODE_ENV !== "production") {
  app.use("/local-files", express.static(LOCAL_STORAGE_DIR));
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const SALT_ROUNDS = 10;

// Conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});
const requireAdmin = createRoleMiddleware(pool, ["admin"]);
const requireSession = createSessionMiddleware(pool);

pool
  .connect()
  .then(() => console.log("Conectado a PostgreSQL"))
  .catch((err) => console.error("Error conexión:", err));

async function ensureDocumentSchema() {
  await pool.query(`
    ALTER TABLE documentos
      ADD COLUMN IF NOT EXISTS documento_key VARCHAR(80),
      ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'review',
      ADD COLUMN IF NOT EXISTS feedback TEXT,
      ADD COLUMN IF NOT EXISTS storage_key TEXT,
      ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS documentos_usuario_documento_key_idx
    ON documentos(usuario_id, documento_key)
    WHERE usuario_id IS NOT NULL AND documento_key IS NOT NULL
  `);
}

const documentSchemaReady = ensureDocumentSchema().catch((error) => {
  console.error("ERROR DOCUMENT SCHEMA:", error);
});

async function ensureUserSchema() {
  await pool.query(`
    ALTER TABLE usuario
      ADD COLUMN IF NOT EXISTS telefono             VARCHAR(40),
      ADD COLUMN IF NOT EXISTS ciudad               VARCHAR(120),
      ADD COLUMN IF NOT EXISTS pais                 VARCHAR(120),
      ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS idioma               VARCHAR(10)  DEFAULT 'es',
      ADD COLUMN IF NOT EXISTS rol                  VARCHAR(20)  DEFAULT 'cliente'
  `);
  await pool.query(`
    UPDATE usuario SET rol = 'cliente'
    WHERE rol IS NULL OR rol NOT IN ('cliente', 'asesor', 'admin')
  `);
  await pool.query("ALTER TABLE usuario ALTER COLUMN rol SET DEFAULT 'cliente', ALTER COLUMN rol SET NOT NULL");
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'usuario_rol_check' AND conrelid = 'usuario'::regclass
      ) THEN
        ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check
        CHECK (rol IN ('cliente', 'asesor', 'admin'));
      END IF;
    END $$
  `);
}

async function ensureTramiteSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tramite (
      id_tramite SERIAL PRIMARY KEY,
      id_usuario INT UNIQUE REFERENCES usuario(id_usuario),
      estado VARCHAR(100) DEFAULT 'En proceso',
      etapa_actual VARCHAR(200) DEFAULT 'Configuración de perfil',
      progreso INT DEFAULT 0,
      siguiente_paso VARCHAR(200) DEFAULT 'Seleccionar perfil de visa',
      mensaje TEXT DEFAULT 'Configura tu perfil para comenzar'
    )
  `);
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS tramite_usuario_idx ON tramite(id_usuario)");
  await pool.query("ALTER TABLE tramite ADD COLUMN IF NOT EXISTS id_asesor INT REFERENCES usuario(id_usuario)");
  await pool.query(`ALTER TABLE tramite
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query("CREATE INDEX IF NOT EXISTS tramite_asesor_idx ON tramite(id_asesor)");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS process_change_history (
      id SERIAL PRIMARY KEY,
      process_id INT NOT NULL REFERENCES tramite(id_tramite) ON DELETE CASCADE,
      field_name VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
      changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS process_change_history_process_idx
    ON process_change_history(process_id, changed_at DESC, id DESC)
  `);
}

async function ensureAdminSchema() {
  await userSchemaReady;
  await tramiteSchemaReady;
  await pool.query(`ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS capacidad_asesor INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS disponible_asesor BOOLEAN DEFAULT TRUE`);
  await pool.query(`ALTER TABLE formulario_ds160
    ADD COLUMN IF NOT EXISTS estado_revision VARCHAR(30) DEFAULT 'en_progreso',
    ADD COLUMN IF NOT EXISTS feedback_revision TEXT,
    ADD COLUMN IF NOT EXISTS id_asesor INT REFERENCES usuario(id_usuario)`);
  await pool.query(`ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS uso_count INT DEFAULT 0`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_settings (
    id INT PRIMARY KEY,
    nombre_comercial VARCHAR(160), razon_social VARCHAR(200), sitio_web TEXT,
    idioma VARCHAR(20) DEFAULT 'es', zona_horaria VARCHAR(80) DEFAULT 'America/Guatemala',
    notificaciones_automaticas BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`ALTER TABLE admin_settings
    ADD COLUMN IF NOT EXISTS notificaciones_automaticas BOOLEAN DEFAULT TRUE`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_activity (
    id SERIAL PRIMARY KEY, actor_id INT REFERENCES usuario(id_usuario),
    accion VARCHAR(180) NOT NULL, detalle TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}
 
const userSchemaReady = ensureUserSchema().catch((error) => {
  console.error("ERROR USER SCHEMA:", error);
});
const tramiteSchemaReady = userSchemaReady.then(ensureTramiteSchema).catch((error) => {
  console.error("ERROR TRAMITE SCHEMA:", error);
});
const adminSchemaReady = tramiteSchemaReady.then(ensureAdminSchema).catch((error) => {
  console.error("ERROR ADMIN SCHEMA:", error);
});

const testUsers = [
  ["Cliente Desarrollo", "cliente.dev@visaguide.test", "VisaGuide-Dev-2026!", "cliente"],
  ["Asesor Desarrollo", "asesor.dev@visaguide.test", "VisaGuide-Dev-2026!", "asesor"],
  ["Admin Desarrollo", "admin.dev@visaguide.test", "VisaGuide-Dev-2026!", "admin"],
  ["Norman", "norman@prueba.cliente", "123456", "cliente"],
  ["Juanfri", "juanfri@prueba.cliente", "123456", "cliente"],
  ["Yaya", "yaya@prueba.cliente", "123456", "cliente"],
  ["Quan", "quan@prueba.cliente", "123456", "cliente"],
  ["Usuario Prueba", "usuario@prueba.com", "123456", "cliente"],
  ["Admin Norman", "admin.norman@prueba.com", "123456", "admin"],
  ["Admin Juanfri", "admin.juanfri@prueba.com", "123456", "admin"],
  ["Admin Yaya", "admin.yaya@prueba.com", "123456", "admin"],
  ["Admin Quan", "admin.quan@prueba.com", "123456", "admin"],
  ["Admin General", "admin@prueba.com", "123456", "admin"],
];

async function seedTestUsers() {
  await userSchemaReady;

  const hashedTestUsers = await Promise.all(
    testUsers.map(async ([nombre, correo, contrasena, rol]) => [
      nombre,
      correo,
      await bcrypt.hash(contrasena, SALT_ROUNDS),
      rol,
    ])
  );

  await pool.query(
    `
      INSERT INTO usuario(nombre, correo, contrasena, rol)
      SELECT seed.nombre, seed.correo, seed.contrasena, seed.rol
      FROM (VALUES
        ${hashedTestUsers.map((_, index) => {
          const base = index * 4;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        }).join(",\n        ")}
      ) AS seed(nombre, correo, contrasena, rol)
      WHERE NOT EXISTS (
        SELECT 1 FROM usuario u WHERE u.correo = seed.correo
      )
    `,
    hashedTestUsers.flat()
  );
}

async function seedTestProcesses() {
  await Promise.all([seedTestUsers(), tramiteSchemaReady]);

  const developmentProcesses = [
    ["norman@prueba.cliente", "Turismo B1/B2", "En proceso", "Formulario DS-160", 17, "asesor.dev@visaguide.test"],
    ["juanfri@prueba.cliente", "Estudiante F1", "Pendiente", "Documentos", 34, "asesor.dev@visaguide.test"],
    ["yaya@prueba.cliente", "Turismo Grupo", "Aprobado", "Pago de visa", 51, "asesor.dev@visaguide.test"],
    ["quan@prueba.cliente", "Renovación B1/B2", "En proceso", "Cita consular", 67, null],
    ["usuario@prueba.com", "Trabajo H1B", "Inactivo", "Configuración de perfil", 0, null],
  ];

  for (const [clientEmail, profile, status, stage, progress, advisorEmail] of developmentProcesses) {
    await pool.query("UPDATE usuario SET perfil = COALESCE(perfil, $1) WHERE correo = $2", [profile, clientEmail]);
    await pool.query(
      `INSERT INTO tramite
         (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje, id_asesor)
       SELECT client.id_usuario, $1, $2, $3, $4, $5, advisor.id_usuario
       FROM usuario client
       LEFT JOIN usuario advisor ON advisor.correo = $6 AND advisor.rol = 'asesor'
       WHERE client.correo = $7
         AND NOT EXISTS (SELECT 1 FROM tramite existing WHERE existing.id_usuario = client.id_usuario)`,
      [status, stage, progress, `Continuar con ${stage}`,
        "Expediente de prueba para validar el panel administrativo local.", advisorEmail, clientEmail]
    );
  }
}

const testUsersReady = (process.env.NODE_ENV === "development" ? seedTestProcesses() : Promise.resolve()).catch((error) => {
  console.error("ERROR TEST USERS SEED:", error);
});

const questionBankService = createQuestionBankService(pool);
questionBankService.seedInitialQuestions().catch((error) => {
  console.error("ERROR QUESTION BANK SCHEMA:", error);
});

const interviewSessionService = createInterviewSessionService(pool);
interviewSessionService.ensureSchema().catch((error) => {
  console.error("ERROR INTERVIEW SESSION SCHEMA:", error);
});

const notificacionService = createNotificacionService(pool);
notificacionService.ensureSchema().catch((error) => {
  console.error("ERROR NOTIFICACIONES SCHEMA:", error);
});

const activityLogService = createActivityLogService(pool);
activityLogService.ensureSchema().catch((error) => {
  console.error("ERROR ACTIVITY LOG SCHEMA:", error);
});

const emailReminderService = createEmailReminderService(pool);
emailReminderService.ensureSchema().catch((error) => {
  console.error("ERROR EMAIL REMINDER SCHEMA:", error);
});

async function notificarCambioEtapa(userId, etapa, titulo, mensaje) {
  try {
    await notificacionService.notificarCambioEtapa(userId, etapa, titulo, mensaje);
  } catch (err) {
    console.error("ERROR NOTIFICAR ETAPA:", err);
  }
}

function buildStoredDocumentUrl(documentId) {
  return `/documentos/${documentId}/archivo`;
}

function presentDocumento(document) {
  if (!document) return document;

  const { storage_key, ...safeDocument } = document;
  const estado = safeDocument.estado === "rejected" ? "correction" : safeDocument.estado;

  return {
    ...safeDocument,
    estado,
    archivo_url: storage_key
      ? buildStoredDocumentUrl(document.id)
      : safeDocument.archivo_url,
  };
}

function presentLoginUser(user) {
  return {
    id: user.id_usuario,
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    correo: user.correo,
    perfil: user.perfil || null,
    rol: user.rol || "cliente",
  };
}

function buildDownloadFilename(document) {
  const rawName = document.nombre || `documento-${document.id}`;
  const sanitizedName = path.basename(rawName).replace(/["\r\n]/g, "").trim();
  return sanitizedName || `documento-${document.id}`;
}

function inferDocumentContentType(document, storedFile = {}) {
  if (document.tipo?.includes("/")) return document.tipo;
  if (storedFile.contentType && storedFile.contentType !== "application/octet-stream") {
    return storedFile.contentType;
  }

  const candidates = [
    document.nombre,
    document.archivo_url,
    document.storage_key,
  ].filter(Boolean);

  const extension = candidates
    .map((value) => path.extname(String(value)).toLowerCase())
    .find(Boolean);

  const mimeTypes = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  return mimeTypes[extension] || storedFile.contentType || "application/octet-stream";
}

function canPreviewInline(contentType) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

function getUrlPathname(url) {
  try {
    return new URL(url, "http://visaguide.local").pathname;
  } catch {
    return "";
  }
}

function isSelfDocumentFileUrl(document) {
  return getUrlPathname(document.archivo_url) === buildStoredDocumentUrl(document.id);
}

async function insertDocumento({
  nombre,
  tipo,
  archivoUrl,
  usuarioId,
  documentoKey,
  storageKey,
}) {
  await documentSchemaReady;

  let existingDocument = null;

  if (usuarioId && documentoKey) {
    const existing = await pool.query(
      `SELECT id, storage_key
       FROM documentos
       WHERE usuario_id = $1 AND documento_key = $2
       LIMIT 1`,
      [usuarioId, documentoKey]
    );
    existingDocument = existing.rows[0] || null;
  }

  if (existingDocument) {
    const result = await pool.query(
      `UPDATE documentos
       SET nombre = $1,
           tipo = $2,
           archivo_url = $3,
           storage_key = $4,
           estado = 'review',
           feedback = NULL,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en, storage_key`,
      [nombre, tipo, archivoUrl, storageKey, existingDocument.id]
    );

    if (existingDocument.storage_key && existingDocument.storage_key !== storageKey) {
      deleteStoredFile(existingDocument.storage_key).catch((cleanupError) => {
        console.error("UPLOAD CLEANUP ERROR:", cleanupError);
      });
    }

    console.log("DB update success");
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO documentos (nombre, tipo, archivo_url, usuario_id, documento_key, estado, storage_key, actualizado_en)
     VALUES ($1, $2, $3, $4, $5, 'review', $6, CURRENT_TIMESTAMP)
     RETURNING id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en, storage_key`,
    [nombre, tipo, archivoUrl, usuarioId, documentoKey || null, storageKey || null]
  );

  console.log("DB insert success");
  return result.rows[0];
}

// Prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.use("/interview-sessions", createInterviewSessionRoutes(pool, { requireAdmin, notificacionService, activityLogService }));
app.use("/questions", createQuestionBankRoutes(pool, { requireAdmin }));
app.use("/notificaciones", createNotificacionRoutes(pool));
app.use("/admin/metrics", createAdminMetricsRoutes(pool, { requireAdmin }));
app.use("/admin/documents", createAdminDocumentRoutes(pool, { requireAdmin, schemaReady: documentSchemaReady, notificacionService, activityLogService }));
app.use("/admin/processes", createAdminProcessRoutes(pool, { requireAdmin, schemaReady: tramiteSchemaReady, notificacionService, activityLogService }));
app.use("/admin", createAdminManagementRoutes(pool, { requireAdmin, schemaReady: adminSchemaReady, notificacionService, activityLogService, emailReminderService }));

// ENDPOINT: validar sesión (verifica si el usuario existe en BD)
app.get("/validar-sesion", requireSession, (req, res) => {
  res.json({ valid: true, user: presentLoginUser(req.auth) });
});

// ENDPOINT: estado del trámite
async function handleEstadoTramite(req, res) {
  const { correo } = req.body || {};

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido en el body" });
  }

  try {
    await tramiteSchemaReady;
    // Buscar usuario
    const userResult = await pool.query(
      "SELECT id_usuario, perfil FROM usuario WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = userResult.rows[0].id_usuario;
    const hasProfile = Boolean(userResult.rows[0].perfil);

    // Buscar trámite del usuario
    let tramiteResult = await pool.query(
      "SELECT * FROM tramite WHERE id_usuario = $1",
      [userId]
    );

    let tramite;

    // Si no tiene trámite, crear uno nuevo
    if (tramiteResult.rows.length === 0) {
      const nuevo = await pool.query(
        `INSERT INTO tramite (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje)
         VALUES ($1, 'En proceso', $2, $3, $4, $5)
         RETURNING *`,
        hasProfile
          ? [userId, "Formulario DS-160", 17, "Completar formulario DS-160", "Tu trámite ha comenzado correctamente"]
          : [userId, "Configuración de perfil", 0, "Seleccionar perfil de visa", "Configura tu perfil para comenzar"]
      );
      tramite = nuevo.rows[0];
    } else {
      tramite = tramiteResult.rows[0];
    }

    res.json({
    estado: tramite.estado,
    etapaActual: tramite.etapa_actual,
    progreso: tramite.progreso,
    siguientePaso: tramite.siguiente_paso,
    mensaje: tramite.mensaje,
    created_at: tramite.created_at,
    updated_at: tramite.updated_at,
  });
  } catch (error) {
    console.log("ERROR ESTADO:", error);
    res.status(500).json({ error: error.message });
  }
}

app.post("/estado-tramite", handleEstadoTramite);
app.get("/estado-tramite", (_req, res) => {
  res.status(405).json({ error: "Usa POST /estado-tramite con correo en el body" });
});

// endpoint registro
app.post("/register", async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  try {
    await userSchemaReady;
    await tramiteSchemaReady;
    const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO usuario(nombre, correo, contrasena, rol) VALUES($1,$2,$3,'cliente') RETURNING *",
      [nombre, correo, contrasenaHash]
    );

    const usuario = presentLoginUser(result.rows[0]);
    await pool.query(
      `INSERT INTO tramite (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje)
       VALUES ($1, 'En proceso', 'Configuración de perfil', 0, 'Seleccionar perfil de visa', 'Configura tu perfil para comenzar')
       ON CONFLICT DO NOTHING`,
      [usuario.id_usuario]
    );
    await activityLogService.logActivity({
      req,
      actor: usuario,
      userId: usuario.id_usuario,
      userEmail: usuario.correo,
      role: usuario.rol,
      action: "user.registered",
      entityType: "usuario",
      entityId: usuario.id_usuario,
      description: "Usuario registrado",
    });
    res.json({
      message: "Usuario guardado en BD",
      data: usuario,
      token: issueSessionToken(usuario),
    });
  } catch (error) {
    console.log("ERROR REGISTER:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST: login
app.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    await testUsersReady;
    const result = await pool.query(
      `SELECT id_usuario, nombre, correo, perfil, COALESCE(rol, 'cliente') AS rol, activo, contrasena
       FROM usuario
       WHERE correo=$1`,
      [correo]
    );

    const usuarioRow = result.rows[0];
    let passwordMatches = false;
    if (usuarioRow) {
      const storedIsHashed = /^\$2[aby]\$/.test(usuarioRow.contrasena || "");
      if (storedIsHashed) {
        passwordMatches = await bcrypt.compare(contrasena || "", usuarioRow.contrasena);
      } else if (contrasena && usuarioRow.contrasena === contrasena) {
        passwordMatches = true;
        const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
        await pool.query("UPDATE usuario SET contrasena = $1 WHERE id_usuario = $2", [contrasenaHash, usuarioRow.id_usuario]);
      }
    }

    if (passwordMatches) {
      if (usuarioRow.activo === false) {
        return res.status(403).json({ error: "Cuenta desactivada. Contacta a un administrador." });
      }
      const usuario = presentLoginUser(result.rows[0]);
      await activityLogService.logActivity({
        req,
        actor: usuario,
        userId: usuario.id_usuario,
        userEmail: usuario.correo,
        role: usuario.rol,
        action: "user.login",
        entityType: "usuario",
        entityId: usuario.id_usuario,
        description: "Login exitoso",
      });
      const usuario = presentLoginUser(usuarioRow);
      res.json({
        success: true,
        message: "Login exitoso",
        usuario,
        user: usuario,
        token: issueSessionToken(usuario),
      });
    } else {
      res.status(401).json({ error: "El correo o la contraseña son incorrectos" });
    }
  } catch (error) {
    console.log("ERROR LOGIN:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST: guardar perfil
app.post("/guardar-perfil", async (req, res) => {
  const { correo, perfil } = req.body;

  if (!correo || !perfil) {
    return res.status(400).json({
      error: "Correo y perfil son obligatorios",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE usuario SET perfil = $1 WHERE correo = $2 RETURNING *",
      [perfil, correo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];
    await activityLogService.logActivity({
      req,
      actor: usuario,
      userId: usuario.id_usuario,
      userEmail: usuario.correo,
      role: usuario.rol || "cliente",
      action: "profile.selected",
      entityType: "usuario",
      entityId: usuario.id_usuario,
      description: "Perfil de visa guardado",
      metadata: { perfil },
    });

    // Avanzar tramite a etapa 2 si el progreso es menor a 17
    const tramiteResult = await pool.query(
      "SELECT id_tramite, progreso FROM tramite WHERE id_usuario = $1",
      [usuario.id_usuario]
    );

    if (tramiteResult.rows.length > 0 && tramiteResult.rows[0].progreso < 17) {
      await pool.query(
        `UPDATE tramite
         SET etapa_actual = 'Formulario DS-160',
             progreso = 17,
             siguiente_paso = 'Completar el formulario DS-160',
             mensaje = 'Perfil de visa configurado. Ahora completa el formulario DS-160.'
         WHERE id_usuario = $1`,
        [usuario.id_usuario]
      );
      notificarCambioEtapa(
        usuario.id_usuario,
        "Formulario DS-160",
        "¡Perfil configurado!",
        "Tu perfil de visa ha sido guardado. El siguiente paso es completar el formulario DS-160."
      );
    }

    res.json({
      message: "Perfil guardado correctamente",
      user: usuario,
    });
  } catch (error) {
    console.log("ERROR GUARDAR PERFIL:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const { nombre, tipo, usuario_id, documento_key } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Archivo requerido" });
  }

  const documentName = nombre?.trim() || req.file.originalname;
  const documentType = tipo?.trim() || req.file.mimetype || null;
  const parsedUsuarioId =
    usuario_id === undefined || usuario_id === null || usuario_id === ""
      ? null
      : Number(usuario_id);

  if (parsedUsuarioId !== null && Number.isNaN(parsedUsuarioId)) {
    return res.status(400).json({ error: "usuario_id debe ser numérico" });
  }

  let uploadedFile;

  try {
    uploadedFile = await uploadStoredFile(req.file, {
      baseUrl: `${req.protocol}://${req.get("host")}`,
    });
    const documento = presentDocumento(await insertDocumento({
      nombre: documentName,
      tipo: documentType,
      archivoUrl: uploadedFile.url,
      usuarioId: parsedUsuarioId,
      documentoKey: documento_key?.trim() || null,
      storageKey: uploadedFile.key,
    }));
    await activityLogService.logActivity({
      req,
      userId: documento.usuario_id,
      userEmail: null,
      role: "cliente",
      action: "document.uploaded",
      entityType: "documento",
      entityId: documento.id,
      description: "Documento cargado",
      metadata: {
        nombre: documento.nombre,
        tipo: documento.tipo,
        documentoKey: documento.documento_key,
      },
    });

    res.json({
      message: "Archivo subido correctamente",
      archivo_url: documento.archivo_url,
      key: uploadedFile.key,
      documento,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    if (process.env.NODE_ENV === "production" && (error.message?.includes("Missing R2") || error.message?.includes("placeholder"))) {
      return res.status(500).json({ error: "No fue posible subir el archivo. Inténtalo nuevamente más tarde." });
    }

    if (!uploadedFile) {
      return res.status(500).json({ error: "No se pudo almacenar el archivo" });
    }

    try {
      await deleteStoredFile(uploadedFile.key);
    } catch (cleanupError) {
      console.error("UPLOAD ERROR: cleanup failed", cleanupError);
    }

    return res.status(500).json({ error: "No se pudo guardar el documento" });
  }
});
// Mapa para presentar el tipo de visa según el perfil guardado.
const PERFIL_A_VISA = {
  turismo_negocios: "B1/B2 (Turismo / Negocios)",
  estudiante:       "F/M (Estudiante)",
  renovacion:       "Renovación",
  grupo_familiar:   "Grupo Familiar",
  adulto_mayor:     "Adulto Mayor (Senior)",
};
 
// Calcula la etapa actual (1..6) a partir del progreso del trámite,
// con la misma regla que ya usa el Dashboard.
function calcularEtapa(progreso, perfil) {
  let etapa = Math.ceil((Number(progreso) || 10) / 16.66);
  if (perfil && etapa < 2) etapa = 2;
  if (etapa < 1) etapa = 1;
  if (etapa > 6) etapa = 6;
  return etapa;
}
 
// POST /usuario-perfil
// Devuelve TODO lo que la pantalla "Perfil de Usuario" necesita en un
// solo request: datos personales, datos del trámite y preferencias.
app.post("/usuario-perfil", async (req, res) => {
  const { correo } = req.body || {};
 
  if (!correo) {
    return res.status(400).json({ error: "Correo requerido en el body" });
  }
 
  try {
    await userSchemaReady;
 
    const userResult = await pool.query(
      `SELECT id_usuario, nombre, correo, perfil,
              telefono, ciudad, pais,
              notificaciones_email, idioma
       FROM usuario
       WHERE correo = $1`,
      [correo]
    );
 
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
 
    const usuario = userResult.rows[0];
 
    // Trámite asociado (puede no existir todavía).
    const tramiteResult = await pool.query(
      "SELECT estado, etapa_actual, progreso FROM tramite WHERE id_usuario = $1",
      [usuario.id_usuario]
    );
 
    const tramite = tramiteResult.rows[0] || {
      estado: "En proceso",
      etapa_actual: "Formulario DS-160",
      progreso: 10,
    };
 
    const etapa = calcularEtapa(tramite.progreso, usuario.perfil);
 
    res.json({
      usuario: {
        id:        usuario.id_usuario,
        nombre:    usuario.nombre,
        correo:    usuario.correo,
        telefono:  usuario.telefono  || "",
        ciudad:    usuario.ciudad    || "",
        pais:      usuario.pais      || "",
        perfil:    usuario.perfil    || null,
        preferencias: {
          notificacionesEmail: usuario.notificaciones_email !== false,
          idioma:              usuario.idioma || "es",
        },
      },
      tramite: {
        tipoVisa:    PERFIL_A_VISA[usuario.perfil] || "Sin definir",
        consulado:   [usuario.ciudad, usuario.pais].filter(Boolean).join(", ") || "Sin definir",
        estado:      tramite.estado,
        etapaActual: tramite.etapa_actual,
        etapa,
        totalEtapas: 6,
        activo:      tramite.estado === "En proceso",
      },
    });
  } catch (error) {
    console.log("ERROR GET USUARIO-PERFIL:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/usuario-perfil", (_req, res) => {
  res.status(405).json({ error: "Usa POST /usuario-perfil con correo en el body" });
});
 
// PUT /usuario-perfil
// Body: { correo, nombre?, telefono?, ciudad?, pais?,
//         notificacionesEmail?, idioma? }
// Solo actualiza los campos que vengan en el body (parcial).
app.put("/usuario-perfil", async (req, res) => {
  const {
    correo,
    nombre,
    telefono,
    ciudad,
    pais,
    notificacionesEmail,
    idioma,
  } = req.body;
 
  if (!correo) {
    return res.status(400).json({ error: "Correo requerido" });
  }
 
  try {
    await userSchemaReady;
 
    // Armado dinámico del SET para hacer un update parcial limpio.
    const sets = [];
    const valores = [];
    let i = 1;
 
    if (nombre              !== undefined) { sets.push(`nombre = $${i++}`);               valores.push(nombre); }
    if (telefono            !== undefined) { sets.push(`telefono = $${i++}`);             valores.push(telefono); }
    if (ciudad              !== undefined) { sets.push(`ciudad = $${i++}`);               valores.push(ciudad); }
    if (pais                !== undefined) { sets.push(`pais = $${i++}`);                 valores.push(pais); }
    if (notificacionesEmail !== undefined) { sets.push(`notificaciones_email = $${i++}`); valores.push(!!notificacionesEmail); }
    if (idioma              !== undefined) { sets.push(`idioma = $${i++}`);               valores.push(idioma); }
 
    if (sets.length === 0) {
      return res.status(400).json({ error: "Nada que actualizar" });
    }
 
    valores.push(correo);
 
    const result = await pool.query(
      `UPDATE usuario
       SET ${sets.join(", ")}
       WHERE correo = $${i}
       RETURNING id_usuario, nombre, correo, perfil,
                 telefono, ciudad, pais,
                 notificaciones_email, idioma`,
      valores
    );
 
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
 
    const u = result.rows[0];
    await activityLogService.logActivity({
      req,
      actor: u,
      userId: u.id_usuario,
      userEmail: u.correo,
      role: "cliente",
      action: "profile.updated",
      entityType: "usuario",
      entityId: u.id_usuario,
      description: "Perfil de usuario actualizado",
      metadata: {
        campos: Object.keys({
          ...(nombre !== undefined ? { nombre: true } : {}),
          ...(telefono !== undefined ? { telefono: true } : {}),
          ...(ciudad !== undefined ? { ciudad: true } : {}),
          ...(pais !== undefined ? { pais: true } : {}),
          ...(notificacionesEmail !== undefined ? { notificacionesEmail: true } : {}),
          ...(idioma !== undefined ? { idioma: true } : {}),
        }),
      },
    });

    res.json({
      message: "Perfil actualizado correctamente",
      usuario: {
        id:        u.id_usuario,
        nombre:    u.nombre,
        correo:    u.correo,
        telefono:  u.telefono || "",
        ciudad:    u.ciudad   || "",
        pais:      u.pais     || "",
        perfil:    u.perfil   || null,
        preferencias: {
          notificacionesEmail: u.notificaciones_email !== false,
          idioma:              u.idioma || "es",
        },
      },
    });
  } catch (error) {
    console.log("ERROR PUT USUARIO-PERFIL:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/documentos", upload.single("file"), async (req, res) => {
  const { nombre, tipo, usuario_id, documento_key } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Archivo requerido" });
  }

  if (!nombre?.trim()) {
    return res.status(400).json({ error: "Nombre requerido" });
  }

  const parsedUsuarioId =
    usuario_id === undefined || usuario_id === null || usuario_id === ""
      ? null
      : Number(usuario_id);

  if (parsedUsuarioId !== null && Number.isNaN(parsedUsuarioId)) {
    return res.status(400).json({ error: "usuario_id debe ser numérico" });
  }

  let uploadedFile;

  try {
    uploadedFile = await uploadStoredFile(req.file, {
      baseUrl: `${req.protocol}://${req.get("host")}`,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    if (process.env.NODE_ENV === "production" && (error.message?.includes("Missing R2") || error.message?.includes("placeholder"))) {
      return res.status(500).json({ error: "No fue posible subir el archivo. Inténtalo nuevamente más tarde." });
    }
    return res.status(500).json({ error: "No se pudo almacenar el archivo" });
  }

  try {
    const documento = presentDocumento(await insertDocumento({
      nombre: nombre.trim(),
      tipo: tipo || null,
      archivoUrl: uploadedFile.url,
      usuarioId: parsedUsuarioId,
      documentoKey: documento_key?.trim() || null,
      storageKey: uploadedFile.key,
    }));
    await activityLogService.logActivity({
      req,
      userId: documento.usuario_id,
      userEmail: null,
      role: "cliente",
      action: "document.uploaded",
      entityType: "documento",
      entityId: documento.id,
      description: "Documento cargado",
      metadata: {
        nombre: documento.nombre,
        tipo: documento.tipo,
        documentoKey: documento.documento_key,
      },
    });

    return res.status(201).json({
      message: "Documento guardado correctamente",
      documento,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    try {
      await deleteStoredFile(uploadedFile.key);
    } catch (cleanupError) {
      console.error("UPLOAD ERROR: cleanup failed", cleanupError);
    }

    return res.status(500).json({ error: "No se pudo guardar el documento" });
  }
});

app.get("/documentos/:id/archivo", async (req, res) => {
  const documentId = Number(req.params.id);

  if (Number.isNaN(documentId)) {
    return res.status(400).json({ error: "documento_id debe ser numÃ©rico" });
  }

  try {
    await documentSchemaReady;

    const result = await pool.query(
      `SELECT id, nombre, tipo, archivo_url, storage_key
       FROM documentos
       WHERE id = $1
       LIMIT 1`,
      [documentId]
    );

    const document = result.rows[0];

    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    if (!document.storage_key) {
      if (isSelfDocumentFileUrl(document)) {
        return res.status(404).json({
          error: "El archivo no esta disponible para vista previa",
        });
      }

      return res.redirect(document.archivo_url);
    }

    const storedFile = await getStoredFile(document.storage_key);
    const contentType = inferDocumentContentType(document, storedFile);
    const dispositionType = canPreviewInline(contentType) ? "inline" : "attachment";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Link", '</visaguide-favicon.svg>; rel="icon"; type="image/svg+xml"');
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${buildDownloadFilename(document)}"`
    );

    if (storedFile.contentLength) {
      res.setHeader("Content-Length", String(storedFile.contentLength));
    }

    storedFile.stream.on("error", (error) => {
      console.error("ERROR STREAM DOCUMENTO:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "No se pudo cargar el documento" });
      } else {
        res.destroy(error);
      }
    });

    return storedFile.stream.pipe(res);
  } catch (error) {
    console.error("ERROR GET DOCUMENTO ARCHIVO:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "No se pudo cargar el documento",
    });
  }
});

async function handleListDocumentos(req, res, usuarioIdValue) {
  const usuarioId = Number(usuarioIdValue ?? req.body?.usuario_id ?? req.body?.usuarioId);

  if (Number.isNaN(usuarioId)) {
    const message = usuarioIdValue === undefined
      ? "usuario_id requerido en el body y debe ser numérico"
      : "usuario_id debe ser numérico";
    return res.status(400).json({ error: message });
  }

  try {
    await documentSchemaReady;

    const result = await pool.query(
      `SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en, storage_key
       FROM documentos
       WHERE usuario_id = $1
       ORDER BY actualizado_en DESC, creado_en DESC`,
      [usuarioId]
    );

    return res.json(result.rows.map(presentDocumento));
  } catch (error) {
    console.error("ERROR GET DOCUMENTOS:", error);
    return res.status(500).json({ error: "No se pudieron cargar los documentos" });
  }
}

app.post("/documentos/listar", async (req, res) => {
  return handleListDocumentos(req, res);
});

app.get("/documentos/:usuarioId", async (req, res) => {
  return handleListDocumentos(req, res, req.params.usuarioId);
});

async function handleDeleteDocumento(req, res, documentIdValue) {
  const documentId = Number(documentIdValue ?? req.body?.documento_id ?? req.body?.documentId);
  const usuarioId = Number(req.body?.usuario_id ?? req.body?.usuarioId);

  if (Number.isNaN(documentId)) {
    return res.status(400).json({ error: "documento_id debe ser numérico" });
  }

  if (Number.isNaN(usuarioId)) {
    return res.status(400).json({ error: "usuario_id requerido en el body y debe ser numérico" });
  }

  try {
    await documentSchemaReady;

    const result = await pool.query(
      `DELETE FROM documentos
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, storage_key`,
      [documentId, usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    const deletedDocument = result.rows[0];

    if (deletedDocument.storage_key) {
      deleteStoredFile(deletedDocument.storage_key).catch((cleanupError) => {
        console.error("DELETE DOCUMENT CLEANUP ERROR:", cleanupError);
      });
    }

    return res.json({ message: "Documento eliminado correctamente" });
  } catch (error) {
    console.error("ERROR DELETE DOCUMENTO:", error);
    return res.status(500).json({ error: "No se pudo eliminar el documento" });
  }
}

app.delete("/documentos", async (req, res) => {
  return handleDeleteDocumento(req, res);
});

app.delete("/documentos/:id", async (req, res) => {
  return handleDeleteDocumento(req, res, req.params.id);
});

// =====================
// ENDPOINTS DS-160
// =====================

// POST: Descargar formulario DS-160 del usuario en PDF
async function handleDs160Pdf(req, res) {
  const { correo } = req.body || {};

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido en el body" });
  }

  try {
    const userResult = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = userResult.rows[0].id_usuario;

    const formResult = await pool.query(
      "SELECT * FROM formulario_ds160 WHERE id_usuario = $1",
      [userId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: "Formulario DS-160 no encontrado" });
    }
    await activityLogService.logActivity({
      req,
      userId,
      userEmail: correo,
      role: "cliente",
      action: "ds160.pdf_exported",
      entityType: "formulario_ds160",
      entityId: formResult.rows[0].id_formulario,
      description: "PDF DS-160 descargado",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="ds160-${userId}.pdf"`);
    res.setHeader("Cache-Control", "no-store");

    return streamDs160Pdf({
      usuario: { id_usuario: userId, correo },
      formulario: formResult.rows[0],
    }, res);
  } catch (error) {
    console.log("ERROR GET DS160 PDF:", error);
    if (res.headersSent) return res.end();
    return res.status(500).json({ error: error.message });
  }
}

app.post("/ds160/pdf", handleDs160Pdf);
app.get("/ds160/pdf", (_req, res) => {
  res.status(405).json({ error: "Usa POST /ds160/pdf con correo en el body" });
});

// POST: Cargar formulario DS-160 del usuario
async function handleLoadDs160(req, res) {
  const { correo } = req.body || {};

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido en el body" });
  }

  try {
    // Buscar usuario
    const userResult = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = userResult.rows[0].id_usuario;

    // Buscar formulario
    const formResult = await pool.query(
      "SELECT * FROM formulario_ds160 WHERE id_usuario = $1",
      [userId]
    );

    if (formResult.rows.length === 0) {
      // No tiene formulario, retornar vacío
      return res.json({ 
        datos: {}, 
        seccion_actual: 1, 
        completado: false 
      });
    }

    const form = formResult.rows[0];
    res.json({
      datos: form.datos,
      seccion_actual: form.seccion_actual,
      completado: form.completado
    });

  } catch (error) {
    console.log("ERROR GET DS160:", error);
    res.status(500).json({ error: error.message });
  }
}

app.post("/ds160/load", handleLoadDs160);
app.get("/ds160", (_req, res) => {
  res.status(405).json({ error: "Usa POST /ds160/load con correo en el body" });
});

// POST: Guardar formulario DS-160
app.post("/ds160", async (req, res) => {
  const { correo, datos, seccion_actual, completado } = req.body;

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido" });
  }

  try {
    // Buscar usuario
    const userResult = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = userResult.rows[0].id_usuario;

    // Verificar si ya tiene formulario
    const existingForm = await pool.query(
      "SELECT id_formulario FROM formulario_ds160 WHERE id_usuario = $1",
      [userId]
    );

    let result;

    const isNewForm = existingForm.rows.length === 0;

    if (isNewForm) {
      // Crear nuevo formulario
      result = await pool.query(
        `INSERT INTO formulario_ds160 (id_usuario, datos, seccion_actual, completado, updated_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [userId, JSON.stringify(datos || {}), seccion_actual || 1, completado || false]
      );
    } else {
      // Actualizar formulario existente
      result = await pool.query(
        `UPDATE formulario_ds160 
         SET datos = $1, seccion_actual = $2, completado = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE id_usuario = $4 
         RETURNING *`,
        [JSON.stringify(datos || {}), seccion_actual || 1, completado || false, userId]
      );
    }
    await activityLogService.logActivity({
      req,
      userId,
      userEmail: correo,
      role: "cliente",
      action: "ds160.saved",
      entityType: "formulario_ds160",
      entityId: result.rows[0].id_formulario,
      description: isNewForm ? "Formulario DS-160 creado" : "Formulario DS-160 actualizado",
      metadata: {
        seccionActual: result.rows[0].seccion_actual,
        completado: result.rows[0].completado,
      },
    });

    // Si el DS-160 se marcó como completado, avanzar tramite a etapa 3
    if (completado) {
      const tramiteDs = await pool.query(
        "SELECT id_tramite, progreso FROM tramite WHERE id_usuario = $1",
        [userId]
      );

      if (tramiteDs.rows.length > 0 && tramiteDs.rows[0].progreso < 34) {
        await pool.query(
          `UPDATE tramite
           SET etapa_actual = 'Pago de visa',
               progreso = 34,
               siguiente_paso = 'Realizar el pago de la tarifa de visa',
               mensaje = 'Formulario DS-160 completado. El siguiente paso es realizar el pago.'
           WHERE id_usuario = $1`,
          [userId]
        );
        notificarCambioEtapa(
          userId,
          "Pago de visa",
          "DS-160 completado",
          "Has completado el formulario DS-160 exitosamente. Ahora debes realizar el pago de la tarifa de visa."
        );
      }
    }

    res.json({
      message: "Formulario guardado correctamente",
      formulario: result.rows[0]
    });

  } catch (error) {
    console.log("ERROR POST DS160:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /tramite — actualizar etapa del trámite y generar notificación automática
const ETAPAS_VALIDAS = {
  "Formulario DS-160": { progreso: 17, siguientePaso: "Completar el formulario DS-160" },
  "Pago de visa":      { progreso: 34, siguientePaso: "Realizar el pago de la tarifa de visa" },
  "Cita consular":     { progreso: 51, siguientePaso: "Programar tu cita consular" },
  "Entrevista":        { progreso: 67, siguientePaso: "Prepararte para la entrevista consular" },
  "Decisión final":    { progreso: 84, siguientePaso: "Esperar la decisión final del consulado" },
};

const MENSAJES_ETAPA = {
  "Formulario DS-160": "Tu perfil fue configurado. El siguiente paso es completar el formulario DS-160.",
  "Pago de visa":      "Formulario DS-160 completado. Ahora debes realizar el pago de la tarifa de visa.",
  "Cita consular":     "Pago de visa confirmado. El siguiente paso es programar tu cita consular.",
  "Entrevista":        "Cita consular agendada. Prepárate para tu entrevista.",
  "Decisión final":    "Entrevista completada. Tu solicitud está en proceso de revisión final.",
};

app.put("/tramite", async (req, res) => {
  const { correo, etapa_actual, progreso, siguiente_paso, mensaje, estado } = req.body;

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido" });
  }

  if (!etapa_actual) {
    return res.status(400).json({ error: "etapa_actual requerida" });
  }

  try {
    const userResult = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = userResult.rows[0].id_usuario;

    const defaults = ETAPAS_VALIDAS[etapa_actual] || {};
    const nuevoProgreso    = progreso      ?? defaults.progreso    ?? 10;
    const nuevoSiguiente   = siguiente_paso ?? defaults.siguientePaso ?? "";
    const nuevoMensaje     = mensaje        ?? MENSAJES_ETAPA[etapa_actual] ?? "";
    const nuevoEstado      = estado         ?? "En proceso";

    const tramiteResult = await pool.query(
      "SELECT id_tramite, etapa_actual FROM tramite WHERE id_usuario = $1",
      [userId]
    );

    let tramite;
    if (tramiteResult.rows.length === 0) {
      const nuevo = await pool.query(
        `INSERT INTO tramite (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, nuevoEstado, etapa_actual, nuevoProgreso, nuevoSiguiente, nuevoMensaje]
      );
      tramite = nuevo.rows[0];
    } else {
      const etapaAnterior = tramiteResult.rows[0].etapa_actual;
      const updated = await pool.query(
        `UPDATE tramite
         SET estado = $1, etapa_actual = $2, progreso = $3,
             siguiente_paso = $4, mensaje = $5
         WHERE id_usuario = $6
         RETURNING *`,
        [nuevoEstado, etapa_actual, nuevoProgreso, nuevoSiguiente, nuevoMensaje, userId]
      );
      tramite = updated.rows[0];

      if (etapaAnterior !== etapa_actual) {
        notificarCambioEtapa(
          userId,
          etapa_actual,
          `Nueva etapa: ${etapa_actual}`,
          nuevoMensaje || `Tu trámite ha avanzado a la etapa: ${etapa_actual}.`
        );
      }
    }

    await activityLogService.logActivity({
      req,
      userId,
      userEmail: correo,
      role: "cliente",
      action: "process.updated",
      entityType: "tramite",
      entityId: tramite.id_tramite,
      description: "Trámite actualizado",
      metadata: {
        estado: tramite.estado,
        etapaActual: tramite.etapa_actual,
        progreso: tramite.progreso,
      },
    });

    return res.json({
      message: "Trámite actualizado correctamente",
      tramite: {
        estado:       tramite.estado,
        etapaActual:  tramite.etapa_actual,
        progreso:     tramite.progreso,
        siguientePaso: tramite.siguiente_paso,
        mensaje:      tramite.mensaje,
      },
    });
  } catch (error) {
    console.error("ERROR PUT TRAMITE:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.use(upload.handleUploadError);

module.exports = app;
