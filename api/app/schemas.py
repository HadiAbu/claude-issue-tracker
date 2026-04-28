from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import Priority, Status


class ProjectCreate(BaseModel):
    key: str = Field(min_length=1, max_length=16)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    key: str
    name: str
    description: str
    created_at: datetime


class IssueCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: Status = Status.todo
    priority: Priority = Priority.medium
    assignee: str | None = None


class IssueUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Status | None = None
    priority: Priority | None = None
    assignee: str | None = None


class IssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    title: str
    description: str
    status: Status
    priority: Priority
    assignee: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None


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
