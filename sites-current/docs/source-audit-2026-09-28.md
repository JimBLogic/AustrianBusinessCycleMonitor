# Auditoría de fuentes ABCM — 28 septiembre 2026

## Alcance y decisión
Se revisaron las 18 series macro y los proveedores auxiliares de Bitcoin. Las fuentes principales se mantienen. Los candidatos se comparan en cada regeneración macro; la selección como principal requiere revisión humana tras >=30 días distintos observados, >=99% de días concordantes y ninguna discrepancia registrada. No es una medición continua de uptime ni un SLA. Las pruebas desde este entorno no representan necesariamente la conectividad desde el Worker de producción.

## Respaldo exacto prioritario
| Serie | Principal actual | Respaldo/comparación | Dependencia y límite |
|---|---|---|---|
| VIX | FRED VIXCLS | Cboe CLOSE diario, cdn-api.cboe.com; host cdn.cboe.com como segunda ruta | Dos rutas del mismo productor; no futuros VIX, VXO ni ETF |
| Baa–10Y | FRED BAA10Y | DBAA menos DGS10 diarios en fechas idénticas | Reconstrucción equivalente de componentes; depende de FRED y no cubre su caída completa |
| S&P 500 | FRED SP500 | Cboe SPX diario | Mismo índice, ruta de entrega distinta |

No se encontró ni verificó una API pública gratuita independiente que distribuya exactamente el diferencial Moody’s Baa diario con continuidad suficiente. No se incorporan espejos desconocidos. Las rutas supuestas DBnomics/FRED/BAA10Y y DBnomics/FRED/VIXCLS devolvieron 404. H15_discontinued/RIMLPBAAR_N.M termina en septiembre de 2016; se retiró como respaldo operativo. Un spread ICE BBB/OAS no es BAA10Y y no puede sustituirlo sin cambiar nombre, umbrales y metodología.

## Inventario completo
| Indicador | Fuente principal | Respaldo / decisión |
|---|---|---|
| M2 | FRED M2SL, mensual SA, miles de millones USD | DBnomics FED/H6_H6_M2/M2.M; sin ceros para NA/null |
| Fed funds | FRED FEDFUNDS, mensual | DBnomics FED/H15/RIFSPFF_N.M |
| Treasury 10Y | FRED DGS10, diario | DBnomics FED/H15/RIFLGFCY10_N.B |
| Curva 10Y–2Y | FRED T10Y2Y, diario | Diferencia de RIFLGFCY10_N.B y RIFLGFCY02_N.B por misma fecha |
| Baa–10Y | FRED BAA10Y | DBAA–DGS10, comparación y registro |
| IPC | FRED CPIAUCSL, mensual SA | BLS CUSR0000SA0; v1 sin clave, v2 con BLS_API_KEY |
| Desempleo | FRED UNRATE, mensual SA | BLS LNS14000000; consulta conjunta con IPC |
| Deuda federal | FRED GFDEBTN, trimestral | Treasury Debt to the Penny como serie diaria identificada; no reconstrucción con deuda central del Banco Mundial |
| Deuda federal/PIB | FRED GFDEGDQ188S, trimestral | Reintento individual + última edición validada; sin ratio anual del Banco Mundial como sustituto |
| WTI | FRED DCOILWTICO, diario | DBnomics EIA/PET/RWTC.D |
| Oro | Banco Mundial Pink Sheet, mensual | Último histórico verificado; sin serie FRED retirada ni PAXG como sustituto del oro |
| Dólar amplio | FRED DTWEXBGS, diario | DBnomics FED/H10/JRXWTFB_N.B; eliminado cambio silencioso a frecuencia mensual |
| S&P 500 | FRED SP500, diario | Cboe SPX, comparación y registro |
| VIX | FRED VIXCLS, diario | Cboe CLOSE, comparación y registro |
| Producción industrial | FRED INDPRO, mensual SA | DBnomics FED/G17_IP_MAJOR_INDUSTRY_GROUPS/IP.B50001.S |
| Utilización capacidad | FRED TCU, mensual SA | DBnomics FED/G17_CAPUTL/CAPUTL.B50001.S |
| PIB real, variación trimestral anualizada | FRED A191RL1Q225SBEA | Reintento individual + última edición; sin crecimiento anual WB como sustituto |
| Encuesta manufacturera Chicago Fed | FRED CFSBCACTIVITYMFG | Reintento individual + última edición; sigue identificada como encuesta regional, no ISM PMI |
| Bitcoin spot | Coinbase Exchange y Kraken | Consenso entre mercados, Coinbase con fecha validada; errores JSON de Kraken rechazados. Históricos y estadísticas no se presentan como spot |
| Bitcoin histórico | Blockchain.com Charts | Última edición, fechas explícitas; no se fabrica spot con el último cierre |
| Red Bitcoin | Blockchain.com stats, mempool.space | Proveedores distintos para funciones distintas; no equivalentes intercambiables |
| Comisiones y altura | mempool.space | Sin sustitución ficticia; estado ausente cuando no responde |
| CoinGecko | Sólo ruta opcional fuera de Sites | No activada como nueva dependencia en Sites; requiere evaluar cuota y credenciales antes de promover |

## Mejoras implementadas
- Validación de ausentes, fechas reales, orden y duplicados; parsers por cabecera para FRED y Cboe.
- Ya no se mezcla una serie anual con una trimestral ni una serie mensual con una diaria.
- Gold FRED retirado excluido del lote: una serie inválida no debe inutilizar las restantes. Pink Sheet verificado contra el enlace mensual actual del Banco Mundial.
- Fallback individual tras lote incompleto, y respaldos macro secundarios sólo cuando faltan datos o están caducados.
- Comparaciones VIX/Baa/SPX sobre hasta 60 observaciones comunes, tolerancia absoluta 0,011; al menos 5 observaciones y antigüedad máxima 14 días. Mantiene la principal si hay divergencia.
- Evidencia persistida en las ediciones D1; consulta `/api/source-health` y enlace desde Estado de proveedores. Hasta 3000 ediciones históricas; contador por día UTC, no por número de clics.
- Tiempo límite incluye descarga completa; límite de cuerpo 8 MiB; rechazo de HTML con HTTP 200 y JSON mal formado; errores públicos no revelan URLs con secretos.
- Retry-After respetado; backoff con jitter; fallos 404 de una serie no declaran caída global del proveedor; 401/403/429 activan pausa.
- Peticiones simultáneas comparten ejecución dentro del mismo Worker. No constituye un bloqueo distribuido entre todos los isolates.
- Consultas BLS condicionadas a necesidad; intento registrado en D1 y reutilizado durante dos horas. La cuota sin clave sigue siendo baja (25 consultas/día compartidas por origen según BLS); una clave registrada mejora límites, no sustituye control de concurrencia.
- Series antiguas siguen disponibles para inspección histórica, pero no entran como datos actuales en las puntuaciones; ediciones con más de 36 horas retiran la lectura del modelo hasta actualizar.

## Límites y próximos pasos
1. Observar `/api/source-health` durante al menos 30 días con regeneraciones reales. No se ha creado una automatización nueva; sin ejecuciones no se acumula evidencia.
2. La configuración de producción consultada no contiene FRED_API_KEY ni BLS_API_KEY. La web funciona con CSV público y BLS v1; añadir claves registradas permitiría usar las rutas oficiales autenticadas, sin exponerlas al navegador. Revisar el comportamiento en producción. HTML de bloqueo recibido aquí desde Coinbase/Kraken no demuestra una caída global de esos servicios.
3. La reconstrucción Baa aún depende de FRED. Un contrato con el productor o distribuidor autorizado sería la opción a evaluar si se exige independencia total; no se recomienda contratar un plan sin comprobar cobertura exacta y condiciones.
4. Las series de PIB/deuda conservan FRED y snapshots como última protección. No se inventa un respaldo equivalente cuando no está verificado.
5. El enlace XLSX del Banco Mundial sigue siendo una dependencia que debe supervisarse si cambia la publicación. La validez mensual se comprueba y no se etiqueta como cotización diaria.
6. La revisión es de calidad y transporte. No concede derechos adicionales sobre los datos.

## Fuentes primarias
- https://www.cboe.com/tradable-products/vix/vix-historical-data
- https://cdn-api.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv
- https://fred.stlouisfed.org/series/BAA10Y
- https://fred.stlouisfed.org/series/DBAA
- https://fred.stlouisfed.org/docs/api/fred/series_observations.html
- https://docs.db.nomics.world/web-api/
- https://www.bls.gov/developers/api_faqs.htm
- https://www.worldbank.org/en/research/commodity-markets
- https://docs.kraken.com/api-reference/market-data/get-ticker-information
- https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker

## Sondeo inicial del entorno de revisión
Estas son respuestas puntuales, no una prueba de estabilidad temporal. Las latencias incluyen la red de este entorno.

| Endpoint | Resultado HTTP | Tiempo ms | Observación |
|---|---|---|---|
| cboe-vix | 200 | 16294 | Respuesta recibida; ver validación semántica por proveedor |
| cboe-spx | 200 | 16282 | Respuesta recibida; ver validación semántica por proveedor |
| fred-baa | 200 | 7200 | Respuesta recibida; ver validación semántica por proveedor |
| fred-components | 200 | 10025 | Respuesta recibida; ver validación semántica por proveedor |
| dbnomics-baa | error | 7719 | HTTP Error 404: NOT FOUND |
| dbnomics-vix | error | 8153 | HTTP Error 404: NOT FOUND |
| dbnomics-m2 | 200 | 7604 | Respuesta recibida; ver validación semántica por proveedor |
| worldbank | 200 | 5828 | Respuesta recibida; ver validación semántica por proveedor |
| coinbase | 200 | 7143 | HTTP 200 con HTML de bloqueo; no JSON válido |
| kraken | 200 | 6807 | HTTP 200 con HTML de bloqueo; no JSON válido |
| blockchain | 200 | 8570 | Respuesta recibida; ver validación semántica por proveedor |
| mempool | 200 | 13887 | Respuesta recibida; ver validación semántica por proveedor |
| fiscal | 200 | 6392 | Respuesta recibida; ver validación semántica por proveedor |
| bls | 200 | 5351 | Respuesta recibida; ver validación semántica por proveedor |
