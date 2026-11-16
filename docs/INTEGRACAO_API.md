# Integração futura com API REST (FastAPI + PostgreSQL)

> Status atual: **não existe backend**. Todo dado é sintético e fica no `localStorage` do navegador.

## Camadas
- `src/lib/domain/models.ts` — interfaces TypeScript (contrato de dados).
- `src/lib/domain/rules.ts` — regras de negócio puras (validação, ciclo de status, bloqueios).
- `src/services/store.ts` — armazenamento local por visitante.
- `src/services/api.ts` — interface `AlimentaApi` + `mockAdapter`. A UI só usa `api`.

## Como trocar o mock por fetch
1. Crie `src/services/httpAdapter.ts` implementando `AlimentaApi`, ex.:
   ```ts
   const BASE = import.meta.env.VITE_API_URL;
   export const httpAdapter: AlimentaApi = {
     async criarLote(input) {
       const r = await fetch(`${BASE}/lotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
       if (!r.ok) throw new Error((await r.json()).detail ?? "Erro");
       return refresh(); // GET /estado ou recarregar recursos e chamar setState
     },
     // ... aprovar: POST /lotes/{id}/aprovar, reservar: POST /lotes/{id}/reservar, etc.
   };
   ```
2. Em `api.ts`, troque `export const api = mockAdapter` por `httpAdapter`.
3. Replique as regras de `rules.ts` no servidor (validade, conservação, capacidade, janela, revisão humana, ordem de etapas, reserva única) — o front não deve ser a única barreira.

## Endpoints sugeridos
`GET /lotes`, `POST /lotes`, `POST /lotes/{id}/aprovar`, `POST /lotes/{id}/rejeitar`, `POST /lotes/{id}/reservar`, `POST /lotes/{id}/coletar`, `POST /lotes/{id}/confirmar`, `POST /lotes/{id}/recusar`, `GET /eventos`, `GET /notificacoes`.
