Feature: Evolución histórica de métricas de empresa

  Scenario: Consulta exitosa de evolución desde la API
    Given que el usuario consulta la evolución de Revenue de "GOOGL" (CIK: 0001652044)
    And los datos no fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna los últimos 8 quarters con el valor de Revenue desde la API
    And cada entrada indica el período reportado

  Scenario: Consulta exitosa de evolución desde el cache
    Given que el usuario consulta la evolución de Revenue de "GOOGL" (CIK: 0001652044)
    And los datos fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Company Facts
    Then retorna los últimos 8 quarters con el valor de Revenue desde el cache
    And cada entrada indica el período reportado

  Scenario: Menos de 8 quarters disponibles
    Given que la empresa solo tiene 3 quarters reportados para la métrica seleccionada
    When el usuario consulta la evolución histórica
    Then el sistema retorna los 3 quarters disponibles sin error

  Scenario: Empresa sin datos históricos para la métrica
    Given que la empresa no tiene datos históricos para la métrica seleccionada
    When el usuario consulta la evolución histórica
    Then el sistema indica que no hay datos disponibles para esa métrica