const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// conexión a PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "db",         
  database: "visa_db",
  password: "postgres",
  port: 5432,        
});

// probar conexión
pool.connect()
  .then(() => console.log("Conectado a PostgreSQL"))
  .catch(err => console.error("Error conexión:", err));

// endpoint de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

// NUEVO ENDPOINT: estado del trámite
app.get("/estado-tramite", async (req, res) => {
  try {
    res.json({
      estado: "En proceso",
      etapaActual: "Formulario DS-160",
      progreso: 40,
      siguientePaso: "Completar formulario DS-160",
      mensaje: "Tu trámite sigue avanzando correctamente"
    });
  } catch (error) {
    console.log("ERROR ESTADO:", error);
    res.status(500).json({ error: error.message });
  }
});

// endpoint registro REAL
app.post("/register", async (req, res) => {
  console.log("ESTOY EN EL REGISTER");

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
    console.log("ERROR COMPLETO");
    console.log(error);

    res.status(500).json({ error: error.message });
  }
});

// Login
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

// Endpoint para subir archivos
const upload = require("./upload");

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      message: "Archivo subido",
      filename: file.filename
    });

  } catch (err) {
    res.status(500).json({ error: "Error al subir archivo" });
  }
});

app.use("/uploads", express.static("uploads"));

// iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});