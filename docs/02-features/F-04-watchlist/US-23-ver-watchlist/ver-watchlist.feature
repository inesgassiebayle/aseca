Feature: Ver watchlist

  Scenario: Watchlist con precios disponibles
    Given que el usuario tiene "TSLA" y "NVDA" en su watchlist
    And ambos tienen precios almacenados en la DB
    When consulta su watchlist
    Then ve cada ticker con su último precio y la fecha de actualización

  Scenario: Ticker sin precio almacenado
    Given que el usuario tiene "XYZ" en su watchlist
    And "XYZ" no tiene precio almacenado en la DB
    When consulta su watchlist
    Then ve "XYZ" pero con indicación de precio no disponible

  Scenario: Watchlist vacía
    Given que el usuario no tiene tickers en su watchlist
    When consulta su watchlist
    Then ve un mensaje indicando que la watchlist está vacía