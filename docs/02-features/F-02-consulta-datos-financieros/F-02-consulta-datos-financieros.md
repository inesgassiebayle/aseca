# F-02 — Consulta de datos financieros (EDGAR)

## Descripción

Integración real con la **API pública de la SEC EDGAR** para consultar datos
financieros fundamentales de empresas que cotizan en mercados de EEUU.

EDGAR no provee precios de mercado. Su rol en el sistema es proveer:
- Búsqueda de empresas por nombre o ticker.
- Métricas financieras. 
- Filings más recientes.
- Evolución histórica de métricas.

> La API de EDGAR tiene un rate limit de 10 requests/segundo y requiere
> un header `User-Agent` descriptivo con nombre del proyecto y mail de contacto.
> No requiere API key ni registro.

---

## Criterios de aceptación

- El sistema permite buscar empresas por nombre parcial o ticker exacto, mostrando nombre, ticker y CIK.
- Se muestran las métricas financieras del período más reciente: Revenue, Net Income, EPS, Total Assets y Total Liabilities.
- Se muestran los filings 10-K y 10-Q con tipo, fecha y enlace al documento en EDGAR.
- Se muestra la evolución histórica de una métrica seleccionada para los últimos 4 a 8 quarters.
- Los resultados de EDGAR se cachean por 1 hora para no exceder el rate limit.
- Cada request a EDGAR incluye el header `User-Agent` requerido.
- Si una empresa no tiene datos disponibles para una consulta, se muestra un mensaje informativo.

---
## User stories
- US-03 — Buscar empresa por nombre o ticker
- US-04 — Ver métricas financieras de una empresa
- US-05 — Ver filings recientes de una empresa
- US-06 — Ver evolución histórica de métricas

---

## Restricciones técnicas

- Rate limit: 10 requests/segundo. El sistema debe respetar este límite.
- Header `User-Agent` obligatorio en cada request.
- Se recomienda implementar caching de 1 hora para respuestas de EDGAR, para
  no exceder el rate limit durante los tests de stress.
