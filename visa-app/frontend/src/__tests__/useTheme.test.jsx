import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useTheme from "../hooks/useTheme";

describe("useTheme", () => {
  it("lee el tema guardado y permite alternarlo", () => {
    localStorage.setItem("vg-theme", "dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    act(() => result.current.toggleTheme());

    expect(result.current.isDark).toBe(false);
    expect(localStorage.getItem("vg-theme")).toBe("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});
