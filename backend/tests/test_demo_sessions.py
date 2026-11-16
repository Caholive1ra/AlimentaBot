import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services import demo


def test_demo_sessions_are_isolated_and_persisted(db: Session):
    first, first_token = demo.create_session(db)
    second, second_token = demo.create_session(db)
    assert first.organization_id != second.organization_id
    assert demo.session_for_token(db, first_token).id == first.id
    assert demo.session_for_token(db, second_token).id == second.id
    assert demo.state(db, first)["lots"] == []
    with pytest.raises(HTTPException):
        demo.session_for_token(db, "x" * 32)


def test_demo_reset_replaces_only_current_session(db: Session):
    first, first_token = demo.create_session(db)
    second, second_token = demo.create_session(db)
    next_session, next_token = demo.reset(db, first)
    assert next_session.id != first.id
    assert next_token != first_token
    assert demo.session_for_token(db, second_token).id == second.id
