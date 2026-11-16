# Auth0 para o MVP AlimentaBot

O MVP usa OpenID Connect com Authorization Code Flow e PKCE na SPA. A API FastAPI
aceita somente access tokens JWT emitidos pelo Auth0, verificando assinatura contra o
JWKS, `iss`, `aud` e expiração. A identidade do token não concede, por si só, acesso a
uma organização: a associação `user + organization + role` é verificada no PostgreSQL.

## Configuração manual no Auth0

1. Crie uma **Single Page Application** em *Applications*. Em *Allowed Callback URLs*,
   inclua a URL local que o frontend realmente usa (por padrão `http://localhost:5173`).
   Inclua-a também em *Allowed Logout URLs* e *Allowed Web Origins*.
2. Crie uma **API** em *Applications > APIs*. Escolha um identificador estável para a
   audiência, como `https://api.sua-organizacao.example/alimentabot`. Não use uma
   credencial ou segredo como identificador.
3. Copie somente o Domain e o Client ID da SPA para o ambiente do frontend. O Client ID
   de uma SPA é público por design; **não** use Client Secret no navegador.
4. Copie o Domain e o Identifier (Audience) da API para `backend/.env`. A URL de JWKS é
   derivada como `https://<AUTH0_DOMAIN>/.well-known/jwks.json` e não precisa ser
   gravada manualmente.
5. Cadastre usuários e organizações de teste sintéticos. Crie, no PostgreSQL local,
   os vínculos de membro autorizados antes de permitir acesso a dados da organização.

## Variáveis

Backend (`backend/.env`, nunca versionado):

| Variável | Origem |
| --- | --- |
| `AUTH0_DOMAIN` | Domain do tenant Auth0, sem `https://` |
| `AUTH0_AUDIENCE` | Identifier da API Auth0 |
| `DEMO_MODE_ENABLED` | `true` apenas no ambiente demonstrativo local |

Frontend (quando o `httpAdapter` for implementado):

| Variável | Origem |
| --- | --- |
| `VITE_AUTH0_DOMAIN` | Domain do tenant Auth0 |
| `VITE_AUTH0_CLIENT_ID` | Client ID da aplicação SPA |
| `VITE_AUTH0_AUDIENCE` | Identifier da API Auth0 |
| `VITE_API_URL` | Base da API, por exemplo `http://localhost:8000/api/v1` |

Não coloque `AUTH0_CLIENT_SECRET`, token, chave privada, `DATABASE_URL` de produção ou
qualquer dado de pessoa atendida no frontend, em commits ou em arquivos `.env.example`.

## Limites do MVP

O modo demonstração continua isolado e sintético; ele não cria permissões reais para
usuários anônimos. A revisão sanitária registrada é operacional e não substitui uma
atestação ou certificado de profissional legalmente habilitado. O MVP não está
autorizado a operar doações reais até que requisitos sanitários, contratuais, de LGPD e
de operação aplicáveis sejam validados por responsáveis humanos competentes.
