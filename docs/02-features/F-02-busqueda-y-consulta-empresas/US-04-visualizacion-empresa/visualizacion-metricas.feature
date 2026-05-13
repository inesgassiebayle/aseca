Feature: Datos financieros de empresa

  Scenario: Empresa con precio almacenado (está en portfolio o watchlist)
    Given que el usuario selecciona "AAPL" en los resultados de búsqueda
    And "AAPL" tiene precio almacenado por el batch
    When el sistema carga el detalle de la empresa
    Then muestra el precio almacenado y la fecha de la última actualización

  Scenario: Empresa sin precio almacenado (no está en portfolio ni watchlist)
    Given que el usuario selecciona "XYZ" en los resultados de búsqueda
    And "XYZ" no tiene precio almacenado
    When el sistema carga el detalle de la empresa
    Then indica que el precio no está disponible

  Scenario: Consulta exitosa de métricas de la API
    Given que el usuario abre el detalle de "AAPL" (CIK: 0000320193)
    And los datos no fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna Revenue, Net Income, EPS, Total Assets y Total Liabilities de la API
    And cada métrica indica el período reportado

  Scenario: Consulta exitosa de métricas del cache
    Given que el usuario abre el detalle de "AAPL" (CIK: 0000320193)
    And los datos fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna Revenue, Net Income, EPS, Total Assets y Total Liabilities del cache
    And cada métrica indica el período reportado

  Scenario: Empresa sin datos XBRL
    Given que la empresa no reporta datos en formato XBRL
    When el usuario abre su detalle
    Then el sistema indica que no hay datos financieros disponibles