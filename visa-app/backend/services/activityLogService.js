const SENSITIVE_KEY_PATTERN = /(password|contrasena|contraseña|token|secret|codigo|c[oó]digo|recovery|archivo|file|binary|base64)/i;

function sanitizeMetadata(value, depth = 0) {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object") return value;
  if (depth >= 4) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeMetadata(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)])
  );
}

function normalizeText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

function getIpAddress(req) {
  const forwardedFor = req?.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req?.ip || req?.socket?.remoteAddress || null;
}

function getRequestContext(req) {
  return {
    ipAddress: getIpAddress(req),
    userAgent: req?.get?.("user-agent") || req?.headers?.["user-agent"] || null,
  };
}

function getActorFromRequest(req, fallback = {}) {
  const actor = req?.auth || fallback || {};
  return {
    id: actor.id_usuario || actor.id || fallback.id_usuario || fallback.id || null,
    email: actor.correo || actor.email || fallback.correo || fallback.email || null,
    role: actor.rol || actor.role || fallback.rol || fallback.role || null,
  };
}

function presentActivityLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    adminId: row.admin_id,
    userEmail: row.user_email || "",
    role: row.role || "",
    action: row.action,
    entityType: row.entity_type || "",
    entityId: row.entity_id || "",
    description: row.description || "",
    metadata: row.metadata || {},
    ipAddress: row.ip_address || "",
    userAgent: row.user_agent || "",
    createdAt: row.created_at,
  };
}

function toPositiveInteger(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

module.exports = function createActivityLogService(pool) {
  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
        admin_id INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
        user_email VARCHAR(200),
        role VARCHAR(30),
        action VARCHAR(120) NOT NULL,
        entity_type VARCHAR(80),
        entity_id VARCHAR(120),
        description TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        ip_address VARCHAR(80),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
      ON activity_logs(created_at DESC, id DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS activity_logs_user_idx
      ON activity_logs(user_id, admin_id, created_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS activity_logs_action_idx
      ON activity_logs(action)
    `);
  }

  async function logActivity(input = {}) {
    try {
      await ensureSchema();

      const actor = input.req
        ? getActorFromRequest(input.req, input.actor)
        : getActorFromRequest(null, input.actor);
      const requestContext = input.req ? getRequestContext(input.req) : {};
      const role = normalizeText(input.role || actor.role, 30);
      const actorId = input.actorId || actor.id || null;
      const explicitUserId = input.userId || null;
      const explicitAdminId = input.adminId || null;
      const userId = explicitUserId || (role === "admin" ? null : actorId);
      const adminId = explicitAdminId || (role === "admin" ? actorId : null);
      const action = normalizeText(input.action, 120);

      if (!action) return null;

      const result = await pool.query(
        `INSERT INTO activity_logs
          (user_id, admin_id, user_email, role, action, entity_type, entity_id,
           description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
         RETURNING id, user_id, admin_id, user_email, role, action, entity_type,
                   entity_id, description, metadata, ip_address, user_agent, created_at`,
        [
          userId,
          adminId,
          normalizeText(input.userEmail || actor.email, 200),
          role,
          action,
          normalizeText(input.entityType, 80),
          normalizeText(input.entityId, 120),
          normalizeText(input.description),
          JSON.stringify(sanitizeMetadata(input.metadata || {})),
          normalizeText(input.ipAddress || requestContext.ipAddress, 80),
          normalizeText(input.userAgent || requestContext.userAgent),
        ]
      );

      return result.rows[0] ? presentActivityLog(result.rows[0]) : null;
    } catch (error) {
      console.error("ERROR ACTIVITY LOG:", error);
      return null;
    }
  }

  async function listLogs(filters = {}) {
    await ensureSchema();

    const page = toPositiveInteger(filters.page, 1);
    const limit = toPositiveInteger(filters.limit, 50, 100);
    const offset = (page - 1) * limit;
    const where = [];
    const values = [];

    if (filters.userId) {
      values.push(Number(filters.userId));
      where.push(`(user_id = $${values.length} OR admin_id = $${values.length})`);
    }

    if (filters.action) {
      values.push(`%${String(filters.action).trim()}%`);
      where.push(`action ILIKE $${values.length}`);
    }

    if (filters.role) {
      values.push(String(filters.role).trim());
      where.push(`role = $${values.length}`);
    }

    if (filters.from) {
      values.push(filters.from);
      where.push(`created_at >= $${values.length}`);
    }

    if (filters.to) {
      values.push(filters.to);
      where.push(`created_at <= $${values.length}`);
    }

    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const result = await pool.query(
      `SELECT id, user_id, admin_id, user_email, role, action, entity_type,
              entity_id, description, metadata, ip_address, user_agent,
              created_at, COUNT(*) OVER() AS total
       FROM activity_logs
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC, id DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values
    );

    const total = Number(result.rows[0]?.total) || 0;
    return {
      logs: result.rows.map(presentActivityLog),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  return { ensureSchema, logActivity, listLogs, presentActivityLog };
};

module.exports.sanitizeMetadata = sanitizeMetadata;
