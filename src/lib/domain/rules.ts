// Regras de negócio puras (sem I/O). A futura API FastAPI deve replicar estas regras no servidor.
import type { DemoState, Instituicao, Lote, NovoLoteInput, Papel, StatusLote, Transportador } from "./models";

export class RegraError extends Error {}

export type ErrosLote = Partial<Record<keyof NovoLoteInput, string>>;

export function validarNovoLote(i: NovoLoteInput, agora: Date): ErrosLote {
  const e: ErrosLote = {};
  const t = (s: string) => new Date(s).getTime();
  if (!i.item || i.item.trim().length < 3) e.item = "Descreva o item (mínimo 3 caracteres).";
  if (!i.categoria) e.categoria = "Selecione a categoria.";
  if (!i.conservacao) e.conservacao = "Selecione a conservação.";
  if (!(i.quantidadeKg > 0)) e.quantidadeKg = "Informe um peso maior que zero.";
  else if (i.quantidadeKg > 500) e.quantidadeKg = "Máximo de 500 kg por lote na demonstração.";
  if (i.unidades !== undefined && i.unidades < 0) e.unidades = "Quantidade inválida.";
  if (!i.origem || i.origem.trim().length < 3) e.origem = "Informe a origem fictícia.";
  const now = agora.getTime();
  if (!i.preparadoEm || isNaN(t(i.preparadoEm))) e.preparadoEm = "Informe a data de preparo/recebimento.";
  else if (t(i.preparadoEm) > now) e.preparadoEm = "O preparo não pode estar no futuro.";
  if (!i.validade || isNaN(t(i.validade))) e.validade = "Informe a validade.";
  else if (t(i.validade) <= now) e.validade = "Lote vencido não pode ser publicado.";
  if (!i.janelaInicio || isNaN(t(i.janelaInicio))) e.janelaInicio = "Informe o início da janela.";
  if (!i.janelaFim || isNaN(t(i.janelaFim))) e.janelaFim = "Informe o fim da janela.";
  if (!e.janelaInicio && !e.janelaFim) {
    if (t(i.janelaFim) <= t(i.janelaInicio)) e.janelaFim = "O fim deve ser depois do início.";
    else if (t(i.janelaFim) <= now) e.janelaFim = "A janela de coleta já terminou.";
    else if (!e.validade && t(i.janelaFim) > t(i.validade))
      e.janelaFim = "A coleta precisa terminar antes da validade.";
  }
  if (i.categoria === "refeicao_pronta" && i.conservacao === "ambiente")
    e.conservacao = "Refeição pronta exige refrigeração ou congelamento.";
  return e;
}

function hashKm(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return Math.round((2 + (h % 160) / 10) * 10) / 10;
}

function registrar(s: DemoState, loteId: string, ator: Papel | "sistema", acao: string, agora: Date, detalhe?: string, notificar?: Papel | "todos") {
  const seq = s.seq + 1;
  const ts = agora.toISOString();
  return {
    ...s,
    seq,
    eventos: [{ id: `EV-${seq}`, loteId, ts, ator, acao, detalhe }, ...s.eventos],
    notificacoes: notificar
      ? [{ id: `NT-${seq}`, ts, papel: notificar, texto: `${loteId}: ${acao}` }, ...s.notificacoes]
      : s.notificacoes,
  };
}

function atualizar(s: DemoState, id: string, patch: Partial<Lote>): DemoState {
  return { ...s, lotes: s.lotes.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
}

function exigir(s: DemoState, id: string, status: StatusLote[], msg: string): Lote {
  const l = s.lotes.find((x) => x.id === id);
  if (!l) throw new RegraError("Lote não encontrado.");
  if (!status.includes(l.status)) throw new RegraError(msg);
  return l;
}

export function criarLote(s: DemoState, input: NovoLoteInput, agora: Date): DemoState {
  const erros = validarNovoLote(input, agora);
  if (Object.keys(erros).length) throw new RegraError(Object.values(erros)[0]);
  const id = `LT-${1000 + s.seq + 1}`;
  const lote: Lote = {
    id,
    item: input.item.trim(),
    categoria: input.categoria as Lote["categoria"],
    quantidadeKg: input.quantidadeKg,
    unidades: input.unidades,
    conservacao: input.conservacao as Lote["conservacao"],
    preparadoEm: new Date(input.preparadoEm).toISOString(),
    validade: new Date(input.validade).toISOString(),
    janelaInicio: new Date(input.janelaInicio).toISOString(),
    janelaFim: new Date(input.janelaFim).toISOString(),
    origem: input.origem.trim(),
    observacoes: input.observacoes?.trim() || undefined,
    status: "PENDENTE_REVISAO", // nunca liberado automaticamente
    distanciaKm: hashKm(id),
    criadoEm: agora.toISOString(),
  };
  return registrar({ ...s, lotes: [lote, ...s.lotes] }, id, "doador", "Lote publicado — pendente de revisão", agora, undefined, "gestor");
}

export function cargaInstituicao(s: DemoState, instId: string): number {
  return s.lotes
    .filter((l) => l.instituicaoId === instId && ["LIBERADO", "RESERVADO", "COLETADO"].includes(l.status))
    .reduce((a, l) => a + l.quantidadeKg, 0);
}

export function instituicaoCompativel(s: DemoState, inst: Instituicao, lote: Lote): string | null {
  if (!inst.aceita.includes(lote.conservacao)) return "Não recebe esse tipo de conservação";
  if (cargaInstituicao(s, inst.id) + lote.quantidadeKg > inst.capacidadeKg) return "Sem capacidade disponível";
  return null;
}

export function transportadorCompativel(t: Transportador, lote: Lote): string | null {
  if (lote.conservacao !== "ambiente" && !t.refrigerado) return "Veículo sem refrigeração";
  if (lote.quantidadeKg > t.capacidadeKg) return "Excede a capacidade do veículo";
  return null;
}

export function aprovarLote(s: DemoState, id: string, instituicaoId: string, agora: Date): DemoState {
  const l = exigir(s, id, ["PENDENTE_REVISAO"], "Apenas lotes pendentes podem ser aprovados.");
  if (new Date(l.validade).getTime() <= agora.getTime()) throw new RegraError("Lote vencido: não pode ser liberado.");
  const inst = s.instituicoes.find((i) => i.id === instituicaoId);
  if (!inst) throw new RegraError("Selecione uma instituição de destino.");
  const motivo = instituicaoCompativel(s, inst, l);
  if (motivo) throw new RegraError(`${inst.nome}: ${motivo}.`);
  const n = atualizar(s, id, { status: "LIBERADO", instituicaoId });
  return registrar(n, id, "gestor", "Revisão hipotética aprovada — liberado para retirada", agora, `Destino: ${inst.nome}`, "todos");
}

export function rejeitarLote(s: DemoState, id: string, motivo: string, agora: Date): DemoState {
  exigir(s, id, ["PENDENTE_REVISAO"], "Apenas lotes pendentes podem ser rejeitados.");
  if (!motivo.trim()) throw new RegraError("Informe o motivo da rejeição.");
  return registrar(atualizar(s, id, { status: "REJEITADO", motivo }), id, "gestor", "Revisão hipotética rejeitada", agora, motivo, "doador");
}

export function reservarLote(s: DemoState, id: string, transportadorId: string, agora: Date): DemoState {
  const atual = s.lotes.find((x) => x.id === id);
  if (atual && atual.transportadorId) throw new RegraError("Este lote já foi reservado por outro transportador.");
  const l = exigir(s, id, ["LIBERADO"], "Lote não está liberado para reserva.");
  const t = s.transportadores.find((x) => x.id === transportadorId);
  if (!t) throw new RegraError("Transportador não encontrado.");
  const motivo = transportadorCompativel(t, l);
  if (motivo) throw new RegraError(motivo + ".");
  return registrar(atualizar(s, id, { status: "RESERVADO", transportadorId }), id, "transportador", "Entrega aceita", agora, t.nome, "todos");
}

export function coletarLote(s: DemoState, id: string, transportadorId: string, agora: Date): DemoState {
  const l = exigir(s, id, ["RESERVADO"], "Etapa fora de ordem: o lote precisa estar reservado antes da coleta.");
  if (l.transportadorId !== transportadorId) throw new RegraError("Apenas o transportador que reservou pode registrar a coleta.");
  return registrar(atualizar(s, id, { status: "COLETADO" }), id, "transportador", "Coleta registrada — em trânsito", agora, undefined, "instituicao");
}

export function confirmarRecebimento(s: DemoState, id: string, agora: Date): DemoState {
  exigir(s, id, ["COLETADO"], "Etapa fora de ordem: o lote ainda não foi coletado.");
  return registrar(atualizar(s, id, { status: "ENTREGUE" }), id, "instituicao", "Recebimento confirmado", agora, "Conferência concluída", "todos");
}

export function recusarRecebimento(s: DemoState, id: string, motivo: string, agora: Date): DemoState {
  exigir(s, id, ["COLETADO"], "Etapa fora de ordem: o lote ainda não foi coletado.");
  if (!motivo.trim()) throw new RegraError("Informe o motivo da recusa.");
  return registrar(atualizar(s, id, { status: "RECUSADO", motivo }), id, "instituicao", "Recebimento recusado", agora, motivo, "todos");
}

export function metricas(s: DemoState) {
  const by = (st: StatusLote) => s.lotes.filter((l) => l.status === st);
  const entregues = by("ENTREGUE");
  return {
    total: s.lotes.length,
    pendentes: by("PENDENTE_REVISAO").length,
    liberados: by("LIBERADO").length,
    emRota: by("RESERVADO").length + by("COLETADO").length,
    entregues: entregues.length,
    kgEntregues: Math.round(entregues.reduce((a, l) => a + l.quantidadeKg, 0) * 10) / 10,
    rejeitados: by("REJEITADO").length + by("RECUSADO").length,
    kmHipoteticos: Math.round(entregues.reduce((a, l) => a + l.distanciaKm, 0) * 10) / 10,
  };
}
