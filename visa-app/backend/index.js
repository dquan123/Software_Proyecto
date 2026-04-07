const express = require("express");
const { Pool } = require("pg");

const app = express();
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

//Login
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

// iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});