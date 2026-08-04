const request = require("supertest");

const mockQuery = jest.fn();
const mockConnect = jest.fn(() => Promise.resolve());

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
    query: mockQuery,
  })),
}));

jest.mock("../r2", () => ({
  uploadBufferToR2: jest.fn(() =>
    Promise.resolve({
      key: "mock-key.pdf",
      url: "https://r2.example.test/mock-bucket/mock-key.pdf",
    })
  ),
  deleteObjectFromR2: jest.fn(() => Promise.resolve()),
  validateR2Config: jest.fn(),
}));

const storedFileResult = {
  key: "local/mock-document.pdf",
  url: "http://localhost/local-files/mock-document.pdf",
  provider: "local",
};
const mockUploadStoredFile = jest.fn(() => Promise.resolve(storedFileResult));
const mockDeleteStoredFile = jest.fn(() => Promise.resolve());

jest.mock("../storage", () => ({
  LOCAL_STORAGE_DIR: "/tmp/visa-app-test-uploads",
  uploadStoredFile: mockUploadStoredFile,
  deleteStoredFile: mockDeleteStoredFile,
}));

function defaultQueryHandler(sql, values) {
  const normalized = String(sql).replace(/\s+/g, " ").trim();

  if (normalized.includes("SELECT COUNT(*)::int AS total FROM question_bank")) {
    return Promise.resolve({ rows: [{ total: 1 }] });
  }

  if (normalized.includes("SELECT id_usuario FROM usuario WHERE correo = $1")) {
    if (values?.[0] === "valido@example.com") {
      return Promise.resolve({ rows: [{ id_usuario: 1 }] });
    }
    const ds160Users = {
      "ds160-con-form@example.com": 10,
      "ds160-sin-form@example.com": 11,
      "ds160-nuevo@example.com": 12,
      "ds160-existente@example.com": 13,
      "ds160-completado@example.com": 14,
      "ds160-datos-vacios@example.com": 15,
      "ds160-invalido@example.com": 16,
      "ds160-pdf@example.com": 17,
      "ds160-pdf-sin-form@example.com": 18,
    };
    if (ds160Users[values?.[0]]) {
      return Promise.resolve({ rows: [{ id_usuario: ds160Users[values[0]] }] });
    }
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("INSERT INTO usuario")) {
    return Promise.resolve({
      rows: [
        {
          id_usuario: 2,
          nombre: values[0],
          correo: values[1],
          contrasena: values[2],
          rol: values[3] || "cliente",
        },
      ],
    });
  }

  if (normalized.includes("FROM usuario WHERE correo=$1 AND contrasena=$2")) {
    if (values?.[0] === "login@example.com" && values?.[1] === "1234") {
      return Promise.resolve({
        rows: [
          {
            id_usuario: 3,
            nombre: "Usuario Login",
            correo: "login@example.com",
            perfil: "turismo_negocios",
            rol: "cliente",
          },
        ],
      });
    }
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("SELECT * FROM formulario_ds160 WHERE id_usuario = $1")) {
    if (values?.[0] === 10) {
      return Promise.resolve({
        rows: [
          {
            id_formulario: 50,
            id_usuario: 10,
            datos: {
              personal: {
                nombreCompleto: "Usuario DS160",
                pasaporte: "A1234567",
              },
            },
            seccion_actual: 3,
            completado: false,
          },
        ],
      });
    }
    if (values?.[0] === 17) {
      return Promise.resolve({
        rows: [
          {
            id_formulario: 51,
            id_usuario: 17,
            datos: {
              personal: {
                nombres: "Usuario",
                apellidos: "PDF",
                numeroPasaporte: "",
              },
              viaje: {
                proposito: "Turismo",
                duracionEstancia: 15,
              },
            },
            seccion_actual: 4,
            completado: false,
          },
        ],
      });
    }
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("SELECT id_formulario FROM formulario_ds160 WHERE id_usuario = $1")) {
    if (values?.[0] === 13 || values?.[0] === 14 || values?.[0] === 16) {
      return Promise.resolve({ rows: [{ id_formulario: 70 }] });
    }
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("INSERT INTO formulario_ds160")) {
    return Promise.resolve({
      rows: [
        {
          id_formulario: 71,
          id_usuario: values[0],
          datos: JSON.parse(values[1]),
          seccion_actual: values[2],
          completado: values[3],
        },
      ],
    });
  }

  if (normalized.includes("UPDATE formulario_ds160")) {
    return Promise.resolve({
      rows: [
        {
          id_formulario: 70,
          id_usuario: values[3],
          datos: JSON.parse(values[0]),
          seccion_actual: values[1],
          completado: values[2],
        },
      ],
    });
  }

  if (normalized.includes("SELECT id_tramite, progreso FROM tramite WHERE id_usuario = $1")) {
    return Promise.resolve({
      rows: [{ id_tramite: 80, progreso: 17 }],
    });
  }

  if (normalized.includes("UPDATE tramite") && normalized.includes("Pago de visa")) {
    return Promise.resolve({ rows: [] });
  }

  if (
    normalized.includes("SELECT id FROM notificaciones") &&
    normalized.includes("etapa_relacionada = $2")
  ) {
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("INSERT INTO notificaciones")) {
    return Promise.resolve({
      rows: [
        {
          id: 81,
          id_usuario: values[0],
          titulo: values[1],
          mensaje: values[2],
          tipo: values[3],
          leido: false,
          etapa_relacionada: values[4],
        },
      ],
    });
  }

  if (
    normalized.includes("SELECT id, question, category, difficulty, is_required, created_at") &&
    normalized.includes("FROM question_bank")
  ) {
    return Promise.resolve({
      rows: [
        {
          id: 10,
          question: "Cual es el proposito principal de su viaje?",
          category: "Viaje",
          difficulty: "Facil",
          is_required: true,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
  }

  if (normalized.includes("INSERT INTO question_bank")) {
    return Promise.resolve({
      rows: [
        {
          id: 11,
          question: values[0],
          category: values[1],
          difficulty: values[2],
          is_required: values[3],
          created_at: "2026-07-02T00:00:00.000Z",
        },
      ],
    });
  }

  if (normalized.includes("UPDATE question_bank")) {
    return Promise.resolve({
      rows: [
        {
          id: values[4],
          question: values[0],
          category: values[1],
          difficulty: values[2],
          is_required: values[3],
          created_at: "2026-07-02T00:00:00.000Z",
        },
      ],
    });
  }

  if (normalized.includes("DELETE FROM question_bank")) {
    return Promise.resolve({ rows: [{ id: values[0] }] });
  }

  if (normalized.includes("SELECT id, storage_key FROM documentos")) {
    return Promise.resolve({ rows: [] });
  }

  if (
    normalized.includes("SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key") &&
    normalized.includes("FROM documentos") &&
    normalized.includes("WHERE usuario_id = $1")
  ) {
    if (values?.[0] === 3) {
      return Promise.resolve({
        rows: [
          {
            id: 41,
            nombre: "Pasaporte",
            tipo: "application/pdf",
            archivo_url: "http://localhost/local-files/mock-document.pdf",
            usuario_id: 3,
            documento_key: "passport",
            estado: "review",
            feedback: null,
            creado_en: "2026-07-07T00:00:00.000Z",
            actualizado_en: "2026-07-07T00:00:00.000Z",
          },
        ],
      });
    }
    return Promise.resolve({ rows: [] });
  }

  if (normalized.includes("INSERT INTO documentos")) {
    return Promise.resolve({
      rows: [{
        id: 41,
        nombre: values[0],
        tipo: values[1],
        archivo_url: values[2],
        usuario_id: values[3],
        documento_key: values[4],
        estado: "review",
      }],
    });
  }

  if (normalized.includes("DELETE FROM documentos")) {
    return Promise.resolve({ rows: [{ id: values[0], storage_key: "local/mock-document.pdf" }] });
  }

  if (normalized.includes("UPDATE usuario") && normalized.includes("RETURNING id_usuario, nombre")) {
    return Promise.resolve({
      rows: [{
        id_usuario: 3,
        nombre: values[0],
        correo: values[values.length - 1],
        perfil: "turismo_negocios",
        telefono: values[1],
        ciudad: values[2],
        pais: values[3],
        notificaciones_email: true,
        idioma: "es",
      }],
    });
  }

  if (
    normalized.includes("FROM notificaciones") &&
    normalized.includes("WHERE id_usuario = $1") &&
    normalized.includes("ORDER BY created_at DESC")
  ) {
    return Promise.resolve({
      rows: [
        {
          id: 20,
          id_usuario: values[0],
          titulo: "DS-160 completado",
          mensaje: "El formulario fue guardado.",
          tipo: "etapa",
          leido: false,
          etapa_relacionada: "Pago de visa",
          created_at: "2026-07-03T00:00:00.000Z",
          updated_at: "2026-07-03T00:00:00.000Z",
        },
      ],
    });
  }

  if (normalized.includes("UPDATE notificaciones") && normalized.includes("WHERE id = $1 AND id_usuario = $2")) {
    return Promise.resolve({
      rows: [
        {
          id: values[0],
          id_usuario: values[1],
          titulo: "DS-160 completado",
          mensaje: "El formulario fue guardado.",
          tipo: "etapa",
          leido: true,
          etapa_relacionada: "Pago de visa",
          created_at: "2026-07-03T00:00:00.000Z",
          updated_at: "2026-07-04T00:00:00.000Z",
        },
      ],
    });
  }

  if (normalized.includes("DELETE FROM notificaciones")) {
    return Promise.resolve({ rows: [{ id: values[0] }] });
  }

  if (normalized.includes("INSERT INTO interview_sessions")) {
    return Promise.resolve({
      rows: [
        {
          id: 30,
          user_id: values[0],
          user_name: values[1],
          user_email: values[2],
          status: "pending",
          responses: JSON.parse(values[3]),
          feedback: null,
          rating: null,
          created_at: "2026-07-05T00:00:00.000Z",
          reviewed_at: null,
        },
      ],
    });
  }

  if (normalized.includes("UPDATE interview_sessions")) {
    return Promise.resolve({
      rows: [
        {
          id: values[2],
          user_id: 4,
          user_name: "Usuario Entrevista",
          user_email: "entrevista@example.com",
          status: "reviewed",
          responses: [],
          feedback: values[0],
          rating: values[1],
          created_at: "2026-07-05T00:00:00.000Z",
          reviewed_at: "2026-07-06T00:00:00.000Z",
        },
      ],
    });
  }

  return Promise.resolve({ rows: [] });
}

function createIntegrationFlowQueryHandler() {
  const state = {
    user: null,
    ds160: null,
    documentos: [],
    nextUserId: 90,
    nextFormularioId: 190,
    nextDocumentoId: 290,
  };

  function buildDocumentoRow(documento) {
    return {
      id: documento.id,
      nombre: documento.nombre,
      tipo: documento.tipo,
      archivo_url: documento.archivo_url,
      usuario_id: documento.usuario_id,
      documento_key: documento.documento_key,
      estado: documento.estado,
      feedback: documento.feedback,
      creado_en: documento.creado_en,
      actualizado_en: documento.actualizado_en,
    };
  }

  async function queryHandler(sql, values) {
    const normalized = String(sql).replace(/\s+/g, " ").trim();

    if (normalized.includes("INSERT INTO usuario")) {
      state.user = {
        id_usuario: state.nextUserId,
        nombre: values[0],
        correo: values[1],
        contrasena: values[2],
        perfil: null,
        rol: values[3] || "cliente",
      };
      state.nextUserId += 1;
      return { rows: [state.user] };
    }

    if (normalized.includes("FROM usuario WHERE correo=$1 AND contrasena=$2")) {
      if (
        state.user &&
        values?.[0] === state.user.correo &&
        values?.[1] === state.user.contrasena
      ) {
        return { rows: [state.user] };
      }
      return { rows: [] };
    }

    if (normalized.includes("SELECT id_usuario FROM usuario WHERE correo = $1")) {
      if (state.user && values?.[0] === state.user.correo) {
        return { rows: [{ id_usuario: state.user.id_usuario }] };
      }
      return { rows: [] };
    }

    if (normalized.includes("SELECT id_formulario FROM formulario_ds160 WHERE id_usuario = $1")) {
      if (state.ds160 && values?.[0] === state.ds160.id_usuario) {
        return { rows: [{ id_formulario: state.ds160.id_formulario }] };
      }
      return { rows: [] };
    }

    if (normalized.includes("INSERT INTO formulario_ds160")) {
      state.ds160 = {
        id_formulario: state.nextFormularioId,
        id_usuario: values[0],
        datos: JSON.parse(values[1]),
        seccion_actual: values[2],
        completado: values[3],
      };
      state.nextFormularioId += 1;
      return { rows: [state.ds160] };
    }

    if (normalized.includes("UPDATE formulario_ds160")) {
      state.ds160 = {
        id_formulario: state.ds160?.id_formulario || state.nextFormularioId,
        id_usuario: values[3],
        datos: JSON.parse(values[0]),
        seccion_actual: values[1],
        completado: values[2],
      };
      return { rows: [state.ds160] };
    }

    if (normalized.includes("SELECT * FROM formulario_ds160 WHERE id_usuario = $1")) {
      if (state.ds160 && values?.[0] === state.ds160.id_usuario) {
        return { rows: [state.ds160] };
      }
      return { rows: [] };
    }

    if (normalized.includes("SELECT id, storage_key FROM documentos")) {
      const existing = state.documentos.find(
        (documento) =>
          documento.usuario_id === values?.[0] &&
          documento.documento_key === values?.[1]
      );
      if (!existing) return { rows: [] };
      return { rows: [{ id: existing.id, storage_key: existing.storage_key }] };
    }

    if (normalized.includes("INSERT INTO documentos")) {
      const documento = {
        id: state.nextDocumentoId,
        nombre: values[0],
        tipo: values[1],
        archivo_url: values[2],
        usuario_id: values[3],
        documento_key: values[4],
        estado: "review",
        feedback: null,
        storage_key: values[5],
        creado_en: "2026-07-08T00:00:00.000Z",
        actualizado_en: "2026-07-08T00:00:00.000Z",
      };
      state.nextDocumentoId += 1;
      state.documentos.push(documento);
      return { rows: [buildDocumentoRow(documento)] };
    }

    if (
      normalized.includes("SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key") &&
      normalized.includes("FROM documentos") &&
      normalized.includes("WHERE usuario_id = $1")
    ) {
      return {
        rows: state.documentos
          .filter((documento) => documento.usuario_id === values?.[0])
          .map(buildDocumentoRow),
      };
    }

    return defaultQueryHandler(sql, values);
  }

  return { state, queryHandler };
}

let app;

beforeAll(() => {
  mockQuery.mockImplementation(defaultQueryHandler);
  app = require("../app");
});

beforeEach(() => {
  mockQuery.mockClear();
  mockQuery.mockImplementation(defaultQueryHandler);
  mockUploadStoredFile.mockReset();
  mockUploadStoredFile.mockResolvedValue(storedFileResult);
  mockDeleteStoredFile.mockReset();
  mockDeleteStoredFile.mockResolvedValue();
});

describe("app endpoints", () => {
  test("GET /validar-sesion devuelve valid true cuando existe el correo", async () => {
    const response = await request(app)
      .get("/validar-sesion")
      .query({ correo: "valido@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ valid: true });
  });

  test("GET /validar-sesion devuelve valid false cuando no existe el correo", async () => {
    const response = await request(app)
      .get("/validar-sesion")
      .query({ correo: "invalido@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ valid: false });
  });

  test("GET /validar-sesion devuelve 400 cuando falta el correo", async () => {
    const response = await request(app).get("/validar-sesion");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      valid: false,
      error: "Correo requerido",
    });
  });

  test("GET /validar-sesion devuelve 500 ante error simulado de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("SELECT id_usuario FROM usuario WHERE correo = $1")) {
        return Promise.reject(new Error("database unavailable"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .get("/validar-sesion")
      .query({ correo: "valido@example.com" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      valid: false,
      error: "database unavailable",
    });
  });

  test("POST /register guarda un usuario con datos validos", async () => {
    const response = await request(app).post("/register").send({
      nombre: "Nuevo Usuario",
      correo: "nuevo@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuario guardado en BD");
    expect(response.body.data).toMatchObject({
      nombre: "Nuevo Usuario",
      correo: "nuevo@example.com",
    });
  });

  test("POST /register devuelve 500 cuando el correo ya existe", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO usuario")) {
        return Promise.reject(
          new Error('duplicate key value violates unique constraint "usuario_correo_key"')
        );
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).post("/register").send({
      nombre: "Usuario Repetido",
      correo: "repetido@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'duplicate key value violates unique constraint "usuario_correo_key"',
    });
  });

  test("POST /register devuelve 500 cuando faltan campos obligatorios", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO usuario") && !values?.[1]) {
        return Promise.reject(
          new Error('null value in column "correo" violates not-null constraint')
        );
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).post("/register").send({
      nombre: "Usuario Sin Correo",
      contrasena: "1234",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'null value in column "correo" violates not-null constraint',
    });
  });

  test("POST /register acepta datos con formato invalido porque el backend no los valida", async () => {
    const response = await request(app).post("/register").send({
      nombre: "Usuario Invalido",
      correo: "correo-sin-formato",
      contrasena: "",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuario guardado en BD");
    expect(response.body.data).toMatchObject({
      nombre: "Usuario Invalido",
      correo: "correo-sin-formato",
      contrasena: "",
    });
  });

  test("POST /register devuelve 500 ante error simulado de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO usuario")) {
        return Promise.reject(new Error("duplicate key value"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).post("/register").send({
      nombre: "Usuario Repetido",
      correo: "nuevo@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("duplicate key value");
  });

  test("POST /login devuelve usuario cuando las credenciales son validas", async () => {
    const response = await request(app).post("/login").send({
      correo: "login@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login exitoso");
    expect(response.body.user.correo).toBe("login@example.com");
    expect(response.body.usuario).toMatchObject({
      id: 3,
      id_usuario: 3,
      correo: "login@example.com",
      rol: "cliente",
    });
  });

  test("POST /login devuelve 401 con credenciales incorrectas", async () => {
    const response = await request(app).post("/login").send({
      correo: "login@example.com",
      contrasena: "incorrecta",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Credenciales incorrectas" });
  });

  test("POST /login devuelve 401 cuando faltan campos", async () => {
    const response = await request(app).post("/login").send({
      correo: "login@example.com",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Credenciales incorrectas" });
  });

  test("POST /login devuelve 401 cuando el usuario no existe", async () => {
    const response = await request(app).post("/login").send({
      correo: "noexiste@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Credenciales incorrectas" });
  });

  test("POST /login devuelve 500 ante error simulado de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).replace(/\s+/g, " ").includes("FROM usuario WHERE correo=$1 AND contrasena=$2")) {
        return Promise.reject(new Error("connection timeout"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).post("/login").send({
      correo: "login@example.com",
      contrasena: "1234",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "connection timeout" });
  });

  test("GET /ds160 carga un formulario existente", async () => {
    const response = await request(app)
      .get("/ds160")
      .query({ correo: "ds160-con-form@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      datos: {
        personal: {
          nombreCompleto: "Usuario DS160",
          pasaporte: "A1234567",
        },
      },
      seccion_actual: 3,
      completado: false,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM formulario_ds160 WHERE id_usuario = $1"),
      [10]
    );
  });

  test("GET /ds160 devuelve formulario vacio cuando el usuario no tiene progreso guardado", async () => {
    const response = await request(app)
      .get("/ds160")
      .query({ correo: "ds160-sin-form@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      datos: {},
      seccion_actual: 1,
      completado: false,
    });
  });

  test("GET /ds160 devuelve 404 cuando el usuario no existe", async () => {
    const response = await request(app)
      .get("/ds160")
      .query({ correo: "noexiste@example.com" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Usuario no encontrado" });
  });

  test("GET /ds160 devuelve 400 cuando falta el correo", async () => {
    const response = await request(app).get("/ds160");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Correo requerido" });
  });

  test("GET /ds160 devuelve 500 ante error simulado de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("SELECT * FROM formulario_ds160 WHERE id_usuario = $1")) {
        return Promise.reject(new Error("ds160 read failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .get("/ds160")
      .query({ correo: "ds160-con-form@example.com" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "ds160 read failed" });
  });

  test("GET /ds160/pdf genera el PDF del formulario existente", async () => {
    const response = await request(app)
      .get("/ds160/pdf")
      .query({ correo: "ds160-pdf@example.com" })
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/pdf/);
    expect(response.headers["content-disposition"]).toBe('attachment; filename="ds160-17.pdf"');
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("GET /ds160/pdf devuelve 400 cuando falta el correo", async () => {
    const response = await request(app).get("/ds160/pdf");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Correo requerido" });
  });

  test("GET /ds160/pdf devuelve 404 cuando el usuario no existe", async () => {
    const response = await request(app)
      .get("/ds160/pdf")
      .query({ correo: "noexiste@example.com" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Usuario no encontrado" });
  });

  test("GET /ds160/pdf devuelve 404 cuando no existe formulario guardado", async () => {
    const response = await request(app)
      .get("/ds160/pdf")
      .query({ correo: "ds160-pdf-sin-form@example.com" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Formulario DS-160 no encontrado" });
  });

  test("GET /ds160/pdf devuelve 500 ante error interno de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("SELECT * FROM formulario_ds160 WHERE id_usuario = $1")) {
        return Promise.reject(new Error("ds160 pdf failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .get("/ds160/pdf")
      .query({ correo: "ds160-pdf@example.com" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "ds160 pdf failed" });
  });

  test("POST /ds160 crea el formulario inicial y guarda el progreso", async () => {
    const datos = {
      personal: {
        nombreCompleto: "Usuario Nuevo",
        paisNacimiento: "Guatemala",
      },
    };

    const response = await request(app).post("/ds160").send({
      correo: "ds160-nuevo@example.com",
      datos,
      seccion_actual: 2,
      completado: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Formulario guardado correctamente");
    expect(response.body.formulario).toMatchObject({
      id_usuario: 12,
      datos,
      seccion_actual: 2,
      completado: false,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO formulario_ds160"),
      [12, JSON.stringify(datos), 2, false]
    );
  });

  test("POST /ds160 actualiza un formulario existente y la seccion actual", async () => {
    const datos = {
      viaje: {
        proposito: "Turismo",
        ciudadDestino: "Miami",
      },
    };

    const response = await request(app).post("/ds160").send({
      correo: "ds160-existente@example.com",
      datos,
      seccion_actual: 4,
      completado: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Formulario guardado correctamente");
    expect(response.body.formulario).toMatchObject({
      id_usuario: 13,
      datos,
      seccion_actual: 4,
      completado: false,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE formulario_ds160"),
      [JSON.stringify(datos), 4, false, 13]
    );
  });

  test("POST /ds160 marca el formulario como completado y avanza el tramite", async () => {
    const datos = {
      confirmacion: {
        numeroConfirmacion: "AA00BB11",
      },
    };

    const response = await request(app).post("/ds160").send({
      correo: "ds160-completado@example.com",
      datos,
      seccion_actual: 6,
      completado: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.formulario).toMatchObject({
      id_usuario: 14,
      datos,
      seccion_actual: 6,
      completado: true,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id_tramite, progreso FROM tramite WHERE id_usuario = $1"),
      [14]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE tramite"),
      [14]
    );
  });

  test("POST /ds160 devuelve 400 cuando falta el correo", async () => {
    const response = await request(app).post("/ds160").send({
      datos: { personal: { nombreCompleto: "Sin Correo" } },
      seccion_actual: 1,
      completado: false,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Correo requerido" });
  });

  test("POST /ds160 devuelve 404 cuando el usuario no existe", async () => {
    const response = await request(app).post("/ds160").send({
      correo: "noexiste@example.com",
      datos: { personal: { nombreCompleto: "No Existe" } },
      seccion_actual: 1,
      completado: false,
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Usuario no encontrado" });
  });

  test("POST /ds160 guarda datos vacios cuando no se envia el objeto datos", async () => {
    const response = await request(app).post("/ds160").send({
      correo: "ds160-datos-vacios@example.com",
      seccion_actual: 1,
      completado: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Formulario guardado correctamente");
    expect(response.body.formulario).toMatchObject({
      id_usuario: 15,
      datos: {},
      seccion_actual: 1,
      completado: false,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO formulario_ds160"),
      [15, JSON.stringify({}), 1, false]
    );
  });

  test("POST /ds160 acepta valores invalidos porque el backend no valida tipos ni estructura", async () => {
    const response = await request(app).post("/ds160").send({
      correo: "ds160-invalido@example.com",
      datos: "contenido-no-estructurado",
      seccion_actual: "segunda",
      completado: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Formulario guardado correctamente");
    expect(response.body.formulario).toMatchObject({
      id_usuario: 16,
      datos: "contenido-no-estructurado",
      seccion_actual: "segunda",
      completado: false,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE formulario_ds160"),
      [JSON.stringify("contenido-no-estructurado"), "segunda", false, 16]
    );
  });

  test("POST /ds160 devuelve 500 ante error simulado de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO formulario_ds160")) {
        return Promise.reject(new Error("ds160 write failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).post("/ds160").send({
      correo: "ds160-nuevo@example.com",
      datos: { personal: { nombreCompleto: "Error DB" } },
      seccion_actual: 1,
      completado: false,
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "ds160 write failed" });
  });

  test("GET /questions lista preguntas desde el servicio", async () => {
    const response = await request(app).get("/questions");

    expect(response.status).toBe(200);
    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].category).toBe("Viaje");
  });

  test("POST /questions crea una pregunta valida", async () => {
    const response = await request(app).post("/questions").send({
      question: "Quien financiara su viaje?",
      category: "Finanzas",
      difficulty: "Media",
      is_required: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Pregunta creada correctamente");
    expect(response.body.question).toMatchObject({
      question: "Quien financiara su viaje?",
      category: "Finanzas",
      difficulty: "Media",
      is_required: true,
    });
  });

  test("PUT /questions/:id actualiza una pregunta existente", async () => {
    const response = await request(app).put("/questions/11").send({
      question: "Cuanto tiempo permanecera en el pais?",
      category: "Viaje",
      difficulty: "Media",
      is_required: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Pregunta actualizada correctamente");
    expect(response.body.question.id).toBe(11);
  });

  test("DELETE /questions/:id elimina una pregunta existente", async () => {
    const response = await request(app).delete("/questions/11");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Pregunta eliminada correctamente",
    });
  });

  test("GET /notificaciones/:userId lista notificaciones del usuario", async () => {
    const response = await request(app).get("/notificaciones/1");

    expect(response.status).toBe(200);
    expect(response.body.notificaciones[0]).toMatchObject({
      id_usuario: 1,
      leido: false,
    });
  });

  test("PUT /notificaciones/:id/leer marca una notificacion como leida", async () => {
    const response = await request(app)
      .put("/notificaciones/20/leer")
      .send({ userId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Notificación marcada como leída");
    expect(response.body.notificacion.leido).toBe(true);
  });

  test("DELETE /notificaciones/:id elimina una notificacion del usuario", async () => {
    const response = await request(app)
      .delete("/notificaciones/20")
      .send({ userId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Notificación eliminada correctamente");
  });

  test("POST /interview-sessions crea una sesion sin usar R2 real cuando no hay archivos", async () => {
    const response = await request(app)
      .post("/interview-sessions")
      .field(
        "session",
        JSON.stringify({
          user: {
            id: 4,
            nombre: "Usuario Entrevista",
            correo: "entrevista@example.com",
          },
          questions: [
            {
              id: "purpose",
              text: "Cual es el motivo principal de su viaje?",
              recorded: true,
              duration: 35,
            },
          ],
        })
      );

    expect(response.status).toBe(201);
    expect(response.body.message).toBe(
      "Sesión de entrevista guardada correctamente"
    );
    expect(response.body.session.status).toBe("pending");
  });

  test("PUT /interview-sessions/:id/feedback guarda retroalimentacion valida", async () => {
    const response = await request(app)
      .put("/interview-sessions/30/feedback")
      .send({ feedback: "Respuesta clara y concreta.", rating: 5 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Retroalimentación guardada correctamente");
    expect(response.body.session).toMatchObject({
      id: 30,
      status: "reviewed",
      feedback: "Respuesta clara y concreta.",
      rating: 5,
    });
  });

  test("POST /upload guarda un documento mediante el proveedor configurado", async () => {
    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("tipo", "application/pdf")
      .field("usuario_id", "3")
      .field("documento_key", "passport")
      .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

    expect(response.status).toBe(200);
    expect(response.body.documento).toMatchObject({ id: 41, documento_key: "passport" });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
  });

  test("POST /upload devuelve 400 cuando falta el archivo", async () => {
    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("usuario_id", "3");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Archivo requerido" });
    expect(mockUploadStoredFile).not.toHaveBeenCalled();
  });

  test("POST /upload acepta metadatos faltantes porque el backend usa valores por defecto", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("pdf de prueba"), "documento.pdf");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Archivo subido correctamente");
    expect(response.body.documento).toMatchObject({
      nombre: "documento.pdf",
      usuario_id: null,
      documento_key: null,
    });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
  });

  test("POST /upload devuelve 400 cuando usuario_id no es numerico", async () => {
    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("usuario_id", "abc")
      .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "usuario_id debe ser numérico" });
    expect(mockUploadStoredFile).not.toHaveBeenCalled();
  });

  test("POST /upload devuelve 500 cuando uploadStoredFile falla", async () => {
    mockUploadStoredFile.mockRejectedValueOnce(new Error("storage offline"));

    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("usuario_id", "3")
      .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo almacenar el archivo" });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteStoredFile).not.toHaveBeenCalled();
  });

  test("POST /upload limpia el archivo si falla la persistencia en base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO documentos")) {
        return Promise.reject(new Error("document insert failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("usuario_id", "3")
      .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo guardar el documento" });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("POST /upload devuelve 500 si usuario_id no existe y la base de datos rechaza la referencia", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO documentos") && values?.[3] === 999) {
        return Promise.reject(
          new Error('insert or update on table "documentos" violates foreign key constraint')
        );
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .post("/upload")
      .field("nombre", "Pasaporte")
      .field("usuario_id", "999")
      .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo guardar el documento" });
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("POST /documentos crea un documento con archivo valido", async () => {
    const response = await request(app)
      .post("/documentos")
      .field("nombre", "Visa anterior")
      .field("tipo", "application/pdf")
      .field("usuario_id", "3")
      .field("documento_key", "previous_visa")
      .attach("file", Buffer.from("pdf de prueba"), "visa-anterior.pdf");

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Documento guardado correctamente");
    expect(response.body.documento).toMatchObject({
      id: 41,
      nombre: "Visa anterior",
      usuario_id: 3,
      documento_key: "previous_visa",
      estado: "review",
    });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
  });

  test("POST /documentos devuelve 400 cuando falta el archivo", async () => {
    const response = await request(app)
      .post("/documentos")
      .field("nombre", "Visa anterior")
      .field("usuario_id", "3");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Archivo requerido" });
    expect(mockUploadStoredFile).not.toHaveBeenCalled();
  });

  test("POST /documentos devuelve 400 cuando falta el nombre", async () => {
    const response = await request(app)
      .post("/documentos")
      .field("usuario_id", "3")
      .attach("file", Buffer.from("pdf de prueba"), "visa-anterior.pdf");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Nombre requerido" });
    expect(mockUploadStoredFile).not.toHaveBeenCalled();
  });

  test("POST /documentos devuelve 400 cuando usuario_id no es numerico", async () => {
    const response = await request(app)
      .post("/documentos")
      .field("nombre", "Visa anterior")
      .field("usuario_id", "abc")
      .attach("file", Buffer.from("pdf de prueba"), "visa-anterior.pdf");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "usuario_id debe ser numérico" });
    expect(mockUploadStoredFile).not.toHaveBeenCalled();
  });

  test("POST /documentos devuelve 500 si usuario_id no existe y la base de datos rechaza la referencia", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO documentos") && values?.[3] === 999) {
        return Promise.reject(
          new Error('insert or update on table "documentos" violates foreign key constraint')
        );
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .post("/documentos")
      .field("nombre", "Visa anterior")
      .field("usuario_id", "999")
      .attach("file", Buffer.from("pdf de prueba"), "visa-anterior.pdf");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo guardar el documento" });
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("POST /documentos devuelve 500 ante error interno de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("INSERT INTO documentos")) {
        return Promise.reject(new Error("document insert failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .post("/documentos")
      .field("nombre", "Visa anterior")
      .field("usuario_id", "3")
      .attach("file", Buffer.from("pdf de prueba"), "visa-anterior.pdf");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo guardar el documento" });
    expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("GET /documentos/:usuarioId lista documentos del usuario", async () => {
    const response = await request(app).get("/documentos/3");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 41,
      nombre: "Pasaporte",
      usuario_id: 3,
      documento_key: "passport",
    });
  });

  test("GET /documentos/:usuarioId devuelve lista vacia cuando el usuario no tiene documentos", async () => {
    const response = await request(app).get("/documentos/4");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("GET /documentos/:usuarioId devuelve lista vacia para usuario inexistente porque no valida usuario", async () => {
    const response = await request(app).get("/documentos/999");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("GET /documentos/:usuarioId devuelve 400 cuando el id no es numerico", async () => {
    const response = await request(app).get("/documentos/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "usuario_id debe ser numérico" });
  });

  test("GET /documentos/:usuarioId devuelve 500 ante error interno de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (
        String(sql).includes("SELECT id, nombre, tipo, archivo_url, usuario_id, documento_key") &&
        String(sql).includes("FROM documentos")
      ) {
        return Promise.reject(new Error("document list failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app).get("/documentos/3");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudieron cargar los documentos" });
  });

  test("DELETE /documentos/:id elimina el registro y el archivo almacenado", async () => {
    const response = await request(app)
      .delete("/documentos/41")
      .query({ usuario_id: 3 });

    expect(response.status).toBe(200);
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("DELETE /documentos/:id devuelve 404 cuando el documento no existe", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("DELETE FROM documentos")) {
        return Promise.resolve({ rows: [] });
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .delete("/documentos/404")
      .query({ usuario_id: 3 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Documento no encontrado" });
    expect(mockDeleteStoredFile).not.toHaveBeenCalled();
  });

  test("DELETE /documentos/:id devuelve 400 cuando el id no es numerico", async () => {
    const response = await request(app)
      .delete("/documentos/abc")
      .query({ usuario_id: 3 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "documento_id debe ser numérico" });
    expect(mockDeleteStoredFile).not.toHaveBeenCalled();
  });

  test("DELETE /documentos/:id devuelve 400 cuando usuario_id no es numerico", async () => {
    const response = await request(app)
      .delete("/documentos/41")
      .query({ usuario_id: "abc" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "usuario_id debe ser numérico" });
    expect(mockDeleteStoredFile).not.toHaveBeenCalled();
  });

  test("DELETE /documentos/:id devuelve 500 ante error interno de base de datos", async () => {
    mockQuery.mockImplementation((sql, values) => {
      if (String(sql).includes("DELETE FROM documentos")) {
        return Promise.reject(new Error("document delete failed"));
      }
      return defaultQueryHandler(sql, values);
    });

    const response = await request(app)
      .delete("/documentos/41")
      .query({ usuario_id: 3 });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo eliminar el documento" });
  });

  test("DELETE /documentos/:id mantiene respuesta exitosa si falla deleteStoredFile", async () => {
    mockDeleteStoredFile.mockRejectedValueOnce(new Error("delete storage failed"));

    const response = await request(app)
      .delete("/documentos/41")
      .query({ usuario_id: 3 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Documento eliminado correctamente" });
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("local/mock-document.pdf");
  });

  test("PUT /usuario-perfil persiste la edición del perfil", async () => {
    const response = await request(app).put("/usuario-perfil").send({
      correo: "login@example.com",
      nombre: "Nombre Actualizado",
      telefono: "55550000",
      ciudad: "Guatemala",
      pais: "Guatemala",
    });

    expect(response.status).toBe(200);
    expect(response.body.usuario).toMatchObject({
      nombre: "Nombre Actualizado",
      telefono: "55550000",
      ciudad: "Guatemala",
      pais: "Guatemala",
    });
  });

  describe("flujo de integracion registro, login, DS-160 y documentos", () => {
    it("mantiene consistente el usuario entre autenticacion, formulario y documentos", async () => {
      const { state, queryHandler } = createIntegrationFlowQueryHandler();
      mockQuery.mockImplementation(queryHandler);

      const usuario = {
        nombre: "Usuario Integracion",
        correo: "integracion@example.com",
        contrasena: "clave-segura",
      };
      const datosDs160 = {
        personal: {
          nombreCompleto: usuario.nombre,
          correo: usuario.correo,
        },
        viaje: {
          proposito: "Turismo",
          ciudadDestino: "Miami",
        },
      };

      const registerResponse = await request(app).post("/register").send(usuario);

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body.message).toBe("Usuario guardado en BD");
      expect(registerResponse.body.data).toMatchObject({
        id_usuario: 90,
        nombre: usuario.nombre,
        correo: usuario.correo,
      });

      const userId = registerResponse.body.data.id_usuario;

      const loginResponse = await request(app).post("/login").send({
        correo: usuario.correo,
        contrasena: usuario.contrasena,
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.message).toBe("Login exitoso");
      expect(loginResponse.body.usuario).toMatchObject({
        id_usuario: userId,
        correo: usuario.correo,
        rol: "cliente",
      });

      const saveDs160Response = await request(app).post("/ds160").send({
        correo: usuario.correo,
        datos: datosDs160,
        seccion_actual: 3,
        completado: false,
      });

      expect(saveDs160Response.status).toBe(200);
      expect(saveDs160Response.body.message).toBe("Formulario guardado correctamente");
      expect(saveDs160Response.body.formulario).toMatchObject({
        id_usuario: userId,
        datos: datosDs160,
        seccion_actual: 3,
        completado: false,
      });

      const getDs160Response = await request(app)
        .get("/ds160")
        .query({ correo: usuario.correo });

      expect(getDs160Response.status).toBe(200);
      expect(getDs160Response.body).toEqual({
        datos: datosDs160,
        seccion_actual: 3,
        completado: false,
      });

      const uploadResponse = await request(app)
        .post("/upload")
        .field("nombre", "Pasaporte")
        .field("tipo", "application/pdf")
        .field("usuario_id", String(userId))
        .field("documento_key", "passport")
        .attach("file", Buffer.from("pdf de prueba"), "pasaporte.pdf");

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.message).toBe("Archivo subido correctamente");
      expect(uploadResponse.body.documento).toMatchObject({
        usuario_id: userId,
        documento_key: "passport",
        nombre: "Pasaporte",
        estado: "review",
      });
      expect(mockUploadStoredFile).toHaveBeenCalledTimes(1);

      const documentosResponse = await request(app).get(`/documentos/${userId}`);

      expect(documentosResponse.status).toBe(200);
      expect(documentosResponse.body).toHaveLength(1);
      expect(documentosResponse.body[0]).toMatchObject({
        id: uploadResponse.body.documento.id,
        usuario_id: userId,
        documento_key: "passport",
        archivo_url: "http://localhost/local-files/mock-document.pdf",
      });

      expect(state.user.id_usuario).toBe(userId);
      expect(state.ds160.id_usuario).toBe(userId);
      expect(state.documentos[0].usuario_id).toBe(userId);
    });
  });
});
