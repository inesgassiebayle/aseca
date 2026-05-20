import httpx
import pytest
from sqlalchemy import create_engine, text

from tests.integration.conftest import SERVER_URL, TEST_DB_URL


class TestRegistroIntegracion:
    def test_registro_exitoso_retorna_201_y_token(self):
        response = httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        assert response.status_code == 201
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 0

    def test_registro_exitoso_persiste_usuario_en_db(self):
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT email FROM users WHERE email = 'test@mail.com'")
            ).fetchone()
        engine.dispose()

        assert row is not None
        assert row[0] == "test@mail.com"

    def test_registro_no_almacena_password_en_texto_plano(self):
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT hashed_password FROM users WHERE email = 'test@mail.com'")
            ).fetchone()
        engine.dispose()

        assert row[0] != "password123"
        assert row[0].startswith("$2b$")

    def test_registro_email_duplicado_retorna_409(self):
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        response = httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        assert response.status_code == 409
        assert "email" in response.json()["detail"].lower()

    def test_registro_email_duplicado_no_crea_usuario_adicional(self):
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "password123",
        })

        engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            count = conn.execute(
                text("SELECT COUNT(*) FROM users WHERE email = 'test@mail.com'")
            ).scalar()
        engine.dispose()

        assert count == 1

    def test_registro_password_debil_retorna_422(self):
        response = httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "123",
        })

        assert response.status_code == 422
        assert "password" in response.json()["detail"].lower()

    def test_registro_password_debil_no_persiste_usuario(self):
        httpx.post(f"{SERVER_URL}/api/v1/auth/register", json={
            "email": "test@mail.com",
            "password": "123",
        })

        engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            count = conn.execute(
                text("SELECT COUNT(*) FROM users WHERE email = 'test@mail.com'")
            ).scalar()
        engine.dispose()

        assert count == 0