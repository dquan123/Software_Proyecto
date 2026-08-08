const express = require("express");

const VALID_STATES = new Set(["En proceso", "Pendiente", "Aprobado", "Inactivo", "Completado"]);
const STAGES = {
  "Configuración de perfil": 0,
  "Formulario DS-160": 17,
  "Pago de visa": 34,
  "Cita consular": 51,
  Entrevista: 67,
  "Decisión final": 84,
  Completado: 100,
};

function presentProcess(row) {
  return {
    id: row.id_tramite,
    estado: row.estado,
    etapaActual: row.etapa_actual,
    progreso: Number(row.progreso) || 0,
    siguientePaso: row.siguiente_paso || "",
    mensaje: row.mensaje || "",
    solicitante: {
      id: row.id_usuario,
      nombre: row.solicitante_nombre,
      correo: row.solicitante_correo,
      perfil: row.solicitante_perfil || "Sin definir",
    },
    asesor: row.id_asesor
      ? { id: row.id_asesor, nombre: row.asesor_nombre, correo: row.asesor_correo }
      : null,
  };
}

module.exports = function createAdminProcessRoutes(pool, { requireAdmin, schemaReady }) {
  const router = express.Router();

  router.use(requireAdmin);

  router.get("/", async (_req, res) => {
    try {
      await schemaReady;
      const [processResult, advisorResult] = await Promise.all([
        pool.query(`
          SELECT t.*, applicant.nombre AS solicitante_nombre,
                 applicant.correo AS solicitante_correo,
                 applicant.perfil AS solicitante_perfil,
                 advisor.nombre AS asesor_nombre,
                 advisor.correo AS asesor_correo
          FROM tramite t
          JOIN usuario applicant ON applicant.id_usuario = t.id_usuario
          LEFT JOIN usuario advisor ON advisor.id_usuario = t.id_asesor
          ORDER BY t.id_tramite DESC
        `),
        pool.query(`
          SELECT id_usuario AS id, nombre, correo
          FROM usuario
          WHERE rol = 'asesor'
          ORDER BY nombre
        `),
      ]);

      res.json({
        tramites: processResult.rows.map(presentProcess),
        asesores: advisorResult.rows,
      });
    } catch (error) {
      console.error("ERROR ADMIN PROCESSES:", error);
      res.status(500).json({ error: "No fue posible cargar los trámites" });
    }
  });

  router.put("/:id", async (req, res) => {
    const processId = Number(req.params.id);
    const { estado, etapaActual, asesorId } = req.body || {};

    if (!Number.isInteger(processId) || processId <= 0) {
      return res.status(400).json({ error: "Trámite inválido" });
    }
    if (!VALID_STATES.has(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }
    if (!Object.prototype.hasOwnProperty.call(STAGES, etapaActual)) {
      return res.status(400).json({ error: "Etapa inválida" });
    }

    const normalizedAdvisorId = asesorId === null || asesorId === "" ? null : Number(asesorId);
    if (normalizedAdvisorId !== null && (!Number.isInteger(normalizedAdvisorId) || normalizedAdvisorId <= 0)) {
      return res.status(400).json({ error: "Asesor inválido" });
    }

    try {
      await schemaReady;
      if (normalizedAdvisorId !== null) {
        const advisor = await pool.query(
          "SELECT id_usuario FROM usuario WHERE id_usuario = $1 AND rol = 'asesor'",
          [normalizedAdvisorId]
        );
        if (!advisor.rows.length) return res.status(400).json({ error: "El asesor seleccionado no existe" });
      }

      const result = await pool.query(
        `UPDATE tramite
         SET estado = $1, etapa_actual = $2, progreso = $3, id_asesor = $4
         WHERE id_tramite = $5
         RETURNING id_tramite`,
        [estado, etapaActual, STAGES[etapaActual], normalizedAdvisorId, processId]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Trámite no encontrado" });

      const refreshed = await pool.query(`
        SELECT t.*, applicant.nombre AS solicitante_nombre,
               applicant.correo AS solicitante_correo,
               applicant.perfil AS solicitante_perfil,
               advisor.nombre AS asesor_nombre,
               advisor.correo AS asesor_correo
        FROM tramite t
        JOIN usuario applicant ON applicant.id_usuario = t.id_usuario
        LEFT JOIN usuario advisor ON advisor.id_usuario = t.id_asesor
        WHERE t.id_tramite = $1
      `, [processId]);

      res.json({ message: "Trámite actualizado correctamente", tramite: presentProcess(refreshed.rows[0]) });
    } catch (error) {
      console.error("ERROR UPDATE ADMIN PROCESS:", error);
      res.status(500).json({ error: "No fue posible actualizar el trámite" });
    }
  });

  return router;
};
