from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import Priority, Status


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=8)
    display_name: str | None = Field(default=None, max_length=120)
    avatar_color: str = "#5b6cff"


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, min_length=1, max_length=254)
    avatar_color: str | None = None
    password: str | None = Field(default=None, min_length=8)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    display_name: str | None
    avatar_color: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    key: str = Field(min_length=1, max_length=16)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    archived: bool | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    key: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    archived: bool
    archived_at: datetime | None


# ── Issues ────────────────────────────────────────────────────────────────────

class IssueCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: Status = Status.todo
    priority: Priority = Priority.medium
    assignee_id: int | None = None


class IssueUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Status | None = None
    priority: Priority | None = None
    assignee_id: int | None = None
    archived: bool | None = None


class IssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    title: str
    description: str
    status: Status
    priority: Priority
    assignee_id: int | None
    assignee_email: str | None
    assignee_avatar_color: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None
    archived: bool
    archived_at: datetime | None


# ── Comments ──────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    author: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    issue_id: int
    author: str
    body: str
    created_at: datetime


# ── Project members ──────────────────────────────────────────────────────────

class ProjectMemberAdd(BaseModel):
    user_id: int


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatusCount(BaseModel):
    status: Status
    count: int


class PriorityCount(BaseModel):
    priority: Priority
    count: int


class AssigneeCount(BaseModel):
    assignee: str
    count: int


class TimeseriesPoint(BaseModel):
    date: str
    created: int
    closed: int


class ProjectStats(BaseModel):
    by_status: list[StatusCount]
    by_priority: list[PriorityCount]
    by_assignee: list[AssigneeCount]
    timeseries: list[TimeseriesPoint]
