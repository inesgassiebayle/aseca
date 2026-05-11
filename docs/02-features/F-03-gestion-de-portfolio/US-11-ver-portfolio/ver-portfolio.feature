Feature: Ver portfolio

  Scenario: Portfolio con posiciones
    Given que el usuario tiene posiciones de "AAPL" y "MSFT"
    And existen precios almacenados para ambos tickers
    When consulta su portfolio
    Then ve cada posición con ticker, cantidad, precio actual y valor total
    And ve el valor total del portfolio

  Scenario: Portfolio vacío
    Given que el usuario no tiene operaciones registradas
    When consulta su portfolio
    Then ve un mensaje indicando que el portfolio está vacío
