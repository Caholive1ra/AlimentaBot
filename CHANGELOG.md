# Changelog

Este arquivo organiza os marcos publicados sem reescrever o histórico Git. As datas e
hashes abaixo correspondem aos commits existentes em `main`.

## Não lançado

- Padronização do processo de commits, releases e rastreabilidade.

## 2026-11-16

### Preparação de backend e produção — `c68b34a`

- API FastAPI, modelos SQLAlchemy e migrations Alembic para PostgreSQL.
- Base de Auth0/JWT, organizações e escopo por membro.
- Docker Compose com bancos locais separados para desenvolvimento e testes.
- Health/readiness, configuração de pool, CORS e limite de payload.
- Configurações de CI, Render e documentação de produção.
- Camada HTTP experimental, sem ativar o frontend conectado por padrão.

### Documentação inicial — `848f31e`

- README inicial do projeto.

### MVP demonstrativo — `d43afd6`

- Landing page e interface React/TypeScript para demonstração.
- Fluxos sintéticos de doador, gestor, transportador, instituição e simulador.
- Regras puras de domínio, adaptador mock e estado local por visitante.

## 2026-11-13

### Base do projeto — `2842fbf`

- Template TanStack Start/TypeScript de origem.

## Política de versões

Enquanto o produto estiver em evolução, use versões `0.x.y` e tags anotadas após a
validação de CI. Mudanças incompatíveis devem ser destacadas em `BREAKING CHANGE` no
corpo do commit e descritas neste arquivo.
