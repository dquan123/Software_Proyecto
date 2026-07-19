import { describe, expect, it, vi } from "vitest";

describe("buildApiUrl", () => {
  it("normaliza rutas sin base URL configurada", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");

    const { buildApiUrl } = await import("../config/api");

    expect(buildApiUrl("/login")).toBe("/login");
    expect(buildApiUrl("login")).toBe("/login");
  });

  it("elimina diagonales finales de VITE_API_URL", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "http://localhost:3000///");

    const { API_BASE_URL, buildApiUrl } = await import("../config/api");

    expect(API_BASE_URL).toBe("http://localhost:3000");
    expect(buildApiUrl("questions")).toBe("http://localhost:3000/questions");
  });
});
