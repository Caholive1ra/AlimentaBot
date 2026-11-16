"""add profile ownership and reservation idempotency

Revision ID: 0003_profiles_and_idempotency
Revises: 0002_organizations_auth_subject
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_profiles_and_idempotency"
down_revision = "0002_organizations_auth_subject"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    return any(item["name"] == column for item in sa.inspect(bind).get_columns(table))


def upgrade() -> None:
    bind = op.get_bind()
    if not _has_column(bind, "institutions", "organization_id"):
        op.add_column("institutions", sa.Column("organization_id", sa.Uuid(), nullable=True))
        op.create_foreign_key("fk_institutions_organization", "institutions", "organizations", ["organization_id"], ["id"])
    if not _has_column(bind, "reservations", "idempotency_key"):
        op.add_column("reservations", sa.Column("idempotency_key", sa.String(length=128), nullable=True))
        op.create_unique_constraint("uq_reservations_idempotency_key", "reservations", ["idempotency_key"])


def downgrade() -> None:
    bind = op.get_bind()
    if _has_column(bind, "reservations", "idempotency_key"):
        op.drop_constraint("uq_reservations_idempotency_key", "reservations", type_="unique")
        op.drop_column("reservations", "idempotency_key")
    if _has_column(bind, "institutions", "organization_id"):
        op.drop_constraint("fk_institutions_organization", "institutions", type_="foreignkey")
        op.drop_column("institutions", "organization_id")
