Feature: Login de usuario

  Scenario: Login exitoso
    Given que el usuario "usuario@mail.com" está registrado
    When envía sus credenciales correctas
    Then el sistema retorna un token de autenticación válido

  Scenario: Credenciales incorrectas
    Given que el usuario "usuario@mail.com" está registrado
    When envía un password incorrecto
    Then el sistema retorna un error 401
    And el mensaje indica credenciales inválidas