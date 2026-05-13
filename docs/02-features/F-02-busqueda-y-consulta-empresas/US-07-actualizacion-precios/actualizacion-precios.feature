Feature: Actualización de precios (batch)

  Scenario: Actualización exitosa de todos los tickers
    Given que los portfolios y watchlists contienen los tickers "AAPL", "MSFT" y "GOOGL"
    And Yahoo Finance devuelve precios para todos ellos
    When se ejecuta el proceso batch
    Then se persisten los precios y timestamps de los 3 tickers
    And se guarda la fecha y hora de la ejecución como última actualización global
    And el reporte indica 3 actualizados, 0 fallidos

  Scenario: Un ticker no devuelve precio
    Given que el sistema tiene los tickers "AAPL" y "XYZ" activos
    And Yahoo Finance devuelve precio para "AAPL" pero no para "XYZ"
    When se ejecuta el proceso batch
    Then se persiste el precio de "AAPL"
    And se registra el error para "XYZ"
    And el proceso no se interrumpe
    And el reporte indica 1 actualizado, 1 fallido

  Scenario: La fecha de última actualización queda disponible
    Given que el proceso batch finalizó exitosamente
    When portfolio o watchlist consultan la fecha de última actualización
    Then el sistema retorna la fecha y hora de ese batch