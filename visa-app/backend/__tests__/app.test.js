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

function defaultQueryHandler(sql, values) {
  const normalized = String(sql).replace(/\s+/g, " ").trim();

  if (normalized.includes("SELECT COUNT(*)::int AS total FROM question_bank")) {
    return Promise.resolve({ rows: [{ total: 1 }] });
  }

  if (normalized.includes("SELECT id_usuario FROM usuario WHERE correo = $1")) {
    if (values?.[0] === "valido@example.com") {
      return Promise.resolve({ rows: [{ id_usuario: 1 }] });
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
        },
      ],
    });
  }

  if (normalized.includes("SELECT * FROM usuario WHERE correo=$1 AND contrasena=$2")) {
    if (values?.[0] === "login@example.com" && values?.[1] === "1234") {
      return Promise.resolve({
        rows: [
          {
            id_usuario: 3,
            nombre: "Usuario Login",
            correo: "login@example.com",
            perfil: "turismo_negocios",
          },
        ],
      });
    }
    return Promise.resolve({ rows: [] });
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

let app;

beforeAll(() => {
  mockQuery.mockImplementation(defaultQueryHandler);
  app = require("../app");
});

beforeEach(() => {
  mockQuery.mockClear();
  mockQuery.mockImplementation(defaultQueryHandler);
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
    expect(response.body.message).toBe("Login exitoso");
    expect(response.body.user.correo).toBe("login@example.com");
  });

  test("POST /login devuelve 401 con credenciales incorrectas", async () => {
    const response = await request(app).post("/login").send({
      correo: "login@example.com",
      contrasena: "incorrecta",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Credenciales incorrectas" });
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
});
