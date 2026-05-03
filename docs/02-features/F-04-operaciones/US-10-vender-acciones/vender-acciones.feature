Feature: Venta de acciones

  Scenario: Venta exitosa
    Given que el usuario tiene 15 acciones de "AAPL" en su portfolio
    And "AAPL" tiene precio almacenado en la DB
    When registra una venta de 5 acciones de "AAPL"
    Then la operación queda registrada con el precio vigente y timestamp
    And el portfolio refleja 10 acciones de "AAPL"

  Scenario: Venta sin posición suficiente
    Given que el usuario tiene 3 acciones de "MSFT"
    When intenta vender 10 acciones de "MSFT"
    Then el sistema retorna un error indicando saldo insuficiente

  Scenario: Venta de acción no poseída
    Given que el usuario no tiene acciones de "TSLA"
    When intenta vender acciones de "TSLA"
    Then el sistema retorna un error indicando que no posee ese ticker