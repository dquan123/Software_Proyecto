const express = require("express");
const createAuthController = require("../controllers/authController");
const createAuthService = require("../services/authService");

function createAuthRoutes(pool, { userSchemaReady, tramiteSchemaReady, testUsersReady, requireSession, activityLogService }) {
  const router = express.Router();
  
  const authService = createAuthService(pool, { userSchemaReady, tramiteSchemaReady });
  const authController = createAuthController(authService, { activityLogService, testUsersReady });

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.get("/validar-sesion", requireSession, authController.validateSession);

  return router;
}

module.exports = createAuthRoutes;