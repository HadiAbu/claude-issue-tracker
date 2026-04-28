from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Issue
from app.schemas import CommentCreate, CommentRead

router = APIRouter(prefix="/issues/{issue_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentRead])
def list_comments(issue_id: int, db: Session = Depends(get_db)):
    if not db.get(Issue, issue_id):
        raise HTTPException(404, "Issue not found")
    return (
        db.query(Comment)
        .filter(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post("", response_model=CommentRead, status_code=201)
def create_comment(issue_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    if not db.get(Issue, issue_id):
        raise HTTPException(404, "Issue not found")
    comment = Comment(issue_id=issue_id, **payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
