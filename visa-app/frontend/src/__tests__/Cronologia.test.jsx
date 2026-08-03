import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cronologia from "../pages/Cronologia";

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

describe("Cronologia", () => {
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

  it("usa la misma etapa dinámica del dashboard e incluye subir documentos después del DS-160", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const requestUrl = String(url);

      if (requestUrl.includes("/estado-tramite")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ progreso: 34, etapaActual: "Pago de visa" }),
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
        json: async () => [{ id: 1, estado: "review" }],
      });
    });

    render(<Cronologia />);

    expect(await screen.findByRole("heading", { name: "Subir documentos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Subir documentos/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pago de visa" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Revisión experta/i })).not.toBeInTheDocument();
  });

  it("muestra hablar con el asesor en la etapa de pago", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const requestUrl = String(url);

      if (requestUrl.includes("/estado-tramite")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ progreso: 50, etapaActual: "Pago de visa" }),
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
        json: async () => [
          { id: 1, estado: "approved" },
          { id: 2, estado: "approved" },
          { id: 3, estado: "approved" },
          { id: 4, estado: "approved" },
        ],
      });
    });

    render(<Cronologia />);

    expect(await screen.findByRole("heading", { name: "Pago de visa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hablar con el asesor/i })).toBeInTheDocument();
  });
});
