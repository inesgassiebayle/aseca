### US-04 — Ver datos financieros de una empresa

> Como usuario, quiero ver los datos financieros de una empresa al seleccionarla,
> para analizar su situación financiera actual.

**Criterios de aceptación:**
- Se muestra el precio de la acción almacenado en el sistema (del batch), junto con la fecha y hora de esa actualización. Si el ticker no pertenece a la lista blanca del sistema, el precio no estará disponible.
- Se consulta la API de EDGAR para obtener las métricas financieras de la empresa.
- Se muestran: Revenue, Net Income, EPS, Total Assets, Total Liabilities del período más reciente.
- Los datos provienen de la XBRL Company Facts API de EDGAR.
- Se cachean los resultados de EDGAR por 1 hora para evitar exceder el rate limit.
- Si la empresa no tiene datos EDGAR disponibles, se muestra un mensaje informativo al usuario.
