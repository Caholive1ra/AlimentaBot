// Modelos de domínio do AlimentaBot. Espelham o contrato esperado de uma futura API REST.
export type Papel = "doador" | "gestor" | "transportador" | "instituicao";
export type Conservacao = "ambiente" | "refrigerado" | "congelado";
export type Categoria =
  | "hortifruti"
  | "panificacao"
  | "refeicao_pronta"
  | "laticinios"
  | "graos"
  | "proteinas";

export type StatusLote =
  | "PENDENTE_REVISAO"
  | "LIBERADO"
  | "REJEITADO"
  | "RESERVADO"
  | "COLETADO"
  | "ENTREGUE"
  | "RECUSADO";

export interface Lote {
  id: string;
  item: string;
  categoria: Categoria;
  quantidadeKg: number;
  unidades?: number | undefined;
  conservacao: Conservacao;
  preparadoEm: string; // ISO
  validade: string; // ISO
  janelaInicio: string; // ISO
  janelaFim: string; // ISO
  origem: string;
  observacoes?: string | undefined;
  status: StatusLote;
  instituicaoId?: string | undefined;
  transportadorId?: string | undefined;
  distanciaKm: number; // hipotética
  motivo?: string | undefined;
  criadoEm: string;
}

export interface Transportador {
  id: string;
  nome: string;
  veiculo: string;
  capacidadeKg: number;
  refrigerado: boolean;
}

export interface Instituicao {
  id: string;
  nome: string;
  bairro: string;
  capacidadeKg: number;
  janela: string;
  aceita: Conservacao[];
}

export interface EventoCustodia {
  id: string;
  loteId: string;
  ts: string;
  ator: Papel | "sistema";
  acao: string;
  detalhe?: string | undefined;
}

export interface Notificacao {
  id: string;
  ts: string;
  papel: Papel | "todos";
  texto: string;
}

export interface DemoState {
  versao: number;
  seq: number;
  lotes: Lote[];
  transportadores: Transportador[];
  instituicoes: Instituicao[];
  eventos: EventoCustodia[];
  notificacoes: Notificacao[];
}

export interface NovoLoteInput {
  item: string;
  categoria: Categoria | "";
  quantidadeKg: number;
  unidades?: number | undefined;
  conservacao: Conservacao | "";
  preparadoEm: string;
  validade: string;
  janelaInicio: string;
  janelaFim: string;
  origem: string;
  observacoes?: string | undefined;
}

export const STATUS_LABEL: Record<StatusLote, string> = {
  PENDENTE_REVISAO: "Pendente de revisão",
  LIBERADO: "Liberado",
  REJEITADO: "Rejeitado",
  RESERVADO: "Reservado",
  COLETADO: "Coletado",
  ENTREGUE: "Entregue",
  RECUSADO: "Recusado",
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  hortifruti: "Hortifrúti",
  panificacao: "Panificação",
  refeicao_pronta: "Refeição pronta",
  laticinios: "Laticínios",
  graos: "Grãos e secos",
  proteinas: "Proteínas",
};

export const CONSERVACAO_LABEL: Record<Conservacao, string> = {
  ambiente: "Temperatura ambiente",
  refrigerado: "Refrigerado (0–5 °C)",
  congelado: "Congelado (≤ -18 °C)",
};
