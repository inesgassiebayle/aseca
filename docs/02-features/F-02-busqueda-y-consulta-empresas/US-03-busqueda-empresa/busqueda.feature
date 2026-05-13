Feature: Búsqueda de empresas

  Scenario: Búsqueda por ticker exacto
    Given que el usuario busca "AAPL"
    When el sistema consulta EDGAR
    Then retorna "Apple Inc." con su CIK correspondiente

  Scenario: Búsqueda por nombre parcial
    Given que el usuario busca "Microsoft"
    When el sistema consulta EDGAR
    Then retorna resultados que incluyen "Microsoft"

  Scenario: Búsqueda sin resultados
    Given que el usuario busca "XYZNOTEXIST"
    When el sistema consulta EDGAR
    Then retorna una lista vacía con mensaje descriptivo