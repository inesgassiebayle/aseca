Feature: Agregar a watchlist

  Scenario: Agregar ticker nuevo
    Given que el usuario no tiene "TSLA" en su watchlist
    When agrega "TSLA" a su watchlist
    Then "TSLA" aparece en su watchlist
    And será incluido en el próximo batch de precios

  Scenario: Ticker ya en watchlist
    Given que el usuario ya tiene "TSLA" en su watchlist
    When intenta agregar "TSLA" nuevamente
    Then el sistema retorna un error indicando que ya está en la watchlist