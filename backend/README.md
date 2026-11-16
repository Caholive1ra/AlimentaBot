# Backend AlimentaBot

API FastAPI preparada para PostgreSQL. Este serviço é demonstrativo: cadastre apenas dados sintéticos e a aprovação sanitária é sempre uma decisão humana autorizada.

## Início local

Requer Python 3.11+ e PostgreSQL.

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest
```

`DATABASE_URL` aceita a forma `postgresql+psycopg://usuario:senha@host:5432/banco`. Para desenvolvimento temporário, testes usam SQLite em memória; produção deve usar PostgreSQL e executar `alembic upgrade head`.

## Contrato REST v1

Todos os recursos retornam apenas entidades sintéticas marcadas com `is_simulation: true`.

- `GET /health` — disponibilidade do processo e modo demonstrativo.
- `GET/POST /api/v1/lotes`, `GET /api/v1/lotes/{id}` — consulta e publicação.
- `POST /api/v1/lotes/{id}/revisoes` — gestor autorizado aprova ou rejeita manualmente.
- `POST /api/v1/lotes/{id}/reservas` — transportador compatível reserva uma única vez.
- `POST /api/v1/lotes/{id}/coletas` — registra coleta do transportador que reservou.
- `POST /api/v1/lotes/{id}/entregas` — instituição confirma ou recusa o recebimento.
- `GET /api/v1/lotes/{id}/custodia` — histórico auditável de eventos.

Próximos recursos previstos: `GET/POST /usuarios`, `GET/POST /instituicoes` e listas filtradas de revisões, reservas, coletas e entregas. A autenticação ainda não integra um provedor: para a demonstração, ações protegidas exigem `X-Demo-Role`, `X-Demo-Actor-Id` e, para revisão, `X-Sanitary-Authorized: true`. Isso não é autenticação de produção.

## Frontend

O mock permanece ativo em `src/services/api.ts`. Quando esta API estiver implantada e validada, implemente `src/services/httpAdapter.ts` usando `VITE_API_URL=http://localhost:8000/api/v1`; não substitua `mockAdapter` antes de testes de integração e autenticação real.

