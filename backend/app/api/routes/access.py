import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_principal, get_authenticated_subject
from app.core.auth import AuthenticatedPrincipal
from app.core.database import get_db
from app.models import OrganizationRole
from app.schemas import InvitationAccept, InvitationCreate, InvitationIssued, InvitationRead, PublicRegistrationRequest
from app.services import access

router = APIRouter(prefix="/access", tags=["access-control"])


@router.post("/registration-requests", status_code=status.HTTP_202_ACCEPTED)
def request_registration(payload: PublicRegistrationRequest, subject: str = Depends(get_authenticated_subject), db: Session = Depends(get_db)) -> dict:
    request = access.request_public_registration(db, subject, payload)
    return {"id": str(request.id), "status": request.status, "message": "Solicitação registrada; ela não concede acesso operacional."}


@router.post("/invitations", response_model=InvitationIssued, status_code=status.HTTP_201_CREATED)
def create_invitation(payload: InvitationCreate, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> dict:
    invite, token = access.issue_invitation(db, principal, payload)
    return {**InvitationRead.model_validate(invite).model_dump(), "token": token}


@router.post("/invitations/accept", response_model=InvitationRead)
def accept_invitation(payload: InvitationAccept, subject: str = Depends(get_authenticated_subject), db: Session = Depends(get_db)) -> object:
    return access.accept_invitation(db, subject, payload)


@router.delete("/members/{user_id}/roles/{role}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_access(user_id: uuid.UUID, role: OrganizationRole, db: Session = Depends(get_db), principal: AuthenticatedPrincipal = Depends(get_authenticated_principal)) -> None:
    access.revoke_membership(db, principal, user_id, role)
