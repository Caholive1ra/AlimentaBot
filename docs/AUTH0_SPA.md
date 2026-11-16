# Auth0 SPA com o AlimentaBot

## Estratégia

O frontend usa `@auth0/auth0-react` como cliente público SPA, com Authorization Code
Flow + PKCE. O access token é solicitado para `VITE_AUTH0_AUDIENCE`, mantido em memória
pelo SDK e enviado como `Authorization: Bearer` ao FastAPI. ID Token nunca é enviado à
API. Não há Client Secret no frontend.

O SDK oficial `@auth0/auth0-tanstack-start-react` não é usado: ele segue modelo de
sessão server-side e requer uma aplicação Auth0 **Regular Web Application**, incluindo
Client Secret. Isso seria uma estratégia diferente da SPA já configurada.

## URLs Auth0

Configure na aplicação SPA do Auth0:

| Campo Auth0           | Desenvolvimento         | Produção                         |
| --------------------- | ----------------------- | -------------------------------- |
| Allowed Callback URLs | `http://localhost:5173` | origem HTTPS pública do frontend |
| Allowed Logout URLs   | `http://localhost:5173` | origem HTTPS pública do frontend |
| Allowed Web Origins   | `http://localhost:5173` | origem HTTPS pública do frontend |

Ao usar preview, cadastre explicitamente cada origem permitida ou uma regra de domínio
revisada no painel Auth0. Não use URLs com caminho: callback e logout retornam à origem.

## Variáveis públicas do frontend

```env
VITE_DATA_MODE=connected
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AUTH0_DOMAIN=seu-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=client-id-da-spa
VITE_AUTH0_AUDIENCE=identifier-da-api-auth0
```

`Domain`, `Client ID` e `Audience` são identificadores públicos. Nunca use
`AUTH0_CLIENT_SECRET`, `DATABASE_URL` ou token em `VITE_*`.

## Variáveis do backend

```env
AUTH0_DOMAIN=seu-tenant.us.auth0.com
AUTH0_AUDIENCE=identifier-da-api-auth0
DEMO_MODE_ENABLED=false
```

O valor de audience deve ser idêntico no SPA e no backend. A API resolve o usuário
interno por `sub` e valida `X-Organization-Id` contra associação persistida; o header
não concede acesso por si só.

## Fluxo manual de validação

1. Inicie frontend e backend locais.
2. Abra `/operacional`, clique em **Entrar com Auth0** e conclua o Universal Login.
3. Após retorno, informe UUID de organização associado ao usuário de teste.
4. A API deve aceitar somente access token JWT válido para a audience configurada.
5. Tente UUID de outra organização: o FastAPI deve retornar `403`.
6. Clique em sair e confirme que uma chamada operacional não possui mais sessão em memória.
