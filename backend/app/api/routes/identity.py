from fastapi import APIRouter, Depends

from app.api.deps import get_authenticated_principal
from app.core.auth import AuthenticatedPrincipal


router = APIRouter(tags=["identity"])


@router.get("/me")
def me(principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> dict:
    return {
        "user_id": str(principal.user_id),
        "subject": principal.subject,
        "organization_id": str(principal.organization_id),
        "roles": sorted(principal.roles),
    }
