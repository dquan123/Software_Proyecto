const express = require("express");
const createDs160Controller = require("../controllers/ds160Controller");
const createDs160Service = require("../services/ds160Service");

function createDs160Routes(pool, { activityLogService, notificacionService }) {
  const router = express.Router();

  const ds160Service = createDs160Service(pool, { activityLogService, notificacionService });
  const ds160Controller = createDs160Controller(ds160Service);

  router.post("/ds160/load", ds160Controller.loadDs160);
  router.get("/ds160", (_req, res) => {
    res.status(405).json({ error: "Usa POST /ds160/load con correo en el body" });
  });

  router.post("/ds160", ds160Controller.saveDs160);

  router.post("/ds160/pdf", ds160Controller.exportPdf);
  router.get("/ds160/pdf", (_req, res) => {
    res.status(405).json({ error: "Usa POST /ds160/pdf con correo en el body" });
  });

  return router;
}

module.exports = createDs160Routes;