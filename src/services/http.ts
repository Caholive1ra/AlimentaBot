import type { Conservacao, Lote, NovoLoteInput, StatusLote } from "@/lib/domain/models";

type ApiLot = {
  id: string;
  item: string;
  category: string;
  quantity_kg: number;
  conservation: Conservacao;
  status: StatusLote;
  expires_at: string;
  institution_id: string | null;
  transporter_id: string | null;
};
type ApiPage = { items: ApiLot[]; next_cursor: string | null };
export type ConnectedSession = { accessToken: string; organizationId: string };
let session: ConnectedSession | null = null;

export function setConnectedSession(next: ConnectedSession | null) {
  session = next;
}
export function clearConnectedSession() {
  session = null;
}

function config() {
  const baseUrl = import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("Integração indisponível: VITE_API_BASE_URL não foi configurada.");
  if (!session) throw new Error("Sua sessão expirou ou não foi iniciada.");
  return { baseUrl, session };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = config();
  let response: Response;
  try {
    response = await fetch(`${current.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${current.session.accessToken}`,
        "X-Organization-Id": current.session.organizationId,
        ...init.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    if (response.status === 401) clearConnectedSession();
    throw new Error(body?.detail || `Não foi possível concluir a operação (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function toFrontendLot(lot: ApiLot): Lote {
  return {
    id: lot.id,
    item: lot.item,
    categoria: lot.category as Lote["categoria"],
    quantidadeKg: lot.quantity_kg,
    conservacao: lot.conservation,
    preparadoEm: "",
    validade: lot.expires_at,
    janelaInicio: "",
    janelaFim: "",
    origem: "",
    status: lot.status,
    instituicaoId: lot.institution_id ?? undefined,
    transportadorId: lot.transporter_id ?? undefined,
    distanciaKm: 0,
    criadoEm: "",
  };
}

export const operationalApi = {
  async listLots(cursor?: string) {
    const page = await request<ApiPage>(
      `/operational/lots${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    );
    return { lots: page.items.map(toFrontendLot), nextCursor: page.next_cursor };
  },
  async createLot(input: NovoLoteInput) {
    const body = {
      item: input.item,
      category: input.categoria,
      quantity_kg: input.quantidadeKg,
      units: input.unidades,
      conservation: input.conservacao,
      prepared_at: input.preparadoEm,
      expires_at: input.validade,
      pickup_window_start: input.janelaInicio,
      pickup_window_end: input.janelaFim,
      origin: input.origem,
      notes: input.observacoes,
    };
    return toFrontendLot(
      await request<ApiLot>("/operational/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  },
  async reserveLot(id: string) {
    return toFrontendLot(
      await request<ApiLot>(`/operational/lots/${id}/reservations`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      }),
    );
  },
};
