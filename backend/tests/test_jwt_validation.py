from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException

from app.core import auth


ISSUER = "https://tenant.example/"
AUDIENCE = "https://api.example/alimentabot"


class SigningKey:
    def __init__(self, key):
        self.key = key


class StaticJwks:
    def __init__(self, public_key):
        self.public_key = public_key

    def get_signing_key_from_jwt(self, _token):
        return SigningKey(self.public_key)


@pytest.fixture()
def jwt_context(monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    settings = SimpleNamespace(auth0_issuer=ISSUER, auth0_audience=AUDIENCE, auth0_jwks_url=f"{ISSUER}.well-known/jwks.json")
    monkeypatch.setattr(auth, "get_settings", lambda: settings)
    monkeypatch.setattr(auth, "_jwks_client", lambda _url: StaticJwks(private_key.public_key()))
    return private_key


def make_token(private_key, **overrides) -> str:
    now = datetime.now(timezone.utc)
    claims = {"sub": "auth0|test-user", "iss": ISSUER, "aud": AUDIENCE, "iat": now, "exp": now + timedelta(minutes=5)}
    claims.update(overrides)
    return jwt.encode(claims, private_key, algorithm="RS256")


def assert_rejected(token: str, category: str, caplog) -> None:
    with pytest.raises(HTTPException) as error:
        auth.validate_access_token(token)
    assert error.value.status_code == 401
    assert f"category={category}" in caplog.text


def test_accepts_valid_access_token(jwt_context):
    claims = auth.validate_access_token(make_token(jwt_context))
    assert claims["sub"] == "auth0|test-user"


def test_rejects_expired_access_token(jwt_context, caplog):
    assert_rejected(make_token(jwt_context, exp=datetime.now(timezone.utc) - timedelta(minutes=1)), "expired_token", caplog)


def test_rejects_wrong_issuer(jwt_context, caplog):
    assert_rejected(make_token(jwt_context, iss="https://other.example/"), "invalid_issuer", caplog)


def test_rejects_wrong_audience(jwt_context, caplog):
    assert_rejected(make_token(jwt_context, aud="https://other-api.example"), "invalid_audience", caplog)


def test_rejects_invalid_signature(jwt_context, caplog):
    another_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    assert_rejected(make_token(another_private_key), "invalid_signature", caplog)
