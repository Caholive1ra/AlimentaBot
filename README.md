<img width="1536" height="1024" alt="AlimentaBot_ Robô Nutritivo" src="https://github.com/user-attachments/assets/94c9b591-1115-47e4-825d-0be488765fea" />
# AlimentaBot

> **Alimento bom não deveria virar desperdício.**

O AlimentaBot é um projeto acadêmico da **FIAP Global Solution 2026** que demonstra como excedentes alimentares seguros podem ser organizados entre doadores, transportadores e instituições. A experiência pública executa um fluxo completo com dados sintéticos; o repositório também traz uma API FastAPI e a base PostgreSQL para uma evolução controlada do produto.

> [!IMPORTANT]
> Este é um projeto demonstrativo: não opera doações reais, não coleta dados de beneficiários e não substitui inspeção, certificação ou decisão sanitária de profissional legalmente habilitado.

## Índice

- [Visão do produto](#visão-do-produto)
- [Status e limites](#status-e-limites)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Início rápido](#início-rápido)
- [Configuração](#configuração)
- [API e autenticação](#api-e-autenticação)
- [Qualidade e testes](#qualidade-e-testes)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Contribuição](#contribuição)

## Visão do produto

O desperdício de alimentos também é um problema de coordenação: é preciso saber se o lote ainda é válido, como foi conservado, quem pode buscá-lo e qual destino tem capacidade para recebê-lo. O AlimentaBot organiza esse fluxo em etapas rastreáveis:

```text
Doador publica → revisão humana autorizada → reserva e coleta → conferência no destino
```

O matching é apenas uma **sugestão simulada**. Antes dela, o sistema considera validade, conservação, capacidade e janela de coleta. A decisão de liberar um lote permanece humana e registrada.

## Status e limites

| Área | Estado atual |
| --- | --- |
| Landing e demonstração | Prontas para navegação, responsivas e em português brasileiro. |
| Fluxo demonstrativo | Funcional no mesmo navegador, usando somente estado sintético no `localStorage`. |
| Backend | API FastAPI com PostgreSQL, migrations, testes, JWT/Auth0 e rotas operacionais em evolução. |
| Integração padrão da interface | Mantém o adaptador mock; a UI principal não aponta para a API automaticamente. |
| Produção | Bloqueada até validações de infraestrutura, segurança, LGPD e operação descritas em [Produção](docs/PRODUCAO.md). |

Não fazem parte do MVP: pagamentos, recompensas, patrocínios, GPS real, parceiros/clientes reais, decisões sanitárias automáticas, IA que altere status de lotes, robôs ou smart lockers operacionais.

## Funcionalidades

### Experiência pública

- Landing page em `/` com proposta, fluxo, público-alvo, tecnologia, FAQ e equipe.
- Experiência guiada em `/experiencia`, com narrativa do fluxo demonstrativo.
- Cadastro público em `/cadastro` e entrada operacional em `/operacional` quando o ambiente conectado estiver configurado.

### Plataforma demonstrativa

As rotas `/app/*` não exigem login e exibem o chip de demonstração. Cada visitante possui um estado local independente e pode reiniciá-lo.

| Papel/rota | O que demonstra |
| --- | --- |
| `/app/doador` | Cadastro de excedente, filtros, consulta e validações de lote. |
| `/app/gestor` | Revisão humana hipotética, aprovação/rejeição e escolha de instituição compatível. |
| `/app/operador` | Indicadores, atividades, notificações e reinício da demo. |
| `/app/transportador` | Oportunidades, compatibilidade, reserva única e registro de coleta. |
| `/app/instituicao` | Capacidade, lotes destinados e confirmação ou recusa do recebimento. |
| `/app/simulador` | Comparação acadêmica e sintética de cenários de matching. |

### Regras do domínio

As regras puras estão em [`src/lib/domain/rules.ts`](src/lib/domain/rules.ts) e são cobertas por testes.

- Novo lote inicia como `PENDENTE_REVISAO`.
- Item, peso, validade, preparação, janela e conservação são validados.
- Refeições prontas não podem ser cadastradas em temperatura ambiente.
- Instituição precisa aceitar a conservação e ter capacidade disponível.
- Transportador precisa comportar o peso e oferecer refrigeração quando necessária.
- Há uma única reserva por lote e as transições ocorrem em ordem.
- Eventos de custódia e notificações são criados a cada etapa.

```text
PENDENTE_REVISAO → LIBERADO → RESERVADO → COLETADO → ENTREGUE
       └────────→ REJEITADO                  └──────→ RECUSADO
```

## Arquitetura

```text
src/
├── routes/                 # Rotas file-based do TanStack Start
├── components/             # Landing, experiência e painéis por papel
├── lib/domain/             # Modelos e regras de negócio puras
├── services/
│   ├── api.ts              # Contrato AlimentaApi e adaptador mock ativo
│   ├── store.ts            # Estado local sintético por visitante
│   └── http.ts             # Cliente experimental para endpoints operacionais
└── auth/                   # Auth0 SPA; tokens somente em memória

backend/
├── app/api/routes/         # Health, identidade, acesso, demo, lotes e operações
├── app/services/           # Casos de uso e autorização contextual
├── app/repositories/       # Consultas por organização
├── app/models.py           # Modelos SQLAlchemy
├── alembic/                # Histórico de migrations PostgreSQL
└── tests/                  # Testes de API, autorização e regras operacionais
```

A interface depende somente da abstração `AlimentaApi`. Isso preserva o fluxo de demonstração e permite a futura troca por um adaptador HTTP sem reescrever as páginas. O servidor, quando usado, é a fonte de verdade: as regras precisam ser revalidadas nele.

## Tecnologias

| Camada | Principais tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, TanStack Start/Router, Vite, Tailwind CSS e Radix UI |
| Formulários e gráficos | React Hook Form, Zod, Recharts e Sonner |
| Testes frontend | Vitest e Testing Library |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2 e Pydantic Settings |
| Banco e migrations | PostgreSQL 16, Psycopg e Alembic |
| Identidade conectada | Auth0/OIDC com Authorization Code Flow + PKCE |
| Ambiente local | Docker Compose (web, API, banco de desenvolvimento e banco de testes) |

## Início rápido

### Pré-requisitos

- Node.js 22+ e npm;
- para o backend: Python 3.11+ e PostgreSQL 16+, ou Docker Desktop;
- Git.

### Frontend demonstrativo

```powershell
git clone <url-do-repositorio>
cd AlimentaBot
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:5173`. O padrão é `VITE_DATA_MODE=demo`, portanto não são necessárias credenciais para conhecer a plataforma.

### Backend local

Crie `backend/.env` a partir do exemplo e mantenha somente dados sintéticos no ambiente local.

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

A API fica em `http://localhost:8000`, com documentação interativa em `/docs`, health check em `/health` e readiness com banco em `/ready`.

### Tudo com Docker

Na raiz do repositório:

```powershell
docker compose up --build
```

| Serviço | Endereço/porta | Finalidade |
| --- | --- | --- |
| `web` | `http://localhost:5173` | Frontend Vite. |
| `api` | `http://localhost:8000` | FastAPI com migrations locais aplicadas. |
| `db` | `localhost:5432` | PostgreSQL de desenvolvimento. |
| `db_test` | `localhost:5433` | PostgreSQL isolado para testes. |

## Configuração

### Frontend

Copie `.env.example` para `.env.local`. Nunca inclua segredos em variáveis `VITE_*`, pois elas são expostas no bundle do navegador.

| Variável | Uso |
| --- | --- |
| `VITE_DATA_MODE` | `demo` mantém a experiência local; `connected` habilita a autenticação operacional se todas as variáveis Auth0 estiverem preenchidas. |
| `VITE_API_BASE_URL` | Base da API, por exemplo `http://localhost:8000/api/v1`. |
| `VITE_AUTH0_DOMAIN` | Domínio público do tenant Auth0, sem `https://`. |
| `VITE_AUTH0_CLIENT_ID` | Client ID público da SPA Auth0. |
| `VITE_AUTH0_AUDIENCE` | Identifier/audience da API Auth0. |

### Backend

Copie `backend/.env.example` para `backend/.env`. Não versione esse arquivo.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL da aplicação. |
| `TEST_DATABASE_URL` | Conexão do banco de testes local. |
| `CORS_ORIGINS` | Origens explícitas, separadas por vírgula. |
| `AUTH0_DOMAIN` / `AUTH0_AUDIENCE` | Validação de access tokens JWT do Auth0. |
| `DEMO_MODE_ENABLED` | Somente em ambiente demonstrativo local; deve ser `false` em produção. |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | Ajustes do pool de conexões. |
| `MAX_REQUEST_BODY_BYTES` | Limite de corpo HTTP; padrão de 1 MiB. |

## API e autenticação

Há dois conjuntos de rotas no backend:

| Conjunto | Finalidade | Autorização |
| --- | --- | --- |
| `/api/v1/demo/*` e `/api/v1/lotes/*` | Recursos sintéticos para desenvolvimento e demonstração da API. | Cabeçalhos `X-Demo-*` somente em modo demo; não são autenticação de produção. |
| `/api/v1/operational/*`, `/api/v1/me` e `/api/v1/access/*` | Base conectada: organizações, perfis, lotes, revisões, reservas, convites e solicitações. | Bearer JWT Auth0 + organização e papel validados no servidor. |

Endpoints de interesse:

- `GET /health` e `GET /ready`;
- `GET /api/v1/me` para contexto das organizações autorizadas;
- `POST /api/v1/access/registration-requests`, `POST /invitations` e `POST /invitations/accept`;
- `GET|POST|PATCH /api/v1/operational/lots`;
- `POST /api/v1/operational/lots/{id}/reviews` e `/reservations`;
- `GET|POST /api/v1/lotes`, com revisão, reserva, coleta, entrega e histórico de custódia demonstrativos;
- `POST /api/v1/demo/sessions`, `GET /state` e `POST /reset`.

No modo conectado, o frontend usa `@auth0/auth0-react`. O access token permanece em memória; o ID Token não é enviado à API. O servidor verifica assinatura, emissor, audience e expiração, e só então resolve o escopo pela associação persistida de usuário, organização e papel.

Consulte [a configuração Auth0 da SPA](docs/AUTH0_SPA.md), [o guia Auth0 do backend](backend/docs/AUTH0.md) e [o contrato REST](backend/docs/API_REST.md) antes de integrar ambientes reais.

## Qualidade e testes

Execute, na raiz:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Para o backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Os testes frontend cobrem regras de domínio, estado operacional e rotas/experiência. Os testes backend cobrem health, sessão demo, lotes, fluxo operacional, JWT, identidade, controle de acesso e isolamento entre organizações.

## Segurança, privacidade e operação responsável

- Use exclusivamente dados sintéticos no MVP e nos ambientes de demonstração.
- Não cadastre beneficiários: a necessidade é representada por instituição e capacidade agregada.
- Não armazene senhas, tokens, `DATABASE_URL`, chaves privadas ou segredo Auth0 no repositório ou bundle.
- A revisão sanitária é uma decisão humana autorizada; seu registro é operacional, não um certificado sanitário legal.
- Eventos relevantes de custódia devem permanecer append-only; não use o cliente como fronteira de segurança.
- Para produção, implemente autorização por organização no servidor, CORS explícito, limites, observabilidade com redação de dados e política de retenção revisada.

A proposta técnica de minimização e retenção está em [Retenção de dados](backend/docs/RETENCAO_DADOS.md).

## Deploy

O repositório contém uma definição de API/PostgreSQL para Render em [`render.yaml`](render.yaml). O frontend atual gera um bundle Nitro configurado para Cloudflare; **não publique em Vercel** antes de validar o preset/roteamento ou uma conversão para SPA estática.

Antes de qualquer publicação, siga o [guia de produção](docs/PRODUCAO.md). Ele descreve variáveis, migrations revisadas, CORS, health checks, backup/restore e os bloqueios atuais. Migrations não devem ser executadas automaticamente no start de produção, nem sofrer downgrade destrutivo em bancos compartilhados.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Arquitetura PostgreSQL](docs/ARQUITETURA_BACKEND_POSTGRESQL.md) | Decisões de persistência, domínio, autorização e plano incremental. |
| [Integração com API](docs/INTEGRACAO_API.md) | Evolução da interface mock para adaptador HTTP. |
| [Produção](docs/PRODUCAO.md) | Estratégia de deploy, variáveis e bloqueios. |
| [Auth0 SPA](docs/AUTH0_SPA.md) | Configuração da autenticação no frontend. |
| [API REST](backend/docs/API_REST.md) | Contratos e ciclo de vida de lotes. |
| [Auth0 no backend](backend/docs/AUTH0.md) | Validação JWT e escopo organizacional. |
| [Contribuindo](docs/CONTRIBUINDO.md) | Commits, checks e migrations. |
| [Changelog](CHANGELOG.md) | Marcos publicados e política de versões. |

## Contribuição

1. Crie uma branch curta a partir de `main`.
2. Mantenha cada commit coeso e use Conventional Commits.
3. Rode os checks aplicáveis antes de abrir uma PR.
4. Não versione `.env`, backups, tokens, dados reais ou URLs com credenciais.
5. Não use `git push --force`, rebase, amend ou squash de commits já publicados: o projeto sincroniza com o Lovable e o histórico deve ser aditivo.

Leia [CONTRIBUINDO.md](docs/CONTRIBUINDO.md) para as regras completas.

## Equipe

- Carolina Feitosa — RM 563049
- Guilherme Machado — RM 564658

---

Feito com React, TypeScript, FastAPI e uma visão prática de reduzir desperdício com responsabilidade.
