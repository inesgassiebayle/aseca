def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_returns_version(client):
    response = client.get("/health")
    assert "version" in response.json()
