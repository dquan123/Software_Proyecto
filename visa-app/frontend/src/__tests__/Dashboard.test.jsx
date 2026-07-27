import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../pages/Dashboard";

const authState = vi.hoisted(() => ({
  isValidating: false,
  session: {
    id: 7,
    nombre: "Ana López",
    correo: "ana@example.com",
    perfil: "turismo_negocios",
  },
}));

vi.mock("../hooks/useRequireAuth", () => ({
  default: () => authState,
}));

vi.mock("../hooks/useModoSenior", () => ({
  default: () => false,
}));

vi.mock("../components/Sidebar", () => ({
  default: ({ currentPage }) => <nav data-testid="sidebar">{currentPage}</nav>,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    Object.assign(authState, {
      isValidating: false,
      session: {
        id: 7,
        nombre: "Ana López",
        correo: "ana@example.com",
        perfil: "turismo_negocios",
      },
    });
  });

  it("muestra la información principal y los datos del usuario", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const requestUrl = String(url);

      if (requestUrl.includes("/estado-tramite")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            progreso: 34,
            etapaActual: "Pago de visa",
            siguientePaso: "Realizar el pago de la tarifa de visa",
          }),
        });
      }

      if (requestUrl.includes("/ds160")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ seccion_actual: 10, completado: true }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, estado: "correction" }],
      });
    });

    render(<Dashboard />);

    expect(await screen.findByRole("heading", { name: "¡Hola, Ana!" })).toBeInTheDocument();
    expect(screen.getByText("Continuemos con tu solicitud de visa B1/B2.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Progreso general" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Corregir ahora/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Corregir documentos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revisión de documentos/i })).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".dash-stat-card__value" })).toBeInTheDocument();
    expect(screen.getByText("Pago de visa")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/estado-tramite?correo=ana%40example.com"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("usa valores seguros cuando no hay datos del usuario ni del trámite", async () => {
    authState.session = { id: 8, correo: "sin-datos@example.com", perfil: null };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<Dashboard />);

    expect(await screen.findByRole("heading", { name: "¡Hola, Usuario!" })).toBeInTheDocument();
    expect(screen.getByText("Continuemos con tu solicitud de visa B1/B2.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("1", { selector: ".dash-etapa-num" })).toBeInTheDocument());
  });

  it("presenta el estado de carga mientras se valida la sesión", () => {
    authState.isValidating = true;
    authState.session = null;

    render(<Dashboard />);

    expect(screen.getByTestId("sidebar")).toHaveTextContent("inicio");
    expect(document.querySelectorAll(".sk-shimmer").length).toBeGreaterThan(0);
  });

  it("limita la etapa al rango válido cuando el backend devuelve progreso excesivo", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ progreso: 180 }),
    });

    render(<Dashboard />);

    await waitFor(() =>
      expect(screen.getByText("6", { selector: ".dash-etapa-num" })).toBeInTheDocument()
    );
    expect(screen.getByText("100%", { selector: ".dash-ring-pct" })).toBeInTheDocument();
  });
});
