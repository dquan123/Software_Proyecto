const express = require("express");

module.exports = function createAdminMetricsRoutes(pool, { requireAdmin }) {
  const router = express.Router();

  router.get("/overview", requireAdmin, async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM usuario) AS usuarios_total,
          (SELECT COUNT(*) FROM usuario WHERE COALESCE(rol, 'cliente') = 'cliente') AS clientes,
          (SELECT COUNT(*) FROM usuario WHERE rol = 'asesor') AS asesores,
          (SELECT COUNT(*) FROM documentos WHERE estado = 'review') AS documentos_pendientes,
          (SELECT COUNT(*) FROM tramite WHERE estado = 'En proceso') AS tramites_activos,
          (SELECT COUNT(*) FROM formulario_ds160 WHERE completado = false) AS ds160_pendientes,
          (SELECT COUNT(*) FROM interview_sessions WHERE status = 'pending') AS entrevistas_pendientes
      `);
      const row = result.rows[0] || {};
      res.json(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value) || 0])));
    } catch (error) {
      console.error("ERROR ADMIN METRICS OVERVIEW:", error);
      res.status(500).json({ error: "No fue posible cargar los indicadores" });
    }
  });

  router.get("/processes", requireAdmin, async (req, res) => {
    try {
      const days = [30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : null;
      const where = days ? "WHERE created_at >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 day')" : "";
      const values = days ? [days] : [];
      const [statusResult, stageResult, summaryResult, advisorResult] = await Promise.all([
        pool.query(`SELECT estado AS label, COUNT(*) AS total FROM tramite ${where} GROUP BY estado ORDER BY estado`, values),
        pool.query(`SELECT etapa_actual AS label, COUNT(*) AS total FROM tramite ${where} GROUP BY etapa_actual ORDER BY etapa_actual`, values),
        pool.query(`
          SELECT
            COUNT(*) AS total,
            COALESCE(AVG(progreso), 0) AS progreso_promedio,
            COUNT(*) FILTER (WHERE estado = 'Aprobado' OR progreso >= 100) AS completados,
            COUNT(*) FILTER (WHERE id_asesor IS NULL) AS sin_asignar
          FROM tramite
          ${where}
        `, values),
        pool.query(`
          SELECT
            advisor.id_usuario AS id,
            advisor.nombre,
            COUNT(t.id_tramite) AS asignados,
            COUNT(t.id_tramite) FILTER (
              WHERE t.estado IN ('Pendiente', 'En proceso')
            ) AS pendientes
          FROM usuario advisor
          LEFT JOIN tramite t ON t.id_asesor = advisor.id_usuario
            ${days ? "AND t.created_at >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 day')" : ""}
          WHERE advisor.rol = 'asesor'
          GROUP BY advisor.id_usuario, advisor.nombre
          ORDER BY asignados DESC, advisor.nombre ASC
          LIMIT 6
        `, values),
      ]);
      const normalize = ({ label, total }) => ({ label, total: Number(total) || 0 });
      const summary = summaryResult.rows[0] || {};
      res.json({
        porEstado: statusResult.rows.map(normalize),
        porEtapa: stageResult.rows.map(normalize),
        totalTramites: Number(summary.total) || 0,
        progresoPromedio: Number(summary.progreso_promedio) || 0,
        completados: Number(summary.completados) || 0,
        sinAsignar: Number(summary.sin_asignar) || 0,
        cargaAsesores: advisorResult.rows.map((row) => ({
          id: row.id,
          nombre: row.nombre,
          asignados: Number(row.asignados) || 0,
          pendientes: Number(row.pendientes) || 0,
        })),
      });
    } catch (error) {
      console.error("ERROR ADMIN PROCESS METRICS:", error);
      res.status(500).json({ error: "No fue posible cargar los reportes" });
    }
  });

  return router;
};
