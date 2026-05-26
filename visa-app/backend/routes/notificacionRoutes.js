const express = require("express");
const createNotificacionController = require("../controllers/notificacionController");
const createNotificacionService = require("../services/notificacionService");

function createNotificacionRoutes(pool) {
  const router = express.Router();
  const service = createNotificacionService(pool);
  const controller = createNotificacionController(service);

  // GET /notificaciones/:userId — listar notificaciones del usuario
  router.get("/:userId", controller.listar);

  // GET /notificaciones/:userId/no-leidas — contar no leídas
  router.get("/:userId/no-leidas", controller.contarNoLeidas);

  // PUT /notificaciones/:id/leer — marcar una como leída (body: { userId })
  router.put("/:id/leer", controller.marcarLeida);

  // PUT /notificaciones/:userId/leer-todas — marcar todas como leídas
  router.put("/:userId/leer-todas", controller.marcarTodasLeidas);

  // POST /notificaciones — crear notificación (uso interno/admin)
  router.post("/", controller.crear);

  return router;
}

module.exports = createNotificacionRoutes;
