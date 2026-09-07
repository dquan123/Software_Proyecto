const bcrypt = require("bcrypt");
const crypto = require("crypto");

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAuthService(pool, { userSchemaReady, tramiteSchemaReady, passwordResetSchemaReady }) {

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

  async function createPasswordResetToken(correo) {
    await passwordResetSchemaReady;
    const usuario = await findUserByEmail(correo);
    if (!usuario) return null;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query(
      "INSERT INTO password_resets (id_usuario, token_hash, expires_at) VALUES ($1, $2, $3)",
      [usuario.id_usuario, tokenHash, expiresAt]
    );

    return { token, usuario };
  }

  async function resetPassword(token, nuevaContrasena) {
    await passwordResetSchemaReady;
    const tokenHash = hashResetToken(token || "");

    const result = await pool.query(
      "SELECT id, id_usuario, expires_at, used_at FROM password_resets WHERE token_hash = $1",
      [tokenHash]
    );
    const record = result.rows[0];

    if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
      return false;
    }

    const contrasenaHash = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);
    await pool.query("UPDATE usuario SET contrasena = $1 WHERE id_usuario = $2", [contrasenaHash, record.id_usuario]);
    await pool.query("UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = $1", [record.id]);

    return true;
  }

  return {
    findUserByEmail,
    createUser,
    createInitialTramite,
    verifyPassword,
    createPasswordResetToken,
    resetPassword,
  };
}

module.exports = createAuthService;