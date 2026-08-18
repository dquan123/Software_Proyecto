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
    if (String(url).includes("/notificaciones/")) {
      return Promise.resolve({ ok: true, json: async () => ({ notificaciones: [], noLeidas: 0 }) });
    }
    if (String(url).endsWith("/admin/dashboard")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          resumen: { solicitudesActivas: 4, sinAsignar: 1, asesoresActivos: 2, ds160Pendientes: 6, documentosPendientes: 3, entrevistasPendientes: 2, usuariosNuevos30d: 5, solicitudesCompletadas: 8, progresoPromedio: 64, tasaCompletitud: 80 },
          cargaAsesores: [],
          actividad: [{ id: "usuario-8", accion: "Nuevo usuario registrado", detalle: "carlos@example.com", actor: "Carlos Mendoza", destino: "/admin/users/8", created_at: "2026-08-01T10:00:00.000Z" }],
          pendientes: [
            { id: "asignaciones", label: "Solicitudes sin asignar", total: 1, destino: "/admin/assignments" },
            { id: "ds160", label: "DS-160 por revisar", total: 6, destino: "/admin/ds160" },
            { id: "documentos", label: "Documentos por revisar", total: 3, destino: "/admin/documents" },
            { id: "entrevistas", label: "Entrevistas pendientes", total: 2, destino: "/admin/interviews" },
          ],
          atencion: [],
        }),
      });
    }
    if (String(url).endsWith("/admin/users")) {
      return Promise.resolve({ ok: true, json: async () => ({ usuarios: [] }) });
    }
    if (String(url).endsWith("/admin/advisors")) {
      return Promise.resolve({ ok: true, json: async () => ({ asesores: [] }) });
    }
    if (String(url).endsWith("/admin/assignments")) {
      return Promise.resolve({ ok: true, json: async () => ({ casos: [], asesores: [] }) });
    }
    if (String(url).endsWith("/admin/ds160")) {
      return Promise.resolve({ ok: true, json: async () => ({ formularios: [] }) });
    }
    if (String(url).endsWith("/admin/profile")) {
      return Promise.resolve({ ok: true, json: async () => ({ usuario: adminSession }) });
    }
    if (String(url).endsWith("/questions")) {
      return Promise.resolve({ ok: true, json: async () => ({ questions: [] }) });
    }
    if (String(url).endsWith("/admin/settings")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ configuracion: { nombre_comercial: "VisaGuide", razon_social: "", sitio_web: "", idioma: "es", zona_horaria: "America/Guatemala" } }),
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
      if (Object.prototype.hasOwnProperty.call(payload, "status")) {
        adminDocumentStatus = payload.status;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "feedback")) {
        adminDocumentFeedback = payload.feedback.trim();
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          message: payload.status
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
    if (String(url).endsWith("/admin/processes/21") && (!options.method || options.method === "GET")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          tramite: {
            ...managedProcess,
            createdAt: "2026-08-01T10:00:00.000Z",
            updatedAt: "2026-08-02T10:00:00.000Z",
          },
          solicitante: {
            id: 8,
            nombre: "Carlos Mendoza",
            correo: "carlos@example.com",
            perfil: "RenovaciÃ³n B1/B2",
            ciudad: "Ciudad de Guatemala",
            pais: "Guatemala",
            createdAt: "2026-07-20T10:00:00.000Z",
          },
          ds160: {
            id: 31,
            seccionActual: 4,
            completado: false,
            progreso: 40,
            estadoRevision: "en_progreso",
            resumen: [
              { key: "nombres", label: "Nombres", value: "Carlos" },
              { key: "numeroPasaporte", label: "Pasaporte", value: "A123456" },
            ],
          },
          documentos: [
            {
              id: 41,
              nombre: "pasaporte.pdf",
              tipo: "application/pdf",
              documento_key: "Pasaporte",
              estado: adminDocumentStatus,
              feedback: adminDocumentFeedback,
              archivo_url: "/documentos/41/archivo",
              creado_en: "2026-08-01T10:00:00.000Z",
            },
          ],
          entrevistas: [
            {
              id: 12,
              user_id: 8,
              user_name: "Carlos Mendoza",
              user_email: "carlos@example.com",
              status: "reviewed",
              responses: [{ id: "q1", text: "Motivo de viaje", recorded: true }],
              feedback: "Buena preparacion",
              rating: 4,
              created_at: "2026-08-03T10:00:00.000Z",
              reviewed_at: "2026-08-04T10:00:00.000Z",
            },
          ],
          notificaciones: [
            {
              id: 61,
              titulo: "Documento aprobado",
              mensaje: "Tu documento fue aprobado.",
              tipo: "documento",
              leido: false,
              createdAt: "2026-08-05T10:00:00.000Z",
            },
          ],
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
    if (String(url).includes("/admin/metrics/processes")) {
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

    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Panel de Administración Global" })).toBeInTheDocument();
    expect(await screen.findByText("Solicitudes activas")).toBeInTheDocument();
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.getByText("Asesores activos")).toBeInTheDocument();
    expect(screen.getByText("DS-160 pendientes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Métricas adicionales" })).toBeInTheDocument();
    expect(screen.getByText("Documentos pendientes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrevistas pendientes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pendientes por atender" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actividad reciente" })).toBeInTheDocument();
    expect(screen.getByText("Nuevo usuario registrado")).toBeInTheDocument();
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

  it("permite colapsar el sidebar de escritorio y conserva el estado", async () => {
    window.history.pushState({}, "", "/admin");
    const user = userEvent.setup();

    const { unmount } = render(<App />);

    await screen.findByRole("heading", { name: "Inicio" });
    await user.click(screen.getByRole("button", { name: "Colapsar menu administrativo" }));

    expect(localStorage.getItem("vg-admin-sidebar-collapsed")).toBe("true");
    expect(document.querySelector(".admin-sidebar")).toHaveClass("admin-sidebar--collapsed");
    expect(screen.getByRole("button", { name: "Expandir menu administrativo" })).toHaveAttribute("aria-expanded", "false");

    unmount();
    render(<App />);

    await screen.findByRole("heading", { name: "Inicio" });
    expect(document.querySelector(".admin-sidebar")).toHaveClass("admin-sidebar--collapsed");
    expect(screen.getByRole("button", { name: "Expandir menu administrativo" })).toBeInTheDocument();
  });

  it("organiza el sidebar administrativo por grupos visibles", async () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await screen.findByRole("heading", { name: "Inicio" });

    expect(screen.getByText("Dashboard", { selector: ".admin-sidebar__group-label" })).toBeInTheDocument();
    expect(screen.getByText(/Gesti.n/, { selector: ".admin-sidebar__group-label" })).toBeInTheDocument();
    expect(screen.getByText(/Revisi.n/, { selector: ".admin-sidebar__group-label" })).toBeInTheDocument();
    expect(screen.getByText(/An.lisis/, { selector: ".admin-sidebar__group-label" })).toBeInTheDocument();
    expect(screen.getByText("Sistema", { selector: ".admin-sidebar__group-label" })).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: /Modulos de administracion/ });
    expect(within(navigation).getByRole("link", { name: /Inicio/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: /Usuarios/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: /Documentos/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: /Reportes/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configuraci/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mi perfil/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cerrar sesi/ })).toBeInTheDocument();
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
    ["/admin/users", "Usuarios", "Usuarios"],
    ["/admin/advisors", "Asesores", "Asesores"],
    ["/admin/assignments", "Asignaciones", "Asignaciones"],
    ["/admin/documents", "Documentos", "Documentos Globales"],
    ["/admin/ds160", "Formularios DS-160", "DS-160 Globales"],
    ["/admin/interviews", "Entrevistas", "Entrevistas Globales"],
    ["/admin/questions", "Banco de preguntas", "Banco de Preguntas"],
    ["/admin/processes", "Todas las solicitudes", "Todas las Solicitudes"],
    ["/admin/reports", "Reportes", "Reportes y Analíticas"],
    ["/admin/settings", "Configuración", "Configuración"],
    ["/admin/profile", "Panel de Administración", "Mi Perfil"],
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
      expect(screen.getByText("En revisión", { selector: ".admin-status" })).toBeInTheDocument();
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
      expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
    } else if (path === "/admin/processes") {
      expect(await screen.findByText("Carlos Mendoza")).toBeInTheDocument();
      expect(screen.getByText("Renovación B1/B2")).toBeInTheDocument();
      expect(screen.getByText("Sin asignar")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/admin/processes/21");
      expect(screen.getByRole("button", { name: "Gestionar" })).toBeInTheDocument();
    } else if (path === "/admin/reports") {
      expect(await screen.findByText("Trámites totales")).toBeInTheDocument();
      expect(screen.getByText("Progreso promedio")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Trámites por estado" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Distribución por etapa" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Carga de trabajo por asesor" })).toBeInTheDocument();
      expect(screen.getByText("Laura Vásquez")).toBeInTheDocument();
    } else if (path === "/admin/users") {
      expect(screen.getByText("No hay usuarios registrados.")).toBeInTheDocument();
    } else if (path === "/admin/settings") {
      expect(await screen.findByDisplayValue("VisaGuide")).toBeInTheDocument();
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

  it("muestra el detalle consolidado de una solicitud administrativa", async () => {
    window.history.pushState({}, "", "/admin/processes/21");

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Todas las solicitudes" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Detalle de Solicitud" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Carlos Mendoza" })).toBeInTheDocument();
    expect(screen.getAllByText("Formulario DS-160").length).toBeGreaterThan(0);
    expect(screen.getByText("Documentos aprobados")).toBeInTheDocument();
    expect(screen.getAllByText("1/1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pasaporte").length).toBeGreaterThan(0);
    expect(screen.getByText("Documento ilegible.")).toBeInTheDocument();
    expect(screen.getAllByText("Buena preparacion").length).toBeGreaterThan(0);
    expect(screen.getByText("Documento aprobado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gestionar tramite" })).toHaveAttribute("href", "/admin/processes");
    expect(screen.getAllByRole("link", { name: "Ver documentos" })[0]).toHaveAttribute("href", "/admin/documents");
    expect(screen.getAllByRole("link", { name: "Revisar entrevistas" })[0]).toHaveAttribute("href", "/admin/interviews");
  });

  it("permite navegar desde el sidebar", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await screen.findByRole("heading", { name: "Inicio" });
    const navigation = screen.getByRole("navigation", { name: /Modulos de administracion/ });
    await user.click(within(navigation).getByRole("link", { name: /Usuarios/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin/users"));
    expect(screen.getAllByRole("heading", { name: "Usuarios" })).toHaveLength(2);
  });

  it("permite aprobar un documento sin recargar la pagina", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/documents");

    render(<App />);

    expect(await screen.findByText("Usuario Demo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar" }));

    expect(await screen.findByText("Documento aprobado correctamente.")).toBeInTheDocument();
    expect(screen.getByText("Aprobado", { selector: ".admin-status" })).toBeInTheDocument();
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
    expect(screen.getByText(/Correcci/, { selector: ".admin-status" })).toBeInTheDocument();

    const statusCall = globalThis.fetch.mock.calls.find(([url]) =>
      String(url).includes("/admin/documents/41/status")
    );
    expect(JSON.parse(statusCall[1].body)).toEqual({ status: "correction" });
  });

  it("navega entre Dashboard y Entrevistas desde el sidebar", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await screen.findByRole("heading", { name: "Inicio" });
    const navigation = screen.getByRole("navigation", { name: /Modulos de administracion/ });
    await user.click(within(navigation).getByRole("link", { name: /Entrevistas/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin/interviews"));
    expect(screen.getByRole("heading", { level: 1, name: "Entrevistas" })).toBeInTheDocument();
    expect((await screen.findAllByText("Usuario Demo")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: /^Inicio$/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin"));
    expect(screen.getByRole("heading", { name: "Panel de Administración Global" })).toBeInTheDocument();
  });
});
