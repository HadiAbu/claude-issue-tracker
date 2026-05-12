"""Shared query helpers used across multiple routers."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Issue, Project, ProjectMember


def get_member_project(project_id: int, user_id: int, db: Session) -> Project:
    """Return the project if user is a member, 404 otherwise."""
    project = (
        db.query(Project)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .filter(Project.id == project_id, ProjectMember.user_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


def get_member_issue(issue_id: int, user_id: int, db: Session) -> Issue:
    """Return the issue if user is a member of its project, 404 otherwise."""
    issue = (
        db.query(Issue)
        .join(Project, Issue.project_id == Project.id)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .filter(Issue.id == issue_id, ProjectMember.user_id == user_id)
        .first()
    )
    if not issue:
        raise HTTPException(404, "Issue not found")
    return issue
