"""add organization membership and Auth0 subject

Revision ID: 0002_organizations_auth_subject
Revises: 0001_initial_schema
Create Date: 2026-11-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_organizations_auth_subject"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def _has_column(inspector, table: str, column: str) -> bool:
    return any(item["name"] == column for item in inspector.get_columns(table))


def _foreign_key_name(inspector, table: str, column: str) -> str | None:
    for foreign_key in inspector.get_foreign_keys(table):
        if foreign_key["constrained_columns"] == [column]:
            return foreign_key["name"]
    return None


def _unique_name(inspector, table: str, column: str) -> str | None:
    for constraint in inspector.get_unique_constraints(table):
        if constraint["column_names"] == [column]:
            return constraint["name"]
    return None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("organizations"):
        op.create_table(
            "organizations",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if not inspector.has_table("organization_members"):
        organization_role = postgresql.ENUM(
            "OWNER", "DOADOR", "GESTOR", "TRANSPORTADOR", "INSTITUICAO", name="organization_role", create_type=False
        )
        organization_role.create(bind, checkfirst=True)
        op.create_table(
            "organization_members",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("is_simulation", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("organization_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("role", organization_role, nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.UniqueConstraint("organization_id", "user_id", "role", name="uq_organization_member_role"),
        )
    inspector = sa.inspect(bind)
    if not _has_column(inspector, "users", "auth_subject"):
        op.add_column("users", sa.Column("auth_subject", sa.String(length=255), nullable=True))
    inspector = sa.inspect(bind)
    if not _unique_name(inspector, "users", "auth_subject"):
        op.create_unique_constraint("uq_users_auth_subject", "users", ["auth_subject"])
    if not _has_column(inspector, "lots", "organization_id"):
        op.add_column("lots", sa.Column("organization_id", sa.Uuid(), nullable=True))
    inspector = sa.inspect(bind)
    if not _foreign_key_name(inspector, "lots", "organization_id"):
        op.create_foreign_key("fk_lots_organization", "lots", "organizations", ["organization_id"], ["id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    foreign_key_name = _foreign_key_name(inspector, "lots", "organization_id")
    if foreign_key_name:
        op.drop_constraint(foreign_key_name, "lots", type_="foreignkey")
    if _has_column(inspector, "lots", "organization_id"):
        op.drop_column("lots", "organization_id")
    unique_name = _unique_name(inspector, "users", "auth_subject")
    if unique_name:
        op.drop_constraint(unique_name, "users", type_="unique")
    if _has_column(inspector, "users", "auth_subject"):
        op.drop_column("users", "auth_subject")
    if inspector.has_table("organization_members"):
        op.drop_table("organization_members")
    if inspector.has_table("organizations"):
        op.drop_table("organizations")
    sa.Enum(name="organization_role").drop(bind, checkfirst=True)
