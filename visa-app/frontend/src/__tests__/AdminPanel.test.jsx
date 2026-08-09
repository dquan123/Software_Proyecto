import { render, screen, waitFor, within } from "@testing-library/react";
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
  let adminDocumentStatus = "review";
  let adminDocumentFeedback = "Documento ilegible.";
  let managedProcess = {
    id: 21,
    estado: "En proceso",
    etapaActual: "Formulario DS-160",
    progreso: 17,
    siguientePaso: "Completar formulario",
    mensaje: "",
    solicitante: { id: 8, nombre: "Carlos Mendoza", correo: "carlos@example.com", perfil: "Renovación B1/B2" },
    asesor: null,
  };
  vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
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
              estado: adminDocumentStatus,
              feedback: adminDocumentFeedback,
              creado_en: "2026-08-01T10:00:00.000Z",
              archivo_url: "http://localhost:8080/documentos/41/archivo",
              usuario: {
                nombre: "Usuario Demo",
                correo: "demo@example.com",
              },
            },
          ],
        }),
      });
    }
    if (String(url).endsWith("/admin/documents/41/status")) {
      const payload = JSON.parse(options.body || "{}");
      if (Object.prototype.hasOwnProperty.call(payload, "estado")) {
        adminDocumentStatus = payload.estado;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "feedback")) {
        adminDocumentFeedback = payload.feedback.trim();
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          message: payload.estado
            ? "Estado del documento actualizado correctamente"
            : "Observaciones del documento actualizadas correctamente",
          documento: {
            id: 41,
            nombre: "pasaporte.pdf",
            tipo: "application/pdf",
            documento_key: "Pasaporte",
            estado: adminDocumentStatus,
            feedback: adminDocumentFeedback,
            creado_en: "2026-08-01T10:00:00.000Z",
            actualizado_en: "2026-08-02T10:00:00.000Z",
            archivo_url: "http://localhost:8080/documentos/41/archivo",
            usuario: {
              nombre: "Usuario Demo",
              correo: "demo@example.com",
            },
          },
        }),
      });
    }
    if (String(url).endsWith("/admin/processes") && (!options.method || options.method === "GET")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          tramites: [managedProcess],
          asesores: [{ id: 5, nombre: "Laura Vásquez", correo: "laura@visaguide.com" }],
        }),
      });
    }
    if (String(url).endsWith("/admin/processes/21") && options.method === "PUT") {
      const payload = JSON.parse(options.body || "{}");
      managedProcess = {
        ...managedProcess,
        estado: payload.estado,
        etapaActual: payload.etapaActual,
        asesor: payload.asesorId ? { id: Number(payload.asesorId), nombre: "Laura Vásquez", correo: "laura@visaguide.com" } : null,
      };
      return Promise.resolve({ ok: true, json: async () => ({ tramite: managedProcess }) });
    }
    if (String(url).endsWith("/admin/metrics/processes")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          totalTramites: 5,
          progresoPromedio: 46.4,
          completados: 1,
          sinAsignar: 2,
          porEstado: [{ label: "En proceso", total: 3 }, { label: "Aprobado", total: 1 }],
          porEtapa: [{ label: "Documentos", total: 2 }, { label: "Formulario DS-160", total: 2 }],
          cargaAsesores: [{ id: 5, nombre: "Laura Vásquez", asignados: 3, pendientes: 2 }],
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ tramites_activos: 4, asesores: 2, ds160_pendientes: 6 }),
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
    expect(screen.getByRole("heading", { name: "Panel de Administración Global" })).toBeInTheDocument();
    expect(await screen.findByText("Solicitudes activas")).toBeInTheDocument();
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.getByText("Asesores activos")).toBeInTheDocument();
    expect(screen.getByText("DS-160 pendientes")).toBeInTheDocument();
    expect(screen.getByText("Actividad de la plataforma")).toBeInTheDocument();
    const validationCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/validar-sesion"));
    expect(validationCalls).toHaveLength(1);
  });

  it("permite activar y conservar el modo oscuro desde el panel", async () => {
    window.history.pushState({}, "", "/admin/reports");
    const user = userEvent.setup();

    render(<App />);

    const themeButton = await screen.findByRole("button", { name: "Activar modo oscuro" });
    await user.click(themeButton);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("vg-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Activar modo claro" })).toHaveAttribute("aria-pressed", "true");
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
    expect(screen.queryByRole("heading", { name: "Panel de Administración Global" })).not.toBeInTheDocument();
    expect(globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/validar-sesion"))).toHaveLength(0);
  });

  it.each([
    ["/admin/users", "Usuarios", "Gestion de usuarios"],
    ["/admin/documents", "Documentos", "Gestión de Documentos"],
    ["/admin/interviews", "Entrevistas", "Entrevistas"],
    ["/admin/processes", "Todas las solicitudes", "Todas las Solicitudes"],
    ["/admin/reports", "Reportes", "Reportes básicos"],
    ["/admin/settings", "Configuracion", "Configuracion"],
  ])("carga la ruta base %s", async (path, header, pageTitle) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: header })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: pageTitle })).toBeInTheDocument();
    if (path === "/admin/documents") {
      expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Tipo de documento" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Observaciones" })).toBeInTheDocument();
      expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
      expect(screen.getByText("Pasaporte")).toBeInTheDocument();
      expect(screen.getByText("Tiene observaciones")).toBeInTheDocument();
      expect(screen.getByText("En revisión")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Observaciones" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ver documento" })).toBeInTheDocument();
    } else if (path === "/admin/interviews") {
      expect((await screen.findAllByText("Usuario Demo")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/administrador/).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: /Entrevistas/ })).toHaveClass("admin-sidebar__link--active");
      expect(screen.queryByRole("heading", { name: "Banco de Preguntas" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Nueva pregunta" })).not.toBeInTheDocument();
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    } else if (path === "/admin/processes") {
      expect(await screen.findByText("Carlos Mendoza")).toBeInTheDocument();
      expect(screen.getByText("Renovación B1/B2")).toBeInTheDocument();
      expect(screen.getByText("Sin asignar")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Gestionar" })).toBeInTheDocument();
    } else if (path === "/admin/reports") {
      expect(await screen.findByText("Trámites totales")).toBeInTheDocument();
      expect(screen.getByText("Progreso promedio")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Trámites por estado" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Distribución por etapa" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Carga de trabajo por asesor" })).toBeInTheDocument();
      expect(screen.getByText("Laura Vásquez")).toBeInTheDocument();
    } else {
      expect(screen.getByText(/Este modulo sera implementado/)).toBeInTheDocument();
    }
  });

  it("permite asignar un asesor y actualizar un trámite", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/processes");

    render(<App />);

    expect(await screen.findByText("Carlos Mendoza")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gestionar" }));
    const dialog = screen.getByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Asesor asignado"), "5");
    await user.selectOptions(within(dialog).getByLabelText("Estado"), "Pendiente");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Laura Vásquez")).toBeInTheDocument();
    expect(screen.getByText("Pendiente", { selector: ".admin-status" })).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/processes/21"),
      expect.objectContaining({ method: "PUT" })
    );
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

  it("permite aprobar un documento sin recargar la pagina", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/documents");

    render(<App />);

    expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar" }));

    expect(await screen.findByText("Documento aprobado correctamente.")).toBeInTheDocument();
    expect(screen.getByText("Aprobado")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/documents");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/documents/41/status"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("abre documentos con la URL del backend y evita navegar por React Router", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    window.history.pushState({}, "", "/admin/documents");

    render(<App />);

    expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver documento" }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000\/documentos\/41\/archivo$/),
      "_blank",
      "noopener,noreferrer"
    );
    expect(window.location.pathname).toBe("/admin/documents");
  });

  it("permite editar y guardar observaciones administrativas", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/documents");

    render(<App />);

    await screen.findByText("Usuario Demo");
    await user.click(screen.getByRole("button", { name: "Observaciones" }));

    const feedbackInput = await screen.findByRole("textbox", {
      name: "Comentario para el usuario",
    });
    expect(feedbackInput).toHaveValue("Documento ilegible.");
    await user.clear(feedbackInput);
    await user.type(feedbackInput, "Falta la segunda pagina.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Observaciones guardadas correctamente.")).toBeInTheDocument();
    expect(screen.getByText("Tiene observaciones")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Observaciones" })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/documents");

    const feedbackCall = globalThis.fetch.mock.calls.find(([url, options]) =>
      String(url).includes("/admin/documents/41/status") &&
      JSON.parse(options?.body || "{}").feedback === "Falta la segunda pagina."
    );
    expect(JSON.parse(feedbackCall[1].body)).toEqual({
      feedback: "Falta la segunda pagina.",
    });

    await user.click(screen.getByRole("button", { name: "Observaciones" }));
    expect(await screen.findByDisplayValue("Falta la segunda pagina.")).toBeInTheDocument();
  });

  it("rechaza un documento usando el estado de correccion que entiende el cliente", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/documents");

    render(<App />);

    expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rechazar" }));

    expect(await screen.findByText("Documento rechazado correctamente.")).toBeInTheDocument();
    expect(screen.getByText(/Correcci/)).toBeInTheDocument();

    const statusCall = globalThis.fetch.mock.calls.find(([url]) =>
      String(url).includes("/admin/documents/41/status")
    );
    expect(JSON.parse(statusCall[1].body)).toEqual({ estado: "correction" });
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

    await user.click(screen.getByRole("link", { name: /^Dashboard$/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin"));
    expect(screen.getByRole("heading", { name: "Panel de Administración Global" })).toBeInTheDocument();
  });
});
