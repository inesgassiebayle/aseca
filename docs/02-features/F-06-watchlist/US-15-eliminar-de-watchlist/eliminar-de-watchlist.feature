Feature: Eliminar de watchlist

  Scenario: Eliminar ticker existente
    Given que el usuario tiene "TSLA" en su watchlist
    When la elimina
    Then "TSLA" ya no aparece en su watchlist

  Scenario: Eliminar ticker inexistente
    Given que el usuario no tiene "XYZ" en su watchlist
    When intenta eliminarlo
    Then el sistema retorna un error 404