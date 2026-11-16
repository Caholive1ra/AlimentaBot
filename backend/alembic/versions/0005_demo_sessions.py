"""add isolated anonymous demo sessions

Revision ID: 0005_demo_sessions
Revises: 0004_access_control
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_demo_sessions"
down_revision = "0004_access_control"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "demo_sessions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("organization_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("demo_sessions")
