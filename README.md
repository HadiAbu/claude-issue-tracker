# Issue Tracker

A Linear-lite issue tracker. FastAPI + Postgres backend, React + Vite frontend, Docker for everything.

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, psycopg 3, python-jose (JWT), bcrypt
- **Frontend:** React 18, Vite, TanStack Query, React Router, recharts
- **Database:** Postgres 16
- **Orchestration:** Docker Compose

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8000 (docs at `/docs`)
- Web: http://localhost:5173
- Postgres: localhost:5432

The first boot creates tables and seeds two demo projects with ~80 issues and a demo account (`demo@example.com` / `demo1234`).

## Authentication

The app uses JWT Bearer tokens. Register an account or use the demo credentials on the login page. All API routes (except `POST /auth/register` and `POST /auth/login`) require a valid token.

To hit the API directly:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d "username=demo@example.com&password=demo1234" | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/projects
```

## Layout

```
.
├── docker-compose.yml
├── api/                  FastAPI service
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py       JWT utilities + get_current_user dependency
│   │   ├── models.py     SQLAlchemy models (User, Project, Issue, Comment)
│   │   ├── schemas.py    Pydantic schemas
│   │   ├── routers/      auth, projects, issues, comments, stats
│   │   └── seed.py       demo data
│   └── requirements.txt
└── web/                  Vite + React + TS
    └── src/
        ├── api.ts        typed API client + token helpers
        └── pages/        Login, Dashboard, Projects, Board
```

## Features

- **Auth** — JWT login/register; all data is scoped to the authenticated user
- **Projects** — create, edit (inline), archive/unarchive, delete (cascades to issues)
- **Issues** — create, edit (modal), archive/unarchive, delete; status board with click-to-advance
- **Actions** — edit / archive / delete icon buttons with hover tooltips on every card and table row
- **Dashboard** — pie, bar, line, and horizontal bar charts; filters out archived projects
- **Stats** — per-project aggregates: by status, priority, assignee, 30-day created-vs-closed timeseries
- **Comments** — API endpoint exists; UI not wired yet

## Schema notes

- No Alembic — tables are created via `Base.metadata.create_all` on startup. Schema changes require `docker compose down -v && docker compose up --build`.
- `Issue.closed_at` is set automatically when status transitions to `done` and cleared on any other status.
- `Project.archived_at` and `Issue.archived_at` are set server-side when the `archived` flag is toggled.
- Projects and issues cascade-delete all children on removal.

## Next steps

- Alembic migrations
- Drag-and-drop on the board (`@dnd-kit/core`)
- Comment UI on the issue detail page
- Production Dockerfiles (multi-stage, non-root, gunicorn)
