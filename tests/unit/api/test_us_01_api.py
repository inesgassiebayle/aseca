class TestRegistroAPI:

    def test_registro_exitoso_retorna_201(self, client):
        c, _ = client
        response = c.post("/api/v1/auth/register", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })
        assert response.status_code == 201

    def test_registro_exitoso_retorna_token(self, client):
        c, _ = client
        response = c.post("/api/v1/auth/register", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_registro_email_duplicado_retorna_409(self, client):
        from app.models.models import User
        c, db = client
        db.query.return_value.filter.return_value.first.return_value = User(
            email="usuario@mail.com", hashed_password="hashed"
        )
        response = c.post("/api/v1/auth/register", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })
        assert response.status_code == 409
        assert "email" in response.json()["detail"].lower()

    def test_registro_password_debil_retorna_422(self, client):
        c, _ = client
        response = c.post("/api/v1/auth/register", json={
            "email": "usuario@mail.com",
            "password": "123"
        })
        assert response.status_code == 422
        assert "password" in response.json()["detail"].lower()

    def test_registro_persiste_usuario(self, client):
        c, db = client
        c.post("/api/v1/auth/register", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })
        db.add.assert_called_once()
        db.commit.assert_called_once()