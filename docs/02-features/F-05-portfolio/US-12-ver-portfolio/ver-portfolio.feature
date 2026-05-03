Feature: Ver portfolio

  Scenario: Usuario con posiciones registradas
    Given que el usuario tiene posiciones en su portfolio
    And el sistema tiene precios actualizados en la DB
    When consulta su portfolio
    Then ve cada ticker con su cantidad, valor actual y P&L
    And ve la fecha y hora de la última actualización de precios

  Scenario: Usuario sin posiciones
    Given que el usuario no tiene posiciones registradas
    When consulta su portfolio
    Then ve un portfolio vacío
    And el sistema sugiere registrar su primera operación