import uuid

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_principal
from app.core.auth import AuthenticatedPrincipal
from app.core.database import get_db
from app.repositories.lots import list_for_organization
from app.schemas import LotRead, LotUpdate, OperationalLotCreate, Page
from app.services import operational_lots

router = APIRouter(prefix="/operational/lots", tags=["operational-lots"])


@router.get("", response_model=Page)
def list_lots(limit: int = Query(20, ge=1, le=100), cursor: uuid.UUID | None = None, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> Page:
    items = list_for_organization(db, principal.organization_id, limit + 1, cursor)
    return Page(items=items[:limit], next_cursor=str(items[-1].id) if len(items) > limit else None)


@router.post("", response_model=LotRead, status_code=status.HTTP_201_CREATED)
def create_lot(payload: OperationalLotCreate, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> LotRead:
    return operational_lots.create(db, payload, principal)


@router.get("/{lot_id}", response_model=LotRead)
def get_lot(lot_id: uuid.UUID, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> LotRead:
    return operational_lots.read(db, lot_id, principal)


@router.patch("/{lot_id}", response_model=LotRead)
def update_lot(lot_id: uuid.UUID, payload: LotUpdate, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> LotRead:
    return operational_lots.update(db, lot_id, payload, principal)


@router.post("/{lot_id}/reservations", response_model=LotRead)
def reserve_lot(lot_id: uuid.UUID, idempotency_key: str = Header(alias="Idempotency-Key", min_length=8, max_length=128), db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> LotRead:
    return operational_lots.reserve(db, lot_id, principal, idempotency_key)
