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
          (SELECT COUNT(*) FROM interview_sessions WHERE status = 'pending') AS entrevistas_pendientes
      `);
      const row = result.rows[0] || {};
      res.json(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value) || 0])));
    } catch (error) {
      console.error("ERROR ADMIN METRICS OVERVIEW:", error);
      res.status(500).json({ error: "No fue posible cargar los indicadores" });
    }
  });

  router.get("/processes", requireAdmin, async (_req, res) => {
    try {
      const [statusResult, stageResult, averageResult] = await Promise.all([
        pool.query("SELECT estado AS label, COUNT(*) AS total FROM tramite GROUP BY estado ORDER BY estado"),
        pool.query("SELECT etapa_actual AS label, COUNT(*) AS total FROM tramite GROUP BY etapa_actual ORDER BY etapa_actual"),
        pool.query("SELECT COALESCE(AVG(progreso), 0) AS promedio FROM tramite"),
      ]);
      const normalize = ({ label, total }) => ({ label, total: Number(total) || 0 });
      res.json({
        porEstado: statusResult.rows.map(normalize),
        porEtapa: stageResult.rows.map(normalize),
        progresoPromedio: Number(averageResult.rows[0]?.promedio) || 0,
      });
    } catch (error) {
      console.error("ERROR ADMIN PROCESS METRICS:", error);
      res.status(500).json({ error: "No fue posible cargar los reportes" });
    }
  });

  return router;
};
