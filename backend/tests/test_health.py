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

