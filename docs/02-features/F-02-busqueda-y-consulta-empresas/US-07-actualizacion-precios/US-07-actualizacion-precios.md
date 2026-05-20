# US-07 — Actualización de precios (batch)

> Como operador del sistema, quiero ejecutar el proceso batch de precios,
> para que el sistema cuente con los precios de cierre más recientes de
> todos los tickers de la lista blanca.

**Criterios de aceptación:**
- El proceso corre sobre la lista blanca de tickers del sistema, independientemente de qué tickers tengan los usuarios en sus portfolios o watchlists.
- La lista blanca es una configuración del sistema (no depende de acciones de usuarios).
- Persiste el precio y el timestamp de actualización por ticker.
- Guarda la fecha y hora de la última ejecución exitosa del batch como dato global del sistema.
- Si un ticker falla, se registra el error y el proceso continúa con los demás.
- Al finalizar, el proceso reporta cuántos tickers se actualizaron y cuántos fallaron.
- La fecha de última actualización queda disponible para ser consultada desde portfolio y watchlist.