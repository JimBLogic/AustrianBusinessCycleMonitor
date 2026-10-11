# Auditoría de privacidad y almacenamiento · ABCM Sites

Revisión de código fuente y artefacto de producción preparada el **4 de
septiembre de 2026**. Alcance: cookies, almacenamiento del navegador,
IndexedDB, service workers, autenticación, formularios, APIs, D1/R2, red,
recursos externos y métricas del alojamiento.

## Resultado

| Superficie | Estado de la versión actual |
| --- | --- |
| Cookies de la aplicación | ABCM no lee, crea ni modifica cookies. Versiones anteriores escribían tres cookies de aviso/refresco; el código actual ya no las consulta. Pueden permanecer hasta caducar o hasta que el visitante borre los datos del sitio. Las cookies técnicas del proveedor no forman parte del código de ABCM. |
| `localStorage` | Cuatro preferencias validadas y centralizadas: `abcm:language`, `abcm:watchlist`, `abcm:educational-notice:v1` y `abcm:manual-refresh-state:v1`. Solo se escriben después de pulsar idioma, radar, aceptación educativa o actualización manual. |
| Caché local anterior | Se retiraron las escrituras automáticas `abcm:last-valid-snapshot` y `abcm:visit-baseline`. El control de borrado elimina también esas claves heredadas. |
| `sessionStorage` | El código de ABCM no lo usa. La build de Vinext conserva `__vinext_rsc_initial_reload__` como guarda temporal de pestaña frente a bucles de recarga. |
| IndexedDB y service workers | No existen en el código ni en el cliente compilado. |
| Autenticación y cuentas | Se retiraron el helper de autenticación, `/workspace` y sus APIs. No hay cuentas ni perfiles de visitante. |
| Formularios y archivos | Se retiraron los formularios personales, `/api/files`, `/api/export` y la subida de archivos. El manifiesto declara `r2: null`. |
| D1 | Se conserva `DB` únicamente para ediciones macro compartidas. La versión actual solo consulta y escribe `macro_snapshots`; no liga una edición con un visitante. |
| APIs activas | `/api/data`, `/api/bitcoin`, `/api/data-manifest` y `/api/health`. Ofrecen datos públicos, estado técnico y cálculos compartidos. |
| Red del navegador | Recursos locales y peticiones del mismo origen. `/api/data` y `/api/bitcoin` usan `credentials: 'omit'` y `referrerPolicy: 'no-referrer'`. Los enlaces externos se abren solo al pulsarlos. |
| Red del servidor | Todas las peticiones pasan por una lista explícita de hosts HTTPS en `lib/network-policy.ts`; no reciben preferencias locales ni identificadores creados por ABCM. |
| Seguimiento | Sin Google Analytics, Meta Pixel, Hotjar, Clarity, anuncios, fingerprinting, iframes ni embeds. |
| Cabeceras | CSP, `Referrer-Policy: no-referrer`, COOP, CORP, Permissions Policy, `X-Content-Type-Options` y protección anti-frame en todas las respuestas. |

## Preferencias locales

Las cuatro claves activas cumplen una función visible y nacen de una acción del
visitante:

1. `abcm:language`: guarda `es` o `en` al cambiar el idioma del monitor.
2. `abcm:watchlist`: guarda hasta cuatro claves de indicadores públicos al
   añadir o quitar elementos de «Mi radar».
3. `abcm:educational-notice:v1`: guarda `accepted` al aceptar el aviso que
   delimita el carácter educativo del proyecto.
4. `abcm:manual-refresh-state:v1`: guarda la instantánea anterior y la hora de
   desbloqueo local después de pedir una actualización manual. Permite comparar
   la edición anterior con la nueva y aplica el intervalo de 30 minutos en ese
   navegador sin cookie.

El helper rechaza formatos inesperados, limita la watchlist y no expone estas
preferencias a una API. «Borrar preferencias locales» elimina las cuatro claves
activas y las dos claves heredadas de caché. No borra cookies técnicas de Sites;
esas pertenecen a la capa del proveedor y se gestionan desde el navegador o sus
políticas.

## Datos compartidos en D1 y retirada del área personal

D1 sigue siendo funcionalmente necesario para que todos los visitantes reciban
la misma edición diaria de las 12:00 `Europe/Madrid`, para limitar presión sobre
las fuentes y para conservar una edición válida cuando un proveedor falla. Solo
se almacena la edición macro compartida: fechas, series, puntuaciones, cálculos y
procedencia.

Las rutas de tareas, cartera, tesis, exportación y archivos, junto con el helper
de autenticación y el enlace R2, se retiraron. Una base D1 ya provisionada puede
conservar tablas históricas creadas por migraciones anteriores, y un bucket R2
ya existente puede conservar objetos históricos. Esta versión no los consulta,
expone ni modifica. No se ejecuta un borrado destructivo automático de datos
históricos.

## Hosts de datos permitidos

Las llamadas servidor-a-servidor solo pueden dirigirse por HTTPS a:

- FRED: `api.stlouisfed.org`, `fred.stlouisfed.org`;
- DBnomics: `api.db.nomics.world`;
- BLS: `api.bls.gov`;
- Cboe: `cdn.cboe.com`;
- World Bank: `api.worldbank.org`, `thedocs.worldbank.org`;
- Coinbase: `api.coinbase.com`, `api.exchange.coinbase.com`;
- Kraken: `api.kraken.com`;
- CoinGecko: `api.coingecko.com`;
- Blockchain.com: `blockchain.info`, `api.blockchain.info`;
- Mempool.space: `mempool.space`;
- U.S. Treasury Fiscal Data: `api.fiscaldata.treasury.gov`.

Los demás enlaces externos son documentación o fuentes que el visitante abre de
forma voluntaria. No se cargan como script, iframe, fuente tipográfica o imagen
de seguimiento.

## Métricas automáticas de ChatGPT Sites

ChatGPT Sites registra recuentos de visitantes únicos y páginas vistas aunque la
aplicación no instale un SDK de analítica. ABCM no añade esa medición ni recibe
en su código una copia individualizada.

La comprobación del manifiesto, la configuración publicada del proyecto y las
operaciones disponibles de Sites no encontró un interruptor para desactivar
estas métricas. Por tanto, no se crea un banner con un botón «Rechazar» que no
podría cumplir su promesa. La página `/privacidad` separa el tratamiento de ABCM
de los registros técnicos y métricas del proveedor.

Referencias del proveedor:

- [Creating and managing ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites)
- [Política de privacidad de OpenAI para Europa](https://openai.com/policies/eu-privacy-policy/)
- [Política de cookies de OpenAI](https://openai.com/policies/cookie-policy/)
- [Portal de privacidad de OpenAI](https://privacy.openai.com/)

## Controles de regresión

`npm test` compila el artefacto y falla si reaparecen cookies de la aplicación,
trackers, publicidad, fingerprinting, formularios, embeds, IndexedDB, service
workers, rutas personales, autenticación, R2, almacenamiento fuera del helper,
peticiones cliente con credenciales o llamadas servidor que eludan la lista de
hosts permitidos. También comprueba `/privacidad`, sitemap, robots y cabeceras de
seguridad sobre el Worker compilado.

## 6 September 2026 follow-up

The 48-question bilingual assessment stores answers only in React memory, shuffles questions and choices on user initiation, and opens sources only on explicit navigation. No answer telemetry, quiz cookies or persistent progress were added. Preference deletion now handles blocked browser storage honestly and clears the active watchlist/comparison. Per-route canonical and social metadata use a configurable build-time origin for independent hosting. The build includes TypeScript checking to catch missing client references before deployment.
