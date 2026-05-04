# Visión del Producto

## ¿Qué es el sistema?

Es una plataforma de seguimiento de portfolios de acciones cotizadas
en mercados de EEUU. Permite a los usuarios registrar sus posiciones, monitorear
el valor actual de su cartera, calcular ganancias y pérdidas, y consultar datos
financieros reales de empresas directamente desde fuentes públicas oficiales.

La plataforma integra dos fuentes de datos externas reales:

- **SEC EDGAR** — API pública de la Securities and Exchange Commission, para
  búsqueda de empresas y métricas financieras fundamentales.
- **Yahoo Finance** — fuente de precios de mercado, consumida exclusivamente
  mediante el proceso batch de actualización de precios.

---

## ¿Qué problema resuelve?

Los inversores individuales no tienen una herramienta simple, centralizada y
conectada a datos reales para:

- Registrar sus operaciones de compra y venta de acciones.
- Ver el valor actual de su portfolio y su rendimiento vs. precio de compra.
- Consultar métricas financieras fundamentales de empresas (Revenue, EPS, filings)
  sin depender de plataformas pagas o cerradas.
- Seguir empresas de interés sin necesidad de tener posición en ellas.
- Comparar métricas financieras entre empresas para tomar decisiones informadas.

---

## Usuarios objetivo

- Inversores individuales que operan en mercados de EEUU.
- Personas que quieren analizar empresas usando datos financieros reales de la SEC.

---

## Componentes del sistema

| Componente | Descripción |
|---|---|
| **API Backend** | Núcleo del sistema. Expone los endpoints consumidos por la app web y la app mobile. |
| **App Web** | Interfaz para usar desde el navegador. |
| **App Mobile** | Interfaz para dispositivos Android. |
| **Proceso Batch de Precios** | Script independiente que consulta Yahoo Finance y persiste precios en la base de datos. Se ejecuta manualmente o desde CI. No corre en tiempo real. |

---

## Fuentes de datos externas

### SEC EDGAR
- API pública, sin autenticación, sin costo.
- Usada para buscar empresas, ver filings (10-K, 10-Q) y métricas financieras
  (Revenue, Net Income, EPS, Total Assets, Total Liabilities).
- Rate limit: 10 requests/segundo. Requiere header `User-Agent` descriptivo.
- Los resultados se cachean por 1 hora para respetar el rate limit.

### Yahoo Finance
- Usada exclusivamente por el proceso batch para obtener precios de cierre.
- No se consulta en tiempo real desde la app.
- Los precios quedan persistidos en la DB con su timestamp de actualización.

---

## Flujo general del sistema

```
Usuario
  │
  ├── Registra operaciones de compra/venta
  │     └── El portfolio se actualiza automáticamente
  │
  ├── Ve su portfolio
  │     └── Precio actual viene de la DB (último batch ejecutado)
  │
  ├── Ve su watchlist
  │     └── Precio actual viene de la DB (último batch ejecutado)
  │
  ├── Consulta datos financieros de una empresa
  │     └── Datos vienen de EDGAR (con cache de 1 hora)
  │
  └── Compara métricas entre empresas de su watchlist
        └── Datos vienen de EDGAR (con cache de 1 hora)

Proceso Batch (ejecución manual o CI)
  └── Consulta Yahoo Finance → persiste precios en DB
```

---

## Lo que NO hace

- No provee precios en tiempo real.
- No ejecuta órdenes de compra/venta en ningún broker.
- No tiene autenticación con terceros (Google, Facebook, etc.).
- No soporta mercados fuera de EEUU en esta versión.
- No genera recomendaciones de inversión.

---
