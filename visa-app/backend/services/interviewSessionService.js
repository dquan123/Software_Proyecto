const { uploadBufferToR2, deleteObjectFromR2 } = require("../r2");

function createInterviewSessionService(pool) {
  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES usuario(id_usuario),
        user_name VARCHAR(200),
        user_email VARCHAR(200),
        status VARCHAR(30) DEFAULT 'pending',
        responses JSONB NOT NULL DEFAULT '[]',
        feedback TEXT,
        rating INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP
      )
    `);
  }

  function parseSessionPayload(rawPayload) {
    if (!rawPayload) {
      const error = new Error("Datos de sesión requeridos");
      error.statusCode = 400;
      throw error;
    }

    if (typeof rawPayload === "object") return rawPayload;

    try {
      return JSON.parse(rawPayload);
    } catch {
      const error = new Error("Formato de sesión inválido");
      error.statusCode = 400;
      throw error;
    }
  }

  function normalizeUser(user = {}) {
    const parsedId =
      user.id === undefined || user.id === null || user.id === ""
        ? null
        : Number(user.id);

    if (parsedId !== null && Number.isNaN(parsedId)) {
      const error = new Error("user.id debe ser numérico");
      error.statusCode = 400;
      throw error;
    }

    return {
      id: parsedId,
      name: String(user.nombre || user.name || "Usuario").trim(),
      email: String(user.correo || user.email || "").trim(),
    };
  }

  function normalizeQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      const error = new Error("La sesión debe incluir preguntas");
      error.statusCode = 400;
      throw error;
    }

    return questions.map((question, index) => ({
      id: String(question.id || `question-${index + 1}`),
      text: String(question.text || "").trim(),
      recorded: Boolean(question.recorded),
      duration: Number(question.duration) || 0,
    }));
  }

  async function createSession(rawPayload, files = []) {
    await ensureSchema();

    const payload = parseSessionPayload(rawPayload);
    const user = normalizeUser(payload.user);
    const questions = normalizeQuestions(payload.questions);
    const uploadedKeys = [];

    try {
      const responses = [];

      for (const question of questions) {
        const audioFile = files.find(
          (file) => file.fieldname === `audio_${question.id}`
        );
        let audio = null;

        if (audioFile) {
          const uploadedAudio = await uploadBufferToR2({
            ...audioFile,
            originalname: `interview-${user.id || "guest"}-${question.id}.webm`,
          });
          uploadedKeys.push(uploadedAudio.key);
          audio = {
            url: uploadedAudio.url,
            key: uploadedAudio.key,
            mimetype: audioFile.mimetype,
            size: audioFile.size,
          };
        }

        responses.push({
          ...question,
          recorded: Boolean(audioFile) || question.recorded,
          audio,
        });
      }

      const result = await pool.query(
        `INSERT INTO interview_sessions
          (user_id, user_name, user_email, status, responses)
         VALUES ($1, $2, $3, 'pending', $4)
         RETURNING id, user_id, user_name, user_email, status, responses,
                   feedback, rating, created_at, reviewed_at`,
        [user.id, user.name, user.email, JSON.stringify(responses)]
      );

      return result.rows[0];
    } catch (error) {
      await Promise.all(
        uploadedKeys.map((key) =>
          deleteObjectFromR2(key).catch((cleanupError) => {
            console.error("INTERVIEW AUDIO CLEANUP ERROR:", cleanupError);
          })
        )
      );

      throw error;
    }
  }

  async function listSessions({ status } = {}) {
    await ensureSchema();

    const values = [];
    const where = [];

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT id, user_id, user_name, user_email, status, responses,
              feedback, rating, created_at, reviewed_at
       FROM interview_sessions
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC, id DESC`,
      values
    );

    return result.rows;
  }

  async function listUserSessions(userId) {
    await ensureSchema();

    const parsedUserId = Number(userId);
    if (Number.isNaN(parsedUserId)) {
      const error = new Error("user_id debe ser numérico");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `SELECT id, user_id, user_name, user_email, status, responses,
              feedback, rating, created_at, reviewed_at
       FROM interview_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [parsedUserId]
    );

    return result.rows;
  }

  async function getSession(id) {
    await ensureSchema();

    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `SELECT id, user_id, user_name, user_email, status, responses,
              feedback, rating, created_at, reviewed_at
       FROM interview_sessions
       WHERE id = $1`,
      [parsedId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Sesión no encontrada");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  async function updateFeedback(id, payload = {}) {
    await ensureSchema();

    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const feedback = String(payload.feedback || "").trim();
    if (!feedback) {
      const error = new Error("La retroalimentación es obligatoria");
      error.statusCode = 400;
      throw error;
    }

    const rating =
      payload.rating === undefined || payload.rating === null || payload.rating === ""
        ? null
        : Number(payload.rating);

    if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
      const error = new Error("La calificación debe estar entre 1 y 5");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `UPDATE interview_sessions
       SET feedback = $1,
           rating = $2,
           status = 'reviewed',
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, user_id, user_name, user_email, status, responses,
                 feedback, rating, created_at, reviewed_at`,
      [feedback, rating, parsedId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Sesión no encontrada");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  return {
    ensureSchema,
    createSession,
    listSessions,
    listUserSessions,
    getSession,
    updateFeedback,
  };
}

module.exports = createInterviewSessionService;
