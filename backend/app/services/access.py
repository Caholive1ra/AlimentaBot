"""Access requests and invitation-only privileged provisioning."""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal
from app.models import AccessAuditEvent, AccessInvitation, AccessRequest, OrganizationMember, OrganizationRole, Role, User
from app.schemas import InvitationAccept, InvitationCreate, PublicRegistrationRequest


PLATFORM_ADMIN = OrganizationRole.ADMIN_PLATAFORMA
ORG_ADMIN = OrganizationRole.ADMIN_ORGANIZACAO


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    """SQLite test databases may return a naive timestamp despite timezone=True."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _audit(db: Session, actor_id: uuid.UUID | None, target_id: uuid.UUID | None, organization_id: uuid.UUID | None, action: str, detail: str | None = None) -> None:
    db.add(AccessAuditEvent(actor_id=actor_id, target_user_id=target_id, organization_id=organization_id, action=action, detail=detail, is_simulation=False))


def _require_inviter(principal: AuthenticatedPrincipal, role: OrganizationRole) -> None:
    if ORG_ADMIN.value not in principal.roles and PLATFORM_ADMIN.value not in principal.roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Somente administrador autorizado pode conceder acessos")
    if role == PLATFORM_ADMIN and PLATFORM_ADMIN.value not in principal.roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Somente administrador de plataforma pode convidar outro administrador de plataforma")


def request_public_registration(db: Session, subject: str, payload: PublicRegistrationRequest) -> AccessRequest:
    existing = db.scalar(select(AccessRequest).where(AccessRequest.auth_subject == subject))
    if existing:
        existing.requested_role = payload.requested_role
        existing.organization_name = payload.organization_name.strip()
        existing.status = "PENDENTE"
        request = existing
    else:
        request = AccessRequest(auth_subject=subject, requested_role=payload.requested_role, organization_name=payload.organization_name.strip(), is_simulation=False)
        db.add(request)
    _audit(db, None, None, None, "SOLICITACAO_PUBLICA_CADASTRO", payload.requested_role.value)
    db.commit()
    db.refresh(request)
    return request


def issue_invitation(db: Session, principal: AuthenticatedPrincipal, payload: InvitationCreate) -> tuple[AccessInvitation, str]:
    _require_inviter(principal, payload.role)
    if payload.expires_at <= _now():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Convite deve expirar no futuro")
    token = secrets.token_urlsafe(32)
    invite = AccessInvitation(
        token_hash=_hash(token), recipient_subject=payload.recipient_subject,
        organization_id=principal.organization_id, role=payload.role,
        invited_by_user_id=principal.user_id, expires_at=payload.expires_at,
        is_simulation=False,
    )
    db.add(invite)
    _audit(db, principal.user_id, None, principal.organization_id, "CONVITE_EMITIDO", payload.role.value)
    db.commit()
    db.refresh(invite)
    return invite, token


def accept_invitation(db: Session, subject: str, payload: InvitationAccept) -> AccessInvitation:
    invite = db.scalar(select(AccessInvitation).where(AccessInvitation.token_hash == _hash(payload.token)).with_for_update())
    if not invite or invite.revoked_at or invite.accepted_at or _as_utc(invite.expires_at) <= _now():
        raise HTTPException(status.HTTP_409_CONFLICT, "Convite inválido, expirado, revogado ou já utilizado")
    if not secrets.compare_digest(invite.recipient_subject, subject):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "A identidade autenticada não corresponde ao destinatário do convite")
    user = db.scalar(select(User).where(User.auth_subject == subject))
    if not user:
        user = User(name=payload.name.strip(), auth_subject=subject, role=Role(invite.role.value), is_simulation=False)
        db.add(user)
        db.flush()
    membership = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == invite.organization_id, OrganizationMember.user_id == user.id, OrganizationMember.role == invite.role))
    if membership:
        membership.active = True
    else:
        db.add(OrganizationMember(organization_id=invite.organization_id, user_id=user.id, role=invite.role, active=True, is_simulation=False))
    invite.accepted_at, invite.accepted_by_user_id = _now(), user.id
    _audit(db, user.id, user.id, invite.organization_id, "CONVITE_ACEITO", invite.role.value)
    db.commit()
    db.refresh(invite)
    return invite


def revoke_membership(db: Session, principal: AuthenticatedPrincipal, user_id: uuid.UUID, role: OrganizationRole) -> None:
    _require_inviter(principal, role)
    membership = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == principal.organization_id, OrganizationMember.user_id == user_id, OrganizationMember.role == role).with_for_update())
    if not membership or not membership.active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vínculo ativo não encontrado")
    membership.active = False
    _audit(db, principal.user_id, user_id, principal.organization_id, "ACESSO_REVOGADO", role.value)
    db.commit()

