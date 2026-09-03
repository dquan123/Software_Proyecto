import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import AdminAdvancedFilters from "../components/admin/AdminAdvancedFilters";
import { EMPTY_ADMIN_FILTERS, adminFilterError, advisorOptions, matchesAdminFilters } from "../utils/adminFilters";

describe("advanced admin filter matching", () => {
  const filters = { from: "2026-09-01", to: "2026-09-30", advisor: "7" };
  it.each(["2026-09-01T00:00:00.000Z", "2026-09-30T23:59:59.999Z"])("includes both date boundaries: %s", (date) => {
    expect(matchesAdminFilters(filters, date, 7)).toBe(true);
  });
  it.each([
    ["2026-08-31T23:59:59Z", 7], ["2026-10-01T00:00:00Z", 7],
    ["2026-09-12T12:00:00Z", 8], ["2026-09-12", null], [null, 7], ["invalid", 7],
  ])("excludes a record if ANY criterion does not match", (date, advisor) => {
    expect(matchesAdminFilters(filters, date, advisor)).toBe(false);
  });
  it("supports open date intervals and no filters", () => {
    expect(matchesAdminFilters(EMPTY_ADMIN_FILTERS, null, null)).toBe(true);
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, from: "2026-09-01" }, "2026-12-31", null)).toBe(true);
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, to: "2026-09-30" }, "2020-01-01", null)).toBe(true);
  });
  it("distinguishes all advisors, an exact ID and unassigned", () => {
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, advisor: "unassigned" }, null, null)).toBe(true);
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, advisor: "unassigned" }, null, 7)).toBe(false);
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, advisor: "7" }, null, "7")).toBe(true);
    expect(matchesAdminFilters({ ...EMPTY_ADMIN_FILTERS, advisor: "7" }, null, 17)).toBe(false);
  });
  it.each([
    ["2026-09-30", "2026-09-01"], ["2026-02-30", ""], ["2025-02-29", ""], ["2026-13-01", ""],
  ])("rejects invalid ranges without broadening results", (from, to) => {
    expect(adminFilterError({ from, to, advisor: "" })).not.toBe("");
    expect(matchesAdminFilters({ from, to, advisor: "" }, "2026-09-20", null)).toBe(false);
  });
  it("keeps identically named advisors separate by ID", () => {
    expect(advisorOptions([{ id: 1, nombre: "Ana" }, { id: 2, nombre: "Ana" }, { id: 1, nombre: "Ana" }, { id: null }])).toHaveLength(2);
  });
});

function FilterHarness() {
  const [filters, setFilters] = useState(EMPTY_ADMIN_FILTERS);
  const [status, setStatus] = useState("");
  return <><AdminAdvancedFilters value={filters} onChange={setFilters} advisors={[{ id: 7, nombre: "Ana" }]}
    status={status} statuses={[{ value: "", label: "Todos" }, { value: "pending", label: "Pendiente" }]} onStatusChange={setStatus}
    onReset={() => { setFilters(EMPTY_ADMIN_FILTERS); setStatus(""); }} /><output>{JSON.stringify({ ...filters, status })}</output></>;
}

describe("advanced filter controls", () => {
  it("clears dates, status and advisor together", () => {
    render(<FilterHarness />);
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("Asesor"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pending" } });
    expect(screen.getByRole("status")).toHaveTextContent('"advisor":"7"');
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("status")).toHaveTextContent(JSON.stringify({ ...EMPTY_ADMIN_FILTERS, status: "" }));
  });
  it("announces reversed dates accessibly", () => {
    render(<FilterHarness />);
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-01" } });
    expect(screen.getByRole("alert")).toHaveTextContent("La fecha inicial no puede ser posterior");
    expect(screen.getByLabelText("Desde")).toHaveAttribute("aria-invalid", "true");
  });
});
