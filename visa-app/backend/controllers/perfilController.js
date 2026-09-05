function createPerfilController(perfilService, { activityLogService, notificacionService }) {

  async function guardarPerfil(req, res) {
    const { correo, perfil } = req.body;

    if (!correo || !perfil) {
      return res.status(400).json({ error: "Correo y perfil son obligatorios" });
    }

    try {
      const usuario = await perfilService.guardarPerfil(correo, perfil);

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      await activityLogService.logActivity({
        req,
        actor: usuario,
        userId: usuario.id_usuario,
        userEmail: usuario.correo,
        role: usuario.rol || "cliente",
        action: "profile.selected",
        entityType: "usuario",
        entityId: usuario.id_usuario,
        description: "Perfil de visa guardado",
        metadata: { perfil },
      });

      await perfilService.avanzarTramiteDS160(usuario.id_usuario);

      // Notificar cambio de etapa
      try {
        await notificacionService.crear({
          userId: usuario.id_usuario,
          titulo: "¡Perfil configurado!",
          mensaje: "Tu perfil de visa ha sido guardado. El siguiente paso es completar el formulario DS-160.",
          tipo: "info",
          etapaRelacionada: "ds160",
        });
      } catch (notifError) {
        console.error("Error al crear notificación:", notifError);
      }

      res.json({
        message: "Perfil actualizado",
        perfil: usuario.perfil,
      });
    } catch (error) {
      console.error("ERROR GUARDAR-PERFIL:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function estadoTramite(req, res) {
    const { correo } = req.body || {};

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido en el body" });
    }

    try {
      const usuario = await perfilService.findUserByEmail(correo);

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const hasProfile = Boolean(usuario.perfil);
      const tramite = await perfilService.getOrCreateTramite(usuario.id_usuario, hasProfile);

      res.json({
        estado: tramite.estado,
        etapaActual: tramite.etapa_actual,
        progreso: tramite.progreso,
        siguientePaso: tramite.siguiente_paso,
        mensaje: tramite.mensaje,
        created_at: tramite.created_at,
        updated_at: tramite.updated_at,
      });
    } catch (error) {
      console.error("ERROR ESTADO-TRAMITE:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function getUsuarioPerfil(req, res) {
    const { correo } = req.body || {};

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido en el body" });
    }

    try {
      const usuario = await perfilService.findUserByEmail(correo);

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const tramiteResult = await perfilService.getTramiteByUserId(usuario.id_usuario);
      const tramite = tramiteResult || {
        estado: "En proceso",
        etapa_actual: "Formulario DS-160",
        progreso: 10,
      };

      const etapa = perfilService.calcularEtapa(tramite.progreso, usuario.perfil);

      res.json({
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          telefono: usuario.telefono || "",
          ciudad: usuario.ciudad || "",
          pais: usuario.pais || "",
          perfil: usuario.perfil || null,
          preferencias: {
            notificacionesEmail: usuario.notificaciones_email !== false,
            idioma: usuario.idioma || "es",
          },
        },
        tramite: {
          tipoVisa: perfilService.PERFIL_A_VISA[usuario.perfil] || "Sin definir",
          consulado: [usuario.ciudad, usuario.pais].filter(Boolean).join(", ") || "Sin definir",
          estado: tramite.estado,
          etapaActual: tramite.etapa_actual,
          etapa,
          totalEtapas: 6,
          activo: tramite.estado === "En proceso",
        },
      });
    } catch (error) {
      console.error("ERROR GET USUARIO-PERFIL:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function updateUsuarioPerfil(req, res) {
    const { correo, nombre, telefono, ciudad, pais, notificacionesEmail, idioma } = req.body;

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido" });
    }

    try {
      const usuario = await perfilService.updateUsuarioPerfil(correo, {
        nombre,
        telefono,
        ciudad,
        pais,
        notificacionesEmail: notificacionesEmail !== undefined ? !notificacionesEmail : undefined,
        idioma,
      });

      if (!usuario) {
        return res.status(400).json({ error: "Nada que actualizar" });
      }

      await activityLogService.logActivity({
        req,
        actor: usuario,
        userId: usuario.id_usuario,
        userEmail: usuario.correo,
        role: "cliente",
        action: "profile.updated",
        entityType: "usuario",
        entityId: usuario.id_usuario,
        description: "Perfil de usuario actualizado",
        metadata: {
          campos: Object.keys({
            ...(nombre !== undefined ? { nombre: true } : {}),
            ...(telefono !== undefined ? { telefono: true } : {}),
            ...(ciudad !== undefined ? { ciudad: true } : {}),
            ...(pais !== undefined ? { pais: true } : {}),
            ...(notificacionesEmail !== undefined ? { notificacionesEmail: true } : {}),
            ...(idioma !== undefined ? { idioma: true } : {}),
          }),
        },
      });

      res.json({
        message: "Perfil actualizado correctamente",
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          telefono: usuario.telefono || "",
          ciudad: usuario.ciudad || "",
          pais: usuario.pais || "",
          perfil: usuario.perfil || null,
          preferencias: {
            notificacionesEmail: usuario.notificaciones_email !== false,
            idioma: usuario.idioma || "es",
          },
        },
      });
    } catch (error) {
      console.error("ERROR PUT USUARIO-PERFIL:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function updateTramite(req, res) {
    const { id_tramite, estado, etapa_actual, progreso, siguiente_paso, mensaje } = req.body;

    if (!id_tramite) {
      return res.status(400).json({ error: "id_tramite requerido" });
    }

    try {
      const tramite = await perfilService.updateTramite(id_tramite, {
        estado,
        etapa_actual,
        progreso,
        siguiente_paso,
        mensaje,
      });

      if (!tramite) {
        return res.status(404).json({ error: "Trámite no encontrado o nada que actualizar" });
      }

      res.json({ message: "Trámite actualizado", tramite });
    } catch (error) {
      console.error("ERROR PUT TRAMITE:", error);
      res.status(500).json({ error: error.message });
    }
  }

  return {
    guardarPerfil,
    estadoTramite,
    getUsuarioPerfil,
    updateUsuarioPerfil,
    updateTramite,
  };
}

module.exports = createPerfilController;