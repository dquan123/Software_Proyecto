const express = require("express");
const upload = require("../upload");
const createInterviewSessionController = require("../controllers/interviewSessionController");
const createInterviewSessionService = require("../services/interviewSessionService");

function createInterviewSessionRoutes(pool) {
  const router = express.Router();
  const service = createInterviewSessionService(pool);
  const controller = createInterviewSessionController(service);

  router.get("/", controller.listSessions);
  router.post("/", upload.any(), controller.createSession);
  router.get("/user/:userId", controller.listUserSessions);
  router.get("/:id", controller.getSession);
  router.put("/:id/feedback", controller.updateFeedback);

  return router;
}

module.exports = createInterviewSessionRoutes;
