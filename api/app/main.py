import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, comments, issues, projects, stats
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(Base.metadata.create_all, engine)
    if settings.seed_on_start:

        def _seed() -> None:
            with SessionLocal() as db:
                seed_if_empty(db)

        await asyncio.to_thread(_seed)
    yield


app = FastAPI(title="Issue Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(issues.router)
app.include_router(comments.router)
app.include_router(stats.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
