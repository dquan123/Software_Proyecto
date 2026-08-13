function createInterviewSessionController(interviewSessionService, { notificacionService } = {}) {
  function handleError(res, error) {
    const status = error.statusCode || 500;
    const message =
      status === 500 ? "Error interno al procesar sesiones" : error.message;

    if (status === 500) {
      console.error("INTERVIEW SESSION ERROR:", error);
    }

    return res.status(status).json({ error: message });
  }

  async function createSession(req, res) {
    try {
      const session = await interviewSessionService.createSession(
        req.body.session,
        req.files || [],
        { baseUrl: `${req.protocol}://${req.get("host")}` }
      );

      return res.status(201).json({
        message: "Sesión de entrevista guardada correctamente",
        session,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function listSessions(req, res) {
    try {
      const sessions = await interviewSessionService.listSessions({
        status: req.query.status,
      });
      return res.json({ sessions });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function listUserSessions(req, res) {
    try {
      const sessions = await interviewSessionService.listUserSessions(
        req.params.userId
      );
      return res.json({ sessions });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function getSession(req, res) {
    try {
      const session = await interviewSessionService.getSession(req.params.id);
      return res.json({ session });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function getSessionAudio(req, res) {
    try {
      const audio = await interviewSessionService.getSessionAudio(
        req.params.id,
        req.params.questionId
      );

      if (audio.redirectUrl) {
        return res.redirect(audio.redirectUrl);
      }

      const contentType =
        audio.response?.audio?.mimetype ||
        audio.storedFile.contentType ||
        "audio/webm";

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${audio.filename}"`
      );

      if (audio.storedFile.contentLength) {
        res.setHeader("Content-Length", String(audio.storedFile.contentLength));
      }

      audio.storedFile.stream.on("error", (streamError) => {
        console.error("INTERVIEW AUDIO STREAM ERROR:", streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: "No se pudo cargar el audio" });
        } else {
          res.destroy(streamError);
        }
      });

      return audio.storedFile.stream.pipe(res);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function updateFeedback(req, res) {
    try {
      const session = await interviewSessionService.updateFeedback(
        req.params.id,
        req.body
      );

      if (notificacionService && session?.user_id) {
        try {
          await notificacionService.crearNotificacion({
            userId: session.user_id,
            titulo: "Entrevista revisada",
            mensaje: "Ya puedes consultar la retroalimentacion de tu entrevista.",
            tipo: "entrevista",
            etapaRelacionada: `entrevista-${session.id}`,
          });
        } catch (notificationError) {
          console.error("ERROR INTERVIEW FEEDBACK NOTIFICATION:", notificationError);
        }
      }

      return res.json({
        message: "Retroalimentación guardada correctamente",
        session,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  return {
    createSession,
    listSessions,
    listUserSessions,
    getSession,
    getSessionAudio,
    updateFeedback,
  };
}

module.exports = createInterviewSessionController;
