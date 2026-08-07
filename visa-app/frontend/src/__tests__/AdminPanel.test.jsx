import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const adminSession = {
  id: 1,
  nombre: "Admin General",
  correo: "admin@prueba.com",
  rol: "admin",
  token: "signed-admin-token",
};

function mockAdminSession() {
  localStorage.setItem("visaguide_session", JSON.stringify(adminSession));
  localStorage.setItem("correoUsuario", adminSession.correo);
  vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
    if (String(url).includes("/validar-sesion")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ valid: true, user: adminSession }),
      });
    }
    if (String(url).endsWith("/interview-sessions")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: 12,
              user_name: "Usuario Demo",
              user_email: "demo@example.com",
              status: "pending",
              responses: [
                {
                  id: "q1",
                  text: "Cual es el proposito de su viaje?",
                  recorded: true,
                  duration: 42,
                  audio: { url: "https://example.com/demo.mp3" },
                },
              ],
              created_at: "2026-08-01T10:00:00.000Z",
            },
          ],
        }),
      });
    }
    if (String(url).endsWith("/admin/documents")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          documentos: [
            {
              id: 41,
              nombre: "pasaporte.pdf",
              tipo: "application/pdf",
              documento_key: "Pasaporte",
              estado: "review",
              creado_en: "2026-08-01T10:00:00.000Z",
              archivo_url: "/documentos/41/archivo",
              usuario: {
                nombre: "Usuario Demo",
                correo: "demo@example.com",
              },
            },
          ],
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
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
    expect(await screen.findByText("Usuarios registrados")).toBeInTheDocument();
    expect(screen.getByText("Documentos pendientes")).toBeInTheDocument();
    expect(screen.getByText("Tramites activos")).toBeInTheDocument();
    expect(screen.getByText("Actividad reciente")).toBeInTheDocument();
    const validationCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/validar-sesion"));
    expect(validationCalls).toHaveLength(1);
  });

  it("rechaza una sesión local fabricada con correo de administrador", async () => {
    localStorage.setItem("visaguide_session", JSON.stringify({
      id: 1,
      nombre: "Admin falso",
      correo: "admin@prueba.com",
      rol: "admin",
    }));
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await waitFor(() => expect(localStorage.getItem("visaguide_session")).toBeNull());
    expect(screen.queryByRole("heading", { name: "Vista general administrativa" })).not.toBeInTheDocument();
    expect(globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/validar-sesion"))).toHaveLength(0);
  });

  it.each([
    ["/admin/users", "Usuarios", "Gestion de usuarios"],
    ["/admin/documents", "Documentos", "Gestión de Documentos"],
    ["/admin/interviews", "Entrevistas", "Entrevistas"],
    ["/admin/processes", "Tramites", "Gestion de tramites"],
    ["/admin/reports", "Reportes", "Resumen de trámites"],
    ["/admin/settings", "Configuracion", "Configuracion"],
  ])("carga la ruta base %s", async (path, header, pageTitle) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: header })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: pageTitle })).toBeInTheDocument();
    if (path === "/admin/documents") {
      expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Tipo de documento" })).toBeInTheDocument();
      expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
      expect(screen.getByText("Pasaporte")).toBeInTheDocument();
      expect(screen.getByText("En revisión")).toBeInTheDocument();
    } else if (path === "/admin/interviews") {
      expect((await screen.findAllByText("Usuario Demo")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/administrador/).length).toBeGreaterThan(0);
    } else if (path !== "/admin/reports") {
      expect(screen.getByText(/Este modulo sera implementado/)).toBeInTheDocument();
    }
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

  it("navega entre Dashboard y Entrevistas desde el sidebar", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await screen.findByRole("heading", { name: "Dashboard" });
    await user.click(screen.getByRole("link", { name: /Entrevistas/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin/interviews"));
    expect(screen.getByRole("heading", { level: 1, name: "Entrevistas" })).toBeInTheDocument();
    expect((await screen.findAllByText("Usuario Demo")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin"));
    expect(screen.getByRole("heading", { name: "Vista general administrativa" })).toBeInTheDocument();
  });
});
