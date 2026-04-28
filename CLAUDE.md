# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the stack

Everything runs via Docker Compose:

```bash
docker compose up --build        # start all services (db + api + web)
docker compose up --build api    # rebuild and restart only the API
docker compose down -v           # stop and delete volumes (resets DB)
```

The API hot-reloads via `uvicorn --reload`; the frontend hot-reloads via Vite. No manual restart needed after file edits while containers are running.

Services:
- API: http://localhost:8000 — FastAPI, auto-docs at `/docs`
- Web: http://localhost:5173 — React/Vite
- DB: postgres://tracker:tracker@localhost:5432/tracker

## Running the API outside Docker (local dev)

```bash
cd api
pip install -r requirements.txt
DATABASE_URL=postgresql+psycopg://tracker:tracker@localhost:5432/tracker uvicorn app.main:app --reload
```

## Running the frontend outside Docker

```bash
cd web
npm install
npm run dev         # dev server
npm run build       # tsc + vite build (type-checks too)
```

There is no test suite yet.

## Architecture

### Backend (`api/`)

FastAPI app with SQLAlchemy (sync ORM, psycopg v3). Schema:

- **Project** → has many **Issue** → has many **Comment** (all cascade-delete)
- `Issue.closed_at` is set automatically when `status` transitions to `done`, and cleared when transitioning away — this logic lives in `routers/issues.py:update_issue`, not in the model.
- DB tables are created at startup via `Base.metadata.create_all`. There are no migration files (no Alembic). Schema changes require `docker compose down -v && docker compose up --build`.
- `SEED_ON_START=true` triggers `seed.py` to populate sample data on first boot (only if tables are empty).
- Settings come from `app/config.py` (`pydantic-settings`), reading `.env` — `DATABASE_URL` and `SEED_ON_START`.

Router layout — each file owns its own `APIRouter`, all registered in `main.py`:
- `routers/projects.py` — CRUD for projects
- `routers/issues.py` — CRUD for issues (nested under `/projects/{id}/issues`, standalone PATCH at `/issues/{id}`)
- `routers/comments.py` — create/list comments nested under issues
- `routers/stats.py` — per-project aggregates (by status, priority, assignee, timeseries)

Pydantic schemas (`schemas.py`) are separate from SQLAlchemy models (`models.py`). All routers use `response_model` with `*Read` schemas; input uses `*Create`/`*Update` schemas. `IssueUpdate` uses `exclude_unset=True` for partial updates.

### Frontend (`web/`)

React 18 + TypeScript + Vite. State management is React Query (`@tanstack/react-query`). Routing is React Router v6.

- `src/api.ts` — single module with all `fetch` calls and shared TypeScript types. The base URL is `VITE_API_URL` env var (defaults to `http://localhost:8000`).
- Three pages: `Dashboard` (cross-project stats with Recharts), `Projects` (list/create), `Board` (kanban-style issues for one project).
- No component library — plain CSS in `src/styles.css`.

When adding a new API endpoint, add the corresponding function and type to `src/api.ts` first, then use it in the page component via `useQuery`/`useMutation`.
