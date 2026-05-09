import pytest

from app.core.exceptions import InvalidCredentialsError
from app.models.models import User
from app.services.auth_service import pwd_context


class TestLogin:
    def test_login_exitoso_retorna_token(self, auth_service, db):
        user = User(email="usuario@mail.com", hashed_password=pwd_context.hash("password123"))

        db.query.return_value.filter.return_value.first.return_value = user

        result = auth_service.login(email="usuario@mail.com", password="password123")

        assert "access_token" in result
        assert result["token_type"] == "bearer"

    def test_login_password_incorrecto_lanza_excepcion(self, auth_service, db):
        user = User(email="usuario@mail.com", hashed_password=pwd_context.hash("password123"))

        db.query.return_value.filter.return_value.first.return_value = user

        with pytest.raises(InvalidCredentialsError):
            auth_service.login(email="usuario@mail.com", password="wrong-password")

    def test_login_usuario_inexistente_lanza_excepcion(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(InvalidCredentialsError):
            auth_service.login(email="usuario@mail.com", password="password123")