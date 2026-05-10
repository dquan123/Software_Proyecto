const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const upload = require("./upload");
const {
  uploadBufferToR2,
  deleteObjectFromR2,
  validateR2Config,
} = require("./r2");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

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
       RETURNING id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en`,
      [nombre, tipo, archivoUrl, storageKey, existingDocument.id]
    );

    if (existingDocument.storage_key && existingDocument.storage_key !== storageKey) {
      deleteObjectFromR2(existingDocument.storage_key).catch((cleanupError) => {
        console.error("UPLOAD CLEANUP ERROR:", cleanupError);
      });
    }

    console.log("DB update success");
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO documentos (nombre, tipo, archivo_url, usuario_id, documento_key, estado, storage_key, actualizado_en)
     VALUES ($1, $2, $3, $4, $5, 'review', $6, CURRENT_TIMESTAMP)
     RETURNING id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en`,
    [nombre, tipo, archivoUrl, usuarioId, documentoKey || null, storageKey || null]
  );

  console.log("DB insert success");
  return result.rows[0];
}

// Prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

// ENDPOINT: validar sesión (verifica si el usuario existe en BD)
app.get("/validar-sesion", async (req, res) => {
  const { correo } = req.query;

  if (!correo) {
    return res.status(400).json({ valid: false, error: "Correo requerido" });
  }

  try {
    const result = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1",
      [correo]
    );

    if (result.rows.length > 0) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.log("ERROR VALIDAR SESION:", error);
    res.status(500).json({ valid: false, error: error.message });
  }
});

// ENDPOINT: estado del trámite
app.get("/estado-tramite", async (req, res) => {
  const { correo } = req.query;

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
         VALUES ($1, 'En proceso', 'Formulario DS-160', 10, 'Completar formulario DS-160', 'Tu trámite ha comenzado correctamente') 
         RETURNING *`,
        [userId]
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
    });
  } catch (error) {
    console.log("ERROR ESTADO:", error);
    res.status(500).json({ error: error.message });
  }
});

// endpoint registro
app.post("/register", async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO usuario(nombre, correo, contrasena) VALUES($1,$2,$3) RETURNING *",
      [nombre, correo, contrasena]
    );

    res.json({
      message: "Usuario guardado en BD",
      data: result.rows[0],
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
    const result = await pool.query(
      "SELECT * FROM usuario WHERE correo=$1 AND contrasena=$2",
      [correo, contrasena]
    );

    if (result.rows.length > 0) {
      res.json({
        message: "Login exitoso",
        user: result.rows[0],
      });
    } else {
      res.status(401).json({ error: "Credenciales incorrectas" });
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

    res.json({
      message: "Perfil guardado correctamente",
      user: result.rows[0],
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

  try {
    validateR2Config();
  } catch (error) {
    console.error("UPLOAD ERROR: invalid R2 config", error);
    return res.status(500).json({ error: "Configuración R2 inválida o incompleta" });
  }

  let uploadedFile;

  try {
    uploadedFile = await uploadBufferToR2(req.file);
    const documento = await insertDocumento({
      nombre: documentName,
      tipo: documentType,
      archivoUrl: uploadedFile.url,
      usuarioId: parsedUsuarioId,
      documentoKey: documento_key?.trim() || null,
      storageKey: uploadedFile.key,
    });

    res.json({
      message: "Archivo subido correctamente",
      archivo_url: uploadedFile.url,
      key: uploadedFile.key,
      documento,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    if (error.message?.includes("Missing R2") || error.message?.includes("placeholder")) {
      return res.status(500).json({ error: "Configuración R2 inválida o incompleta" });
    }

    if (!uploadedFile) {
      return res.status(500).json({ error: "No se pudo subir el archivo a R2" });
    }

    try {
      await deleteObjectFromR2(uploadedFile.key);
    } catch (cleanupError) {
      console.error("UPLOAD ERROR: cleanup failed", cleanupError);
    }

    return res.status(500).json({ error: "No se pudo guardar el documento" });
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

  try {
    validateR2Config();
  } catch (error) {
    console.error("UPLOAD ERROR: invalid R2 config", error);
    return res.status(500).json({ error: "Configuración R2 inválida o incompleta" });
  }

  let uploadedFile;

  try {
    uploadedFile = await uploadBufferToR2(req.file);
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ error: "No se pudo subir el archivo a R2" });
  }

  try {
    const documento = await insertDocumento({
      nombre: nombre.trim(),
      tipo: tipo || null,
      archivoUrl: uploadedFile.url,
      usuarioId: parsedUsuarioId,
      documentoKey: documento_key?.trim() || null,
      storageKey: uploadedFile.key,
    });

    return res.status(201).json({
      message: "Documento guardado correctamente",
      documento,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    try {
      await deleteObjectFromR2(uploadedFile.key);
    } catch (cleanupError) {
      console.error("UPLOAD ERROR: cleanup failed", cleanupError);
    }

    return res.status(500).json({ error: "No se pudo guardar el documento" });
  }
});

app.get("/documentos/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  if (Number.isNaN(usuarioId)) {
    return res.status(400).json({ error: "usuario_id debe ser numérico" });
  }

  try {
    await documentSchemaReady;

    const result = await pool.query(
      `SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key, estado, feedback, creado_en, actualizado_en
       FROM documentos
       WHERE usuario_id = $1
       ORDER BY actualizado_en DESC, creado_en DESC`,
      [usuarioId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("ERROR GET DOCUMENTOS:", error);
    return res.status(500).json({ error: "No se pudieron cargar los documentos" });
  }
});

app.delete("/documentos/:id", async (req, res) => {
  const documentId = Number(req.params.id);
  const usuarioId = Number(req.query.usuario_id);

  if (Number.isNaN(documentId)) {
    return res.status(400).json({ error: "documento_id debe ser numérico" });
  }

  if (Number.isNaN(usuarioId)) {
    return res.status(400).json({ error: "usuario_id debe ser numérico" });
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
      deleteObjectFromR2(deletedDocument.storage_key).catch((cleanupError) => {
        console.error("DELETE DOCUMENT CLEANUP ERROR:", cleanupError);
      });
    }

    return res.json({ message: "Documento eliminado correctamente" });
  } catch (error) {
    console.error("ERROR DELETE DOCUMENTO:", error);
    return res.status(500).json({ error: "No se pudo eliminar el documento" });
  }
});

// =====================
// ENDPOINTS DS-160
// =====================

// GET: Cargar formulario DS-160 del usuario
app.get("/ds160", async (req, res) => {
  const { correo } = req.query;

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

    if (existingForm.rows.length === 0) {
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

    res.json({
      message: "Formulario guardado correctamente",
      formulario: result.rows[0]
    });

  } catch (error) {
    console.log("ERROR POST DS160:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
