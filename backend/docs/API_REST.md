# Contrato REST proposto — `/api/v1`

Todos os recursos são demonstrativos: `is_simulation: true` é obrigatório e nenhum endpoint aceita dados reais de beneficiários. Datas são ISO 8601 em UTC; erros de regra retornam `409`, autorização insuficiente retorna `403` e dados inválidos retornam `422`.

## Identidade e cadastros

| Recurso | Operações | Campos relevantes |
| --- | --- | --- |
| `usuarios` | `GET`, `POST`, `GET /{id}` | `name`, `role`, `authorized_sanitary_reviewer`, perfil de veículo/capacidade |
| `instituicoes` | `GET`, `POST`, `GET /{id}` | `name`, `neighborhood`, `capacity_kg`, `accepted_conservation` |
| `lotes` | `GET`, `POST`, `GET /{id}` | item, categoria, peso, conservação, preparo, validade, janela, origem, status |

Em produção, a identidade virá de token e o papel será obtido no servidor. Os cabeçalhos `X-Demo-*` existem somente enquanto a API for demonstrativa.

## Ciclo de um lote

| Ação | Endpoint | Papel | Pré-condições |
| --- | --- | --- | --- |
| Publicar | `POST /lotes` | doador | validade e janela futuras; estado inicial `PENDENTE_REVISAO` |
| Revisar | `POST /lotes/{id}/revisoes` | gestor humano autorizado | decisão aprovada/rejeitada; aprovação define destino compatível |
| Reservar | `POST /lotes/{id}/reservas` | transportador | lote liberado, não vencido, veículo compatível, uma única reserva |
| Coletar | `POST /lotes/{id}/coletas` | transportador reservado | lote reservado |
| Receber | `POST /lotes/{id}/entregas` | instituição | lote coletado; confirma ou recusa com motivo |
| Auditar | `GET /lotes/{id}/custodia` | papéis autorizados | retorna eventos imutáveis ordenados por data |

`POST /revisoes` nunca pode ser automatizado: qualquer campo de matching/IA pode ser incluído como sugestão explicável em futura versão, mas não muda o estado do lote. A única transição para `LIBERADO` requer registro `SanitaryReview.human_authorized=true` de gestor autorizado.

## Esquema relacional

`users` (papel e perfil de transportador) → `lots` (doador, destino, transportador) → `sanitary_reviews`, `reservations`, `pickups`, `deliveries`, `custody_events`. A restrição `uq_reservation_lot` impede reservas duplicadas mesmo sob concorrência. As tabelas de coleta e entrega também são um-para-um por lote.

