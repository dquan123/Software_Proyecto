function createDocumentController(documentService) {

  async function upload(req, res) {
    const { nombre, tipo, usuario_id, documento_key } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    try {
      const { documento, uploadedFile } = await documentService.saveDocumento(
        req.file,
        { 
          nombre: nombre?.trim() || req.file.originalname, 
          tipo: tipo?.trim() || req.file.mimetype || null, 
          usuario_id, 
          documento_key 
        },
        req
      );

      res.json({
        message: "Archivo subido correctamente",
        archivo_url: documento.archivo_url,
        key: uploadedFile.key,
        documento,
      });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      if (process.env.NODE_ENV === "production" &&
          (error.message?.includes("Missing R2") || error.message?.includes("placeholder"))) {
        return res.status(500).json({ error: "No fue posible subir el archivo. Inténtalo nuevamente más tarde." });
      }

      return res.status(500).json({ error: "No se pudo guardar el documento" });
    }
  }

  async function createDocumento(req, res) {
    const { nombre, tipo, usuario_id, documento_key } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "Nombre requerido" });
    }

    try {
      const { documento, uploadedFile } = await documentService.saveDocumento(
        req.file,
        { nombre, tipo, usuario_id, documento_key },
        req
      );

      res.status(201).json({
        message: "Documento guardado correctamente",
        archivo_url: documento.archivo_url,
        key: uploadedFile.key,
        documento,
      });
    } catch (error) {
      console.error("DOCUMENTO ERROR:", error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      if (process.env.NODE_ENV === "production" &&
          (error.message?.includes("Missing R2") || error.message?.includes("placeholder"))) {
        return res.status(500).json({ error: "No fue posible subir el archivo. Inténtalo nuevamente más tarde." });
      }

      return res.status(500).json({ error: "No se pudo guardar el documento" });
    }
  }

  async function listDocumentos(req, res) {
    const usuarioIdValue = req.params.usuarioId ?? req.body?.usuario_id ?? req.body?.usuarioId;
    const usuarioId = Number(usuarioIdValue);

    if (Number.isNaN(usuarioId)) {
      const message = req.params.usuarioId === undefined
        ? "usuario_id requerido en el body y debe ser numérico"
        : "usuario_id debe ser numérico";
      return res.status(400).json({ error: message });
    }

    try {
      const documentos = await documentService.listDocumentos(usuarioId);
      return res.json(documentos);
    } catch (error) {
      console.error("ERROR GET DOCUMENTOS:", error);
      return res.status(500).json({ error: "No se pudieron cargar los documentos" });
    }
  }

  async function deleteDocumento(req, res) {
    const documentIdValue = req.params.id ?? req.body?.documento_id ?? req.body?.documentId;
    const documentId = Number(documentIdValue);
    const usuarioId = Number(req.body?.usuario_id ?? req.body?.usuarioId);

    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "documento_id debe ser numérico" });
    }

    if (Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "usuario_id requerido en el body y debe ser numérico" });
    }

    try {
      const deleted = await documentService.deleteDocumento(documentId, usuarioId);

      if (!deleted) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      return res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
      console.error("ERROR DELETE DOCUMENTO:", error);
      return res.status(500).json({ error: "No se pudo eliminar el documento" });
    }
  }

  async function getArchivo(req, res) {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "documento_id debe ser numérico" });
    }

    try {
      const document = await documentService.getDocumentoById(documentId);

      if (!document) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      if (!document.storage_key) {
        if (documentService.isSelfDocumentFileUrl(document)) {
          return res.status(404).json({ error: "El archivo no está disponible para vista previa" });
        }
        return res.redirect(document.archivo_url);
      }

      const storedFile = await documentService.getDocumentoFile(document.storage_key);
      const contentType = documentService.inferDocumentContentType(document, storedFile);
      const dispositionType = documentService.canPreviewInline(contentType) ? "inline" : "attachment";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Link", '</visaguide-favicon.svg>; rel="icon"; type="image/svg+xml"');
      res.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="${documentService.buildDownloadFilename(document)}"`
      );

      if (storedFile.contentLength) {
        res.setHeader("Content-Length", String(storedFile.contentLength));
      }

      storedFile.stream.on("error", (error) => {
        console.error("ERROR STREAM DOCUMENTO:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "No se pudo cargar el documento" });
        } else {
          res.destroy(error);
        }
      });

      return storedFile.stream.pipe(res);
    } catch (error) {
      console.error("ERROR GET DOCUMENTO ARCHIVO:", error);
      return res.status(error.statusCode || 500).json({
        error: error.statusCode ? error.message : "No se pudo cargar el documento",
      });
    }
  }

  return {
    upload,
    createDocumento,
    listDocumentos,
    deleteDocumento,
    getArchivo,
  };
}

module.exports = createDocumentController;