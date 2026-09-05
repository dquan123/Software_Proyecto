const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

function createAuthService(pool, { userSchemaReady, tramiteSchemaReady }) {
  
  async function findUserByEmail(correo) {
    await userSchemaReady;
    const result = await pool.query(
      `SELECT id_usuario, nombre, correo, perfil, COALESCE(rol, 'cliente') AS rol, activo, contrasena
       FROM usuario WHERE correo = $1`,
      [correo]
    );
    return result.rows[0] || null;
  }

  async function createUser({ nombre, correo, contrasena }) {
    await userSchemaReady;
    await tramiteSchemaReady;
    
    const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO usuario(nombre, correo, contrasena, rol) VALUES($1,$2,$3,'cliente') RETURNING *",
      [nombre, correo, contrasenaHash]
    );
    return result.rows[0];
  }

  async function createInitialTramite(userId) {
    await pool.query(
      `INSERT INTO tramite (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje)
       VALUES ($1, 'En proceso', 'Configuración de perfil', 0, 'Seleccionar perfil de visa', 'Configura tu perfil para comenzar')
       ON CONFLICT DO NOTHING`,
      [userId]
    );
  }

  async function verifyPassword(contrasena, usuario) {
    if (!usuario || !contrasena) return false;
    
    const storedIsHashed = /^\$2[aby]\$/.test(usuario.contrasena || "");
    
    if (storedIsHashed) {
      return bcrypt.compare(contrasena, usuario.contrasena);
    }
    
    // Contraseña legacy en texto plano - migrar a bcrypt
    if (usuario.contrasena === contrasena) {
      const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
      await pool.query(
        "UPDATE usuario SET contrasena = $1 WHERE id_usuario = $2",
        [contrasenaHash, usuario.id_usuario]
      );
      return true;
    }
    
    return false;
  }

  return {
    findUserByEmail,
    createUser,
    createInitialTramite,
    verifyPassword,
  };
}

module.exports = createAuthService;