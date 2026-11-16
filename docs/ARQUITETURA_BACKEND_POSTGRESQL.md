# Arquitetura de persistência e contratos REST — AlimentaBot

## Escopo e evidências da auditoria

Esta etapa é documental: não altera o domínio, o mock, o frontend, migrations ou banco.

| Área inspecionada | Evidência | Direção arquitetural |
| --- | --- | --- |
| `src/lib/domain/models.ts` | Lote, instituição, transportador, evento e sete estados. | Tipos/estados atuais são a base do contrato. |
| `src/lib/domain/rules.ts` | Validação, compatibilidade, capacidade, reserva, coleta e recebimento são funções puras. | Regras devem ser revalidadas no servidor; cliente não é fronteira de segurança. |
| `src/services/api.ts` | `AlimentaApi` usa `mockAdapter`. | Criar futuro `httpAdapter` compatível, sem reescrever páginas. |
| `src/services/store.ts` e `seed.ts` | Seed e estado por visitante em `localStorage`. | Permanecem como demo isolada. |
| Painéis de papel | Doador publica; gestor revisa; transportador reserva/coleta; instituição recebe/recusa. | Determinam operações e permissões. |
| `backend/` | FastAPI/SQLAlchemy/Alembic já têm lotes, revisão, reserva, coleta, entrega e custódia com cabeçalhos demo. | Base parcial: faltam identidade real, organizações e isolamento de tenant. |

O frontend calcula distância hipotética, usa notificações locais e não possui autenticação real. O backend atual já aplica parte do ciclo, porém cabeçalhos `X-Demo-*` não são seguros para produção.

## Dados persistentes versus locais

Persistir no PostgreSQL: usuários, organizações e membros, perfis de transporte, instituições, lotes, revisão sanitária humana, reservas/atribuições, coleta, recebimento e eventos de custódia. Indicadores devem ser consultas agregadas; não criar uma tabela de dashboard inicialmente.

Continuar locais: estado sintético, filtros, modais, toasts, rascunhos não enviados e preferências de interface. Notificações ficam locais até haver requisito operacional. Distância e matching continuam sugestão demonstrativa, explicitamente identificada, e nunca são evidência de operação.

Não persistir dados de beneficiários. A necessidade atual é atendida por instituição e capacidade agregada, sem cadastro de pessoas atendidas.

## Estrutura proposta para `backend/`

Preservar o módulo atual e evoluir em partes:

```text
backend/app/
  api/v1/routes/       # auth, me, organizations, lots, reviews, opportunities,
                       # assignments, custody, dashboard
  core/                # config, security, database, errors
  domain/              # enums e regras puras
  models/              # SQLAlchemy, por agregado
  schemas/             # DTOs Pydantic
  repositories/        # consultas e locks transacionais
  services/            # casos de uso e autorização contextual
  dependencies/        # ator autenticado, tenant, paginação
  tests/               # unitários + integração PostgreSQL
```

Rotas ficam sob `/api/v1`; usar UUID e datas ISO 8601 UTC. O servidor é a fonte de verdade para status. A divisão do atual `services/lots.py` só deve ocorrer quando o próximo recurso exigir: não é uma refatoração prévia obrigatória.

## Modelo relacional PostgreSQL

Todas as entidades de negócio usam UUID, `created_at timestamptz` e, quando mutáveis, `updated_at timestamptz`. Toda tabela de negócio inclui `organization_id uuid not null`, com filtro obrigatório do tenant no repositório.

```text
users ──< organization_members >── organizations
  │                                  │
  ├──< transporter_profiles          ├──< institutions
  ├──< sanitary_reviews              │       │
  └──< custody_events                └──< lots >── sanitary_reviews
                                             │ ├── reservation (0..1)
                                             │ ├── transport_assignment (0..1)
                                             │ ├── pickup (0..1)
                                             │ ├── delivery (0..1)
                                             │ └── custody_events (0..n)
```

| Tabela | Campos, constraints e propósito |
| --- | --- |
| `users` | `id`, `auth_subject unique`, `display_name` opcional. O provedor é dono da credencial; não gravar senha/token. |
| `organizations` | `id`, `name`, `kind` (`DONOR`, `RECIPIENT`, `TRANSPORT`, `OPERATOR`), `active`. |
| `organization_members` | `organization_id`, `user_id`, `role`, `active`, `unique(organization_id, user_id)`. |
| `institutions` | `organization_id unique`, nome, bairro opcional, `capacity_kg > 0`, conservações aceitas. Janelas múltiplas ficam para uma tabela posterior se necessárias. |
| `transporter_profiles` | `organization_id unique`, veículo descritivo, `capacity_kg > 0`, `refrigerated`. Não coletar placa/GPS sem requisito. |
| `lots` | Doador, item, categoria, quantidade, unidades, conservação, preparo, validade, janela, origem, observações, status, instituição e transportador. Checks: quantidade positiva, unidades não negativas, preparo ≤ validade, `pickup_start < pickup_end <= expires_at`; refeição pronta não pode ser ambiente. |
| `sanitary_reviews` | lote, revisor/membro, decisão, motivo, `human_authorized`, data. Aprovação exige humano autorizado e destino compatível; não é atestado legal. |
| `reservations` | lote, transportador/membro, data, estado; `unique(lot_id)` para a reserva ativa ou índice parcial caso haja cancelamento histórico. |
| `transport_assignments` | lote único, perfil/organização de transporte, estado. Na v1 pode coincidir com reserva; separar somente se despacho manual entrar no escopo. |
| `pickups` / `deliveries` | `lot_id unique`, ator/data; entrega inclui `accepted` e motivo obrigatório na recusa. |
| `custody_events` | lote, ator anulável para sistema, papel, tipo, detalhe JSONB limitado e data. Append-only: sem edição ou endpoint de remoção. |

Índices mínimos: `lots(organization_id, status, expires_at)`, `lots(institution_id, status)`, `lots(transporter_profile_id, status)`, `custody_events(lot_id, occurred_at desc)` e `organization_members(user_id, organization_id)`. Transições usam transação e lock do lote (`SELECT ... FOR UPDATE`); a unicidade de reserva é a segunda defesa contra concorrência.

## Estados e invariantes

```text
PENDENTE_REVISAO --aprovar humano--> LIBERADO --reservar--> RESERVADO --coletar--> COLETADO --aceitar--> ENTREGUE
        |                                  |                                                    \--recusar--> RECUSADO
        \--rejeitar humano---------------> REJEITADO
```

Não há reversão implícita. Cancelamento, expiração pós-publicação e reatribuição exigem decisão de produto antes de rotas. Em toda transição: validar tenant, ator, estado, validade, compatibilidade/capacidade e gerar evento de custódia na mesma transação. Lote vencido ou incompatível não é reservável; dupla reserva e confirmação fora de ordem retornam conflito.

## Contratos REST `/api/v1`

### Convenções

- Operações reais exigem `Authorization: Bearer <access-token>`; cliente não informa livremente um `organization_id` para obter dados de outro tenant.
- Listas: `limit` 1–100 (padrão 20), `cursor` opaco, retorno `{ "items": [], "next_cursor": null }`.
- Filtros permitidos: `status`, `category`, `conservation`, `institution_id`, `from`, `to` e `q` quando aplicável.
- Erros: `401` token ausente/inválido; `403` papel insuficiente; `404` inexistente ou fora do tenant; `409` estado/expiração/capacidade/reserva; `422` payload inválido; `429` rate limit.
- Mutação operacional aceita `Idempotency-Key`; retornará a representação final do lote.

| Área | Rotas | Papel requerido |
| --- | --- | --- |
| Identidade | `GET /me`; `POST /auth/exchange` apenas se houver troca de token do provedor | autenticado |
| Organizações | `GET/POST /organizations`; `GET/PATCH /organizations/{id}`; `GET/POST/PATCH /organizations/{id}/members` | owner/membro, conforme ação |
| Instituições | `GET/POST /institutions`; `GET/PATCH /institutions/{id}` | owner ou operador receptor autorizado |
| Lotes | `GET/POST /lots`; `GET /lots/{id}` | doador cria; leitura por escopo |
| Revisão | `POST /lots/{id}/sanitary-reviews` | revisor sanitário humano autorizado |
| Oportunidades | `GET /opportunities` | transportador; somente liberados, não vencidos e compatíveis |
| Reserva/atribuição | `POST /lots/{id}/reservations`; `GET /assignments`; `POST /lots/{id}/assignments` se houver despacho | transporte |
| Custódia | `POST /lots/{id}/pickups`; `POST /lots/{id}/deliveries`; `GET /lots/{id}/custody-events` | ator atribuído/destino/leitores por escopo |
| Dashboard | `GET /dashboard/metrics?from=&to=` | membro autorizado; agregado do tenant |

Exemplos:

```json
POST /api/v1/lots
{
  "item": "Pães integrais do dia",
  "category": "panificacao",
  "quantity_kg": 12.5,
  "units": 80,
  "conservation": "ambiente",
  "prepared_at": "2026-11-16T12:00:00Z",
  "expires_at": "2026-11-17T12:00:00Z",
  "pickup_window_start": "2026-11-16T15:00:00Z",
  "pickup_window_end": "2026-11-16T18:00:00Z",
  "origin": "Padaria Parceira",
  "notes": "Lote sintético de homologação"
}
```

```json
POST /api/v1/lots/{lot_id}/sanitary-reviews
{
  "decision": "APPROVED",
  "institution_id": "f3e0a35f-85e5-49a0-9a31-1a31ab54819b",
  "reason": "Checklist interno concluído"
}

200 OK
{ "id": "2bc4b3f6-86a8-4e30-9f53-50ccff8b37c1", "status": "LIBERADO" }
```

```json
POST /api/v1/lots/{lot_id}/deliveries
{ "accepted": true }

200 OK
{ "id": "2bc4b3f6-86a8-4e30-9f53-50ccff8b37c1", "status": "ENTREGUE" }
```

`accepted: false` exige `reason`. O DTO/documentação de revisão deve sempre informar: “Registro operacional; não substitui atestado sanitário juridicamente válido.”

## Matriz de permissões

| Ação | Doador | Revisor | Transporte | Instituição | Owner |
| --- | --- | --- | --- | --- | --- |
| Criar/ver próprios lotes | sim | leitura por escopo | não | destinados | sim no tenant |
| Aprovar/rejeitar | não | sim, autorizado | não | não | se também revisor |
| Oportunidades/reserva | não | não | sim, compatíveis | não | conforme papel |
| Coleta | não | não | somente atribuído | não | conforme papel |
| Receber/recusar | não | não | não | somente destino | conforme papel |
| Gerir membros | não | não | não | não | sim |
| Ler custódia | próprios | revisão | atribuições | recebimentos | sim no tenant |

O papel vem de `organization_members`, nunca de cabeçalho do navegador. A mesma pessoa pode pertencer a organizações diferentes; cada requisição executa dentro de uma organização autorizada.

## Autenticação, autorização e demonstração

Para o MVP real, adotar provedor OIDC gerenciado a ser escolhido pelo time. O frontend envia token de curta duração e o FastAPI valida assinatura, `issuer`, `audience`, expiração e `sub`; mapeia `sub` a `users.auth_subject` e aplica tenant/papel no servidor. Não implementar senha própria. Tokens, chaves e dados reais não entram no repositório ou bundle.

O demo continua com seed sintético/localStorage/mock. Ele não envia token real nem chama endpoints de produção. Se houver API demo em desenvolvimento, usar banco/schema/tenant separado, identidades sintéticas, retenção definida e nenhuma pessoa real. Nunca aceitar `is_simulation` do cliente como autorização.

O matching poderá devolver sugestão opcional (`suggested_institution_id`, `score`, `explanation`, `simulated: true`), mas não aprova, não reserva e não muda status.

## Decisões tomadas e pontos em aberto

Decisões: PostgreSQL transacional; UUID/timestamps/tenant padrão; custódia append-only; indicadores agregados; cliente não é autoridade; aprovação sanitária humana autorizada; demo separada de produção.

Exigem decisão humana:

1. Provedor OIDC e fluxo de convite/ativação de membros.
2. Se uma organização pode ter múltiplos tipos operacionais.
3. Cancelamento, reatribuição, expiração pós-publicação e retenção de eventos.
4. Calendário/feriados e múltiplas janelas de instituição.
5. Documentos/comprovantes legalmente exigidos; não modelar validade sanitária sem orientação jurídica.
6. Auto-reserva, despacho manual ou ambos — define se `transport_assignments` entra na primeira migration.
7. LGPD, retenção e responsáveis antes de dados reais.

## Plano incremental

1. Decidir OIDC, tenant e regras pendentes; acrescentar testes de contrato/concorrência.
2. Criar `users`, `organizations`, membros e dependência de token; testar isolamento.
3. Persistir instituições e perfis de transporte com constraints.
4. Migrar o ciclo de lotes em transação, com locks e testes PostgreSQL.
5. Adicionar oportunidades, filtros/paginação, custódia e métricas agregadas; matching segue simulado.
6. Criar `httpAdapter` compatível com `AlimentaApi`, feature flag e testes de integração; somente então alterar o ambiente que usa mock.

## Verificação

```powershell
# raiz
npm run lint
npm test
npm run build

# backend, após instalar .[dev]
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Em etapa futura, provisionar PostgreSQL, criar `backend/.env` não versionado a partir de `.env.example`, configurar `DATABASE_URL`, revisar migrations e executar `alembic upgrade head`. Não executar reset/downgrade em banco compartilhado ou com dados reais.
