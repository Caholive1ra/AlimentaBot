"""Auth0 JWT validation and organization-scoped principal resolution."""

from dataclasses import dataclass
from functools import lru_cache
import logging
import uuid

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import OrganizationMember, User


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    user_id: uuid.UUID
    subject: str
    organization_id: uuid.UUID
    roles: frozenset[str]


def subject_from_claims(claims: dict) -> str:
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sem subject válido")
    return subject


@lru_cache
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url, cache_keys=True)


def validate_access_token(token: str) -> dict:
    settings = get_settings()
    if not settings.auth0_issuer or not settings.auth0_audience or not settings.auth0_jwks_url:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Auth0 não está configurado neste ambiente")
    try:
        key = _jwks_client(settings.auth0_jwks_url).get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=settings.auth0_issuer,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as error:
        _auth_failure("expired_token")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error
    except jwt.InvalidIssuerError as error:
        _auth_failure("invalid_issuer")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error
    except jwt.InvalidAudienceError as error:
        _auth_failure("invalid_audience")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error
    except jwt.InvalidSignatureError as error:
        _auth_failure("invalid_signature")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error
    except jwt.PyJWKClientError as error:
        _auth_failure("jwks_unavailable")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error
    except jwt.PyJWTError as error:
        _auth_failure("invalid_token")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de acesso inválido") from error


def _auth_failure(category: str) -> None:
    """Diagnostic category only: never log credentials, claims, headers or secrets."""
    logger.warning("auth_validation_failed category=%s", category)


def resolve_principal(db: Session, claims: dict, organization_id: uuid.UUID) -> AuthenticatedPrincipal:
    subject = subject_from_claims(claims)
    user = db.scalar(select(User).where(User.auth_subject == subject))
    if not user:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuário não possui acesso cadastrado")
    memberships = db.scalars(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.active.is_(True),
        )
    ).all()
    if not memberships:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuário não possui acesso a esta organização")
    return AuthenticatedPrincipal(user.id, subject, organization_id, frozenset(member.role.value for member in memberships))
