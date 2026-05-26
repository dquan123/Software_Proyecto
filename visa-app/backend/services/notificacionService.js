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

  return { ensureSchema };
}

module.exports = createNotificacionService;
