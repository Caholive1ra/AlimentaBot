from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import demo

router = APIRouter(prefix="/demo", tags=["academic-demo"])


def current_session(x_demo_session: str = Header(min_length=32, max_length=256), db: Session = Depends(get_db)):
    return demo.session_for_token(db, x_demo_session)


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def start(db: Session = Depends(get_db)) -> dict:
    session, token = demo.create_session(db)
    return {"token": token, "expires_at": session.expires_at}


@router.get("/state")
def get_state(session=Depends(current_session), db: Session = Depends(get_db)) -> dict:
    return demo.state(db, session)


@router.post("/reset")
def reset(session=Depends(current_session), db: Session = Depends(get_db)) -> dict:
    next_session, token = demo.reset(db, session)
    return {"token": token, "expires_at": next_session.expires_at}
