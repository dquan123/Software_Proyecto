function createAdminDocumentController(adminDocumentService) {
  async function listDocuments(_req, res) {
    try {
      const documentos = await adminDocumentService.listDocuments();
      return res.json({ documentos });
    } catch (error) {
      console.error("ERROR ADMIN DOCUMENTS LIST:", error);
      return res.status(500).json({ error: "No fue posible cargar los documentos" });
    }
  }

  async function updateDocumentStatus(req, res) {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "documento_id debe ser numerico" });
    }

    try {
      const payload = {};

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "estado")) {
        payload.status = req.body.estado;
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "feedback")) {
        payload.feedback = req.body.feedback;
      }

      const documento = await adminDocumentService.updateDocumentStatus(documentId, payload);
      return res.json({
        message: req.body?.estado
          ? "Estado del documento actualizado correctamente"
          : "Observaciones del documento actualizadas correctamente",
        documento,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error("ERROR ADMIN DOCUMENT STATUS:", error);
      return res.status(500).json({ error: "No fue posible actualizar el documento" });
    }
  }

  return { listDocuments, updateDocumentStatus };
}

module.exports = createAdminDocumentController;
