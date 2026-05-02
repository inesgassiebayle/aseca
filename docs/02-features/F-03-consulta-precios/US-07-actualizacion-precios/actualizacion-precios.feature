Feature: Ejecución del batch de precios

  Scenario: Actualización exitosa de todos los tickers
    Given que el sistema tiene los tickers "AAPL", "MSFT" y "GOOGL" activos
    And Yahoo Finance devuelve precios para todos ellos
    When se ejecuta el proceso batch
    Then se persisten los precios y timestamps de los 3 tickers
    And el reporte indica 3 actualizados, 0 fallidos

  Scenario: Un ticker no devuelve precio
    Given que el sistema tiene los tickers "AAPL" y "XYZ" activos
    And Yahoo Finance devuelve precio para "AAPL" pero no para "XYZ"
    When se ejecuta el proceso batch
    Then se persiste el precio de "AAPL"
    And se registra el error para "XYZ"
    And el proceso no se interrumpe
    And el reporte indica 1 actualizado, 1 fallido