const express = require("express");
const upload = require("../upload");
const createInterviewSessionController = require("../controllers/interviewSessionController");
const createInterviewSessionService = require("../services/interviewSessionService");

function createInterviewSessionRoutes(pool, { requireAdmin = (_req, _res, next) => next(), notificacionService } = {}) {
  const router = express.Router();
  const service = createInterviewSessionService(pool);
  const controller = createInterviewSessionController(service, { notificacionService });

  router.get("/", requireAdmin, controller.listSessions);
  router.post("/", upload.any(), controller.createSession);
  router.get("/user/:userId", controller.listUserSessions);
  router.get("/:id/audio/:questionId", controller.getSessionAudio);
  router.get("/:id", controller.getSession);
  router.put("/:id/feedback", requireAdmin, controller.updateFeedback);

  return router;
}

module.exports = createInterviewSessionRoutes;
