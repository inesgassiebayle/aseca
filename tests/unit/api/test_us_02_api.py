from app.models.models import User
from app.services.auth_service import pwd_context


class TestLoginAPI:
    def test_login_exitoso_retorna_200_y_token(self, client):
        c, db = client

        db.query.return_value.filter.return_value.first.return_value = User(
            email="usuario@mail.com",
            hashed_password=pwd_context.hash("password123")
        )

        response = c.post("/api/v1/auth/login", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })

        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_password_incorrecto_retorna_401(self, client):
        c, db = client

        db.query.return_value.filter.return_value.first.return_value = User(
            email="usuario@mail.com",
            hashed_password=pwd_context.hash("password123")
        )

        response = c.post("/api/v1/auth/login", json={
            "email": "usuario@mail.com",
            "password": "wrong-password"
        })

        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()

    def test_login_usuario_inexistente_retorna_401(self, client):
        c, db = client

        db.query.return_value.filter.return_value.first.return_value = None

        response = c.post("/api/v1/auth/login", json={
            "email": "usuario@mail.com",
            "password": "password123"
        })

        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()