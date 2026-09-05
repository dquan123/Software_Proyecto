const express = require("express");
const createPerfilController = require("../controllers/perfilController");
const createPerfilService = require("../services/perfilService");

function createPerfilRoutes(pool, { userSchemaReady, tramiteSchemaReady, activityLogService, notificacionService }) {
  const router = express.Router();

  const perfilService = createPerfilService(pool, { userSchemaReady, tramiteSchemaReady });
  const perfilController = createPerfilController(perfilService, { activityLogService, notificacionService });

  router.post("/guardar-perfil", perfilController.guardarPerfil);

  router.post("/estado-tramite", perfilController.estadoTramite);
  router.get("/estado-tramite", (_req, res) => {
    res.status(405).json({ error: "Usa POST /estado-tramite con correo en el body" });
  });

  router.post("/usuario-perfil", perfilController.getUsuarioPerfil);
  router.get("/usuario-perfil", (_req, res) => {
    res.status(405).json({ error: "Usa POST /usuario-perfil con correo en el body" });
  });
  router.put("/usuario-perfil", perfilController.updateUsuarioPerfil);

  router.put("/tramite", perfilController.updateTramite);

  return router;
}

module.exports = createPerfilRoutes;