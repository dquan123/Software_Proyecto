import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

function createMemoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    removeItem(key) { values.delete(String(key)); },
    setItem(key, value) { values.set(String(key), String(value)); },
  };
}

// Node 25 exposes Storage without a usable backing store in this environment.
if (typeof globalThis.localStorage?.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: createMemoryStorage(),
  });
}

if (typeof globalThis.sessionStorage?.clear !== "function") {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: createMemoryStorage(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
  sessionStorage.clear();
});
