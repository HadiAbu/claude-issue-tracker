import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Issue, Priority, Project, ProjectMember, Status, User

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

_SEED_USERS = [
    ("demo@example.com",  "Demo User", "#5b6cff"),
    ("alice@example.com", "Alice",     "#ff8a99"),
    ("bob@example.com",   "Bob",       "#6affb0"),
    ("carol@example.com", "Carol",     "#ffd761"),
    ("dan@example.com",   "Dan",       "#ff7043"),
]


def seed_if_empty(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    from app.auth import hash_password

    users = [
        User(email=email, hashed_password=hash_password("demo1234"), display_name=name, avatar_color=color)
        for email, name, color in _SEED_USERS
    ]
    db.add_all(users)
    db.flush()

    demo_user = users[0]
    team_users = users[1:]

    projects = [
        Project(key="WEB", name="Marketing site", description="Public site & blog", owner_id=demo_user.id),
        Project(key="API", name="Core API", description="Backend services", owner_id=demo_user.id),
    ]
    db.add_all(projects)
    db.flush()

    for project in projects:
        for user in users:
            db.add(ProjectMember(project_id=project.id, user_id=user.id))

    assignee_ids = [u.id for u in team_users] + [None]
    statuses = list(Status)
    priorities = list(Priority)
    now = datetime.now(timezone.utc)
    rng = random.Random(42)

    for project in projects:
        for _ in range(40):
            created = now - timedelta(days=rng.randint(0, 29), hours=rng.randint(0, 23))
            status = rng.choice(statuses)
            closed = (
                created + timedelta(days=rng.randint(0, 5))
                if status == Status.done
                else None
            )
            db.add(Issue(
                project_id=project.id,
                title=rng.choice(_TITLES),
                description="Seeded issue.",
                status=status,
                priority=rng.choice(priorities),
                assignee_id=rng.choice(assignee_ids),
                created_at=created,
                updated_at=created,
                closed_at=closed,
            ))

    db.commit()
