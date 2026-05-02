### US-10 — Ejecutar actualización de precios
> Como operador del sistema, quiero ejecutar el proceso batch de precios,
> para que el sistema cuente con los precios de cierre más recientes.

**Criterios de aceptación:**
- El proceso consulta Yahoo Finance para todos los tickers activos en el sistema.
- Persiste el precio y el timestamp de actualización por ticker.
- Si un ticker falla, se registra el error y el proceso continúa con los demás.
- Al finalizar, el proceso reporta cuántos tickers se actualizaron y cuántos fallaron.
