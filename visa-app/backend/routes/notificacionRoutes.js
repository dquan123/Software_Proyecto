const express = require("express");
const createNotificacionController = require("../controllers/notificacionController");
const createNotificacionService = require("../services/notificacionService");

function createNotificacionRoutes(
  pool,
  {
    requireSession = (_req, _res, next) => next(),
    requireAdmin = (_req, _res, next) => next(),
  } = {}
) {
  const router = express.Router();
  const service = createNotificacionService(pool);
  const controller = createNotificacionController(service);
  const requireNotificationOwner = (req, res, next) => {
    const requestedUserId = Number(req.params.userId ?? req.body?.userId);

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return next();
    }

    if (req.auth?.rol === "admin" || Number(req.auth?.id_usuario) === requestedUserId) {
      return next();
    }

    return res.status(403).json({ error: "No puedes acceder a notificaciones de otro usuario" });
  };

  // POST /notificaciones — crear notificación (uso interno/admin)
  router.post("/", requireAdmin, controller.crear);

  // POST /notificaciones/no-leidas — contar no leídas (body: { userId })
  router.post("/no-leidas", requireSession, requireNotificationOwner, controller.contarNoLeidasDesdeBody);

  // POST /notificaciones/listar — listar notificaciones del usuario (body: { userId })
  router.post("/listar", requireSession, requireNotificationOwner, controller.listarDesdeBody);

  // PUT /notificaciones/leer-todas — marcar todas como leídas (body: { userId })
  router.put("/leer-todas", requireSession, requireNotificationOwner, controller.marcarTodasLeidas);

  // GET /notificaciones/:userId/no-leidas — contar no leídas (más específica primero)
  router.get("/:userId/no-leidas", requireSession, requireNotificationOwner, controller.contarNoLeidas);

  // GET /notificaciones/:userId — listar notificaciones del usuario
  router.get("/:userId", requireSession, requireNotificationOwner, controller.listar);

  // PUT /notificaciones/:id/leer — marcar una como leída (body: { userId })
  router.put("/:id/leer", requireSession, requireNotificationOwner, controller.marcarLeida);

  // PUT /notificaciones/:userId/leer-todas — ruta legacy; usar body para userId
  router.put("/:userId/leer-todas", (_req, res) => {
    res.status(405).json({ error: "Usa PUT /notificaciones/leer-todas con userId en el body" });
  });

  // DELETE /notificaciones/:id — eliminar una notificación propia (body: { userId })
  router.delete("/:id", requireSession, requireNotificationOwner, controller.eliminar);

  return router;
}

module.exports = createNotificacionRoutes;
