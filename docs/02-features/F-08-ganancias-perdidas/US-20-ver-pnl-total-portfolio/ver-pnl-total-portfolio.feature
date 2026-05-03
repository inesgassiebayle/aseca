Feature: P&L total del portfolio

  Scenario: Portfolio con múltiples posiciones
    Given que el usuario tiene posiciones en "AAPL", "MSFT" y "GOOGL"
    And todos tienen precios almacenados en la DB
    When consulta el resumen de su portfolio
    Then ve el valor total invertido, el valor actual y el P&L total consolidado

  Scenario: Portfolio con ticker sin precio
    Given que el usuario tiene posiciones en "AAPL" y "XYZ"
    And "XYZ" no tiene precio almacenado en la DB
    When consulta el resumen de su portfolio
    Then ve el P&L calculado solo con "AAPL"
    And ve una advertencia indicando que "XYZ" fue excluido del cálculo