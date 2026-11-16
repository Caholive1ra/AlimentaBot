from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import AccessInvitation, AccessRequest, Organization, OrganizationMember, OrganizationRole, Role, User
from app.services.identity import context_for_subject


def add_member(db: Session, subject: str, organizations: list[tuple[str, OrganizationRole]]) -> User:
    user = User(name="Usuário", auth_subject=subject, role=Role.DOADOR, is_simulation=False)
    db.add(user)
    db.flush()
    for name, role in organizations:
        organization = Organization(name=name, is_simulation=False)
        db.add(organization)
        db.flush()
        db.add(OrganizationMember(organization_id=organization.id, user_id=user.id, role=role, active=True, is_simulation=False))
    db.commit()
    return user


def test_context_returns_one_authorized_organization(db: Session):
    add_member(db, "auth0|one", [("Banco de Alimentos", OrganizationRole.DOADOR)])
    context = context_for_subject(db, "auth0|one")
    assert context["onboarding"] == "AUTORIZADO"
    assert context["organizations"] == [{"id": context["organizations"][0]["id"], "name": "Banco de Alimentos", "roles": ["doador"]}]


def test_context_groups_multiple_roles_and_organizations(db: Session):
    user = User(name="Múltiplos vínculos", auth_subject="auth0|many", role=Role.GESTOR, is_simulation=False)
    first, second = Organization(name="Org A", is_simulation=False), Organization(name="Org B", is_simulation=False)
    db.add_all([user, first, second])
    db.flush()
    db.add_all([
        OrganizationMember(organization_id=first.id, user_id=user.id, role=OrganizationRole.GESTOR, active=True, is_simulation=False),
        OrganizationMember(organization_id=first.id, user_id=user.id, role=OrganizationRole.OPERADOR, active=True, is_simulation=False),
        OrganizationMember(organization_id=second.id, user_id=user.id, role=OrganizationRole.TRANSPORTADOR, active=True, is_simulation=False),
    ])
    db.commit()
    context = context_for_subject(db, "auth0|many")
    assert len(context["organizations"]) == 2
    assert context["organizations"][0]["roles"] == ["gestor", "operador"]


def test_context_shows_pending_public_registration_without_membership(db: Session):
    db.add(AccessRequest(auth_subject="auth0|pending", requested_role=OrganizationRole.INSTITUICAO, organization_name="Instituição Teste", status="PENDENTE", is_simulation=False))
    db.commit()
    context = context_for_subject(db, "auth0|pending")
    assert context["known_user"] is False
    assert context["onboarding"] == "CADASTRO_PENDENTE"
    assert context["registration"]["requested_role"] == "instituicao"


def test_context_shows_pending_invite_without_provisioning_user(db: Session):
    inviter = add_member(db, "auth0|admin", [("Org", OrganizationRole.ADMIN_ORGANIZACAO)])
    organization_id = db.query(OrganizationMember).filter_by(user_id=inviter.id).one().organization_id
    db.add(AccessInvitation(token_hash="a" * 64, recipient_subject="auth0|invite", organization_id=organization_id, role=OrganizationRole.OPERADOR, invited_by_user_id=inviter.id, expires_at=datetime.now(timezone.utc) + timedelta(hours=1), is_simulation=False))
    db.commit()
    context = context_for_subject(db, "auth0|invite")
    assert context["known_user"] is False
    assert context["onboarding"] == "AGUARDANDO_CONVITE"


def test_context_hides_revoked_membership(db: Session):
    user = add_member(db, "auth0|revoked", [("Org", OrganizationRole.GESTOR)])
    db.query(OrganizationMember).filter_by(user_id=user.id).one().active = False
    db.commit()
    context = context_for_subject(db, "auth0|revoked")
    assert context["organizations"] == []
    assert context["onboarding"] == "ACESSO_REVOGADO"
