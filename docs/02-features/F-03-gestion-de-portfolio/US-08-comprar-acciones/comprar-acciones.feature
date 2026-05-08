Feature: Compra de acciones

  Scenario: Compra exitosa
    Given que el usuario quiere comprar 10 acciones de "AAPL"
    And existe precio almacenado para "AAPL"
    When registra la operación
    Then se persiste la compra con tipo "compra", ticker, cantidad, precio y timestamp
    And la posición de "AAPL" en el portfolio aumenta en 10

  Scenario: Ticker sin precio almacenado
    Given que el usuario quiere comprar "XYZ"
    And no existe precio almacenado para "XYZ"
    When intenta registrar la operación
    Then el sistema rechaza la operación con un mensaje de error
