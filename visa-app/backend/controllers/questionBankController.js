function createQuestionBankController(questionBankService) {
  function handleError(res, error) {
    const status = error.statusCode || 500;
    const message =
      status === 500 ? "Error interno al procesar preguntas" : error.message;

    if (status === 500) {
      console.error("QUESTION BANK ERROR:", error);
    }

    return res.status(status).json({ error: message });
  }

  async function listQuestions(req, res) {
    try {
      const questions = await questionBankService.listQuestions();
      return res.json({ questions });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function createQuestion(req, res) {
    try {
      const question = await questionBankService.createQuestion(req.body);
      return res.status(201).json({
        message: "Pregunta creada correctamente",
        question,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function updateQuestion(req, res) {
    try {
      const question = await questionBankService.updateQuestion(
        req.params.id,
        req.body
      );

      return res.json({
        message: "Pregunta actualizada correctamente",
        question,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async function deleteQuestion(req, res) {
    try {
      await questionBankService.deleteQuestion(req.params.id);
      return res.json({ message: "Pregunta eliminada correctamente" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}

module.exports = createQuestionBankController;
