Feature: Compra de acciones

  Scenario: Compra exitosa
    Given que el usuario está autenticado
    And el ticker "AAPL" tiene precio almacenado en la DB
    When registra una compra de 10 acciones de "AAPL"
    Then la operación queda registrada con el precio vigente y timestamp
    And el portfolio refleja 10 acciones más de "AAPL"

  Scenario: Ticker sin precio en la DB
    Given que el ticker "XYZ" no tiene precio almacenado
    When el usuario intenta comprar acciones de "XYZ"
    Then el sistema retorna un error indicando que no hay precio disponible

  Scenario: Cantidad inválida
    Given que el usuario está autenticado
    When intenta comprar 0 o una cantidad negativa de acciones
    Then el sistema retorna un error de validación