function createNotificacionService(pool) {
  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'info',
        leido BOOLEAN NOT NULL DEFAULT FALSE,
        etapa_relacionada VARCHAR(200),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS notificaciones_usuario_idx
      ON notificaciones(id_usuario)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS notificaciones_leido_idx
      ON notificaciones(id_usuario, leido)
    `);
  }

  function parseUserId(userId) {
    const parsed = Number(userId);
    if (Number.isNaN(parsed) || parsed <= 0) {
      const error = new Error("user_id debe ser un número válido");
      error.statusCode = 400;
      throw error;
    }
    return parsed;
  }

  function parseId(id) {
    const parsed = Number(id);
    if (Number.isNaN(parsed) || parsed <= 0) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }
    return parsed;
  }

  async function listarPorUsuario(userId) {
    await ensureSchema();
    const uid = parseUserId(userId);

    const result = await pool.query(
      `SELECT id, id_usuario, titulo, mensaje, tipo, leido, etapa_relacionada,
              created_at, updated_at
       FROM notificaciones
       WHERE id_usuario = $1
       ORDER BY created_at DESC, id DESC`,
      [uid]
    );

    return result.rows;
  }

  async function contarNoLeidas(userId) {
    await ensureSchema();
    const uid = parseUserId(userId);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM notificaciones
       WHERE id_usuario = $1 AND leido = FALSE`,
      [uid]
    );

    return result.rows[0].total;
  }

  async function marcarLeida(id, userId) {
    await ensureSchema();
    const nid = parseId(id);
    const uid = parseUserId(userId);

    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND id_usuario = $2
       RETURNING id, id_usuario, titulo, mensaje, tipo, leido, etapa_relacionada,
                 created_at, updated_at`,
      [nid, uid]
    );

    if (result.rows.length === 0) {
      const error = new Error("Notificación no encontrada");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  async function marcarTodasLeidas(userId) {
    await ensureSchema();
    const uid = parseUserId(userId);

    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id_usuario = $1 AND leido = FALSE
       RETURNING id`,
      [uid]
    );

    return result.rows.length;
  }

  async function crearNotificacion({ userId, titulo, mensaje, tipo = "info", etapaRelacionada = null }) {
    await ensureSchema();
    const uid = parseUserId(userId);

    if (!titulo || !titulo.trim()) {
      const error = new Error("El título es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    if (!mensaje || !mensaje.trim()) {
      const error = new Error("El mensaje es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    const tiposValidos = ["info", "etapa", "documento", "entrevista", "alerta"];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : "info";

    const result = await pool.query(
      `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, etapa_relacionada)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, id_usuario, titulo, mensaje, tipo, leido, etapa_relacionada,
                 created_at, updated_at`,
      [uid, titulo.trim(), mensaje.trim(), tipoFinal, etapaRelacionada || null]
    );

    return result.rows[0];
  }

  return {
    ensureSchema,
    listarPorUsuario,
    contarNoLeidas,
    marcarLeida,
    marcarTodasLeidas,
    crearNotificacion,
  };
}

module.exports = createNotificacionService;
