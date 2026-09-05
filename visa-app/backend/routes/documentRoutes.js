const express = require("express");
const upload = require("../upload");
const createDocumentController = require("../controllers/documentController");
const createDocumentService = require("../services/documentService");

function createDocumentRoutes(pool, { documentSchemaReady, activityLogService }) {
  const router = express.Router();

  const documentService = createDocumentService(pool, { documentSchemaReady, activityLogService });
  const documentController = createDocumentController(documentService);

  router.post("/upload", upload.single("file"), documentController.upload);
  router.post("/documentos", upload.single("file"), documentController.createDocumento);
  router.post("/documentos/listar", documentController.listDocumentos);
  
  // IMPORTANTE: /archivo debe ir ANTES de /:usuarioId
  router.get("/documentos/:id/archivo", documentController.getArchivo);
  router.get("/documentos/:usuarioId", documentController.listDocumentos);
  
  router.delete("/documentos", documentController.deleteDocumento);
  router.delete("/documentos/:id", documentController.deleteDocumento);

  return router;
}

module.exports = createDocumentRoutes;