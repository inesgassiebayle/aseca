Feature: Registro de usuario

  Scenario: Registro exitoso
    Given que el email "usuario@mail.com" no está registrado
    When el usuario quiere registrarse con email "usuario@mail.com" y contraseña "password123"
    Then se crea la cuenta exitosamente
    And el sistema retorna un token de autenticación

  Scenario: Email ya registrado
    Given que el email "usuario@mail.com" ya está registrado
    When el usuario intenta registrarse con "usuario@mail.com"
    Then el sistema retorna un error 409
    And el mensaje indica que el email ya está en uso

  Scenario: Contraseña débil
    Given que el email "usuario@mail.com" no está registrado
    And la contraseña "123" no cumple con los requisitos de seguridad
    When el usuario envía email "usuario@mail.com" y password "123"
    Then el sistema retorna un error 409
    And el mensaje indica que la contraseña es demasiado débil