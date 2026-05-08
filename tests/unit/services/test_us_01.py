import pytest
from app.models.models import User


class TestRegistro:

    def test_registro_exitoso_retorna_token(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        result = auth_service.register(email="usuario@mail.com", password="password123")
        assert "access_token" in result
        assert result["token_type"] == "bearer"

    def test_registro_persiste_usuario_en_db(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        auth_service.register(email="usuario@mail.com", password="password123")
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_registro_no_guarda_password_en_texto_plano(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        auth_service.register(email="usuario@mail.com", password="password123")
        usuario_guardado = db.add.call_args[0][0]
        assert usuario_guardado.hashed_password != "password123"

    def test_registro_email_duplicado_lanza_excepcion(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = User(
            email="usuario@mail.com",
            hashed_password="hashed"
        )
        with pytest.raises(Exception) as exc:
            auth_service.register(email="usuario@mail.com", password="password123")
        assert "email" in str(exc.value).lower()

    def test_registro_password_menor_a_8_caracteres_lanza_excepcion(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(Exception) as exc:
            auth_service.register(email="usuario@mail.com", password="123")
        assert "password" in str(exc.value).lower() or "contraseña" in str(exc.value).lower()

    def test_registro_password_exactamente_8_caracteres_es_valido(self, auth_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        result = auth_service.register(email="usuario@mail.com", password="12345678")
        assert "access_token" in result