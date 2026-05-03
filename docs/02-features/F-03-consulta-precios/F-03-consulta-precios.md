# F-03 — Consulta de precios (Yahoo Finance)

## Descripción

Proceso **independiente** que se ejecuta una única vez por invocación.
Consulta Yahoo Finance para obtener el precio de cierre más reciente de cada
ticker presente en el sistema (portfolios y watchlists), y persiste esos
precios en la base de datos.

Toda la lógica de valorización del portfolio y P&L se calcula **únicamente**
contra los precios almacenados. El proceso batch es la única parte del sistema
que habla con Yahoo Finance.

El proceso puede ejecutarse:
- Manualmente por línea de comando.
- Mediante un endpoint dedicado de la API.
- Como paso opcional en el pipeline de CI.

> Si Yahoo Finance no devuelve precio para un ticker, el proceso registra
> el error y continúa con el resto sin interrumpirse.

---

## User stories

- US-07 — Ejecutar actualización de precios (batch)
- US-08 — Ver fecha de última actualización de precios

---

## Restricciones técnicas

- Yahoo Finance no garantiza SLA ni disponibilidad formal.
- El proceso batch debe manejar errores y timeouts de forma explícita por ticker.
- La librería a utilizar es `yfinance` (Python):
    - Precio de cierre más reciente: `yf.Ticker("AAPL").fast_info["lastPrice"]`
    - Múltiples tickers en una sola llamada: `yf.download(["AAPL", "MSFT"], period="1d")`
- El proceso **no** debe ser invocado durante el uso normal de la aplicación
  (consultas de portfolio, P&L, watchlist): solo corre en el batch.
- Debe registrar en la base de datos el timestamp de la última actualización
  y el precio obtenido por ticker.