const express = require("express");
const request = require("supertest");
const { parseAdminSearch, buildAdminCohort, buildDashboardCohort } = require("../services/adminSearchFilter");
const createMetrics = require("../routes/adminMetricsRoutes");
const createManagement = require("../routes/adminManagementRoutes");

describe("admin search SQL contracts", () => {
  test("binds combined criteria with AND and an exclusive next-day upper bound", () => {
    const result = buildAdminCohort(parseAdminSearch({ from: "2026-09-01", to: "2026-09-30", status: "Pendiente", advisor: "7" }));
    expect(result.values).toEqual(["2026-09-01", "2026-09-30", "Pendiente", "7"]);
    expect(result.cte).toContain("t.created_at >= $1::date AND t.created_at < ($2::date + INTERVAL '1 day') AND t.estado = $3 AND t.id_asesor = $4::int");
    expect(result.cte).not.toContain("Pendiente");
  });
  test("supports unassigned and open intervals", () => {
    const result = buildAdminCohort(parseAdminSearch({ to: "2026-09-30", advisor: "unassigned" }));
    expect(result.values).toEqual(["2026-09-30"]);
    expect(result.cte).toContain("t.id_asesor IS NULL");
  });
  test.each([
    { from: "2026-02-30" }, { from: "0000-01-01" }, { advisor: "2147483648" }, { from: "2026-09-30", to: "2026-09-01" },
    { from: ["2026-09-01"] }, { advisor: "1 OR 1=1" }, { advisor: "-1" },
    { advisor: ["7"] }, { advisor: "9999999999999999999999" },
    { status: "anything" }, { status: ["Pendiente"] }, { days: "-30" },
  ])("rejects invalid or injected criteria: %j", (query) => {
    expect(() => parseAdminSearch(query)).toThrow();
  });
  test("does not stack a rolling period over an explicit date range", () => {
    expect(parseAdminSearch({ from: "2026-09-01", days: "30" }).days).toBeNull();
  });
  test("scopes dashboard tables before existing aggregates and limits", () => {
    const result = buildDashboardCohort(parseAdminSearch({ advisor: "7" }));
    expect(result.cte).toContain("FROM public.tramite t WHERE t.id_asesor = $1::int");
    expect(result.cte).toContain("documentos AS");
    expect(result.cte).toContain("WHERE FALSE");
  });
});

describe("report and dashboard filter endpoints", () => {
  function setup() {
    const pool = { query: jest.fn(async () => ({ rows: [] })) };
    const app = express();
    const requireAdmin = (_req, _res, next) => next();
    app.use("/metrics", createMetrics(pool, { requireAdmin }));
    app.use("/admin", createManagement(pool, { requireAdmin, schemaReady: Promise.resolve() }));
    return { app, pool };
  }
  test.each(["/metrics/processes", "/metrics/processes.csv", "/admin/dashboard"])("returns 400 for a reversed range: %s", async (path) => {
    const { app, pool } = setup();
    await request(app).get(`${path}?from=2026-09-30&to=2026-09-01`).expect(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  test.each(["/metrics/processes", "/metrics/processes.csv", "/admin/dashboard"])("applies the same parameters to every query: %s", async (path) => {
    const { app, pool } = setup();
    await request(app).get(path).query({ from: "2026-09-01", to: "2026-09-30", status: "Pendiente", advisor: "7" }).expect(200);
    expect(pool.query).toHaveBeenCalled();
    for (const [sql, values] of pool.query.mock.calls) {
      expect(values).toEqual(["2026-09-01", "2026-09-30", "Pendiente", "7"]);
      expect(sql).toContain("filtered_processes");
    }
  });
});
