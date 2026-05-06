from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Issue, Project, User
from app.schemas import (
    AssigneeCount,
    PriorityCount,
    ProjectStats,
    StatusCount,
    TimeseriesPoint,
)

router = APIRouter(prefix="/projects/{project_id}/stats", tags=["stats"])

CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=ProjectStats)
def project_stats(
    project_id: int,
    current_user: CurrentUser,
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")

    by_status_rows = (
        db.query(Issue.status, func.count(Issue.id))
        .filter(Issue.project_id == project_id)
        .group_by(Issue.status)
        .all()
    )
    by_status = [StatusCount(status=s, count=c) for s, c in by_status_rows]

    by_priority_rows = (
        db.query(Issue.priority, func.count(Issue.id))
        .filter(Issue.project_id == project_id)
        .group_by(Issue.priority)
        .all()
    )
    by_priority = [PriorityCount(priority=p, count=c) for p, c in by_priority_rows]

    by_assignee_rows = (
        db.query(Issue.assignee, func.count(Issue.id))
        .filter(Issue.project_id == project_id, Issue.assignee.isnot(None))
        .group_by(Issue.assignee)
        .order_by(func.count(Issue.id).desc())
        .limit(10)
        .all()
    )
    by_assignee = [AssigneeCount(assignee=a, count=c) for a, c in by_assignee_rows]

    end = date.today()
    start = end - timedelta(days=days - 1)
    days_index: dict[str, dict[str, int]] = {
        (start + timedelta(days=i)).isoformat(): {"created": 0, "closed": 0}
        for i in range(days)
    }

    def _key(d) -> str:
        return d.isoformat() if hasattr(d, "isoformat") else str(d)

    created_rows = (
        db.query(func.date(Issue.created_at), func.count(Issue.id))
        .filter(Issue.project_id == project_id, func.date(Issue.created_at) >= start)
        .group_by(func.date(Issue.created_at))
        .all()
    )
    for d, c in created_rows:
        k = _key(d)
        if k in days_index:
            days_index[k]["created"] = c

    closed_rows = (
        db.query(func.date(Issue.closed_at), func.count(Issue.id))
        .filter(
            Issue.project_id == project_id,
            Issue.closed_at.isnot(None),
            func.date(Issue.closed_at) >= start,
        )
        .group_by(func.date(Issue.closed_at))
        .all()
    )
    for d, c in closed_rows:
        k = _key(d)
        if k in days_index:
            days_index[k]["closed"] = c

    timeseries = [
        TimeseriesPoint(date=d, created=v["created"], closed=v["closed"])
        for d, v in days_index.items()
    ]

    return ProjectStats(
        by_status=by_status,
        by_priority=by_priority,
        by_assignee=by_assignee,
        timeseries=timeseries,
    )
