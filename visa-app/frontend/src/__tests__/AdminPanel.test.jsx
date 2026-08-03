import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const adminSession = {
  id: 1,
  nombre: "Admin General",
  correo: "admin@prueba.com",
  rol: "admin",
};

function mockAdminSession() {
  localStorage.setItem("visaguide_session", JSON.stringify(adminSession));
  localStorage.setItem("correoUsuario", adminSession.correo);
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true }),
  });
}

describe("panel de administracion", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockAdminSession();
  });

  it("muestra el dashboard principal en /admin", async () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vista general administrativa" })).toBeInTheDocument();
    expect(screen.getByText("Usuarios registrados")).toBeInTheDocument();
    expect(screen.getByText("Documentos pendientes")).toBeInTheDocument();
    expect(screen.getByText("Tramites activos")).toBeInTheDocument();
    expect(screen.getByText("Actividad reciente")).toBeInTheDocument();
  });

  it.each([
    ["/admin/users", "Usuarios", "Gestion de usuarios"],
    ["/admin/documents", "Documentos", "Gestion de documentos"],
    ["/admin/processes", "Tramites", "Gestion de tramites"],
    ["/admin/reports", "Reportes", "Reportes administrativos"],
    ["/admin/settings", "Configuracion", "Configuracion"],
  ])("carga la ruta base %s", async (path, header, pageTitle) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: header })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: pageTitle })).toBeInTheDocument();
    expect(screen.getByText(/Este modulo sera implementado/)).toBeInTheDocument();
  });

  it("permite navegar desde el sidebar", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await screen.findByRole("heading", { name: "Dashboard" });
    await user.click(screen.getByRole("link", { name: /Usuarios/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin/users"));
    expect(screen.getByRole("heading", { name: "Gestion de usuarios" })).toBeInTheDocument();
  });
});
