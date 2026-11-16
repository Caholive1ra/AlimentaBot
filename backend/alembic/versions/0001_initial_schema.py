"""initial demonstrative schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-16

This revision intentionally defines the initial schema explicitly.  It must not
use ``Base.metadata.create_all()`` because metadata evolves with application
models and would otherwise create tables owned by later revisions.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


role = postgresql.ENUM(
    "DOADOR", "GESTOR", "TRANSPORTADOR", "INSTITUICAO", name="role", create_type=False
)
conservation = postgresql.ENUM(
    "AMBIENTE", "REFRIGERADO", "CONGELADO", name="conservation", create_type=False
)
lot_status = postgresql.ENUM(
    "PENDENTE_REVISAO",
    "LIBERADO",
    "REJEITADO",
    "RESERVADO",
    "COLETADO",
    "ENTREGUE",
    "RECUSADO",
    name="lot_status",
    create_type=False,
)
review_decision = postgresql.ENUM("APROVADO", "REJEITADO", name="review_decision", create_type=False)


def _entity_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("is_simulation", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    ]


def upgrade() -> None:
    bind = op.get_bind()
    role.create(bind, checkfirst=True)
    conservation.create(bind, checkfirst=True)
    lot_status.create(bind, checkfirst=True)
    review_decision.create(bind, checkfirst=True)

    op.create_table(
        "users",
        *_entity_columns(),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("role", role, nullable=False),
        sa.Column("authorized_sanitary_reviewer", sa.Boolean(), nullable=False),
        sa.Column("vehicle", sa.String(length=160)),
        sa.Column("capacity_kg", sa.Float()),
        sa.Column("refrigerated", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "institutions",
        *_entity_columns(),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("neighborhood", sa.String(length=120), nullable=False),
        sa.Column("capacity_kg", sa.Float(), nullable=False),
        sa.Column("accepted_conservation", sa.String(length=100), nullable=False),
    )
    op.create_table(
        "lots",
        *_entity_columns(),
        sa.Column("item", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("quantity_kg", sa.Float(), nullable=False),
        sa.Column("units", sa.Integer()),
        sa.Column("conservation", conservation, nullable=False),
        sa.Column("prepared_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pickup_window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pickup_window_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("origin", sa.String(length=200), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("status", lot_status, nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column("donor_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("institution_id", sa.Uuid(), sa.ForeignKey("institutions.id")),
        sa.Column("transporter_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("distance_km", sa.Float()),
    )
    op.create_table(
        "sanitary_reviews",
        *_entity_columns(),
        sa.Column("lot_id", sa.Uuid(), sa.ForeignKey("lots.id"), nullable=False),
        sa.Column("reviewer_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("decision", review_decision, nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column("human_authorized", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "reservations",
        *_entity_columns(),
        sa.Column("lot_id", sa.Uuid(), sa.ForeignKey("lots.id"), nullable=False),
        sa.Column("transporter_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("lot_id", name="uq_reservation_lot"),
    )
    op.create_table(
        "pickups",
        *_entity_columns(),
        sa.Column("lot_id", sa.Uuid(), sa.ForeignKey("lots.id"), nullable=False),
        sa.Column("transporter_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("lot_id"),
    )
    op.create_table(
        "deliveries",
        *_entity_columns(),
        sa.Column("lot_id", sa.Uuid(), sa.ForeignKey("lots.id"), nullable=False),
        sa.Column("institution_id", sa.Uuid(), sa.ForeignKey("institutions.id"), nullable=False),
        sa.Column("accepted", sa.Boolean(), nullable=False),
        sa.Column("reason", sa.Text()),
        sa.UniqueConstraint("lot_id"),
    )
    op.create_table(
        "custody_events",
        *_entity_columns(),
        sa.Column("lot_id", sa.Uuid(), sa.ForeignKey("lots.id"), nullable=False),
        sa.Column("actor_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("actor_role", sa.String(length=30), nullable=False),
        sa.Column("action", sa.String(length=160), nullable=False),
        sa.Column("detail", sa.Text()),
    )


def downgrade() -> None:
    for table in ("custody_events", "deliveries", "pickups", "reservations", "sanitary_reviews", "lots", "institutions", "users"):
        op.drop_table(table)
    bind = op.get_bind()
    review_decision.drop(bind, checkfirst=True)
    lot_status.drop(bind, checkfirst=True)
    conservation.drop(bind, checkfirst=True)
    role.drop(bind, checkfirst=True)
