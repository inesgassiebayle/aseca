Feature: Fecha de última actualización de precios

  Scenario: Batch ejecutado previamente
    Given que el batch se ejecutó el "2025-05-01 18:30:00"
    When el usuario consulta su portfolio
    Then ve "Precios actualizados al: 01/05/2025 18:30"

  Scenario: Batch nunca ejecutado
    Given que el batch nunca fue ejecutado
    When el usuario consulta su portfolio
    Then ve un aviso indicando que no hay precios disponibles aún