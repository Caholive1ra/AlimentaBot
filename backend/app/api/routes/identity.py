from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_subject
from app.core.database import get_db
from app.services.identity import context_for_subject


router = APIRouter(tags=["identity"])


@router.get("/me")
def me(subject: str = Depends(get_authenticated_subject), db: Session = Depends(get_db)) -> dict:
    """Return only memberships already authorized on the server; no organization header is accepted."""
    return context_for_subject(db, subject)
