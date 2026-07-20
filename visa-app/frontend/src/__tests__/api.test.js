import { describe, expect, it, vi } from "vitest";

describe("buildApiUrl", () => {
  it("normaliza rutas sin base URL configurada", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");

    const { API_BASE_URL, buildApiUrl } = await import("../config/api");

    expect(buildApiUrl("/login")).toBe(`${API_BASE_URL}/login`);
    expect(buildApiUrl("login")).toBe(`${API_BASE_URL}/login`);
  });

  it("elimina diagonales finales de VITE_API_URL", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test///");

    const { API_BASE_URL, buildApiUrl } = await import("../config/api");

    expect(API_BASE_URL).toBe("https://api.example.test");
    expect(buildApiUrl("questions")).toBe("https://api.example.test/questions");
  });
});
