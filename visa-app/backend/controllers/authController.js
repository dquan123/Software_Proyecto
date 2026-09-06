const { issueSessionToken } = require("../auth");

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

function createAuthController(authService, { activityLogService, testUsersReady }) {

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

  return {
    register,
    login,
    validateSession,
  };
}

module.exports = createAuthController;