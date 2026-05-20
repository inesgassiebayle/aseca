import httpx

from tests.integration.conftest import SERVER_URL


def _registrar(email: str, password: str = "password123"):
    httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
        "email": email,
        "password": password,
    })


class TestLoginIntegracion:
    def test_login_exitoso_retorna_200_y_token(self):
        _registrar("test@mail.com")

        response = httpx.post(f"{SERVER_URL}/api/v1/auth/login", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 0

    def test_login_password_incorrecto_retorna_401(self):
        _registrar("test@mail.com")

        response = httpx.post(f"{SERVER_URL}/api/v1/auth/login", json={
            "email": "test@mail.com",
            "password": "wrongpassword",
        })

        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()

    def test_login_usuario_inexistente_retorna_401(self):
        response = httpx.post(f"{SERVER_URL}/api/v1/auth/login", json={
            "email": "noexiste@mail.com",
            "password": "password123",
        })

        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()

    def test_login_no_distingue_usuario_inexistente_de_password_incorrecto(self):
        _registrar("test@mail.com")

        r_wrong_pass = httpx.post(f"{SERVER_URL}/api/v1/auth/login", json={
            "email": "test@mail.com",
            "password": "wrongpassword",
        })
        r_no_user = httpx.post(f"{SERVER_URL}/api/v1/auth/login", json={
            "email": "noexiste@mail.com",
            "password": "password123",
        })

        assert r_wrong_pass.status_code == r_no_user.status_code == 401
        assert r_wrong_pass.json()["detail"] == r_no_user.json()["detail"]