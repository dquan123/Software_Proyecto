const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const upload = require("./upload");
const { uploadBufferToR2, deleteObjectFromR2 } = require("./r2");

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
  if (!req.file) {
    return res.status(400).json({ error: "Archivo requerido" });
  }

  try {
    const uploadedFile = await uploadBufferToR2(req.file);

    res.json({
      message: "Archivo subido correctamente",
      archivo_url: uploadedFile.url,
      key: uploadedFile.key,
    });
  } catch (error) {
    console.log("ERROR UPLOAD:", error);
    res.status(502).json({ error: "No se pudo subir el archivo" });
  }
});

app.post("/documentos", upload.single("file"), async (req, res) => {
  const { nombre, tipo, usuario_id } = req.body;

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
    uploadedFile = await uploadBufferToR2(req.file);
  } catch (error) {
    console.log("ERROR R2 DOCUMENTOS:", error);
    return res.status(502).json({ error: "No se pudo subir el archivo" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO documentos (nombre, tipo, archivo_url, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, tipo, archivo_url, usuario_id, creado_en`,
      [nombre.trim(), tipo || null, uploadedFile.url, parsedUsuarioId]
    );

    return res.status(201).json({
      message: "Documento guardado correctamente",
      documento: result.rows[0],
    });
  } catch (error) {
    console.log("ERROR DB DOCUMENTOS:", error);

    try {
      await deleteObjectFromR2(uploadedFile.key);
    } catch (cleanupError) {
      console.log("ERROR CLEANUP R2:", cleanupError);
    }

    return res.status(500).json({ error: "No se pudo guardar el documento" });
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
