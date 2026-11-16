import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOperationalContext } from "@/services/operational-context";

beforeEach(() => vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api/v1"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("operational context HTTP client", () => {
  it("maps a 401 to a reauthentication message without exposing the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Token de acesso inválido" }), { status: 401 }),
        ),
    );
    await expect(getOperationalContext("not-a-real-token")).rejects.toThrow(
      "Sua sessão expirou ou o token não é válido. Entre novamente.",
    );
  });

  it("keeps an absent API configuration separate from a network failure", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    await expect(getOperationalContext("not-a-real-token")).rejects.toThrow(
      "Integração indisponível: VITE_API_BASE_URL não foi configurada.",
    );
  });
});
