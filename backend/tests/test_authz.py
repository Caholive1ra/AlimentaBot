import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.auth import resolve_principal
from app.models import Organization, OrganizationMember, OrganizationRole, Role, User


def test_principal_is_scoped_to_organization_and_roles(db: Session):
    user = User(name="Operador", role=Role.GESTOR, auth_subject="auth0|operator")
    allowed = Organization(name="Organização permitida")
    denied = Organization(name="Organização não permitida")
    db.add_all([user, allowed, denied])
    db.flush()
    db.add(OrganizationMember(organization_id=allowed.id, user_id=user.id, role=OrganizationRole.GESTOR))
    db.commit()

    principal = resolve_principal(db, {"sub": "auth0|operator"}, allowed.id)
    assert principal.user_id == user.id
    assert principal.roles == frozenset({"gestor"})

    with pytest.raises(HTTPException) as error:
        resolve_principal(db, {"sub": "auth0|operator"}, denied.id)
    assert error.value.status_code == 403


def test_principal_rejects_unknown_subject(db: Session):
    organization = Organization(name="Organização")
    db.add(organization)
    db.commit()

    with pytest.raises(HTTPException) as error:
        resolve_principal(db, {"sub": f"auth0|{uuid.uuid4()}"}, organization.id)
    assert error.value.status_code == 403


def test_operational_route_rejects_missing_bearer_token(client: TestClient):
    response = client.get("/api/v1/operational/lots")
    assert response.status_code == 401
