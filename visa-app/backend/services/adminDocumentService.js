function presentAdminDocument(document) {
  const {
    storage_key: storageKey,
    usuario_nombre: userName,
    usuario_correo: userEmail,
    ...safeDocument
  } = document;

  return {
    ...safeDocument,
    archivo_url: storageKey
      ? `/documentos/${document.id}/archivo`
      : safeDocument.archivo_url,
    usuario: {
      id: safeDocument.usuario_id,
      nombre: userName || "Usuario sin nombre",
      correo: userEmail || "",
    },
  };
}

function createAdminDocumentService(pool, { schemaReady = Promise.resolve() } = {}) {
  async function listDocuments() {
    await schemaReady;

    const result = await pool.query(`
      SELECT
        d.id,
        d.nombre,
        d.tipo,
        d.archivo_url,
        d.usuario_id,
        d.documento_key,
        d.estado,
        d.feedback,
        d.creado_en,
        d.actualizado_en,
        d.storage_key,
        u.nombre AS usuario_nombre,
        u.correo AS usuario_correo
      FROM documentos d
      LEFT JOIN usuario u ON u.id_usuario = d.usuario_id
      ORDER BY d.actualizado_en DESC, d.creado_en DESC
    `);

    return result.rows.map(presentAdminDocument);
  }

  async function updateDocumentStatus(documentId, status) {
    await schemaReady;

    if (!["approved", "rejected"].includes(status)) {
      const error = new Error("Estado de documento invalido");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
        WITH updated AS (
          UPDATE documentos
          SET estado = $1,
              actualizado_en = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, nombre, tipo, archivo_url, usuario_id, documento_key, estado,
                    feedback, creado_en, actualizado_en, storage_key
        )
        SELECT
          updated.*,
          u.nombre AS usuario_nombre,
          u.correo AS usuario_correo
        FROM updated
        LEFT JOIN usuario u ON u.id_usuario = updated.usuario_id
      `,
      [status, documentId]
    );

    const document = result.rows[0];

    if (!document) {
      const error = new Error("Documento no encontrado");
      error.statusCode = 404;
      throw error;
    }

    return presentAdminDocument(document);
  }

  return { listDocuments, updateDocumentStatus };
}

module.exports = createAdminDocumentService;
