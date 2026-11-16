from fastapi.testclient import TestClient


def test_health_reports_demonstration_mode(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "alimentabot-api", "simulation_only": True}


def test_health_allows_configured_local_cors_origin(client: TestClient):
    response = client.options(
        "/health",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_operational_preflight_allows_local_frontend_and_authorization(client: TestClient):
    response = client.options(
        "/api/v1/me",
        headers={
            "Origin": "http://localhost:8080",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8080"
    assert "GET" in response.headers["access-control-allow-methods"]
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_preflight_rejects_untrusted_origin_without_allow_origin(client: TestClient):
    response = client.options(
        "/api/v1/me",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_me_without_token_keeps_cors_headers_for_authorized_origin(client: TestClient):
    response = client.get("/api/v1/me", headers={"Origin": "http://localhost:8080"})
    assert response.status_code == 401
    assert response.headers["access-control-allow-origin"] == "http://localhost:8080"

