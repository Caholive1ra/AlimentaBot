"""add invitation-only privileged access control

Revision ID: 0004_access_control
Revises: 0003_profiles_and_idempotency

Enum labels are intentionally not removed on downgrade: PostgreSQL cannot safely
remove enum values in a non-destructive rollback. Application rollback remains
compatible with the expanded enum set.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_access_control"
down_revision = "0003_profiles_and_idempotency"
branch_labels = None
depends_on = None


ROLE_VALUES = ("OPERADOR", "REVISOR_AUTORIZADO", "ADMIN_ORGANIZACAO", "ADMIN_PLATAFORMA")


def _add_enum_values(bind, enum_name: str) -> None:
    if bind.dialect.name != "postgresql":
        return
    for value in ROLE_VALUES:
        op.execute(sa.text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"))


def upgrade() -> None:
    bind = op.get_bind()
    _add_enum_values(bind, "role")
    _add_enum_values(bind, "organization_role")
    org_role = postgresql.ENUM(name="organization_role", create_type=False)
    op.create_table(
        "access_requests",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("auth_subject", sa.String(length=255), nullable=False, unique=True),
        sa.Column("requested_role", org_role, nullable=False),
        sa.Column("organization_name", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDENTE"),
    )
    op.create_table(
        "access_invitations",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("recipient_subject", sa.String(length=255), nullable=False),
        sa.Column("organization_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("role", org_role, nullable=False),
        sa.Column("invited_by_user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("accepted_by_user_id", sa.Uuid(), sa.ForeignKey("users.id")),
    )
    op.create_table(
        "access_audit_events",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("actor_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("target_user_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("organization_id", sa.Uuid(), sa.ForeignKey("organizations.id")),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("detail", sa.Text()),
    )


def downgrade() -> None:
    op.drop_table("access_audit_events")
    op.drop_table("access_invitations")
    op.drop_table("access_requests")
