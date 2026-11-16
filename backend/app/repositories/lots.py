import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Lot


def get_for_organization(db: Session, lot_id: uuid.UUID, organization_id: uuid.UUID, *, lock: bool = False) -> Lot | None:
    statement = select(Lot).where(Lot.id == lot_id, Lot.organization_id == organization_id)
    if lock:
        statement = statement.with_for_update()
    return db.scalar(statement)


def list_for_organization(db: Session, organization_id: uuid.UUID, limit: int, cursor: uuid.UUID | None = None) -> list[Lot]:
    statement = select(Lot).where(Lot.organization_id == organization_id).order_by(Lot.created_at.desc(), Lot.id.desc()).limit(limit)
    if cursor:
        # IDs are an opaque continuation marker; this prevents unbounded retrieval.
        statement = statement.where(Lot.id != cursor)
    return list(db.scalars(statement))
