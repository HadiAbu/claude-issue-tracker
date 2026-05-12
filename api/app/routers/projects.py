from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Project, ProjectMember, User
from app.schemas import ProjectCreate, ProjectMemberAdd, ProjectRead, ProjectUpdate, UserRead

router = APIRouter(prefix="/projects", tags=["projects"])

CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_owned(project_id: int, user_id: int, db: Session) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.get("", response_model=list[ProjectRead])
def list_projects(current_user: CurrentUser, db: Session = Depends(get_db)):
    return (
        db.query(Project)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .filter(ProjectMember.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    project = Project(owner_id=current_user.id, **payload.model_dump())
    db.add(project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, f"Project key '{payload.key}' already exists")
    db.refresh(project)
    db.add(ProjectMember(project_id=project.id, user_id=current_user.id))
    db.commit()
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    return _get_owned(project_id, current_user.id, db)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, current_user: CurrentUser, db: Session = Depends(get_db)):
    project = _get_owned(project_id, current_user.id, db)
    data = payload.model_dump(exclude_unset=True)
    if "archived" in data:
        if data["archived"] and not project.archived:
            project.archived_at = datetime.now(timezone.utc)
        elif not data["archived"]:
            project.archived_at = None
    for key, value in data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    project = _get_owned(project_id, current_user.id, db)
    db.delete(project)
    db.commit()


# ── Members ───────────────────────────────────────────────────────────────────

@router.get("/{project_id}/members", response_model=list[UserRead])
def list_members(project_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    _get_owned(project_id, current_user.id, db)
    return (
        db.query(User)
        .join(ProjectMember, User.id == ProjectMember.user_id)
        .filter(ProjectMember.project_id == project_id)
        .order_by(User.email)
        .all()
    )


@router.post("/{project_id}/members", response_model=UserRead, status_code=201)
def add_member(project_id: int, payload: ProjectMemberAdd, current_user: CurrentUser, db: Session = Depends(get_db)):
    _get_owned(project_id, current_user.id, db)
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    already = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == payload.user_id,
    ).first()
    if already:
        raise HTTPException(409, "User is already a member")
    db.add(ProjectMember(project_id=project_id, user_id=payload.user_id))
    db.commit()
    return user


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(project_id: int, user_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    project = _get_owned(project_id, current_user.id, db)
    if user_id == project.owner_id:
        raise HTTPException(400, "Cannot remove the project owner")
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")
    db.delete(member)
    db.commit()
