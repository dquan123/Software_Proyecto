const createNotificacionService = require("../services/notificacionService");

describe("notificacionService automatic notifications toggle", () => {
  function createService(query) {
    const pool = { query: jest.fn(query) };
    return { service: createNotificacionService(pool), pool };
  }

  test("skips creating a notification when automatic notifications are disabled", async () => {
    const { service, pool } = createService(async (sql) => {
      if (sql.includes("SELECT notificaciones_automaticas")) return { rows: [{ notificaciones_automaticas: false }] };
      return { rows: [] };
    });

    const result = await service.crearNotificacion({ userId: 4, titulo: "Hola", mensaje: "Mensaje" });

    expect(result).toBeNull();
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO notificaciones"), expect.anything());
  });

  test("creates a notification when automatic notifications are enabled", async () => {
    const { service, pool } = createService(async (sql) => {
      if (sql.includes("SELECT notificaciones_automaticas")) return { rows: [{ notificaciones_automaticas: true }] };
      if (sql.includes("INSERT INTO notificaciones")) return { rows: [{ id: 1, id_usuario: 4, titulo: "Hola", mensaje: "Mensaje", tipo: "info", leido: false }] };
      return { rows: [] };
    });

    const result = await service.crearNotificacion({ userId: 4, titulo: "Hola", mensaje: "Mensaje" });

    expect(result).toMatchObject({ id: 1, titulo: "Hola" });
  });

  test("defaults to enabled when the setting has never been saved", async () => {
    const { service } = createService(async (sql) => {
      if (sql.includes("SELECT notificaciones_automaticas")) return { rows: [] };
      if (sql.includes("INSERT INTO notificaciones")) return { rows: [{ id: 2, id_usuario: 4, titulo: "Hola", mensaje: "Mensaje", tipo: "info", leido: false }] };
      return { rows: [] };
    });

    const result = await service.crearNotificacion({ userId: 4, titulo: "Hola", mensaje: "Mensaje" });

    expect(result).toMatchObject({ id: 2 });
  });

  test("defaults to enabled when the settings table is not reachable", async () => {
    const { service } = createService(async (sql) => {
      if (sql.includes("SELECT notificaciones_automaticas")) return Promise.reject(new Error("relation admin_settings does not exist"));
      if (sql.includes("INSERT INTO notificaciones")) return { rows: [{ id: 3, id_usuario: 4, titulo: "Hola", mensaje: "Mensaje", tipo: "info", leido: false }] };
      return { rows: [] };
    });

    const result = await service.crearNotificacion({ userId: 4, titulo: "Hola", mensaje: "Mensaje" });

    expect(result).toMatchObject({ id: 3 });
  });
});
