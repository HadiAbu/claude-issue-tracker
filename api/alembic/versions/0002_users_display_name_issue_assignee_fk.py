"""users display_name; issues assignee_id FK

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("display_name", sa.String(length=120), nullable=True))

    op.drop_index("ix_issues_assignee", table_name="issues")
    op.drop_column("issues", "assignee")

    op.add_column(
        "issues",
        sa.Column("assignee_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_issues_assignee_id_users",
        "issues",
        "users",
        ["assignee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_issues_assignee_id", "issues", ["assignee_id"])


def downgrade() -> None:
    op.drop_index("ix_issues_assignee_id", table_name="issues")
    op.drop_constraint("fk_issues_assignee_id_users", "issues", type_="foreignkey")
    op.drop_column("issues", "assignee_id")

    op.add_column("issues", sa.Column("assignee", sa.String(length=120), nullable=True))
    op.create_index("ix_issues_assignee", "issues", ["assignee"])

    op.drop_column("users", "display_name")
