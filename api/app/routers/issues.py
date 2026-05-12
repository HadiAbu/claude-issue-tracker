from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ProjectMember, Status, User
from app.routers.deps import get_member_issue, get_member_project
from app.schemas import IssueCreate, IssueRead, IssueUpdate

router = APIRouter(tags=["issues"])

CurrentUser = Annotated[User, Depends(get_current_user)]


def _assert_member(project_id: int, user_id: int, db: Session) -> None:
    exists = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not exists:
        raise HTTPException(400, "Assignee must be a member of this project")


@router.get("/projects/{project_id}/issues", response_model=list[IssueRead])
def list_issues(project_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    get_member_project(project_id, current_user.id, db)
    from app.models import Issue
    return (
        db.query(Issue)
        .filter(Issue.project_id == project_id)
        .order_by(Issue.created_at.desc())
        .all()
    )


@router.post("/projects/{project_id}/issues", response_model=IssueRead, status_code=201)
def create_issue(project_id: int, payload: IssueCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    get_member_project(project_id, current_user.id, db)
    if payload.assignee_id is not None:
        _assert_member(project_id, payload.assignee_id, db)
    from app.models import Issue
    issue = Issue(project_id=project_id, **payload.model_dump())
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/issues/{issue_id}", response_model=IssueRead)
def get_issue(issue_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    return get_member_issue(issue_id, current_user.id, db)


@router.patch("/issues/{issue_id}", response_model=IssueRead)
def update_issue(issue_id: int, payload: IssueUpdate, current_user: CurrentUser, db: Session = Depends(get_db)):
    issue = get_member_issue(issue_id, current_user.id, db)
    data = payload.model_dump(exclude_unset=True)

    if "assignee_id" in data and data["assignee_id"] is not None:
        _assert_member(issue.project_id, data["assignee_id"], db)

    if "status" in data:
        new_status = data["status"]
        if new_status == Status.done and issue.status != Status.done:
            issue.closed_at = datetime.now(timezone.utc)
        elif new_status != Status.done:
            issue.closed_at = None

    if "archived" in data:
        if data["archived"] and not issue.archived:
            issue.archived_at = datetime.now(timezone.utc)
        elif not data["archived"]:
            issue.archived_at = None

    for key, value in data.items():
        setattr(issue, key, value)

    db.commit()
    db.refresh(issue)
    return issue


@router.delete("/issues/{issue_id}", status_code=204)
def delete_issue(issue_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    issue = get_member_issue(issue_id, current_user.id, db)
    db.delete(issue)
    db.commit()
