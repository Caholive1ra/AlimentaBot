from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import DemoActor, require_role
from app.models import (
    Conservation, CustodyEvent, Delivery, Institution, Lot, LotStatus, Pickup, Reservation, ReviewDecision,
    Role, SanitaryReview, User,
)
from app.schemas import DeliveryCreate, LotCreate, ReservationCreate, ReviewCreate


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def fail(code: int, detail: str) -> None:
    raise HTTPException(code, detail)


def event(db: Session, lot: Lot, actor: DemoActor, action: str, detail: str | None = None) -> None:
    db.add(CustodyEvent(lot_id=lot.id, actor_id=actor.actor_id, actor_role=actor.role.value, action=action, detail=detail))


def get_lot(db: Session, lot_id) -> Lot:
    lot = db.get(Lot, lot_id)
    if not lot:
        fail(status.HTTP_404_NOT_FOUND, "Lote não encontrado")
    return lot


def assert_not_expired(lot: Lot) -> None:
    expiry = lot.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now_utc():
        fail(status.HTTP_409_CONFLICT, "Lote vencido não pode seguir no fluxo")


def create_lot(db: Session, payload: LotCreate, actor: DemoActor) -> Lot:
    require_role(actor, Role.DOADOR)
    lot = Lot(**payload.model_dump(), status=LotStatus.PENDENTE_REVISAO, is_simulation=True)
    db.add(lot)
    db.flush()
    event(db, lot, actor, "Lote publicado — pendente de revisão humana")
    db.commit()
    db.refresh(lot)
    return lot


def review_lot(db: Session, lot_id, payload: ReviewCreate, actor: DemoActor) -> Lot:
    require_role(actor, Role.GESTOR)
    if not actor.sanitary_authorized:
        fail(status.HTTP_403_FORBIDDEN, "Revisão sanitária exige verificador humano autorizado")
    lot = get_lot(db, lot_id)
    if lot.status != LotStatus.PENDENTE_REVISAO:
        fail(status.HTTP_409_CONFLICT, "Apenas lotes pendentes podem ser revisados")
    if payload.decision == ReviewDecision.APROVADO:
        assert_not_expired(lot)
        institution = db.get(Institution, payload.institution_id)
        if not institution:
            fail(status.HTTP_404_NOT_FOUND, "Instituição não encontrada")
        accepted = set(institution.accepted_conservation.split(","))
        allocated = db.scalar(
            select(func.coalesce(func.sum(Lot.quantity_kg), 0)).where(
                Lot.institution_id == institution.id,
                Lot.status.in_([LotStatus.LIBERADO, LotStatus.RESERVADO, LotStatus.COLETADO]),
            ),
        )
        if lot.conservation.value not in accepted or allocated + lot.quantity_kg > institution.capacity_kg:
            fail(status.HTTP_409_CONFLICT, "Instituição incompatível com conservação ou capacidade do lote")
        lot.status, lot.institution_id = LotStatus.LIBERADO, institution.id
        action, detail = "Revisão humana autorizada: aprovado", f"Destino: {institution.name}"
    else:
        lot.status, lot.reason = LotStatus.REJEITADO, payload.reason.strip() if payload.reason else None
        action, detail = "Revisão humana autorizada: rejeitado", lot.reason
    db.add(SanitaryReview(lot_id=lot.id, reviewer_id=actor.actor_id, decision=payload.decision, reason=payload.reason, human_authorized=True))
    event(db, lot, actor, action, detail)
    db.commit()
    db.refresh(lot)
    return lot


def reserve_lot(db: Session, lot_id, payload: ReservationCreate, actor: DemoActor) -> Lot:
    require_role(actor, Role.TRANSPORTADOR)
    if actor.actor_id and actor.actor_id != payload.transporter_id:
        fail(status.HTTP_403_FORBIDDEN, "Transportador só pode reservar em seu próprio nome")
    lot = get_lot(db, lot_id)
    if lot.status != LotStatus.LIBERADO:
        fail(status.HTTP_409_CONFLICT, "Lote não está liberado para reserva")
    assert_not_expired(lot)
    transporter = db.get(User, payload.transporter_id)
    if not transporter or transporter.role != Role.TRANSPORTADOR:
        fail(status.HTTP_404_NOT_FOUND, "Transportador não encontrado")
    if lot.quantity_kg > (transporter.capacity_kg or 0) or (lot.conservation != Conservation.AMBIENTE and not transporter.refrigerated):
        fail(status.HTTP_409_CONFLICT, "Transportador incompatível com capacidade ou conservação")
    try:
        db.add(Reservation(lot_id=lot.id, transporter_id=transporter.id))
        lot.status, lot.transporter_id = LotStatus.RESERVADO, transporter.id
        event(db, lot, actor, "Entrega aceita", transporter.name)
        db.commit()
    except IntegrityError:
        db.rollback()
        fail(status.HTTP_409_CONFLICT, "Este lote já foi reservado")
    db.refresh(lot)
    return lot


def pickup_lot(db: Session, lot_id, actor: DemoActor) -> Lot:
    require_role(actor, Role.TRANSPORTADOR)
    lot = get_lot(db, lot_id)
    if lot.status != LotStatus.RESERVADO:
        fail(status.HTTP_409_CONFLICT, "Etapa fora de ordem: lote deve estar reservado")
    if actor.actor_id != lot.transporter_id:
        fail(status.HTTP_403_FORBIDDEN, "Somente o transportador que reservou registra a coleta")
    db.add(Pickup(lot_id=lot.id, transporter_id=lot.transporter_id))
    lot.status = LotStatus.COLETADO
    event(db, lot, actor, "Coleta registrada — em trânsito")
    db.commit()
    db.refresh(lot)
    return lot


def deliver_lot(db: Session, lot_id, payload: DeliveryCreate, actor: DemoActor) -> Lot:
    require_role(actor, Role.INSTITUICAO)
    lot = get_lot(db, lot_id)
    if lot.status != LotStatus.COLETADO:
        fail(status.HTTP_409_CONFLICT, "Etapa fora de ordem: lote ainda não foi coletado")
    if not lot.institution_id:
        fail(status.HTTP_409_CONFLICT, "Lote sem instituição de destino")
    lot.status = LotStatus.ENTREGUE if payload.accepted else LotStatus.RECUSADO
    lot.reason = None if payload.accepted else payload.reason
    db.add(Delivery(lot_id=lot.id, institution_id=lot.institution_id, accepted=payload.accepted, reason=payload.reason))
    event(db, lot, actor, "Recebimento confirmado" if payload.accepted else "Recebimento recusado", lot.reason)
    db.commit()
    db.refresh(lot)
    return lot

