import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedPrincipal, resolve_principal, validate_access_token
from app.core.database import get_db
from app.core.config import get_settings
from app.models import Role


@dataclass(frozen=True)
class DemoActor:
    role: Role
    actor_id: uuid.UUID | None
    sanitary_authorized: bool


bearer_scheme = HTTPBearer(auto_error=False)


def get_authenticated_principal(
    organization_id: uuid.UUID = Header(alias="X-Organization-Id"),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthenticatedPrincipal:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bearer token é obrigatório")
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

