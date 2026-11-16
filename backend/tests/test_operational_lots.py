from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal
from app.models import LotStatus, Organization, OrganizationRole, Role, User
from app.schemas import OperationalLotCreate
from app.services import operational_lots


def principal(user: User, organization: Organization, role: OrganizationRole) -> AuthenticatedPrincipal:
    return AuthenticatedPrincipal(user.id, user.auth_subject or "test", organization.id, frozenset({role.value}))


def payload() -> OperationalLotCreate:
    now = datetime.now(timezone.utc)
    return OperationalLotCreate(item="Pães", category="panificacao", quantity_kg=5, conservation="ambiente", prepared_at=now - timedelta(hours=1), expires_at=now + timedelta(hours=4), pickup_window_start=now + timedelta(minutes=30), pickup_window_end=now + timedelta(hours=2), origin="Origem sintética")


def test_operational_lot_is_organization_scoped_and_audited(db: Session):
    donor = User(name="Doador", role=Role.DOADOR, auth_subject="auth0|donor")
    organization = Organization(name="Org A")
    other = Organization(name="Org B")
    db.add_all([donor, organization, other])
    db.commit()
    lot = operational_lots.create(db, payload(), principal(donor, organization, OrganizationRole.DOADOR))
    assert lot.organization_id == organization.id
    assert lot.status == LotStatus.PENDENTE_REVISAO
    with pytest.raises(HTTPException) as error:
        operational_lots.read(db, lot.id, principal(donor, other, OrganizationRole.DOADOR))
    assert error.value.status_code == 404


def test_reservation_is_idempotent_and_rejects_duplicate_key_for_another_actor(db: Session):
    donor = User(name="Doador", role=Role.DOADOR, auth_subject="auth0|donor")
    driver = User(name="Motorista", role=Role.TRANSPORTADOR, auth_subject="auth0|driver", capacity_kg=100)
    other_driver = User(name="Outro", role=Role.TRANSPORTADOR, auth_subject="auth0|other", capacity_kg=100)
    organization = Organization(name="Org")
    db.add_all([donor, driver, other_driver, organization])
    db.commit()
    lot = operational_lots.create(db, payload(), principal(donor, organization, OrganizationRole.DOADOR))
    lot.status = LotStatus.LIBERADO
    db.commit()
    first = operational_lots.reserve(db, lot.id, principal(driver, organization, OrganizationRole.TRANSPORTADOR), "repeatable-key")
    second = operational_lots.reserve(db, lot.id, principal(driver, organization, OrganizationRole.TRANSPORTADOR), "repeatable-key")
    assert first.id == second.id
    with pytest.raises(HTTPException) as error:
        operational_lots.reserve(db, lot.id, principal(other_driver, organization, OrganizationRole.TRANSPORTADOR), "repeatable-key")
    assert error.value.status_code == 409
