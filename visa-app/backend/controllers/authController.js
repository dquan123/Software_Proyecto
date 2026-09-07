const { issueSessionToken } = require("../auth");
const { createSafeEmailSender } = require("../services/emailReminderService");

function getFrontendBaseUrl(env = process.env) {
  if (env.FRONTEND_URL) return env.FRONTEND_URL.replace(/\/+$/, "");
  return env.NODE_ENV === "production" ? "https://visa-app.duckdns.org" : "http://localhost:5173";
}

function presentLoginUser(row) {
  return {
    id: row.id_usuario,
    id_usuario: row.id_usuario,
    nombre: row.nombre,
    correo: row.correo,
    perfil: row.perfil || null,
    rol: row.rol || "cliente",
  };
}

function createAuthController(authService, { activityLogService, testUsersReady, sendEmail }) {
  const sendPasswordResetEmail = sendEmail || createSafeEmailSender();

  async function register(req, res) {
    const { nombre, correo, contrasena } = req.body;

    try {
      const usuarioRow = await authService.createUser({ nombre, correo, contrasena });
      const usuario = presentLoginUser(usuarioRow);
      
      await authService.createInitialTramite(usuario.id_usuario);
      
      await activityLogService.logActivity({
        req,
        actor: usuario,
        userId: usuario.id_usuario,
        userEmail: usuario.correo,
        role: usuario.rol,
        action: "user.registered",
        entityType: "usuario",
        entityId: usuario.id_usuario,
        description: "Usuario registrado",
      });

      res.json({
        message: "Usuario guardado en BD",
        data: usuario,
        token: issueSessionToken(usuario),
      });
    } catch (error) {
      console.error("ERROR REGISTER:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function login(req, res) {
    const { correo, contrasena } = req.body;

    try {
      await testUsersReady;
      const usuarioRow = await authService.findUserByEmail(correo);
      const passwordMatches = await authService.verifyPassword(contrasena, usuarioRow);

      if (!passwordMatches) {
        return res.status(401).json({ error: "El correo o la contraseña son incorrectos" });
      }

      if (usuarioRow.activo === false) {
        return res.status(403).json({ error: "Cuenta desactivada. Contacta a un administrador." });
      }

      const usuario = presentLoginUser(usuarioRow);
      
      await activityLogService.logActivity({
        req,
        actor: usuario,
        userId: usuario.id_usuario,
        userEmail: usuario.correo,
        role: usuario.rol,
        action: "user.login",
        entityType: "usuario",
        entityId: usuario.id_usuario,
        description: "Login exitoso",
      });

      res.json({
        success: true,
        message: "Login exitoso",
        usuario,
        user: usuario,
        token: issueSessionToken(usuario),
      });
    } catch (error) {
      console.error("ERROR LOGIN:", error);
      res.status(500).json({ error: error.message });
    }
  }

  function validateSession(req, res) {
    res.json({ valid: true, user: presentLoginUser(req.auth) });
  }

  async function forgotPassword(req, res) {
    const { correo } = req.body;
    const genericMessage = "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.";

    try {
      const result = await authService.createPasswordResetToken(correo);

      if (result) {
        const resetUrl = `${getFrontendBaseUrl()}/restablecer-contrasena?token=${result.token}`;
        await sendPasswordResetEmail({
          to: result.usuario.correo,
          subject: "Recuperación de contraseña - VisaGuide",
          text: [
            `Hola ${result.usuario.nombre},`,
            "",
            "Solicitaste restablecer tu contraseña. Usa el siguiente enlace (válido por 1 hora):",
            resetUrl,
            "",
            "Si no fuiste tú, ignora este mensaje.",
          ].join("\n"),
        });

        await activityLogService.logActivity({
          req,
          userId: result.usuario.id_usuario,
          userEmail: result.usuario.correo,
          role: result.usuario.rol,
          action: "user.password_reset_requested",
          entityType: "usuario",
          entityId: result.usuario.id_usuario,
          description: "Solicitud de recuperación de contraseña",
        });
      }

      res.json({ message: genericMessage });
    } catch (error) {
      console.error("ERROR FORGOT PASSWORD:", error);
      res.status(500).json({ error: "No fue posible procesar la solicitud" });
    }
  }

  async function resetPassword(req, res) {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena || nuevaContrasena.length < 4) {
      return res.status(400).json({ error: "Token y una nueva contraseña de al menos 4 caracteres son obligatorios" });
    }

    try {
      const success = await authService.resetPassword(token, nuevaContrasena);
      if (!success) {
        return res.status(400).json({ error: "El enlace de recuperación es inválido o expiró" });
      }
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      console.error("ERROR RESET PASSWORD:", error);
      res.status(500).json({ error: "No fue posible restablecer la contraseña" });
    }
  }

  return {
    register,
    login,
    validateSession,
    forgotPassword,
    resetPassword,
  };
}

module.exports = createAuthController;