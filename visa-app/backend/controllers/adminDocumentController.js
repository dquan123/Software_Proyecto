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

  return { listDocuments };
}

module.exports = createAdminDocumentController;
