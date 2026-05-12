from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Comment, User
from app.routers.deps import get_member_issue
from app.schemas import CommentCreate, CommentRead

router = APIRouter(prefix="/issues/{issue_id}/comments", tags=["comments"])

CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[CommentRead])
def list_comments(issue_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    get_member_issue(issue_id, current_user.id, db)
    return (
        db.query(Comment)
        .filter(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post("", response_model=CommentRead, status_code=201)
def create_comment(issue_id: int, payload: CommentCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    get_member_issue(issue_id, current_user.id, db)
    comment = Comment(issue_id=issue_id, **payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
