"""Read-only identity context derived from persisted, active authorizations."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AccessInvitation, AccessRequest, Organization, OrganizationMember, User


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_future(value: datetime) -> bool:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value > _now()


def context_for_subject(db: Session, subject: str) -> dict:
    """Never provisions a user: Auth0 authentication alone grants no local access."""
    user = db.scalar(select(User).where(User.auth_subject == subject))
    request = db.scalar(select(AccessRequest).where(AccessRequest.auth_subject == subject))

    organizations: list[dict] = []
    if user:
        rows = db.execute(
            select(OrganizationMember, Organization)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(
                OrganizationMember.user_id == user.id,
                OrganizationMember.active.is_(True),
                Organization.active.is_(True),
            )
            .order_by(Organization.name, OrganizationMember.role)
        ).all()
        by_id: dict[str, dict] = {}
        for membership, organization in rows:
            key = str(organization.id)
            entry = by_id.setdefault(
                key,
                {"id": key, "name": organization.name, "roles": []},
            )
            entry["roles"].append(membership.role.value)
        organizations = list(by_id.values())
        for organization in organizations:
            organization["roles"].sort()

    invitations = db.scalars(
        select(AccessInvitation).where(
            AccessInvitation.recipient_subject == subject,
            AccessInvitation.accepted_at.is_(None),
            AccessInvitation.revoked_at.is_(None),
        )
    ).all()
    # The expiry comparison stays in Python because SQLite test fixtures may be naive.
    active_invite = any(_is_future(invite.expires_at) for invite in invitations)

    if organizations:
        onboarding = "AUTORIZADO"
    elif request and request.status == "PENDENTE":
        onboarding = "CADASTRO_PENDENTE"
    elif active_invite:
        onboarding = "AGUARDANDO_CONVITE"
    elif user and db.scalar(select(OrganizationMember.id).where(OrganizationMember.user_id == user.id)):
        onboarding = "ACESSO_REVOGADO"
    else:
        onboarding = "SEM_ACESSO"

    return {
        "subject": subject,
        "known_user": user is not None,
        "organizations": organizations,
        "registration": (
            {"status": request.status, "requested_role": request.requested_role.value, "organization_name": request.organization_name}
            if request
            else None
        ),
        "onboarding": onboarding,
    }
