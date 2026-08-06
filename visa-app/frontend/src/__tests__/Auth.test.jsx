import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { buildApiUrl } from "../config/api";

describe("pantallas de autenticación", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirige la ruta raíz al login", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("mantiene el login real y permite mostrar la contraseña", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    window.history.pushState({}, "", "/login");

    render(<App />);

    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");

    await user.type(screen.getByLabelText("Correo electrónico"), "persona@example.com");
    await user.type(password, "secreto");
    await user.click(screen.getByRole("button", { name: /Ingresar/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos"));
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl("/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "persona@example.com", contrasena: "secreto" }),
    });
  });

  it("renderiza el login y bloquea envíos con campos vacíos o correo inválido", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ingresar/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ingresar/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("El correo es obligatorio");

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@dominio");
    await user.click(screen.getByRole("button", { name: /Ingresar/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresa un correo válido");

    await user.clear(screen.getByLabelText("Correo electrónico"));
    await user.type(screen.getByLabelText("Correo electrónico"), "persona@example.com");
    await user.click(screen.getByRole("button", { name: /Ingresar/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("La contraseña es obligatoria");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirige a /admin usando el rol entregado por el backend", async () => {
    const user = userEvent.setup();
    const loggedUser = {
      id: 1,
      nombre: "Admin General",
      correo: "admin@prueba.com",
      rol: "admin",
    };
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).endsWith("/login")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, usuario: loggedUser, token: "signed-admin-token" }),
        });
      }
      if (String(url).includes("/validar-sesion")) {
        return Promise.resolve({ ok: true, json: async () => ({ valid: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ questions: [], sessions: [] }) });
    });
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(document.querySelector("#login-correo"), loggedUser.correo);
    await user.type(document.querySelector("#login-contrasena"), "123456");
    await user.click(screen.getByRole("button", { name: /Ingresar/i }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin"));
    expect(JSON.parse(localStorage.getItem("visaguide_session"))).toMatchObject({
      id: 1,
      correo: loggedUser.correo,
      rol: "admin",
    });
  });

  it("guarda la sesión cuando el login responde correctamente", async () => {
    const user = userEvent.setup();
    const loggedUser = {
      id_usuario: 8,
      nombre: "Mario Gómez",
      correo: "mario@example.com",
      perfil: null,
      rol: "cliente",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).endsWith("/login")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, usuario: loggedUser, token: "signed-client-token" }),
        });
      }
      if (String(url).includes("/validar-sesion")) {
        return Promise.resolve({ ok: true, json: async () => ({ valid: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(document.querySelector("#login-correo"), loggedUser.correo);
    await user.type(screen.getByLabelText("Contraseña"), "secreto");
    await user.click(screen.getByRole("button", { name: /Ingresar/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("visaguide_session"))).toMatchObject({
        id: loggedUser.id_usuario,
        nombre: loggedUser.nombre,
        correo: loggedUser.correo,
        perfil: null,
        rol: "cliente",
      });
    });
    expect(localStorage.getItem("correoUsuario")).toBe(loggedUser.correo);
    expect(window.location.pathname).toBe("/seleccion-perfil");
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl("/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: loggedUser.correo, contrasena: "secreto" }),
    });
  });

  it("conserva validación, autocomplete y envío real del registro", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "duplicate key" }),
    });
    window.history.pushState({}, "", "/registro");

    render(<App />);

    expect(screen.getByLabelText("Nombre completo")).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirmar contraseña")).toHaveAttribute("autocomplete", "new-password");

    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("El nombre es obligatorio");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Nombre completo"), "Ana López");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "clave123");
    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Este correo ya está registrado"));
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl("/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Ana López", correo: "ana@example.com", contrasena: "clave123" }),
    });
  });

  it("valida correo, longitud y confirmación de contraseña antes de registrar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    window.history.pushState({}, "", "/registro");

    render(<App />);

    await user.type(screen.getByLabelText("Nombre completo"), "Ana López");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@dominio");
    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresa un correo válido");

    await user.clear(screen.getByLabelText("Correo electrónico"));
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "123");
    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("al menos 4 caracteres");

    await user.clear(screen.getByLabelText("Contraseña"));
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "otra-clave");
    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Las contraseñas no coinciden");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("guarda la sesión después del registro y continúa a selección de perfil", async () => {
    const user = userEvent.setup();
    const newUser = {
      id_usuario: 42,
      nombre: "Ana López",
      correo: "ana@example.com",
      perfil: null,
    };
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).endsWith("/register")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: newUser, token: "signed-registration-token" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ valid: true }) });
    });
    window.history.pushState({}, "", "/registro");

    render(<App />);

    await user.type(screen.getByLabelText("Nombre completo"), newUser.nombre);
    await user.type(screen.getByLabelText("Correo electrónico"), newUser.correo);
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "clave123");
    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }));

    await waitFor(() => expect(window.location.pathname).toBe("/seleccion-perfil"));
    expect(JSON.parse(localStorage.getItem("visaguide_session"))).toMatchObject({
      id: 42,
      nombre: newUser.nombre,
      correo: newUser.correo,
      perfil: null,
    });
    expect(localStorage.getItem("correoUsuario")).toBe(newUser.correo);
  });

  it.each([
    ["/login", "turismo_negocios", "/dashboard"],
    ["/registro", "turismo_negocios", "/dashboard"],
    ["/login", null, "/seleccion-perfil"],
    ["/registro", null, "/seleccion-perfil"],
  ])("redirige una sesión válida desde %s según su perfil", async (route, perfil, destination) => {
    localStorage.setItem("correoUsuario", "sesion@example.com");
    localStorage.setItem("visaguide_session", JSON.stringify({
      id: 7,
      nombre: "Usuario Sesión",
      correo: "sesion@example.com",
      perfil,
      token: "signed-session-token",
    }));
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("/validar-sesion")) {
        return Promise.resolve({ ok: true, json: async () => ({ valid: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    window.history.pushState({}, "", route);

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe(destination));
  });
});
