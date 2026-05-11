Feature: Detalle de posición

  Scenario: Ver detalle de ticker existente
    Given que el usuario tiene posiciones de "AAPL" en su portfolio
    When consulta el detalle de "AAPL"
    Then ve la cantidad actual, precio promedio y P&L
    And ve el historial de operaciones de "AAPL"

  Scenario: Ticker sin posición
    Given que el usuario no tiene posiciones de "TSLA"
    When consulta el detalle de "TSLA"
    Then el sistema retorna un error 404