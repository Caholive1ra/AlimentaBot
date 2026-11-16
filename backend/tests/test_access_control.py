from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal
from app.models import AccessInvitation, Organization, OrganizationMember, OrganizationRole, Role, User
from app.schemas import InvitationAccept, InvitationCreate, PublicRegistrationRequest
from app.services import access


def principal(user: User, organization: Organization, *roles: OrganizationRole) -> AuthenticatedPrincipal:
    return AuthenticatedPrincipal(user.id, user.auth_subject or "auth0|test", organization.id, frozenset(role.value for role in roles))


def make_admin(db: Session, role: OrganizationRole = OrganizationRole.ADMIN_ORGANIZACAO) -> tuple[User, Organization, AuthenticatedPrincipal]:
    organization = Organization(name="Org autorizada", is_simulation=False)
    user = User(name="Admin", auth_subject="auth0|admin", role=Role.ADMIN_ORGANIZACAO, is_simulation=False)
    db.add_all([organization, user])
    db.flush()
    db.add(OrganizationMember(organization_id=organization.id, user_id=user.id, role=role, active=True, is_simulation=False))
    db.commit()
    return user, organization, principal(user, organization, role)


def test_public_registration_allows_only_public_roles(db: Session):
    request = access.request_public_registration(db, "auth0|doador", PublicRegistrationRequest(requested_role=OrganizationRole.DOADOR, organization_name="Padaria teste"))
    assert request.status == "PENDENTE"
    with pytest.raises(ValidationError):
        PublicRegistrationRequest(requested_role=OrganizationRole.ADMIN_ORGANIZACAO, organization_name="Ataque")


def test_invite_is_bound_to_subject_single_use_and_audited(db: Session):
    _admin, organization, actor = make_admin(db)
    invitation, token = access.issue_invitation(db, actor, InvitationCreate(recipient_subject="auth0|operator", role=OrganizationRole.OPERADOR, expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
    with pytest.raises(HTTPException) as wrong_identity:
        access.accept_invitation(db, "auth0|other", InvitationAccept(token=token, name="Outro"))
    assert wrong_identity.value.status_code == 403
    accepted = access.accept_invitation(db, "auth0|operator", InvitationAccept(token=token, name="Operador"))
    assert accepted.accepted_at is not None
    member = db.query(OrganizationMember).filter_by(organization_id=organization.id, role=OrganizationRole.OPERADOR).one()
    assert member.active is True
    with pytest.raises(HTTPException) as reused:
        access.accept_invitation(db, "auth0|operator", InvitationAccept(token=token, name="Operador"))
    assert reused.value.status_code == 409


def test_invite_expiration_revocation_and_platform_admin_boundary(db: Session):
    _admin, _organization, actor = make_admin(db)
    with pytest.raises(HTTPException) as forbidden:
        access.issue_invitation(db, actor, InvitationCreate(recipient_subject="auth0|new-platform-admin", role=OrganizationRole.ADMIN_PLATAFORMA, expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
    assert forbidden.value.status_code == 403
    invitation, token = access.issue_invitation(db, actor, InvitationCreate(recipient_subject="auth0|expired", role=OrganizationRole.GESTOR, expires_at=datetime.now(timezone.utc) + timedelta(seconds=1)))
    invitation.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    with pytest.raises(HTTPException) as expired:
        access.accept_invitation(db, "auth0|expired", InvitationAccept(token=token, name="Gestor"))
    assert expired.value.status_code == 409


def test_revocation_is_organization_scoped(db: Session):
    _admin, organization, actor = make_admin(db)
    target = User(name="Transportador", auth_subject="auth0|carrier", role=Role.TRANSPORTADOR, is_simulation=False)
    db.add(target)
    db.flush()
    db.add(OrganizationMember(organization_id=organization.id, user_id=target.id, role=OrganizationRole.TRANSPORTADOR, active=True, is_simulation=False))
    db.commit()
    access.revoke_membership(db, actor, target.id, OrganizationRole.TRANSPORTADOR)
    assert db.query(OrganizationMember).filter_by(organization_id=organization.id, user_id=target.id).one().active is False


def test_operator_cannot_grant_self_permissions(db: Session):
    organization = Organization(name="Org", is_simulation=False)
    operator = User(name="Operador", auth_subject="auth0|operator", role=Role.OPERADOR, is_simulation=False)
    db.add_all([organization, operator])
    db.flush()
    db.add(OrganizationMember(organization_id=organization.id, user_id=operator.id, role=OrganizationRole.OPERADOR, active=True, is_simulation=False))
    db.commit()
    with pytest.raises(HTTPException) as forbidden:
        access.issue_invitation(db, principal(operator, organization, OrganizationRole.OPERADOR), InvitationCreate(recipient_subject="auth0|operator", role=OrganizationRole.ADMIN_ORGANIZACAO, expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
    assert forbidden.value.status_code == 403
