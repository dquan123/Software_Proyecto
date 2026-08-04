const express = require("express");
const createNotificacionController = require("../controllers/notificacionController");
const createNotificacionService = require("../services/notificacionService");

function createNotificacionRoutes(pool) {
  const router = express.Router();
  const service = createNotificacionService(pool);
  const controller = createNotificacionController(service);

  // POST /notificaciones — crear notificación (uso interno/admin)
  router.post("/", controller.crear);

  // GET /notificaciones/:userId/no-leidas — contar no leídas (más específica primero)
  router.get("/:userId/no-leidas", controller.contarNoLeidas);

  // GET /notificaciones/:userId — listar notificaciones del usuario
  router.get("/:userId", controller.listar);

  // PUT /notificaciones/:id/leer — marcar una como leída (body: { userId })
  router.put("/:id/leer", controller.marcarLeida);

  // PUT /notificaciones/:userId/leer-todas — marcar todas como leídas
  router.put("/:userId/leer-todas", controller.marcarTodasLeidas);

  // DELETE /notificaciones/:id — eliminar una notificación propia (body: { userId })
  router.delete("/:id", controller.eliminar);

  return router;
}

module.exports = createNotificacionRoutes;
