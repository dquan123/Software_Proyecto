const express = require("express");
const createAdminDocumentController = require("../controllers/adminDocumentController");
const createAdminDocumentService = require("../services/adminDocumentService");

module.exports = function createAdminDocumentRoutes(pool, { requireAdmin, schemaReady }) {
  const router = express.Router();
  const adminDocumentService = createAdminDocumentService(pool, { schemaReady });
  const adminDocumentController = createAdminDocumentController(adminDocumentService);

  router.get("/", requireAdmin, adminDocumentController.listDocuments);
  router.put("/:id/status", requireAdmin, adminDocumentController.updateDocumentStatus);

  return router;
};
