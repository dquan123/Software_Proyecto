const { streamDs160Pdf } = require("../services/ds160PdfService");

function createDs160Controller(ds160Service) {

  async function loadDs160(req, res) {
    const { correo } = req.body || {};

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido en el body" });
    }

    try {
      const user = await ds160Service.findUserByEmail(correo);

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const formulario = await ds160Service.getFormulario(user.id_usuario);

      if (!formulario) {
        return res.json({
          datos: {},
          seccion_actual: 1,
          completado: false,
        });
      }

      res.json({
        datos: formulario.datos,
        seccion_actual: formulario.seccion_actual,
        completado: formulario.completado,
      });
    } catch (error) {
      console.error("ERROR GET DS160:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function saveDs160(req, res) {
    const { correo, datos, seccion_actual, completado } = req.body;

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido" });
    }

    try {
      const user = await ds160Service.findUserByEmail(correo);

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const formulario = await ds160Service.saveFormulario(
        user.id_usuario,
        correo,
        { datos, seccion_actual, completado },
        req
      );

      // Si se completó, avanzar trámite y notificar
      if (completado) {
        const avanzado = await ds160Service.avanzarTramitePago(user.id_usuario);
        if (avanzado) {
          await ds160Service.notificarDs160Completado(user.id_usuario);
        }
      }

      res.json({
        message: "Formulario guardado correctamente",
        formulario,
      });
    } catch (error) {
      console.error("ERROR SAVE DS160:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function exportPdf(req, res) {
    const { correo } = req.body || {};

    if (!correo) {
      return res.status(400).json({ error: "Correo requerido en el body" });
    }

    try {
      const user = await ds160Service.findUserByEmail(correo);

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const formulario = await ds160Service.getFormulario(user.id_usuario);

      if (!formulario) {
        return res.status(404).json({ error: "Formulario DS-160 no encontrado" });
      }

      await ds160Service.logPdfExport(req, user.id_usuario, correo, formulario.id_formulario);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="ds160-${user.id_usuario}.pdf"`);
      res.setHeader("Cache-Control", "no-store");

      return streamDs160Pdf({
        usuario: { id_usuario: user.id_usuario, correo },
        formulario,
      }, res);
    } catch (error) {
      console.error("ERROR DS160 PDF:", error);
      if (res.headersSent) return res.end();
      return res.status(500).json({ error: error.message });
    }
  }

  return {
    loadDs160,
    saveDs160,
    exportPdf,
  };
}

module.exports = createDs160Controller;