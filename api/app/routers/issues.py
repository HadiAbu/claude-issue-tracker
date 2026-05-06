from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Issue, Project, Status, User
from app.schemas import IssueCreate, IssueRead, IssueUpdate

router = APIRouter(tags=["issues"])

CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_owned_project(project_id: int, user_id: int, db: Session) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


def _get_owned_issue(issue_id: int, user_id: int, db: Session) -> Issue:
    issue = (
        db.query(Issue)
        .join(Project, Issue.project_id == Project.id)
        .filter(Issue.id == issue_id, Project.owner_id == user_id)
        .first()
    )
    if not issue:
        raise HTTPException(404, "Issue not found")
    return issue


@router.get("/projects/{project_id}/issues", response_model=list[IssueRead])
def list_issues(project_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    _get_owned_project(project_id, current_user.id, db)
    return (
        db.query(Issue)
        .filter(Issue.project_id == project_id)
        .order_by(Issue.created_at.desc())
        .all()
    )


@router.post("/projects/{project_id}/issues", response_model=IssueRead, status_code=201)
def create_issue(project_id: int, payload: IssueCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    _get_owned_project(project_id, current_user.id, db)
    issue = Issue(project_id=project_id, **payload.model_dump())
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/issues/{issue_id}", response_model=IssueRead)
def get_issue(issue_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    return _get_owned_issue(issue_id, current_user.id, db)


@router.patch("/issues/{issue_id}", response_model=IssueRead)
def update_issue(issue_id: int, payload: IssueUpdate, current_user: CurrentUser, db: Session = Depends(get_db)):
    issue = _get_owned_issue(issue_id, current_user.id, db)
    data = payload.model_dump(exclude_unset=True)

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
    issue = _get_owned_issue(issue_id, current_user.id, db)
    db.delete(issue)
    db.commit()
