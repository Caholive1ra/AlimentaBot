import { describe, expect, it } from "vitest";
import { makeSeed } from "@/lib/domain/seed";
import * as R from "@/lib/domain/rules";
import type { NovoLoteInput } from "@/lib/domain/models";

const agora = new Date("2026-11-16T12:00:00Z");
const iso = (h: number) => new Date(agora.getTime() + h * 3600_000).toISOString();
const input: NovoLoteInput = {
  item: "Pão de forma", categoria: "panificacao", quantidadeKg: 10, conservacao: "ambiente",
  preparadoEm: iso(-2), validade: iso(24), janelaInicio: iso(1), janelaFim: iso(4), origem: "Padaria X",
};

describe("regras AlimentaBot", () => {
  it("novo lote sempre entra pendente de revisão", () => {
    const s = R.criarLote(makeSeed(agora), input, agora);
    expect(s.lotes[0]?.status).toBe("PENDENTE_REVISAO");
  });
  it("bloqueia lote vencido", () => {
    expect(R.validarNovoLote({ ...input, validade: iso(-1) }, agora).validade).toBeDefined();
  });
  it("bloqueia refeição pronta em temperatura ambiente", () => {
    expect(R.validarNovoLote({ ...input, categoria: "refeicao_pronta" }, agora).conservacao).toBeDefined();
  });
  it("bloqueia reserva duplicada", () => {
    const s = R.reservarLote(makeSeed(agora), "LT-1003", "TR-01", agora);
    expect(() => R.reservarLote(s, "LT-1003", "TR-02", agora)).toThrow(/já foi reservado/);
  });
  it("bloqueia coleta fora de ordem", () => {
    expect(() => R.coletarLote(makeSeed(agora), "LT-1003", "TR-01", agora)).toThrow(/fora de ordem/);
  });
  it("bloqueia confirmação antes da coleta", () => {
    expect(() => R.confirmarRecebimento(makeSeed(agora), "LT-1005", agora)).toThrow(/fora de ordem/);
  });
  it("fluxo completo chega a ENTREGUE", () => {
    let s = R.criarLote(makeSeed(agora), input, agora);
    const id = s.lotes[0]!.id;
    s = R.aprovarLote(s, id, "IN-01", agora);
    s = R.reservarLote(s, id, "TR-02", agora);
    s = R.coletarLote(s, id, "TR-02", agora);
    s = R.confirmarRecebimento(s, id, agora);
    expect(s.lotes.find((l) => l.id === id)?.status).toBe("ENTREGUE");
  });
});
