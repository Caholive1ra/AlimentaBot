import type { DemoState, Lote } from "./models";

// Dados 100% sintéticos. Gerados em função de "agora" para manter validades coerentes.
export function makeSeed(agora: Date): DemoState {
  const h = (horas: number) => new Date(agora.getTime() + horas * 3600_000).toISOString();
  const base = (p: Partial<Lote> & Pick<Lote, "id" | "item" | "categoria" | "quantidadeKg" | "conservacao" | "status">): Lote => ({
    preparadoEm: h(-6),
    validade: h(30),
    janelaInicio: h(1),
    janelaFim: h(6),
    origem: "Mercado Fictício Vila Verde",
    distanciaKm: 4.2,
    criadoEm: h(-3),
    ...p,
  });
  const lotes: Lote[] = [
    base({ id: "LT-1001", item: "Pães franceses do dia", categoria: "panificacao", quantidadeKg: 12, unidades: 120, conservacao: "ambiente", status: "PENDENTE_REVISAO", origem: "Padaria Fictícia Aurora", distanciaKm: 3.1 }),
    base({ id: "LT-1002", item: "Marmitas de arroz, feijão e legumes", categoria: "refeicao_pronta", quantidadeKg: 18, unidades: 45, conservacao: "refrigerado", status: "PENDENTE_REVISAO", origem: "Restaurante Fictício Sabor", validade: h(20), janelaFim: h(4), distanciaKm: 6.8 }),
    base({ id: "LT-1003", item: "Banana prata e maçã", categoria: "hortifruti", quantidadeKg: 35, conservacao: "ambiente", status: "LIBERADO", instituicaoId: "IN-01", distanciaKm: 5.4 }),
    base({ id: "LT-1004", item: "Iogurte natural (potes 170 g)", categoria: "laticinios", quantidadeKg: 9, unidades: 52, conservacao: "refrigerado", status: "LIBERADO", instituicaoId: "IN-02", validade: h(48), distanciaKm: 8.9 }),
    base({ id: "LT-1005", item: "Arroz e feijão (pacotes íntegros)", categoria: "graos", quantidadeKg: 60, conservacao: "ambiente", status: "RESERVADO", instituicaoId: "IN-03", transportadorId: "TR-02", validade: h(24 * 60), distanciaKm: 11.2 }),
    base({ id: "LT-1006", item: "Frango congelado porcionado", categoria: "proteinas", quantidadeKg: 22, conservacao: "congelado", status: "COLETADO", instituicaoId: "IN-02", transportadorId: "TR-01", validade: h(24 * 20), distanciaKm: 7.5 }),
    base({ id: "LT-1007", item: "Verduras folhosas", categoria: "hortifruti", quantidadeKg: 14, conservacao: "refrigerado", status: "ENTREGUE", instituicaoId: "IN-01", transportadorId: "TR-01", distanciaKm: 4.6, criadoEm: h(-26) }),
    base({ id: "LT-1008", item: "Bolo caseiro sem rótulo", categoria: "panificacao", quantidadeKg: 4, conservacao: "ambiente", status: "REJEITADO", motivo: "Sem informação de ingredientes/alergênicos (simulação).", distanciaKm: 2.3 }),
  ];
  const ev = (n: number, loteId: string, ator: DemoState["eventos"][0]["ator"], acao: string, horas: number, detalhe?: string) => ({ id: `EV-${n}`, loteId, ator, acao, ts: h(horas), detalhe });
  return {
    versao: 1,
    seq: 40,
    lotes,
    transportadores: [
      { id: "TR-01", nome: "Motorista Demo A", veiculo: "Furgão refrigerado", capacidadeKg: 300, refrigerado: true },
      { id: "TR-02", nome: "Motorista Demo B", veiculo: "Utilitário", capacidadeKg: 120, refrigerado: false },
      { id: "TR-03", nome: "Ciclista Demo C", veiculo: "Bike cargo", capacidadeKg: 25, refrigerado: false },
    ],
    instituicoes: [
      { id: "IN-01", nome: "Instituição Fictícia Raízes", bairro: "Bairro A", capacidadeKg: 120, janela: "08h–17h", aceita: ["ambiente", "refrigerado"] },
      { id: "IN-02", nome: "Cozinha Comunitária Demo", bairro: "Bairro B", capacidadeKg: 80, janela: "10h–20h", aceita: ["ambiente", "refrigerado", "congelado"] },
      { id: "IN-03", nome: "Abrigo Fictício Horizonte", bairro: "Bairro C", capacidadeKg: 150, janela: "07h–15h", aceita: ["ambiente"] },
    ],
    eventos: [
      ev(1, "LT-1007", "instituicao", "Recebimento confirmado", -2, "Conferência concluída"),
      ev(2, "LT-1006", "transportador", "Coleta registrada — em trânsito", -1),
      ev(3, "LT-1005", "transportador", "Entrega aceita", -1.5, "Motorista Demo B"),
      ev(4, "LT-1008", "gestor", "Revisão hipotética rejeitada", -2.5),
      ev(5, "LT-1003", "gestor", "Revisão hipotética aprovada — liberado para retirada", -2),
      ev(6, "LT-1001", "doador", "Lote publicado — pendente de revisão", -0.5),
      ev(7, "LT-1002", "doador", "Lote publicado — pendente de revisão", -0.3),
    ].sort((a, b) => b.ts.localeCompare(a.ts)),
    notificacoes: [
      { id: "NT-1", ts: h(-0.3), papel: "gestor", texto: "LT-1002: novo lote aguardando revisão" },
      { id: "NT-2", ts: h(-1), papel: "instituicao", texto: "LT-1006: coleta registrada — em trânsito" },
    ],
  };
}
