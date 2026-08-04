function createInterviewSessionController(interviewSessionService) {
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
        req.files || []
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

  async function updateFeedback(req, res) {
    try {
      const session = await interviewSessionService.updateFeedback(
        req.params.id,
        req.body
      );

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
    updateFeedback,
  };
}

module.exports = createInterviewSessionController;
