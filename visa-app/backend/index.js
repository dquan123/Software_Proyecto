const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Conexión a PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "db",
  database: "visa_db",
  password: "postgres",
  port: 5432,
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

// Guardar documentos
// crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    console.log("Archivo guardado:", req.file.filename);
    res.json({ message: "Archivo subido correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al subir archivo" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});