### US-13 — Ver métricas financieras de una empresa
> Como usuario, quiero consultar las métricas financieras fundamentales de
> una empresa, para analizar su salud financiera.

**Criterios de aceptación:**
- Se consulta la API de EDGAR para obtener las métricas financieras de la empresa consultada.
- Se muestran: Revenue, Net Income, EPS, Total Assets, Total Liabilities del período más reciente.
- Los datos provienen de la XBRL Company Facts API de EDGAR.
- Se cachean los resultados por 1 hora para evitar exceder el rate limit de EDGAR.
- Si la empresa no tiene datos disponibles, se muestra un mensaje informativo al usuario.
