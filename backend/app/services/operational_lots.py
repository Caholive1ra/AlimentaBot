"""Organization-scoped operations. The UI demo service remains separate."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal
from app.models import CustodyEvent, Institution, Lot, LotStatus, OrganizationRole, Reservation, ReviewDecision, SanitaryReview
from app.repositories.lots import get_for_organization
from app.schemas import LotUpdate, OperationalLotCreate, ReviewCreate
from app.services.lots import assert_not_expired, now_utc


def _require(principal: AuthenticatedPrincipal, *roles: OrganizationRole) -> None:
    allowed = {role.value for role in roles}
    if not (principal.roles & allowed) and OrganizationRole.OWNER.value not in principal.roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Papel sem permissão nesta organização")


def _event(db: Session, lot: Lot, principal: AuthenticatedPrincipal, action: str, detail: str | None = None) -> None:
    db.add(CustodyEvent(lot_id=lot.id, actor_id=principal.user_id, actor_role=",".join(sorted(principal.roles)), action=action, detail=detail))


def create(db: Session, payload: OperationalLotCreate, principal: AuthenticatedPrincipal) -> Lot:
    _require(principal, OrganizationRole.DOADOR)
    values = payload.model_dump(exclude={"donor_id"})
    lot = Lot(**values, donor_id=principal.user_id, organization_id=principal.organization_id, status=LotStatus.PENDENTE_REVISAO, is_simulation=False)
    db.add(lot)
    db.flush()
    _event(db, lot, principal, "Lote criado", "Registro operacional; não substitui atestado sanitário.")
    db.commit()
    db.refresh(lot)
    return lot


def read(db: Session, lot_id: uuid.UUID, principal: AuthenticatedPrincipal, *, lock: bool = False) -> Lot:
    lot = get_for_organization(db, lot_id, principal.organization_id, lock=lock)
    if not lot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lote não encontrado neste escopo")
    return lot


def update(db: Session, lot_id: uuid.UUID, payload: LotUpdate, principal: AuthenticatedPrincipal) -> Lot:
    _require(principal, OrganizationRole.DOADOR)
    lot = read(db, lot_id, principal, lock=True)
    if lot.donor_id != principal.user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Apenas o doador pode alterar este lote")
    if lot.status != LotStatus.PENDENTE_REVISAO:
        raise HTTPException(status.HTTP_409_CONFLICT, "Lote não pode ser alterado após a revisão")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lot, key, value)
    _event(db, lot, principal, "Lote atualizado")
    db.commit()
    db.refresh(lot)
    return lot


def reserve(db: Session, lot_id: uuid.UUID, principal: AuthenticatedPrincipal, idempotency_key: str) -> Lot:
    _require(principal, OrganizationRole.TRANSPORTADOR)
    existing = db.scalar(select(Reservation).where(Reservation.idempotency_key == idempotency_key))
    if existing:
        lot = get_for_organization(db, existing.lot_id, principal.organization_id)
        if lot and existing.transporter_id == principal.user_id:
            return lot
        raise HTTPException(status.HTTP_409_CONFLICT, "Chave de idempotência já foi usada")
    lot = read(db, lot_id, principal, lock=True)
    if lot.status != LotStatus.LIBERADO:
        raise HTTPException(status.HTTP_409_CONFLICT, "Lote não está liberado para reserva")
    assert_not_expired(lot)
    try:
        db.add(Reservation(lot_id=lot.id, transporter_id=principal.user_id, idempotency_key=idempotency_key, is_simulation=False))
        lot.status, lot.transporter_id = LotStatus.RESERVADO, principal.user_id
        _event(db, lot, principal, "Reserva confirmada")
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Lote já possui reserva ativa") from error
    db.refresh(lot)
    return lot


def review(db: Session, lot_id: uuid.UUID, payload: ReviewCreate, principal: AuthenticatedPrincipal) -> Lot:
    _require(principal, OrganizationRole.REVISOR_AUTORIZADO)
    lot = read(db, lot_id, principal, lock=True)
    if lot.status != LotStatus.PENDENTE_REVISAO:
        raise HTTPException(status.HTTP_409_CONFLICT, "Apenas lotes pendentes podem ser revisados")
    if payload.decision == ReviewDecision.APROVADO:
        assert_not_expired(lot)
        institution = db.get(Institution, payload.institution_id)
        if not institution or institution.organization_id != principal.organization_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Instituição não encontrada neste escopo")
        accepted = set(institution.accepted_conservation.split(","))
        if lot.conservation.value not in accepted or lot.quantity_kg > institution.capacity_kg:
            raise HTTPException(status.HTTP_409_CONFLICT, "Instituição incompatível com o lote")
        lot.status, lot.institution_id = LotStatus.LIBERADO, institution.id
        action = "Revisão humana registrada: aprovada"
    else:
        lot.status, lot.reason = LotStatus.REJEITADO, payload.reason.strip() if payload.reason else None
        action = "Revisão humana registrada: rejeitada"
    db.add(SanitaryReview(lot_id=lot.id, reviewer_id=principal.user_id, decision=payload.decision, reason=payload.reason, human_authorized=True, is_simulation=False))
    _event(db, lot, principal, action, "Registro do sistema; não é atestado legal ou sanitário.")
    db.commit()
    db.refresh(lot)
    return lot
