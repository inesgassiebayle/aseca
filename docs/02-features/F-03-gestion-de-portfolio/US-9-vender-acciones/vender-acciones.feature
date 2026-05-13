Feature: Venta de acciones

  Scenario: Venta exitosa parcial
    Given que el usuario tiene 20 acciones de "AAPL"
    And existe precio almacenado para "AAPL"
    When registra una venta de 10 acciones de "AAPL"
    Then se persiste la venta con tipo "venta", ticker, cantidad, precio y timestamp
    And la posición de "AAPL" queda en 10

  Scenario: Venta que cierra posición
    Given que el usuario tiene 10 acciones de "AAPL"
    When registra una venta de 10 acciones de "AAPL"
    Then la posición de "AAPL" desaparece del portfolio

  Scenario: Venta con cantidad mayor a la disponible
    Given que el usuario tiene 5 acciones de "AAPL"
    When intenta vender 10 acciones de "AAPL"
    Then el sistema rechaza la operación con un mensaje de error

  Scenario: Venta de ticker no poseído
    Given que el usuario no tiene posiciones de "TSLA"
    When intenta vender acciones de "TSLA"
    Then el sistema rechaza la operación con un mensaje de error
