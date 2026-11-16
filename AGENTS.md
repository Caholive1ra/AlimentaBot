<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules

- Domain logic lives in pure functions in `src/lib/domain/rules.ts`; UI calls only `api` from `src/services/api.ts` — so a future HTTP adapter can replace the mock without touching pages.
- Demo state is per-visitor localStorage (`src/services/store.ts`) read via `useSyncExternalStore`; `/app` routes use `ssr: false` to avoid hydration mismatches with locally stored data.

## AlimentaBot backend and persistence rules

- Inspect the domain models/rules, services/store, role routes and `backend/` before proposing persistence or API changes.
- Preserve the pure frontend rules and `AlimentaApi` boundary. Do not replace the mock or alter UI flows before a reviewed HTTP adapter and integration tests exist.
- PostgreSQL/FastAPI/SQLAlchemy/Alembic live under `backend/`. Do not alter database schema in a planning stage and never edit `supabase/migrations/` or `drizzle/`.
- Demo data is synthetic and local by default. Never mix it with production records. Real operations require server authentication, organization-scoped authorization, and server-side validation.
- Sanitary review is an authorized human decision only; it is never automatic or AI-made, and a recorded review is not a legally valid sanitary certificate.
- Enforce expiry, compatibility, capacity, ordered state transitions, and a single active reservation server-side. Relevant custody changes are append-only audit events.
- Do not store unnecessary beneficiary data. Matching may be simulated only when explicit and unable to alter a lot status.
- Keep changes typed, small, testable, and modular. Do not use destructive database operations, force pushes, rebase, amend, or squash published history.

## Architecture reference and verification

- The planning reference is `docs/ARQUITETURA_BACKEND_POSTGRESQL.md`.
- Frontend checks: `npm run lint`, `npm test`, `npm run build`.
- Backend check (PowerShell, from `backend/`): `.\\.venv\\Scripts\\python.exe -m pytest -q`.
- A future local PostgreSQL setup uses an untracked `backend/.env` with `DATABASE_URL`, followed by reviewed `alembic upgrade head`. Never commit secrets or real beneficiary data.
