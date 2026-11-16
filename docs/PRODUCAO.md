# Guia de produção: Vercel + Render

Não execute deploy até que os bloqueios ao fim deste documento estejam resolvidos. Não
há credenciais, URLs reais ou dados pessoais neste repositório.

## Render: API e PostgreSQL

O app FastAPI é `backend/app/main.py`. O comando de produção é:

```sh
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers
```

`render.yaml` cria a definição de Web Service e banco. O endpoint `/health` é liveness
do processo; `/ready` verifica `SELECT 1` no PostgreSQL e é o health check do Render.
O start command **não** executa migration automaticamente. Em cada release, um operador
autorizado deve executar `alembic upgrade head` uma única vez contra o banco correto,
depois de backup e revisão da migration. Rollback de aplicação só é permitido quando a
migration continuar compatível; não faça downgrade automático nem destrutivo.

Variáveis no Render:

| Nome | Valor/origem |
| --- | --- |
| `DATABASE_URL` | Internal Database URL do PostgreSQL Render, no mesmo workspace/região |
| `APP_ENV` | `production` |
| `DEMO_MODE_ENABLED` | `false` |
| `CORS_ORIGINS` | URLs Vercel Production e Preview explicitamente aprovadas, separadas por vírgula |
| `AUTH0_DOMAIN` | tenant Auth0, sem `https://` |
| `AUTH0_AUDIENCE` | Identifier da API Auth0 |
| `DB_POOL_SIZE` | iniciar em `5`, ajustar conforme plano e número de instâncias |
| `DB_MAX_OVERFLOW` | iniciar em `2` |
| `MAX_REQUEST_BODY_BYTES` | `1048576` salvo requisito revisado |

Use logs estruturados/redigidos: nunca registre Authorization, cookies, payloads de
beneficiários ou URLs de banco. Configure alerta de indisponibilidade para `/ready` e
alertas de erro no painel Render. Defina backups, retenção e teste de restauração no
painel do banco conforme plano contratado; restaure sempre primeiro em banco de teste.

## Vercel

O diretório raiz do frontend é a raiz do repositório; `npm run build` gera `.output` com
preset Nitro atual **Cloudflare**, não Vercel. Portanto não há configuração Vercel segura
para publicar o SSR atual ainda. Não configure Output Directory manualmente como
`.output/public`: isso perderia o servidor Nitro e pode quebrar refresh/rotas.

Para tornar Vercel viável, escolha e teste uma das opções antes de publicar:

1. mudar o preset Nitro/TanStack Start para Vercel e validar `npm run build`; ou
2. converter conscientemente o frontend em SPA estática e criar rewrite testado para
   todas as rotas, inclusive `/app/doador`.

Quando a opção for validada, adicione em Vercel apenas `VITE_API_BASE_URL` com a URL
pública HTTPS da API. Em Preview, use uma API de preview/teste separada; nunca o banco
de produção. Não inclua segredos em variáveis `VITE_*`.

## Checklist pós-release

1. Confirmar `/health` e `/ready` HTTPS.
2. Confirmar CORS apenas para origens esperadas.
3. Executar login Auth0 com usuário sintético e teste de 401/403.
4. Criar um lote sintético e confirmar persistência após reinício da API.
5. Conferir logs sem tokens, dados pessoais ou connection strings.
6. Validar backup e procedimento de restore no banco de teste.

## Bloqueios de produção

- Frontend ainda usa o modo demo e o bundle Nitro está preparado para Cloudflare, não Vercel.
- Fluxos autenticados completos (revisão, coleta, entrega, custódia, métricas) ainda não
  estão disponíveis no contrato operacional.
- Não há rate limiting distribuído para endpoints autenticados/sensíveis.
- A migration inicial precisa ser convertida de `create_all` para DDL explícito imutável.
- Auth0, observabilidade externa, política jurídica de retenção e teste de restore ainda
  dependem de configuração humana.
