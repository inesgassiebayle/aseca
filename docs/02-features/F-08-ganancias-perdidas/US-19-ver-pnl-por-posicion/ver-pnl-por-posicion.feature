Feature: P&L por posición

  Scenario: Posición con ganancia
    Given que el usuario compró 10 acciones de "AAPL" a $150
    And el último precio almacenado de "AAPL" es $180
    When consulta el P&L de su portfolio
    Then ve un P&L de +$300 y +20% para "AAPL"

  Scenario: Posición con pérdida
    Given que el usuario compró 5 acciones de "MSFT" a $420
    And el último precio almacenado de "MSFT" es $390
    When consulta el P&L de su portfolio
    Then ve un P&L de -$150 y -7.14% para "MSFT"

  Scenario: Sin precio actualizado
    Given que el ticker "XYZ" no tiene precio almacenado
    When el usuario consulta el P&L de su posición en "XYZ"
    Then el sistema indica que no hay precio disponible para ese ticker