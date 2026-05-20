# F-02 — Busqueda y consulta de empresas

## Descripción

Integración con la **API pública de la SEC EDGAR** para consultar datos financieros
fundamentales de empresas, y con **Yahoo Finance** para obtener precios de mercado.

EDGAR provee:
- Búsqueda de empresas por nombre o ticker.
- Métricas financieras.
- Filings más recientes.
- Evolución histórica de métricas.

Yahoo Finance provee:
- Precio de cierre más reciente por ticker.

Los precios se obtienen mediante un proceso batch independiente que opera sobre una **lista blanca** de tickers conocidos del sistema, y se almacenan en la base de datos.
Toda la lógica de valorización (portfolio, P&L) se calcula únicamente contra los precios almacenados.

El proceso batch puede ejecutarse:
- Manualmente por línea de comando.
- Mediante un endpoint dedicado de la API.
- Como paso opcional en el pipeline de CI.

> Si Yahoo Finance no devuelve precio para un ticker, el proceso registra
> el error y continúa con el resto sin interrumpirse.

---

## Alcance de cada US

Cada user story cubre las siguientes capas:
- **Backend:** endpoint/s de la API REST implementados con tests unitarios.
- **Frontend web:** vista o componente implementado con tests de end-to-end (E2E).

---

## User stories

- US-03 — Buscar empresa por nombre o ticker
- US-04 — Ver datos financieros de una empresa (métricas EDGAR + precio almacenado)
- US-05 — Ver filings recientes de una empresa
- US-06 — Ver evolución histórica de métricas
- US-07 — Actualización de precios (batch)
- US-27 — [Mobile] Búsqueda y consulta de empresas desde la app móvil
- US-31 — [Stress] Tests de stress de búsqueda y consulta de empresas

---

## Restricciones técnicas

### EDGAR
- Rate limit: 10 requests/segundo. El sistema debe respetar este límite.
- Header `User-Agent` obligatorio en cada request.
- Se recomienda implementar caching de 1 hora para respuestas de EDGAR.

### Yahoo Finance
- No garantiza SLA ni disponibilidad formal.
- El proceso batch debe manejar errores y timeouts de forma explícita por ticker.
- La librería a utilizar es `yfinance` (Python):
    - Precio de cierre más reciente: `yf.Ticker("AAPL").fast_info["lastPrice"]`
    - Múltiples tickers en una sola llamada: `yf.download(["AAPL", "MSFT"], period="1d")`
- El proceso batch **no** debe ser invocado durante el uso normal de la aplicación.
- Debe registrar en la base de datos el timestamp de la última actualización
  y el precio obtenido por ticker.