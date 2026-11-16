import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import DemoActor, get_actor
from app.core.database import get_db
from app.models import CustodyEvent, Lot
from app.schemas import CustodyEventRead, DeliveryCreate, LotCreate, LotRead, ReservationCreate, ReviewCreate
from app.services import lots as service

router = APIRouter(prefix="/lotes", tags=["lotes"])


@router.get("", response_model=list[LotRead])
def list_lots(db: Session = Depends(get_db)):
    return db.scalars(select(Lot).order_by(Lot.created_at.desc())).all()


@router.post("", response_model=LotRead, status_code=status.HTTP_201_CREATED)
def create_lot(payload: LotCreate, db: Session = Depends(get_db), actor: DemoActor = Depends(get_actor)):
    return service.create_lot(db, payload, actor)


@router.get("/{lot_id}", response_model=LotRead)
def read_lot(lot_id: uuid.UUID, db: Session = Depends(get_db)):
    return service.get_lot(db, lot_id)


@router.post("/{lot_id}/revisoes", response_model=LotRead)
def review_lot(lot_id: uuid.UUID, payload: ReviewCreate, db: Session = Depends(get_db), actor: DemoActor = Depends(get_actor)):
    return service.review_lot(db, lot_id, payload, actor)


@router.post("/{lot_id}/reservas", response_model=LotRead)
def reserve_lot(lot_id: uuid.UUID, payload: ReservationCreate, db: Session = Depends(get_db), actor: DemoActor = Depends(get_actor)):
    return service.reserve_lot(db, lot_id, payload, actor)


@router.post("/{lot_id}/coletas", response_model=LotRead)
def pickup_lot(lot_id: uuid.UUID, db: Session = Depends(get_db), actor: DemoActor = Depends(get_actor)):
    return service.pickup_lot(db, lot_id, actor)


@router.post("/{lot_id}/entregas", response_model=LotRead)
def deliver_lot(lot_id: uuid.UUID, payload: DeliveryCreate, db: Session = Depends(get_db), actor: DemoActor = Depends(get_actor)):
    return service.deliver_lot(db, lot_id, payload, actor)


@router.get("/{lot_id}/custodia", response_model=list[CustodyEventRead])
def custody_history(lot_id: uuid.UUID, db: Session = Depends(get_db)):
    service.get_lot(db, lot_id)
    return db.scalars(select(CustodyEvent).where(CustodyEvent.lot_id == lot_id).order_by(CustodyEvent.created_at)).all()

