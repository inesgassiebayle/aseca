Feature: Métricas financieras de empresa

  Scenario: Consulta exitosa de métricas de la API
    Given que el usuario busca métricas de "AAPL" (CIK: 0000320193)
    And los datos no fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna Revenue, Net Income, EPS, Total Assets y Total Liabilities de la API
    And cada métrica indica el período reportado

  Scenario: Consulta exitosa de métricas del cache
    Given que el usuario busca métricas de "AAPL" (CIK: 0000320193)
    And los datos fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna Revenue, Net Income, EPS, Total Assets y Total Liabilities del cache
    And cada métrica indica el período reportado

  Scenario: Empresa sin datos XBRL
    Given que la empresa no reporta datos en formato XBRL
    When el usuario consulta sus métricas
    Then el sistema indica que no hay datos financieros disponibles