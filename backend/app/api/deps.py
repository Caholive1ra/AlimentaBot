import uuid
from dataclasses import dataclass
import logging

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal, resolve_principal, subject_from_claims, validate_access_token
from app.core.database import get_db
from app.core.config import get_settings
from app.models import Role


@dataclass(frozen=True)
class DemoActor:
    role: Role
    actor_id: uuid.UUID | None
    sanitary_authorized: bool


bearer_scheme = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


def _missing_bearer(credentials: HTTPAuthorizationCredentials | None) -> None:
    category = "missing_authorization_header" if credentials is None else "malformed_bearer_token"
    logger.warning("auth_request_rejected category=%s", category)
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bearer token é obrigatório")


def get_authenticated_subject(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        _missing_bearer(credentials)
    return subject_from_claims(validate_access_token(credentials.credentials))


def get_authenticated_principal(
    organization_id: uuid.UUID | None = Header(default=None, alias="X-Organization-Id"),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthenticatedPrincipal:
    if not credentials or credentials.scheme.lower() != "bearer":
        _missing_bearer(credentials)
    if organization_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Organization scope is required")
    return resolve_principal(db, validate_access_token(credentials.credentials), organization_id)


def get_actor(
    x_demo_role: Role | None = Header(default=None),
    x_demo_actor_id: uuid.UUID | None = Header(default=None),
    x_sanitary_authorized: bool = Header(default=False),
) -> DemoActor:
    if not get_settings().demo_mode_enabled:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Modo demonstração está desabilitado")
    if x_demo_role is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "X-Demo-Role é obrigatório no modo demonstrativo")
    return DemoActor(x_demo_role, x_demo_actor_id, x_sanitary_authorized)


def require_role(actor: DemoActor, *roles: Role) -> None:
    if actor.role not in roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Papel sem permissão para esta ação")

