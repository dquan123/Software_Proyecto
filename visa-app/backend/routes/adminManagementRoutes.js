const express = require("express");

const VALID_ROLES = new Set(["cliente", "asesor", "admin"]);
const VALID_DS160_STATES = new Set(["en_progreso", "por_revisar", "correccion", "aprobado"]);

function number(value) { return Number(value) || 0; }
function presentUser(row) {
  return {
    id: row.id_usuario,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    perfil: row.perfil || null,
    activo: row.activo !== false,
    telefono: row.telefono || "",
    ciudad: row.ciudad || "",
    pais: row.pais || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    capacidad: number(row.capacidad_asesor) || 50,
    disponible: row.disponible_asesor !== false,
    asignados: number(row.asignados),
    pendientes: number(row.pendientes),
    asesor: row.asesor_nombre || null,
    actividad: row.last_activity || row.updated_at || null,
  };
}

module.exports = function createAdminManagementRoutes(pool, { requireAdmin, schemaReady, notificacionService }) {
  const router = express.Router();
  router.use(requireAdmin);

  async function logActivity(actorId, action, detail = "") {
    try {
      await pool.query(
        "INSERT INTO admin_activity (actor_id, accion, detalle) VALUES ($1, $2, $3)",
        [actorId, action, detail]
      );
    } catch (error) {
      console.error("ERROR ADMIN ACTIVITY:", error);
    }
  }

  router.get("/dashboard", async (_req, res) => {
    try {
      await schemaReady;
      const [summary, workload, activity, attention] = await Promise.all([
        pool.query(`SELECT
          (SELECT COUNT(*) FROM tramite WHERE estado NOT IN ('Completado', 'Aprobado')) AS solicitudes_activas,
          (SELECT COUNT(*) FROM tramite WHERE id_asesor IS NULL) AS sin_asignar,
          (SELECT COUNT(*) FROM usuario WHERE rol = 'asesor' AND activo = TRUE) AS asesores_activos,
          (SELECT COUNT(*) FROM formulario_ds160 WHERE estado_revision IN ('en_progreso', 'por_revisar')) AS ds160_pendientes`),
        pool.query(`SELECT u.id_usuario AS id, u.nombre,
          COUNT(t.id_tramite) AS asignados,
          COUNT(t.id_tramite) FILTER (WHERE t.estado IN ('Pendiente','En proceso')) AS pendientes
          FROM usuario u LEFT JOIN tramite t ON t.id_asesor = u.id_usuario
          WHERE u.rol = 'asesor' AND u.activo = TRUE
          GROUP BY u.id_usuario, u.nombre ORDER BY asignados DESC, u.nombre LIMIT 4`),
        pool.query(`SELECT a.id, a.accion, a.detalle, a.created_at, u.nombre AS actor
          FROM admin_activity a LEFT JOIN usuario u ON u.id_usuario = a.actor_id
          ORDER BY a.created_at DESC LIMIT 8`),
        pool.query(`SELECT t.id_tramite AS id, t.estado, t.etapa_actual,
          applicant.nombre, applicant.correo, applicant.perfil,
          advisor.nombre AS asesor
          FROM tramite t JOIN usuario applicant ON applicant.id_usuario = t.id_usuario
          LEFT JOIN usuario advisor ON advisor.id_usuario = t.id_asesor
          WHERE t.id_asesor IS NULL OR t.estado = 'Pendiente'
          ORDER BY t.id_asesor NULLS FIRST, t.id_tramite DESC LIMIT 8`),
      ]);
      const row = summary.rows[0] || {};
      res.json({
        resumen: {
          solicitudesActivas: number(row.solicitudes_activas),
          sinAsignar: number(row.sin_asignar),
          asesoresActivos: number(row.asesores_activos),
          ds160Pendientes: number(row.ds160_pendientes),
        },
        cargaAsesores: workload.rows.map((item) => ({ ...item, asignados: number(item.asignados), pendientes: number(item.pendientes) })),
        actividad: activity.rows,
        atencion: attention.rows,
      });
    } catch (error) {
      console.error("ERROR ADMIN DASHBOARD:", error);
      res.status(500).json({ error: "No fue posible cargar el panel administrativo" });
    }
  });

  router.get("/users", async (_req, res) => {
    try {
      await schemaReady;
      const result = await pool.query(`SELECT u.*,
        (SELECT COUNT(*) FROM tramite assigned WHERE assigned.id_asesor = u.id_usuario) AS asignados,
        (SELECT COUNT(*) FROM tramite assigned WHERE assigned.id_asesor = u.id_usuario
          AND assigned.estado IN ('Pendiente','En proceso')) AS pendientes,
        advisor.nombre AS asesor_nombre,
        COALESCE(client_process.updated_at, u.updated_at) AS last_activity
        FROM usuario u
        LEFT JOIN tramite client_process ON client_process.id_usuario = u.id_usuario
        LEFT JOIN usuario advisor ON advisor.id_usuario = client_process.id_asesor
        ORDER BY u.created_at DESC, u.id_usuario DESC`);
      res.json({ usuarios: result.rows.map(presentUser) });
    } catch (error) {
      console.error("ERROR ADMIN USERS:", error);
      res.status(500).json({ error: "No fue posible cargar los usuarios" });
    }
  });

  router.post("/users", async (req, res) => {
    const { nombre, correo, contrasena, rol = "cliente" } = req.body || {};
    if (!nombre?.trim() || !correo?.trim() || !contrasena) return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios" });
    if (!VALID_ROLES.has(rol)) return res.status(400).json({ error: "Rol inválido" });
    try {
      await schemaReady;
      const result = await pool.query(`INSERT INTO usuario (nombre, correo, contrasena, rol)
        VALUES ($1, $2, $3, $4) RETURNING *`, [nombre.trim(), correo.trim().toLowerCase(), contrasena, rol]);
      await logActivity(req.auth.id_usuario, "Usuario creado", `${nombre.trim()} · ${rol}`);
      res.status(201).json({ usuario: presentUser(result.rows[0]) });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "El correo ya está registrado" });
      console.error("ERROR CREATE ADMIN USER:", error);
      res.status(500).json({ error: "No fue posible crear el usuario" });
    }
  });

  router.patch("/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { activo, disponible, capacidad } = req.body || {};
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Usuario inválido" });
    try {
      await schemaReady;
      const result = await pool.query(`UPDATE usuario SET
        activo = COALESCE($1, activo),
        disponible_asesor = COALESCE($2, disponible_asesor),
        capacidad_asesor = COALESCE($3, capacidad_asesor),
        updated_at = CURRENT_TIMESTAMP
        WHERE id_usuario = $4 RETURNING *`,
      [typeof activo === "boolean" ? activo : null, typeof disponible === "boolean" ? disponible : null, capacidad ? number(capacidad) : null, id]);
      if (!result.rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
      await logActivity(req.auth.id_usuario, "Usuario actualizado", result.rows[0].correo);
      res.json({ usuario: presentUser(result.rows[0]) });
    } catch (error) {
      console.error("ERROR UPDATE ADMIN USER:", error);
      res.status(500).json({ error: "No fue posible actualizar el usuario" });
    }
  });

  router.get("/advisors", async (_req, res) => {
    try {
      await schemaReady;
      const result = await pool.query(`SELECT u.*,
        COUNT(t.id_tramite) AS asignados,
        COUNT(t.id_tramite) FILTER (WHERE t.estado IN ('Pendiente','En proceso')) AS pendientes
        FROM usuario u LEFT JOIN tramite t ON t.id_asesor = u.id_usuario
        WHERE u.rol = 'asesor' GROUP BY u.id_usuario ORDER BY u.nombre`);
      res.json({ asesores: result.rows.map(presentUser) });
    } catch (error) {
      console.error("ERROR ADMIN ADVISORS:", error);
      res.status(500).json({ error: "No fue posible cargar los asesores" });
    }
  });

  router.post("/advisors", async (req, res) => {
    const { nombre, correo, contrasena } = req.body || {};
    if (!nombre?.trim() || !correo?.trim() || !contrasena) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios" });
    }
    try {
      await schemaReady;
      const result = await pool.query(`INSERT INTO usuario (nombre, correo, contrasena, rol)
        VALUES ($1, $2, $3, 'asesor') RETURNING *`,
      [nombre.trim(), correo.trim().toLowerCase(), contrasena]);
      await logActivity(req.auth.id_usuario, "Asesor creado", nombre.trim());
      res.status(201).json({ asesor: presentUser(result.rows[0]) });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "El correo ya está registrado" });
      console.error("ERROR CREATE ADMIN ADVISOR:", error);
      res.status(500).json({ error: "No fue posible crear el asesor" });
    }
  });

  router.get("/assignments", async (_req, res) => {
    try {
      await schemaReady;
      const [cases, advisors] = await Promise.all([
        pool.query(`SELECT t.id_tramite AS id, t.estado, t.etapa_actual, t.progreso,
          u.nombre, u.correo, u.perfil FROM tramite t JOIN usuario u ON u.id_usuario = t.id_usuario
          WHERE t.id_asesor IS NULL ORDER BY t.id_tramite DESC`),
        pool.query(`SELECT u.id_usuario AS id, u.nombre, u.correo, u.capacidad_asesor AS capacidad,
          u.disponible_asesor AS disponible, COUNT(t.id_tramite) AS asignados
          FROM usuario u LEFT JOIN tramite t ON t.id_asesor = u.id_usuario
          WHERE u.rol = 'asesor' AND u.activo = TRUE GROUP BY u.id_usuario ORDER BY u.nombre`),
      ]);
      res.json({ casos: cases.rows, asesores: advisors.rows.map((item) => ({ ...item, capacidad: number(item.capacidad) || 50, asignados: number(item.asignados) })) });
    } catch (error) {
      console.error("ERROR ADMIN ASSIGNMENTS:", error);
      res.status(500).json({ error: "No fue posible cargar las asignaciones" });
    }
  });

  router.post("/assignments", async (req, res) => {
    const tramiteId = number(req.body?.tramiteId);
    const asesorId = number(req.body?.asesorId);
    if (!tramiteId || !asesorId) return res.status(400).json({ error: "Trámite y asesor son obligatorios" });
    try {
      await schemaReady;
      const advisor = await pool.query("SELECT id_usuario, nombre FROM usuario WHERE id_usuario = $1 AND rol = 'asesor' AND activo = TRUE", [asesorId]);
      if (!advisor.rows.length) return res.status(400).json({ error: "Asesor no disponible" });
      const result = await pool.query("UPDATE tramite SET id_asesor = $1, updated_at = CURRENT_TIMESTAMP WHERE id_tramite = $2 AND id_asesor IS NULL RETURNING id_tramite, id_usuario", [asesorId, tramiteId]);
      if (!result.rows.length) return res.status(409).json({ error: "El trámite ya fue asignado o no existe" });
      await logActivity(req.auth.id_usuario, "Solicitud asignada", `Trámite ${tramiteId} → ${advisor.rows[0].nombre}`);
      if (notificacionService && result.rows[0].id_usuario) {
        try {
          await notificacionService.crearNotificacion({
            userId: result.rows[0].id_usuario,
            titulo: "Asesor asignado",
            mensaje: "Se te asigno un asesor para acompanar tu tramite.",
            tipo: "info",
            etapaRelacionada: `tramite-${tramiteId}-asesor`,
          });
        } catch (notificationError) {
          console.error("ERROR ADMIN ASSIGNMENT NOTIFICATION:", notificationError);
        }
      }
      res.json({ message: "Solicitud asignada correctamente" });
    } catch (error) {
      console.error("ERROR CREATE ASSIGNMENT:", error);
      res.status(500).json({ error: "No fue posible asignar la solicitud" });
    }
  });

  router.get("/ds160", async (_req, res) => {
    try {
      await schemaReady;
      const result = await pool.query(`SELECT f.id_formulario AS id, f.id_usuario, f.seccion_actual,
        f.completado, f.estado_revision, f.feedback_revision, f.updated_at,
        u.nombre, u.correo, u.perfil, advisor.id_usuario AS asesor_id, advisor.nombre AS asesor
        FROM formulario_ds160 f JOIN usuario u ON u.id_usuario = f.id_usuario
        LEFT JOIN usuario advisor ON advisor.id_usuario = f.id_asesor
        ORDER BY f.updated_at DESC, f.id_formulario DESC`);
      res.json({ formularios: result.rows.map((row) => ({ ...row, progreso: row.completado ? 100 : Math.min(100, Math.round(number(row.seccion_actual) / 6 * 100)) })) });
    } catch (error) {
      console.error("ERROR ADMIN DS160:", error);
      res.status(500).json({ error: "No fue posible cargar los formularios" });
    }
  });

  router.put("/ds160/:id", async (req, res) => {
    const id = number(req.params.id);
    const { estado, feedback = "" } = req.body || {};
    if (!id || !VALID_DS160_STATES.has(estado)) return res.status(400).json({ error: "Formulario o estado inválido" });
    try {
      await schemaReady;
      const result = await pool.query(`UPDATE formulario_ds160 SET estado_revision = $1,
        feedback_revision = $2, updated_at = CURRENT_TIMESTAMP WHERE id_formulario = $3 RETURNING id_formulario`,
      [estado, String(feedback).trim() || null, id]);
      if (!result.rows.length) return res.status(404).json({ error: "Formulario no encontrado" });
      await logActivity(req.auth.id_usuario, "DS-160 revisado", `Formulario ${id} · ${estado}`);
      res.json({ message: "Formulario actualizado correctamente" });
    } catch (error) {
      console.error("ERROR UPDATE ADMIN DS160:", error);
      res.status(500).json({ error: "No fue posible actualizar el formulario" });
    }
  });

  router.get("/profile", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM usuario WHERE id_usuario = $1", [req.auth.id_usuario]);
      if (!result.rows.length) return res.status(404).json({ error: "Perfil no encontrado" });
      res.json({ usuario: presentUser(result.rows[0]) });
    } catch (error) {
      res.status(500).json({ error: "No fue posible cargar el perfil" });
    }
  });

  router.put("/profile", async (req, res) => {
    const { nombre, telefono = "", ciudad = "", pais = "" } = req.body || {};
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    try {
      const result = await pool.query(`UPDATE usuario SET nombre = $1, telefono = $2, ciudad = $3,
        pais = $4, updated_at = CURRENT_TIMESTAMP WHERE id_usuario = $5 RETURNING *`,
      [nombre.trim(), telefono.trim(), ciudad.trim(), pais.trim(), req.auth.id_usuario]);
      await logActivity(req.auth.id_usuario, "Perfil actualizado", result.rows[0].correo);
      res.json({ usuario: presentUser(result.rows[0]) });
    } catch (error) {
      res.status(500).json({ error: "No fue posible actualizar el perfil" });
    }
  });

  router.get("/settings", async (_req, res) => {
    try {
      await schemaReady;
      const result = await pool.query("SELECT * FROM admin_settings WHERE id = 1");
      res.json({ configuracion: result.rows[0] || null });
    } catch (error) {
      res.status(500).json({ error: "No fue posible cargar la configuración" });
    }
  });

  router.put("/settings", async (req, res) => {
    const data = req.body || {};
    try {
      await schemaReady;
      const result = await pool.query(`INSERT INTO admin_settings
        (id, nombre_comercial, razon_social, sitio_web, idioma, zona_horaria)
        VALUES (1, $1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET nombre_comercial = EXCLUDED.nombre_comercial,
          razon_social = EXCLUDED.razon_social, sitio_web = EXCLUDED.sitio_web,
          idioma = EXCLUDED.idioma, zona_horaria = EXCLUDED.zona_horaria,
          updated_at = CURRENT_TIMESTAMP RETURNING *`,
      [data.nombre_comercial || "", data.razon_social || "", data.sitio_web || "", data.idioma || "es", data.zona_horaria || "America/Guatemala"]);
      await logActivity(req.auth.id_usuario, "Configuración actualizada", "Datos generales");
      res.json({ configuracion: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "No fue posible guardar la configuración" });
    }
  });

  return router;
};
