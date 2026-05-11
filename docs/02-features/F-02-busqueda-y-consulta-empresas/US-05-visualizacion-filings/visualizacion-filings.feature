Feature: Filings recientes de empresa

  Scenario: Consulta exitosa de filings desde la API
    Given que el usuario consulta filings de "MSFT" (CIK: 0000789019)
    And los datos no fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Submissions API
    Then retorna los filings 10-K y 10-Q más recientes desde la API
    And cada filing muestra tipo, fecha y enlace al documento en EDGAR

  Scenario: Consulta exitosa de filings desde el cache
    Given que el usuario consulta filings de "MSFT" (CIK: 0000789019)
    And los datos fueron buscados hace menos de 1hs
    When el sistema consulta EDGAR Submissions API
    Then retorna los filings 10-K y 10-Q más recientes desde el cache
    And cada filing muestra tipo, fecha y enlace al documento en EDGAR

  Scenario: Empresa sin filings 10-K o 10-Q
    Given que la empresa no tiene filings de tipo 10-K ni 10-Q registrados en EDGAR
    When el usuario consulta sus filings
    Then el sistema indica que no hay filings disponibles para esa empresa