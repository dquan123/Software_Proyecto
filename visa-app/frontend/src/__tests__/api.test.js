import { describe, expect, it, vi } from "vitest";

describe("buildApiUrl", () => {
  it("usa el host actual y el puerto del backend cuando no hay URL configurada", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");

    const { buildApiUrl, resolveApiBaseUrl } = await import("../config/api");
    const baseUrl = resolveApiBaseUrl("", {
      protocol: "http:",
      hostname: "localhost",
    });

    expect(baseUrl).toBe("http://localhost:3000");
    expect(buildApiUrl("/login")).toMatch(/\/login$/);
    expect(buildApiUrl("login")).toMatch(/\/login$/);
  });

  it("elimina diagonales finales de VITE_API_URL", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test///");

    const { API_BASE_URL, buildApiUrl } = await import("../config/api");

    expect(API_BASE_URL).toBe("https://api.example.test");
    expect(buildApiUrl("questions")).toBe("https://api.example.test/questions");
  });

  it("reemplaza localhost por el host del servidor cuando el frontend es remoto", async () => {
    vi.resetModules();

    const { resolveApiBaseUrl } = await import("../config/api");
    const baseUrl = resolveApiBaseUrl("http://localhost:3000", {
      protocol: "http:",
      hostname: "3.14.12.212",
    });

    expect(baseUrl).toBe("http://3.14.12.212:3000");
  });

  it("respeta una URL remota configurada explícitamente", async () => {
    vi.resetModules();

    const { resolveApiBaseUrl } = await import("../config/api");
    const baseUrl = resolveApiBaseUrl("https://api.visaguide.example/", {
      protocol: "https:",
      hostname: "visaguide.example",
    });

    expect(baseUrl).toBe("https://api.visaguide.example");
  });
});
