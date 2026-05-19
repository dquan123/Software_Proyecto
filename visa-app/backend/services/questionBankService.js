const CATEGORIES = [
  "General",
  "Viaje",
  "Finanzas",
  "Laboral",
  "Historial",
  "Migración",
  "Relaciones",
  "Personal",
];

const DIFFICULTIES = ["Fácil", "Media", "Alta"];

const SEED_QUESTIONS = [
  {
    question: "¿Cuál es el propósito principal de su viaje?",
    category: "Viaje",
    difficulty: "Fácil",
    is_required: true,
  },
  {
    question: "¿Cuánto tiempo planea permanecer en el país?",
    category: "Viaje",
    difficulty: "Fácil",
    is_required: true,
  },
  {
    question: "¿Quién financiará su viaje y estadía?",
    category: "Finanzas",
    difficulty: "Media",
    is_required: true,
  },
  {
    question: "¿Tiene familiares o conocidos viviendo en el país destino?",
    category: "Relaciones",
    difficulty: "Media",
    is_required: false,
  },
  {
    question: "¿Cuál es su ocupación actual?",
    category: "Laboral",
    difficulty: "Fácil",
    is_required: true,
  },
  {
    question: "¿Desde cuándo trabaja en su empleo actual?",
    category: "Laboral",
    difficulty: "Media",
    is_required: false,
  },
  {
    question: "¿Ha viajado anteriormente a este país?",
    category: "Historial",
    difficulty: "Media",
    is_required: false,
  },
  {
    question: "¿Ha visitado otros países en los últimos cinco años?",
    category: "Historial",
    difficulty: "Media",
    is_required: false,
  },
  {
    question: "¿Cuenta con reservación de hospedaje o dirección de estadía?",
    category: "Viaje",
    difficulty: "Media",
    is_required: true,
  },
  {
    question: "¿Cuál es su salario o ingreso mensual aproximado?",
    category: "Finanzas",
    difficulty: "Alta",
    is_required: false,
  },
  {
    question: "¿Tiene propiedades, negocios o activos en su país de origen?",
    category: "Finanzas",
    difficulty: "Alta",
    is_required: false,
  },
  {
    question: "¿Cuál es su estado civil?",
    category: "Personal",
    difficulty: "Fácil",
    is_required: false,
  },
  {
    question: "¿Viajará solo o acompañado?",
    category: "Relaciones",
    difficulty: "Fácil",
    is_required: false,
  },
  {
    question: "¿Qué actividades realizará durante su estadía?",
    category: "Viaje",
    difficulty: "Media",
    is_required: true,
  },
  {
    question: "¿Tiene intención de trabajar o estudiar durante su visita?",
    category: "Migración",
    difficulty: "Alta",
    is_required: true,
  },
];

function createQuestionBankService(pool) {
  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        category VARCHAR(100),
        difficulty VARCHAR(20),
        is_required BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async function seedInitialQuestions() {
    await ensureSchema();

    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM question_bank");
    if (rows[0]?.total > 0) return;

    const values = [];
    const placeholders = SEED_QUESTIONS.map((item, index) => {
      const offset = index * 4;
      values.push(item.question, item.category, item.difficulty, item.is_required);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    });

    await pool.query(
      `INSERT INTO question_bank (question, category, difficulty, is_required)
       VALUES ${placeholders.join(", ")}`,
      values
    );
  }

  function normalizeQuestionPayload(payload = {}, { partial = false } = {}) {
    const normalized = {};

    if (!partial || payload.question !== undefined) {
      normalized.question = String(payload.question || "").trim();
      if (!normalized.question) {
        const error = new Error("La pregunta es obligatoria");
        error.statusCode = 400;
        throw error;
      }
    }

    if (!partial || payload.category !== undefined) {
      const category = String(payload.category || "General").trim();
      if (!CATEGORIES.includes(category)) {
        const error = new Error("Categoría inválida");
        error.statusCode = 400;
        throw error;
      }
      normalized.category = category;
    }

    if (!partial || payload.difficulty !== undefined) {
      const difficulty = String(payload.difficulty || "Media").trim();
      if (!DIFFICULTIES.includes(difficulty)) {
        const error = new Error("Dificultad inválida");
        error.statusCode = 400;
        throw error;
      }
      normalized.difficulty = difficulty;
    }

    if (!partial || payload.is_required !== undefined) {
      normalized.is_required =
        payload.is_required === true ||
        payload.is_required === "true" ||
        payload.is_required === 1 ||
        payload.is_required === "1";
    }

    return normalized;
  }

  async function listQuestions() {
    await ensureSchema();

    const result = await pool.query(
      `SELECT id, question, category, difficulty, is_required, created_at
       FROM question_bank
       ORDER BY created_at DESC, id DESC`
    );

    return result.rows;
  }

  async function createQuestion(payload) {
    await ensureSchema();

    const data = normalizeQuestionPayload(payload);
    const result = await pool.query(
      `INSERT INTO question_bank (question, category, difficulty, is_required)
       VALUES ($1, $2, $3, $4)
       RETURNING id, question, category, difficulty, is_required, created_at`,
      [data.question, data.category, data.difficulty, data.is_required]
    );

    return result.rows[0];
  }

  async function updateQuestion(id, payload) {
    await ensureSchema();

    const questionId = Number(id);
    if (Number.isNaN(questionId)) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const data = normalizeQuestionPayload(payload);
    const result = await pool.query(
      `UPDATE question_bank
       SET question = $1,
           category = $2,
           difficulty = $3,
           is_required = $4
       WHERE id = $5
       RETURNING id, question, category, difficulty, is_required, created_at`,
      [data.question, data.category, data.difficulty, data.is_required, questionId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Pregunta no encontrada");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  async function deleteQuestion(id) {
    await ensureSchema();

    const questionId = Number(id);
    if (Number.isNaN(questionId)) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `DELETE FROM question_bank
       WHERE id = $1
       RETURNING id`,
      [questionId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Pregunta no encontrada");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  return {
    ensureSchema,
    seedInitialQuestions,
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}

module.exports = {
  CATEGORIES,
  DIFFICULTIES,
  SEED_QUESTIONS,
  createQuestionBankService,
};
