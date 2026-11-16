from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Institution, Role, User


def times() -> dict[str, str]:
    now = datetime.now(timezone.utc)
    return {"prepared_at": (now - timedelta(hours=2)).isoformat(), "expires_at": (now + timedelta(hours=24)).isoformat(), "pickup_window_start": (now + timedelta(hours=1)).isoformat(), "pickup_window_end": (now + timedelta(hours=4)).isoformat()}


def lot_payload(**changes):
    payload = {"item": "Pães demonstrativos", "category": "panificacao", "quantity_kg": 10, "conservation": "ambiente", "origin": "Padaria Fictícia", **times()}
    payload.update(changes)
    return payload


def headers(role: str, actor_id=None, authorized=False) -> dict[str, str]:
    result = {"X-Demo-Role": role}
    if actor_id:
        result["X-Demo-Actor-Id"] = str(actor_id)
    if authorized:
        result["X-Sanitary-Authorized"] = "true"
    return result


def setup_actors(db: Session):
    institution = Institution(name="Instituição Fictícia", neighborhood="Centro", capacity_kg=100, accepted_conservation="ambiente,refrigerado")
    driver = User(name="Transportador Demo", role=Role.TRANSPORTADOR, capacity_kg=100, refrigerated=False)
    db.add_all([institution, driver])
    db.commit()
    return institution, driver


def create_lot(client: TestClient):
    response = client.post("/api/v1/lotes", json=lot_payload(), headers=headers("doador"))
    assert response.status_code == 201
    assert response.json()["status"] == "PENDENTE_REVISAO"
    return response.json()["id"]


def approve(client: TestClient, lot_id: str, institution_id: str):
    return client.post(f"/api/v1/lotes/{lot_id}/revisoes", json={"decision": "APROVADO", "institution_id": institution_id}, headers=headers("gestor", authorized=True))


def test_lot_requires_human_authorized_review(client: TestClient, db: Session):
    institution, _ = setup_actors(db)
    lot_id = create_lot(client)
    response = client.post(f"/api/v1/lotes/{lot_id}/revisoes", json={"decision": "APROVADO", "institution_id": str(institution.id)}, headers=headers("gestor"))
    assert response.status_code == 403
    assert "humano autorizado" in response.json()["detail"]


def test_donor_cannot_review_a_lot(client: TestClient, db: Session):
    institution, _ = setup_actors(db)
    lot_id = create_lot(client)
    response = client.post(
        f"/api/v1/lotes/{lot_id}/revisoes",
        json={"decision": "APROVADO", "institution_id": str(institution.id)},
        headers=headers("doador", authorized=True),
    )
    assert response.status_code == 403


def test_rejects_expired_lot_at_creation(client: TestClient):
    response = client.post("/api/v1/lotes", json=lot_payload(expires_at=(datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()), headers=headers("doador"))
    assert response.status_code == 422


def test_reservation_is_unique_and_flow_records_custody(client: TestClient, db: Session):
    institution, driver = setup_actors(db)
    lot_id = create_lot(client)
    assert approve(client, lot_id, str(institution.id)).status_code == 200
    driver_headers = headers("transportador", driver.id)
    assert client.post(f"/api/v1/lotes/{lot_id}/reservas", json={"transporter_id": str(driver.id)}, headers=driver_headers).status_code == 200
    assert client.post(f"/api/v1/lotes/{lot_id}/reservas", json={"transporter_id": str(driver.id)}, headers=driver_headers).status_code == 409
    assert client.post(f"/api/v1/lotes/{lot_id}/coletas", headers=driver_headers).json()["status"] == "COLETADO"
    assert client.post(f"/api/v1/lotes/{lot_id}/entregas", json={"accepted": True}, headers=headers("instituicao")).json()["status"] == "ENTREGUE"
    events = client.get(f"/api/v1/lotes/{lot_id}/custodia").json()
    assert len(events) == 5
    assert events[-1]["action"] == "Recebimento confirmado"


def test_transporter_conservation_compatibility(client: TestClient, db: Session):
    institution, driver = setup_actors(db)
    lot = client.post("/api/v1/lotes", json=lot_payload(category="refeicao_pronta", conservation="refrigerado"), headers=headers("doador"))
    lot_id = lot.json()["id"]
    assert approve(client, lot_id, str(institution.id)).status_code == 200
    response = client.post(f"/api/v1/lotes/{lot_id}/reservas", json={"transporter_id": str(driver.id)}, headers=headers("transportador", driver.id))
    assert response.status_code == 409
    assert "incompatível" in response.json()["detail"]

