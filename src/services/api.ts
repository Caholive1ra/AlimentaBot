// Contrato da camada de serviços. Hoje: adaptador mock local. Futuro: adaptador HTTP (FastAPI).
import type { DemoState, NovoLoteInput } from "@/lib/domain/models";
import * as R from "@/lib/domain/rules";
import { getState, resetState, setState } from "./store";

export interface AlimentaApi {
  criarLote(input: NovoLoteInput): Promise<DemoState>;
  aprovarLote(id: string, instituicaoId: string): Promise<DemoState>;
  rejeitarLote(id: string, motivo: string): Promise<DemoState>;
  reservarLote(id: string, transportadorId: string): Promise<DemoState>;
  coletarLote(id: string, transportadorId: string): Promise<DemoState>;
  confirmarRecebimento(id: string): Promise<DemoState>;
  recusarRecebimento(id: string, motivo: string): Promise<DemoState>;
  reiniciar(): Promise<DemoState>;
}

function run(fn: (s: DemoState, agora: Date) => DemoState): Promise<DemoState> {
  try {
    const next = fn(getState(), new Date());
    setState(next);
    return Promise.resolve(next);
  } catch (e) {
    return Promise.reject(e);
  }
}

export const mockAdapter: AlimentaApi = {
  criarLote: (i) => run((s, a) => R.criarLote(s, i, a)),
  aprovarLote: (id, inst) => run((s, a) => R.aprovarLote(s, id, inst, a)),
  rejeitarLote: (id, m) => run((s, a) => R.rejeitarLote(s, id, m, a)),
  reservarLote: (id, t) => run((s, a) => R.reservarLote(s, id, t, a)),
  coletarLote: (id, t) => run((s, a) => R.coletarLote(s, id, t, a)),
  confirmarRecebimento: (id) => run((s, a) => R.confirmarRecebimento(s, id, a)),
  recusarRecebimento: (id, m) => run((s, a) => R.recusarRecebimento(s, id, m, a)),
  reiniciar: () => {
    resetState();
    return Promise.resolve(getState());
  },
};

// Troque aqui por um adaptador HTTP quando a API existir (ver docs/INTEGRACAO_API.md).
export const api: AlimentaApi = mockAdapter;
