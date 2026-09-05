const PERFIL_A_VISA = {
  turismo_negocios: "B1/B2 (Turismo / Negocios)",
  estudiante: "F/M (Estudiante)",
  renovacion: "Renovación",
  grupo_familiar: "Grupo Familiar",
  adulto_mayor: "Adulto Mayor (Senior)",
};

function calcularEtapa(progreso, perfil) {
  let etapa = Math.ceil((Number(progreso) || 10) / 16.66);
  if (perfil && etapa < 2) etapa = 2;
  if (etapa < 1) etapa = 1;
  if (etapa > 6) etapa = 6;
  return etapa;
}

function createPerfilService(pool, { userSchemaReady, tramiteSchemaReady }) {

  async function findUserByEmail(correo) {
    await userSchemaReady;
    const result = await pool.query(
      `SELECT id_usuario, nombre, correo, perfil,
              telefono, ciudad, pais,
              notificaciones_email, idioma, rol
       FROM usuario WHERE correo = $1`,
      [correo]
    );
    return result.rows[0] || null;
  }

  async function guardarPerfil(correo, perfil) {
    const result = await pool.query(
      "UPDATE usuario SET perfil = $1 WHERE correo = $2 RETURNING *",
      [perfil, correo]
    );
    return result.rows[0] || null;
  }

  async function getTramiteByUserId(userId) {
    await tramiteSchemaReady;
    const result = await pool.query(
      "SELECT * FROM tramite WHERE id_usuario = $1",
      [userId]
    );
    return result.rows[0] || null;
  }

  async function getOrCreateTramite(userId, hasProfile) {
    await tramiteSchemaReady;
    let tramite = await getTramiteByUserId(userId);

    if (!tramite) {
      const result = await pool.query(
        `INSERT INTO tramite (id_usuario, estado, etapa_actual, progreso, siguiente_paso, mensaje)
         VALUES ($1, 'En proceso', $2, $3, $4, $5)
         RETURNING *`,
        hasProfile
          ? [userId, "Formulario DS-160", 17, "Completar formulario DS-160", "Tu trámite ha comenzado correctamente"]
          : [userId, "Configuración de perfil", 0, "Seleccionar perfil de visa", "Configura tu perfil para comenzar"]
      );
      tramite = result.rows[0];
    }

    return tramite;
  }

  async function avanzarTramiteDS160(userId) {
    const tramite = await getTramiteByUserId(userId);
    if (tramite && tramite.progreso < 17) {
      await pool.query(
        `UPDATE tramite
         SET etapa_actual = 'Formulario DS-160',
             progreso = 17,
             siguiente_paso = 'Completar el formulario DS-160',
             mensaje = 'Perfil de visa configurado. Ahora completa el formulario DS-160.'
         WHERE id_usuario = $1`,
        [userId]
      );
    }
  }

  async function updateUsuarioPerfil(correo, campos) {
    await userSchemaReady;

    const sets = [];
    const valores = [];
    let i = 1;

    if (campos.nombre !== undefined) { sets.push(`nombre = $${i++}`); valores.push(campos.nombre); }
    if (campos.telefono !== undefined) { sets.push(`telefono = $${i++}`); valores.push(campos.telefono); }
    if (campos.ciudad !== undefined) { sets.push(`ciudad = $${i++}`); valores.push(campos.ciudad); }
    if (campos.pais !== undefined) { sets.push(`pais = $${i++}`); valores.push(campos.pais); }
    if (campos.notificacionesEmail !== undefined) { sets.push(`notificaciones_email = $${i++}`); valores.push(campos.notificacionesEmail); }
    if (campos.idioma !== undefined) { sets.push(`idioma = $${i++}`); valores.push(campos.idioma); }

    if (sets.length === 0) return null;

    valores.push(correo);

    const result = await pool.query(
      `UPDATE usuario
       SET ${sets.join(", ")}
       WHERE correo = $${i}
       RETURNING id_usuario, nombre, correo, perfil,
                 telefono, ciudad, pais,
                 notificaciones_email, idioma`,
      valores
    );

    return result.rows[0] || null;
  }

  async function updateTramite(tramiteId, campos) {
    await tramiteSchemaReady;

    const sets = [];
    const valores = [];
    let i = 1;

    if (campos.estado !== undefined) { sets.push(`estado = $${i++}`); valores.push(campos.estado); }
    if (campos.etapa_actual !== undefined) { sets.push(`etapa_actual = $${i++}`); valores.push(campos.etapa_actual); }
    if (campos.progreso !== undefined) { sets.push(`progreso = $${i++}`); valores.push(campos.progreso); }
    if (campos.siguiente_paso !== undefined) { sets.push(`siguiente_paso = $${i++}`); valores.push(campos.siguiente_paso); }
    if (campos.mensaje !== undefined) { sets.push(`mensaje = $${i++}`); valores.push(campos.mensaje); }

    if (sets.length === 0) return null;

    valores.push(tramiteId);

    const result = await pool.query(
      `UPDATE tramite SET ${sets.join(", ")} WHERE id_tramite = $${i} RETURNING *`,
      valores
    );

    return result.rows[0] || null;
  }

  return {
    PERFIL_A_VISA,
    calcularEtapa,
    findUserByEmail,
    guardarPerfil,
    getTramiteByUserId,
    getOrCreateTramite,
    avanzarTramiteDS160,
    updateUsuarioPerfil,
    updateTramite,
  };
}

module.exports = createPerfilService;