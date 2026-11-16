"""Isolated synthetic demo datasets. Never used by operational/Auth0 routes."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import CustodyEvent, DemoSession, Institution, Lot, LotStatus, Organization, OrganizationMember, OrganizationRole, Reservation, Role, User

TTL = timedelta(hours=8)


def now() -> datetime:
    return datetime.now(timezone.utc)


def digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def create_session(db: Session) -> tuple[DemoSession, str]:
    token = secrets.token_urlsafe(32)
    org = Organization(name="Demonstração acadêmica", is_simulation=True)
    db.add(org)
    db.flush()
    session = DemoSession(token_hash=digest(token), organization_id=org.id, expires_at=now() + TTL, last_seen_at=now(), is_simulation=True)
    db.add(session)
    donor = User(name="Doador fictício", role=Role.DOADOR, is_simulation=True)
    carrier = User(name="Transportador fictício", role=Role.TRANSPORTADOR, vehicle="Van demo", capacity_kg=200, refrigerated=True, is_simulation=True)
    db.add_all([donor, carrier])
    db.flush()
    db.add_all([
        OrganizationMember(organization_id=org.id, user_id=donor.id, role=OrganizationRole.DOADOR, is_simulation=True),
        OrganizationMember(organization_id=org.id, user_id=carrier.id, role=OrganizationRole.TRANSPORTADOR, is_simulation=True),
    ])
    db.add(Institution(name="Instituição fictícia", neighborhood="Centro", capacity_kg=500, accepted_conservation="ambiente,refrigerado,congelado", organization_id=org.id, is_simulation=True))
    db.commit()
    db.refresh(session)
    return session, token


def session_for_token(db: Session, token: str) -> DemoSession:
    session = db.scalar(select(DemoSession).where(DemoSession.token_hash == digest(token)).with_for_update())
    if not session or _utc(session.expires_at) <= now():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão demonstrativa inválida ou expirada")
    session.last_seen_at = now()
    db.commit()
    return session


def state(db: Session, session: DemoSession) -> dict:
    lots = list(db.scalars(select(Lot).where(Lot.organization_id == session.organization_id, Lot.is_simulation.is_(True)).order_by(Lot.created_at.desc())))
    events = list(db.scalars(select(CustodyEvent).join(Lot).where(Lot.organization_id == session.organization_id).order_by(CustodyEvent.created_at.desc())))
    return {"session_id": str(session.id), "expires_at": session.expires_at, "lots": [{"id": str(l.id), "item": l.item, "status": l.status.value, "quantity_kg": l.quantity_kg, "expires_at": l.expires_at} for l in lots], "events": [{"id": str(e.id), "lot_id": str(e.lot_id), "action": e.action, "created_at": e.created_at} for e in events]}


def reset(db: Session, session: DemoSession) -> tuple[DemoSession, str]:
    org_id = session.organization_id
    lot_ids = select(Lot.id).where(Lot.organization_id == org_id)
    db.execute(delete(CustodyEvent).where(CustodyEvent.lot_id.in_(lot_ids)))
    db.execute(delete(Reservation).where(Reservation.lot_id.in_(lot_ids)))
    db.execute(delete(Lot).where(Lot.organization_id == org_id))
    db.execute(delete(Institution).where(Institution.organization_id == org_id))
    member_ids = select(OrganizationMember.user_id).where(OrganizationMember.organization_id == org_id)
    db.execute(delete(OrganizationMember).where(OrganizationMember.organization_id == org_id))
    db.execute(delete(User).where(User.id.in_(member_ids)))
    db.delete(session)
    db.delete(db.get(Organization, org_id))
    db.commit()
    return create_session(db)


def cleanup_expired(db: Session) -> int:
    expired = list(db.scalars(select(DemoSession).where(DemoSession.expires_at <= now())))
    for session in expired:
        reset(db, session)
    return len(expired)
