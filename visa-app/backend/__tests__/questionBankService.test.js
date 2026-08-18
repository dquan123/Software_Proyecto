const {
  CATEGORIES,
  DIFFICULTIES,
  SEED_QUESTIONS,
  createQuestionBankService,
} = require("../services/questionBankService");

describe("question bank seed catalog", () => {
  test("contains a broad, valid and duplicate-free interview catalog", () => {
    expect(SEED_QUESTIONS).toHaveLength(40);
    expect(new Set(SEED_QUESTIONS.map((item) => item.question.toLocaleLowerCase("es"))).size).toBe(SEED_QUESTIONS.length);
    expect(SEED_QUESTIONS.every((item) => CATEGORIES.includes(item.category))).toBe(true);
    expect(SEED_QUESTIONS.every((item) => DIFFICULTIES.includes(item.difficulty))).toBe(true);
    expect(SEED_QUESTIONS.filter((item) => item.is_required).length).toBeGreaterThanOrEqual(15);
  });

  test("inserts only missing seed questions without clearing existing records", async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = createQuestionBankService(pool);

    await service.seedInitialQuestions();

    const seedCall = pool.query.mock.calls.find(([sql]) => String(sql).includes("WITH seed_questions"));
    expect(seedCall).toBeDefined();
    expect(seedCall[0]).toContain("WHERE NOT EXISTS");
    expect(seedCall[0]).toContain("LOWER(TRIM(existing.question))");
    expect(seedCall[1]).toHaveLength(SEED_QUESTIONS.length * 4);
    expect(pool.query.mock.calls.some(([sql]) => String(sql).includes("DELETE FROM question_bank"))).toBe(false);
  });
});
