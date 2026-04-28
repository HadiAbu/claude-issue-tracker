# Issue Tracker

A Linear-lite issue tracker. FastAPI + Postgres backend, React + Vite frontend, Docker for everything.

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, psycopg 3
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

The first boot creates tables and seeds two demo projects with ~80 issues so the dashboard charts have something to render.

## Layout

```
.
├── docker-compose.yml
├── api/                  FastAPI service
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py     SQLAlchemy models
│   │   ├── schemas.py    Pydantic schemas
│   │   ├── routers/      projects, issues, comments, stats
│   │   └── seed.py       demo data
│   └── requirements.txt
└── web/                  Vite + React + TS
    └── src/
        ├── api.ts        typed API client
        └── pages/        Dashboard, Projects, Board
```

## What's there

- **Projects** — create / list
- **Issues** — create, list per project, status board with click-to-advance
- **Comments** — endpoint exists; UI not wired yet
- **Stats** — `/projects/{id}/stats` returns by-status, by-priority, by-assignee, and a 30-day created-vs-closed timeseries
- **Dashboard** — pie, bar, line, and horizontal bar charts driven by the stats endpoint

## Next steps

- Auth (JWT) — good first PR for `/cr-python` security pass
- Alembic migrations (currently `Base.metadata.create_all` on startup)
- Drag-and-drop on the board (`@dnd-kit/core`)
- Comment UI on the issue detail page
- Production Dockerfiles (multi-stage, non-root, gunicorn)
