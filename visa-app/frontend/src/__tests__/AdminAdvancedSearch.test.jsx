import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProcesses from "../pages/admin/AdminProcesses";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminDocuments from "../pages/admin/AdminDocuments";
import AdminDS160 from "../pages/admin/AdminDS160";
import AdminQuestions from "../pages/admin/AdminQuestions";
import AdminAdvisors from "../pages/admin/AdminAdvisors";
import AdminAssignments from "../pages/admin/AdminAssignments";
import InterviewReviewPanel from "../components/InterviewReviewPanel";

vi.mock("../components/admin/AdminLayout", () => ({ default: ({ children }) => <main>{children}</main> }));

const rows = [
  { id: 1, nombre: "Coincidencia", date: "2026-09-30T23:59:59Z", advisor: 7, status: true },
  { id: 2, nombre: "Fecha excluida", date: "2026-08-31T23:59:59Z", advisor: 7, status: true },
  { id: 3, nombre: "Asesor excluido", date: "2026-09-15T10:00:00Z", advisor: 8, status: true },
  { id: 4, nombre: "Estado excluido", date: "2026-09-15T10:00:00Z", advisor: 7, status: false },
];
const advisors = [{ id: 7, nombre: "Ana", createdAt: "2026-09-01", disponible: true, activo: true, asignados: 0, capacidad: 50, correo: "ana@test.dev" }, { id: 8, nombre: "Ana", createdAt: "2026-08-31", disponible: true, activo: true, asignados: 0, capacidad: 50, correo: "otra@test.dev" }];

function fixtures() {
  return {
    "/admin/processes": { tramites: rows.map((r) => ({ id: r.id, estado: r.status ? "Pendiente" : "Aprobado", createdAt: r.date, solicitante: { nombre: r.nombre, correo: `${r.id}@test.dev`, perfil: "Turismo" }, asesor: { id: r.advisor, nombre: "Ana" } })), asesores: advisors },
    "/admin/users": { usuarios: rows.map((r) => ({ ...r, rol: "cliente", correo: `${r.id}@test.dev`, activo: r.status, createdAt: r.date, asesorId: r.advisor, asesor: "Ana" })) },
    "/admin/documents": { documentos: rows.map((r) => ({ id: r.id, nombre: r.nombre, documento_key: r.nombre, estado: r.status ? "review" : "approved", creado_en: r.date, asesor_id: r.advisor, asesor_nombre: "Ana", usuario: { id: r.id, nombre: "Solicitante" } })) },
    "/admin/ds160": { formularios: rows.map((r) => ({ ...r, estado_revision: r.status ? "por_revisar" : "aprobado", created_at: r.date, asesor_id: r.advisor, asesor: "Ana", progreso: 30 })) },
    "/interview-sessions": { sessions: rows.map((r) => ({ id: r.id, user_name: r.nombre, status: r.status ? "pending" : "reviewed", created_at: r.date, advisor_id: r.advisor, advisor_name: "Ana", responses: [] })) },
    "/questions/admin": { questions: rows.map((r) => ({ id: r.id, question: r.nombre, category: "Viaje", difficulty: "Media", activo: r.status, created_at: r.date })) },
    "/admin/advisors": { asesores: advisors },
    "/admin/assignments": { casos: rows.map((r) => ({ ...r, created_at: r.date, estado: r.status ? "Pendiente" : "Aprobado" })), asesores: advisors },
  };
}

beforeEach(() => {
  const data = fixtures();
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const path = new URL(String(url), "http://localhost").pathname;
    return { ok: true, json: async () => data[path] || {} };
  });
});

describe("combined filters in each administrative list", () => {
  it.each([
    ["solicitudes", AdminProcesses, "Pendiente"],
    ["usuarios", AdminUsers, "active"],
    ["documentos", AdminDocuments, "review"],
    ["DS-160", AdminDS160, "por_revisar"],
    ["entrevistas", InterviewReviewPanel, "pending"],
  ])("only displays records matching date AND status AND advisor: %s", async (name, Component, status) => {
    render(<MemoryRouter><Component showHeader /></MemoryRouter>);
    await screen.findByText("Coincidencia");
    if (name === "solicitudes") fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("Asesor"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Estado", { selector: "select" }), { target: { value: status } });
    expect(screen.getByText("Coincidencia")).toBeInTheDocument();
    expect(screen.queryByText("Fecha excluida")).not.toBeInTheDocument();
    expect(screen.queryByText("Asesor excluido")).not.toBeInTheDocument();
    expect(screen.queryByText("Estado excluido")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Asesor"), { target: { value: "unassigned" } });
    expect(screen.queryByText("Coincidencia")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByText("Fecha excluida")).toBeInTheDocument();
    expect(screen.getByText("Asesor excluido")).toBeInTheDocument();
    expect(screen.getByText("Estado excluido")).toBeInTheDocument();
  });

  it("filters question dates together with existing status/category/search", async () => {
    render(<MemoryRouter><AdminQuestions /></MemoryRouter>);
    await screen.findByText("Coincidencia");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "active" } });
    fireEvent.change(screen.getByPlaceholderText("Buscar preguntas..."), { target: { value: "Coincidencia" } });
    expect(screen.getByText("Coincidencia")).toBeInTheDocument();
    expect(screen.queryByText("Estado excluido")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Asesor")).not.toBeInTheDocument();
  });

  it("selects an advisor by ID rather than by a potentially duplicated name", async () => {
    render(<MemoryRouter><AdminAdvisors /></MemoryRouter>);
    await screen.findByText("ana@test.dev");
    fireEvent.change(screen.getByLabelText("Asesor"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    expect(screen.getByText("ana@test.dev")).toBeInTheDocument();
    expect(screen.queryByText("otra@test.dev")).not.toBeInTheDocument();
  });

  it("filters assignment cases and clears a hidden selection", async () => {
    render(<MemoryRouter><AdminAssignments /></MemoryRouter>);
    await screen.findByText("Coincidencia");
    fireEvent.click(screen.getByText("Fecha excluida"));
    expect(screen.getAllByRole("button", { name: "Asignar" })[0]).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Asesor"), { target: { value: "7" } });
    expect(screen.queryByText("Fecha excluida")).not.toBeInTheDocument();
    expect(screen.queryByText("Estado excluido")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecciona un caso" })).toBeDisabled();
  });

  it("resets process pagination when filtering from a later page", async () => {
    const records = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, estado: index === 0 ? "Aprobado" : "Pendiente", createdAt: "2026-09-01", solicitante: { nombre: `Persona ${index}`, correo: `${index}@test.dev` }, asesor: null }));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ tramites: records, asesores: [] }) });
    render(<MemoryRouter><AdminProcesses /></MemoryRouter>);
    await screen.findByText("Persona 9");
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "Aprobado" } });
    await waitFor(() => expect(screen.getByText("1 / 1")).toBeInTheDocument());
    expect(screen.getByText("Persona 0")).toBeInTheDocument();
  });
});
