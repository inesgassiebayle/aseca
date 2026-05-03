Feature: Historial de operaciones

  Scenario: Ver historial completo
    Given que el usuario tiene operaciones registradas
    When consulta su historial
    Then ve todas las operaciones ordenadas por fecha descendente
    And cada operación muestra tipo, ticker, cantidad, precio y timestamp

  Scenario: Filtrar historial por ticker
    Given que el usuario tiene operaciones de "AAPL" y "MSFT"
    When filtra el historial por "AAPL"
    Then solo ve las operaciones de "AAPL"

  Scenario: Historial vacío
    Given que el usuario no tiene operaciones registradas
    When consulta su historial
    Then ve un mensaje indicando que no hay operaciones registradas