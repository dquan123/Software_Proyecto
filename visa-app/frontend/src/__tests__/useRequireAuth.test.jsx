import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useRequireAuth from "../hooks/useRequireAuth";
import { buildApiUrl } from "../config/api";

describe("useRequireAuth", () => {
  it("mantiene la sesion cuando el backend la reporta como valida", async () => {
    const session = {
      id: 7,
      nombre: "Norman Aguirre",
      correo: "norman@example.com",
      token: "signed-token",
    };
    localStorage.setItem("visaguide_session", JSON.stringify(session));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ valid: true }) });

    const { result, unmount } = renderHook(() => useRequireAuth());

    await waitFor(() => expect(result.current.isValidating).toBe(false));

    expect(result.current.session).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      buildApiUrl("/validar-sesion"),
      { signal: expect.any(AbortSignal), headers: { Authorization: "Bearer signed-token" } }
    );
    const requestSignal = fetchMock.mock.calls[0][1].signal;
    expect(requestSignal.aborted).toBe(false);
    unmount();
    expect(requestSignal.aborted).toBe(true);
  });

  it("limpia la sesion local cuando el backend la reporta como invalida", async () => {
    localStorage.setItem(
      "visaguide_session",
      JSON.stringify({ id: 8, correo: "expirada@example.com", token: "expired-token" })
    );
    localStorage.setItem("correoUsuario", "expirada@example.com");
    localStorage.setItem("perfilUsuario", "turismo_negocios");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ valid: false }),
    });

    renderHook(() => useRequireAuth());

    await waitFor(() =>
      expect(localStorage.getItem("visaguide_session")).toBeNull()
    );
    expect(localStorage.getItem("correoUsuario")).toBeNull();
    expect(localStorage.getItem("perfilUsuario")).toBeNull();
  });
});
