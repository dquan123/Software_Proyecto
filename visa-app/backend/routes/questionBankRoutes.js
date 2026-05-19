const express = require("express");
const createQuestionBankController = require("../controllers/questionBankController");
const { createQuestionBankService } = require("../services/questionBankService");

function createQuestionBankRoutes(pool) {
  const router = express.Router();
  const service = createQuestionBankService(pool);
  const controller = createQuestionBankController(service);

  router.get("/", controller.listQuestions);
  router.post("/", controller.createQuestion);
  router.put("/:id", controller.updateQuestion);
  router.delete("/:id", controller.deleteQuestion);

  return router;
}

module.exports = createQuestionBankRoutes;
