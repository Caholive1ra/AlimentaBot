# Contribuição e histórico Git

## Regra essencial

`main` é uma linha de histórico aditiva. Não use `git push --force`, `git rebase`,
`git commit --amend` ou squash de commits que já chegaram ao GitHub/Lovable.

## Fluxo

1. Crie uma branch curta a partir de `main`.
2. Faça uma alteração coesa por commit.
3. Execute os checks aplicáveis antes de abrir PR.
4. Faça merge somente com CI verde e revisão concluída.
5. Atualize `CHANGELOG.md` para marcos e mudanças relevantes ao usuário.

## Convenção de commits

Use Conventional Commits em português ou inglês, com escopo quando útil:

```text
feat(api): adicionar reserva idempotente
fix(frontend): apresentar erro de validação da API
test(backend): cobrir acesso entre organizações
docs(producao): detalhar rollback de migration
ci: executar migrations em PostgreSQL temporário
chore(deps): atualizar dependência vulnerável
```

O corpo deve explicar motivação, risco e como foi testado quando a mudança afeta
segurança, dados, migrations, autenticação ou produção.

## Commits e migrations

- Uma migration revisada deve ir no mesmo commit que os modelos e testes que a exigem.
- Não altere uma migration aplicada em ambiente compartilhado; crie uma nova migration
  aditiva e compatível com rollback planejado.
- Não inclua `.env`, backups, dados reais, tokens ou URLs com credenciais.

## Checks mínimos

```powershell
npm run lint
npm run typecheck
npm test
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```
