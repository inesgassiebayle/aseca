Feature: Evolución histórica comparada

  Scenario: Ver evolución de Revenue entre dos empresas
    Given que el usuario tiene "AAPL" y "GOOGL" en su watchlist
    When solicita comparar la evolución de Revenue de los últimos 8 quarters
    Then ve un listado por quarter con el Revenue de cada empresa
    And puede identificar la tendencia de crecimiento de cada una

  Scenario: Métrica sin datos históricos suficientes
    Given que el usuario tiene "AAPL" y "XYZ" en su watchlist
    And "XYZ" solo tiene 2 quarters reportados en EDGAR
    When solicita los últimos 8 quarters de Revenue
    Then ve los 8 quarters de "AAPL"
    And ve los 2 quarters disponibles de "XYZ" con indicación de datos insuficientes