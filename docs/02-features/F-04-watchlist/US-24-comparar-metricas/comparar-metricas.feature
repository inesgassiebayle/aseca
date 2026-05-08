Feature: Comparación de métricas financieras

  Scenario: Comparación exitosa entre dos empresas
    Given que el usuario tiene "AAPL" y "MSFT" en su watchlist
    And ambas tienen datos disponibles en EDGAR
    When solicita comparar sus métricas financieras
    Then ve una tabla con Revenue, Net Income, EPS, Total Assets y Total Liabilities para cada empresa en paralelo

  Scenario: Una empresa sin datos en EDGAR
    Given que el usuario tiene "AAPL" y "XYZ" en su watchlist
    And "XYZ" no tiene datos XBRL en EDGAR
    When solicita comparar sus métricas
    Then ve los datos de "AAPL" normalmente
    And para "XYZ" se indica "No disponible" en cada métrica

  Scenario: Empresa no está en watchlist
    Given que el usuario intenta comparar "TSLA" que no está en su watchlist
    When solicita la comparación
    Then el sistema retorna un error indicando que "TSLA" no está en la watchlist