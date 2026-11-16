import { afterEach, describe, expect, it, vi } from "vitest";

import { getOperationalContext } from "@/services/operational-context";

afterEach(() => vi.unstubAllGlobals());

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
});
