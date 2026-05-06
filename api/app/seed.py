import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Issue, Priority, Project, Status, User

_TITLES = [
    "Fix layout shift on hero",
    "Add dark mode toggle",
    "Caching for /search",
    "Rate-limit webhook endpoint",
    "Migrate auth to JWT",
    "Improve cold-start time",
    "Refactor settings page",
    "Empty-state for projects",
    "Pagination on issues",
    "OpenAPI client gen",
    "Sentry integration",
    "Bulk-update issues",
    "CSV export",
    "Email notifications",
    "Audit log table",
]

_ASSIGNEES = ["alice", "bob", "carol", "dan", None]


def seed_if_empty(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    from app.auth import hash_password

    demo_user = User(
        email="demo@example.com",
        hashed_password=hash_password("demo1234"),
    )
    db.add(demo_user)
    db.flush()

    projects = [
        Project(key="WEB", name="Marketing site", description="Public site & blog", owner_id=demo_user.id),
        Project(key="API", name="Core API", description="Backend services", owner_id=demo_user.id),
    ]
    db.add_all(projects)
    db.flush()

    statuses = list(Status)
    priorities = list(Priority)
    now = datetime.now(timezone.utc)
    rng = random.Random(42)

    for project in projects:
        for _ in range(40):
            created = now - timedelta(
                days=rng.randint(0, 29), hours=rng.randint(0, 23)
            )
            status = rng.choice(statuses)
            closed = (
                created + timedelta(days=rng.randint(0, 5))
                if status == Status.done
                else None
            )
            db.add(
                Issue(
                    project_id=project.id,
                    title=rng.choice(_TITLES),
                    description="Seeded issue.",
                    status=status,
                    priority=rng.choice(priorities),
                    assignee=rng.choice(_ASSIGNEES),
                    created_at=created,
                    updated_at=created,
                    closed_at=closed,
                )
            )

    db.commit()
