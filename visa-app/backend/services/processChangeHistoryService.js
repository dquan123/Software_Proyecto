function normalizeHistoryValue(value) {
  if (value === undefined || value === null) return null;
  return String(value);
}

function presentHistory(row) {
  return {
    id: row.id,
    processId: row.process_id,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedAt: row.changed_at,
    changedBy: row.changed_by
      ? {
          id: row.changed_by,
          nombre: row.changed_by_nombre || "",
          correo: row.changed_by_correo || "",
        }
      : null,
  };
}

module.exports = function createProcessChangeHistoryService(pool) {
  async function ensureSchema() {
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

  function buildChange(fieldName, oldValue, newValue) {
    const normalizedOldValue = normalizeHistoryValue(oldValue);
    const normalizedNewValue = normalizeHistoryValue(newValue);
    if (normalizedOldValue === normalizedNewValue) return null;

    return {
      fieldName,
      oldValue: normalizedOldValue,
      newValue: normalizedNewValue,
    };
  }

  async function recordChanges({ processId, changedBy = null, changes = [] }) {
    const validChanges = changes.filter(Boolean);
    if (!validChanges.length) return [];

    await ensureSchema();

    const insertedRows = [];
    for (const change of validChanges) {
      const result = await pool.query(
        `INSERT INTO process_change_history
          (process_id, field_name, old_value, new_value, changed_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, process_id, field_name, old_value, new_value, changed_by, changed_at`,
        [processId, change.fieldName, change.oldValue, change.newValue, changedBy]
      );
      if (result.rows[0]) insertedRows.push(result.rows[0]);
    }

    return insertedRows.map(presentHistory);
  }

  async function listByProcess(processId) {
    await ensureSchema();

    const result = await pool.query(
      `SELECT h.id, h.process_id, h.field_name, h.old_value, h.new_value,
              h.changed_by, h.changed_at,
              admin.nombre AS changed_by_nombre,
              admin.correo AS changed_by_correo
       FROM process_change_history h
       LEFT JOIN usuario admin ON admin.id_usuario = h.changed_by
       WHERE h.process_id = $1
       ORDER BY h.changed_at DESC, h.id DESC`,
      [processId]
    );

    return result.rows.map(presentHistory);
  }

  return { buildChange, ensureSchema, listByProcess, recordChanges };
};
