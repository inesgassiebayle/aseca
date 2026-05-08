# US-07 — Actualización de precios (batch)

> Como operador del sistema, quiero ejecutar el proceso batch de precios,
> para que el sistema cuente con los precios de cierre más recientes de
> todos los tickers en portfolios y watchlists.

**Criterios de aceptación:**
- El proceso corre sobre todos los tickers presentes en portfolios y watchlists.
- Persiste el precio y el timestamp de actualización por ticker.
- Guarda la fecha y hora de la última ejecución exitosa del batch como dato global del sistema.
- Si un ticker falla, se registra el error y el proceso continúa con los demás.
- Al finalizar, el proceso reporta cuántos tickers se actualizaron y cuántos fallaron.
- La fecha de última actualización queda disponible para ser consultada desde portfolio y watchlist.

