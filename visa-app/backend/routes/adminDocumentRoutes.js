const express = require("express");
const createAdminDocumentController = require("../controllers/adminDocumentController");
const createAdminDocumentService = require("../services/adminDocumentService");

module.exports = function createAdminDocumentRoutes(pool, { requireAdmin, schemaReady, notificacionService, activityLogService }) {
  const router = express.Router();
  const adminDocumentService = createAdminDocumentService(pool, { schemaReady });
  const adminDocumentController = createAdminDocumentController(adminDocumentService, { notificacionService, activityLogService });

  router.get("/", requireAdmin, adminDocumentController.listDocuments);
  router.put("/:id/status", requireAdmin, adminDocumentController.updateDocumentStatus);

  return router;
};
