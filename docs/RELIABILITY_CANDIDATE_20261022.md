# ABCM — candidata consolidada y evidencia del 22 de octubre de 2026

## A. Resumen ejecutivo

Candidata de código: `f968eefdcc93c0003923044e364eeb6515e71a79`, en
`codex/abcm-v92-reliability-candidate`. PR DRAFT: [#36](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/pull/36).
La documentación posterior no modifica ese árbol de aplicación. No se ha
incrementado la versión pública: sigue siendo 91.

Se conserva #35, se recupera la frescura trimestral de #28 y el diagnóstico HTTP
de #32, y se seleccionan controles de #25. Se añaden verificación de lectura tras
escritura, rechazo de ediciones enteramente retenidas durante una caída total y
protección por defecto de POST públicos desde QA. Cinco incidencias Ruff seguras
se corrigen; los fallos históricos restantes siguen visibles y bloquean su imagen.

Resultados locales: 205/205 pruebas de aplicación, Worker y D1; 54/54 pruebas de
política/seguridad; lint, TypeScript, build, SSR/assets, contenedor y reinicios
aprobados. Chromium 154 del sistema: 9 PASS, 1 SKIPPED en candidata con escritorio
y Android emulado. Los navegadores fijados de Playwright no se pudieron descargar
en esta máquina. La QA pública local encontró un bloqueo de confianza TLS; no se
ha desactivado la verificación ni modificado el almacén de confianza.

**NO-GO para publicación** mientras falten las pruebas completas de la candidata,
la correspondencia con un checkpoint publicable y la revisión de los riesgos de
datos pendientes. Un entorno de desarrollo funcional no equivale a aprobación de
producción. No se ejecutaron merge, despliegue, cambios administrativos, cambios
de secretos ni POST productivos. BrangeCycle no se modificó.

## B. Repositorio, commits y procedencia

| Referencia consultada | SHA / estado real |
| --- | --- |
| Checkout inicial, rama local `work`; `master` remoto | `82a5786668f31b4c0255d849e7104a491ee9585e` |
| #35, base preferente | `ac6f31116ddbe7fb5d113fdb9e96f6b61ac96c4f`, OPEN, DRAFT |
| #34 | `4c36118136945f4cf3c85e750be3ff60f46eb721`, OPEN, DRAFT |
| #28 | `30cda0a67e7e747d5a08ea25f0d6b04ea2ec734d`, CLOSED sin merge |
| #32 | `7c9ad2525d1fe04c33d6779c21e6c1cf0b04f298`, OPEN, DRAFT |
| #25 | `2b183860352cc1ed5ad1b3242b3280ecc8232ad1`, OPEN, DRAFT |
| #30 | `7fbb732f784a0a60bd4baafaded3f2c655285107`, OPEN, DRAFT |
| Nueva implementación | [`f968eef`](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/f968eefdcc93c0003923044e364eeb6515e71a79) |

`master` y #35 se volvieron a consultar después del push y permanecían en esos
SHA. #34 no es ancestro de #35, pero sus `sites-current/package.json` y lockfile
son idénticos: no se ha duplicado su parche. #36 contiene #35 por ascendencia.
La comparación completa y la lista de archivos están disponibles en
[Files changed de #36](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/pull/36/files).

Superficies modificadas: cinco workflows existentes y un nuevo workflow de
auditoría; política y arranque de QA; ruta `/api/data`, salud, transporte y runtime
D1; dos helpers y sus regresiones; controles de seguridad; documentación; `.gitignore`;
y dos archivos Python con cinco correcciones sin cambio funcional. Los manifests,
lockfiles, pesos económicos, horarios y versión pública no cambian respecto a #35.

## C. Dependencias y seguridad

| Superficie auditada hoy | Todas | Producción | Clasificación |
| --- | ---: | ---: | --- |
| Site mantenido | 0 | 0 | PASS |
| QA Playwright | 0 | 0 | PASS |
| Frontend Flask/React histórico | 63 (3 críticas, 43 altas) | 30 (19 altas) | HISTORICAL NON-DEPLOYED; publicación FAIL |
| Sites v25 archivado | 32 (1 crítica, 24 altas) | 6 (1 crítica, 4 altas) | HISTORICAL NON-DEPLOYED; build bloqueado antes de instalar |
| Monorepo Copilot archivado | 65 (5 críticas, 43 altas) | 0 | HISTORICAL NON-DEPLOYED |

Son recuentos de paquetes que npm clasifica como vulnerables, no un recuento de
exploits independientes. Vite instalado: **8.2.4**; Rolldown: **1.2.15**. La
mitigación local de braces y sus hashes se conservan; sus regresiones pasan.
La instalación congelada conserva TLS e integridades. No se usó `audit fix`.

El inventario se regenera con `node security/lockfile-audit.mjs`; registra fecha,
commit y estado del árbol, y `verify-current-audit.mjs` rechaza avisos en Site/QA
sin considerar seguros los archivos históricos. Los resultados incompletos se
mantienen como errores. Los SHA de Actions recuperados de #25 se contrastaron
contra sus tags remotos reales antes de usarlos.

En el venv local, pip 25.0.1 tenía avisos; se actualizó a 26.2.2. La auditoría
posterior de sus dependencias instaladas no encontró vulnerabilidades conocidas.
Python es 3.12.14 localmente; CI prueba 3.11. `requirements.txt` sigue sin lock:
un venv limpio hoy no prueba reproducibilidad futura ni seguridad de imágenes
históricas. No se atribuye ausencia de vulnerabilidades al conjunto del sistema.

Calidad histórica reproducida: Ruff 29 errores inicialmente, 24 después de cinco
correcciones seguras (NEEDS FIX); Black 39 archivos (NEEDS FIX); frontend lint
13 errores y 6 avisos (NEEDS FIX). Se clasifican como HISTORICAL NON-DEPLOYED,
no FALSE POSITIVE. No se amplió esta candidata a un reformateo global ni a una
migración mayor de las dependencias históricas. Los gates no se suavizan.

## D. Datos económicos: observaciones actuales y límites

Lectura pública de `/api/health`: **22/10/2026 13:46 CEST (11:46 UTC)**;
edición `2026-10-22T11:02:21.815Z`, release 91, D1 legible,
**20/20 disponibles, 13/20 frescos, DEGRADED**. Esto sustituye como medición actual
la referencia histórica 10/20; no demuestra que esta candidata esté desplegada.

Las nueve series prioritarias se consultaron además directamente mediante FRED
CSV el 22/10 a las 11:48 UTC. Sus últimas observaciones devueltas coincidían con
las siguientes. CSV no proporciona una fecha independiente de publicación: no
se confunde fecha de descarga, etiqueta económica y fecha de publicación.

| Indicador / serie oficial | Frecuencia y unidad | Valor observado | Etiqueta original / período cubierto | Estado público; diagnóstico |
| --- | --- | ---: | --- | --- |
| yieldCurve / T10Y2Y | diaria; puntos porcentuales | 0.32 | 2026-10-21 | FRESH; descarga/parseo verificados |
| creditSpread / BAA10Y | diaria; puntos porcentuales | 1.44 | 2026-10-20 | FRESH; descarga/parseo verificados |
| cpi / CPIAUCSL | mensual SA; índice 1982–84=100 | 336.298 | 2026-09-01, septiembre | FRESH; último punto CSV coincide |
| unemployment / UNRATE | mensual SA; % | 4.2 | 2026-09-01, septiembre | FRESH; último punto CSV coincide |
| federalDebt / GFDEBTN | trimestral; millones USD | 39462398 | 2026-04-01 / fin 2026-06-30 | STALE público por edad desde inicio; candidata calcula 114.5 días desde cierre |
| debtToGdp / GFDEGDQ188S | trimestral; % PIB | 122.59387 | 2026-01-01 / fin 2026-03-31 | STALE legítimo: 205.5 días desde cierre, mayor que 160 |
| oil / DCOILWTICO | diaria; USD/barril WTI | 107.89 | 2026-10-20 | FRESH; último punto CSV coincide |
| realGdpGrowth / A191RL1Q225SBEA | trimestral SAAR; cambio % | 2.2 | 2026-04-01 / fin 2026-06-30 | STALE público por edad desde inicio; candidata calcula 114.5 días desde cierre |
| manufacturingSurvey / CFSBCACTIVITYMFG | mensual; índice regional CFSEC | 25 | 2026-09-01 | FRESH; no es ISM PMI ni entra en el compuesto de diez señales |
| BTC persistido | spot USD/BTC, ventana 15 min | 81894.10 | 2026-10-22T11:02:09.899816011Z | STALE; no usar la fecha de edición como fecha de cotización |

Fuente de las nueve series macro: entrega CSV oficial de FRED, con productores
subyacentes Treasury/Federal Reserve, BLS, BEA, EIA y Chicago Fed según serie.
El resto de la lectura pública: M2 23342.8 (2026-08-31, DBnomics, DEGRADED);
fedFunds 3.75 (2026-09-30, retenido STALE); Treasury10Y 5.12 y Treasury2Y 4.79
(2026-10-20, FRESH); oro mensual World Bank 4319 (2026-09-01, DEGRADED, no spot
LBMA equivalente); dólar 121.4048 (2026-10-16, FRESH); SP500 7757.17
(2026-10-21, FRESH); VIX 17.31 (2026-10-20, FRESH); producción industrial 103.9506
y utilización de capacidad 76.8504 (2026-09-30, retenidas STALE).

fedFunds, producción industrial y capacidad estaban retenidos por fallos de
proveedor, aun dentro de sus ventanas estadísticas. No se atribuye el mismo
problema a deuda/PIB: el endpoint oficial devolvía Q1. No hay evidencia que
justifique inventar Q2, extender 160 días o sustituirlo por una serie anual.

La política conserva 14 días para las series diarias prioritarias, 75 para
mensuales y 160 para las tres trimestrales. Solo etiquetas trimestrales canónicas
y períodos cerrados admiten edad desde cierre. Q1–Q4, cambio de año, bisiestos,
fechas inválidas/futuras y series diarias/mensuales están cubiertos por regresiones.
No se modifican valores ni etiquetas originales. API, elegibilidad del modelo,
fallbacks, razones y recuperación D1 utilizan la política común.

Fallbacks: yield curve puede calcular 10Y−2Y DBnomics con fechas idénticas;
credit spread DBAA−DGS10 comparte el riesgo de FRED; CPI/desempleo tienen series
BLS equivalentes; petróleo tiene EIA vía DBnomics. Las tres trimestrales y CFSEC
no tienen sustituto equivalente validado: retienen historial duradero. No se
promueven automáticamente comparaciones divergentes. La persistencia sigue siendo
`macro_snapshots`; no se borra historial.

GET independiente `/api/bitcoin`: 81804.73 USD, timestamp
`2026-10-22T11:46:47.338849126Z`, consenso Coinbase+Kraken confirmado, HEALTHY.
Es otra observación, independiente del BTC almacenado y de la edición macro.
Se mantienen los veinte indicadores históricos del contrato y se añaden
`domains.macro` y `domains.storedBitcoinQuote`.

La edición local de integración `2026-10-22T11:53:06.297Z` sobrevivió a reinicio con
valores/series/fecha BTC idénticos: 20 disponibles, 15 frescos en esa lectura;
macro 14/19 y BTC almacenado 1/1. Es una medición aislada, no salud productiva.

## E. Backend, Worker y D1

| Control local sobre el árbol de aplicación indicado | Resultado |
| --- | --- |
| Suite de aplicación y Worker, con D1 Miniflare | PASS, 205/205, cero omitidas |
| Corrupción, parcialidad, recuperación y esquema idempotente | PASS |
| Escritores concurrentes y prevención de edición duplicada | PASS |
| Escritura D1 rechazada mediante trigger | PASS: 503 y edición previa legible |
| Acknowledgement anómalo y lectura perdida/alterada | PASS: `persistence_unconfirmed` |
| Snapshot inválido o futuro | PASS: no INSERT |
| Caída total del proveedor | PASS: 503, sin nueva edición de datos retenidos |
| Transporte Worker: JSON, redirect, timeout, corrupción y 429 | PASS |
| Cuatrimestres, D1 y estados API/UI coherentes | PASS para las regresiones trimestrales |
| Build ESM Worker + manifest y SSR/assets self-host | PASS |
| Docker del Site: build, salud, HTML, manifest y reinicio | PASS |
| Flask histórico: factory, GET salud y 42 pruebas | PASS; separado de Sites |

Los errores HTTP añaden categorías fijas y request ID opaco; nunca serializan
excepciones ni cuerpos upstream. El refresh fallido incluye, cuando es legible,
el payload anterior con su fecha real. Un 503 no se vuelve un refresh aprobado.
El cooldown conserva su contrato 200. Un conflicto con otra edición válida
retorna esa edición, no los valores generados descartados. Véase
[`REFRESH_FAILURES.md`](../sites-current/docs/REFRESH_FAILURES.md).
La instrumentación no demuestra la causa del POST histórico del 21/10.

La escritura sigue siendo una admisión SQL atómica; no se anuncia como lease
completo de escritores distribuidos. No se certifican backups remotos, siete días
de operación continua, cuota máxima de D1 o resistencia a toda carga posible.

El contenedor local `sha256:fd8b1965fd30c2a9494da2afaae3240440532e6ae901e21dc67cf571dad23c44`
usa Node 22.14. Sus 120 archivos de runtime e inputs de build rastreados coinciden
por SHA-256 con el checkout; se excluyeron pruebas, docs y README de esa comparación.
Su origen de build es `http://localhost`; el build de navegador usa
`http://127.0.0.1:8793`, y la suite de producción usa el origen público. No se
confunden artefactos construidos con diferentes orígenes. Una ejecución local de
las pruebas canónicas contra el build de loopback falló por esa diferencia; se
reconstruyó con origen productivo y la suite completa volvió a pasar.

## F. GitHub Actions

Las expresiones de #35 se conservan: push y pull_request no permiten refresh
productivo; solo schedule/dispatch de master pueden optar a escritura. No se
cambian cron ni horarios ni se crean nuevos cron. QA manual público también queda
en lectura por defecto y bloquea los POST automáticos del dashboard; la candidata
local conserva sus escrituras reales. Los tests ejercen las expresiones del YAML
para eventos/refs admitidos y desconocidos. No afirman equivalencia universal
entre JavaScript y todo el lenguaje de expresiones de GitHub.

`sites-current.yml` verifica también la política; los filtros del workflow de
navegador incluyen sus cambios. Se elimina el `continue-on-error` de calidad
histórica, reforzando su condición de publicación. El gate de dependencias
históricas y el de Sites v25 fallan con sus avisos reales. No hay deploy de Sites.

Baseline #35 confirmado mediante API:
[CI histórico fallido](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/39767760715),
[Site aprobado](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/39767760766),
[navegadores aprobados](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/39767761102).
Los pasos fallidos históricos coinciden con la reproducción local: Ruff, Black,
lint y auditoría npm. Backend, frontend y Docker históricos pasan; publicación omitida.

Para #36 en `f968eef` se verificaron en Actions: Site/self-host, auditoría completa,
Node 24, inventario npm, auditoría Python, aislamiento, backend/frontend y Docker
históricos y QA pública PASS. Calidad histórica, su auditoría npm y v25 FAIL de
forma esperada; publicación SKIPPED. La QA candidata completa seguía pendiente al
redactar esta sección: consultar el estado exacto en la PR. No se propaga el PASS
anterior de #35 a este HEAD.

Master sigue `protected: false`. #30 se conserva como acción administrativa
separada; no se activaron reglas ni auto-merge.

## G. Frontend, navegadores y entorno

Pruebas locales ejecutadas: Chromium 154.0.8037.57, escritorio 1440×900 y Android
Pixel 7 emulado, ES/EN, gráficos y coordenadas, tooltips/teclado, navegación,
responsive, hidratación, retención ante 503 interceptado, edición persistida,
refresh local y cooldown tras recarga: **9 PASS, 1 SKIPPED** (evitar refresh repetido).
No se probaron dispositivos físicos. Firefox/WebKit locales: BLOCKED por descarga.
La QA pública local con Chromium: BLOCKED por confianza TLS (8 errores de arranque
HTTPS, 2 omisiones deliberadas), no fallos funcionales de la aplicación demostrados.

La revisión automática rechazó importar la CA del proxy al NSS persistente porque
amplía confianza TLS y precisa autorización específica. No se importó ni se
eludió la verificación. El workflow público remoto pasó sin ese cambio local.
La versión de Chromium del sistema no sustituye la certificación de los cuatro
perfiles fijados de la candidata. La accesibilidad cubierta es la funcional del
suite, no una auditoría WCAG completa; rendimiento bajo carga y backtest con
vintages punto-en-tiempo quedan NOT TESTED. Fórmulas y pesos permanecen intactos.

Entorno: instalación repetida correctamente con `install.sh`; venv separado;
Node 24.19.0; instrucciones `install_script` y `start_skill` guardadas. Un adaptador
local de Miniflare fuera del checkout usa el Worker compilado, assets y D1 local,
con fetch saliente por el proxy/CA heredados. Resuelve el fallo DNS de la salida
directa de workerd en esta máquina sin modificar código productivo o política de
red. Vite HMR inicia y su D1 se migró localmente; para integración de proveedores
se usa el adaptador. Reinicio conserva la edición local. Los procesos se deben
reiniciar tras restaurar un entorno; no se presume publicación del snapshot.

## H. Integración y publicación controlada

| Origen | Decisión |
| --- | --- |
| #35 y #34 | Preservadas mediante base #35; parche de Vite idéntico, sin duplicación |
| #28 | Recuperada selectivamente; etiquetas no canónicas y trimestres aún abiertos se rechazan; regresiones adicionales |
| #32 | Incorporada; metadata HTTP sin cuerpos/headers sensibles, más diagnósticos seguros API |
| #25 | Inventario/gates npm, bloqueo v25, protección del input FRED y revisión Node 24; nombres de evidencia actualizados |
| #30 | Fuera de integración: autorización administrativa separada |
| BrangeCycle | Sin modificaciones, dependencias runtime ni bases compartidas |

Antes de cualquier aprobación: cerrar los gates pendientes del HEAD exacto,
revisar el diff contra master y PR originales, construir un artefacto con el origen
productivo, registrar su hash y un checkpoint de Sites cuyo contenido corresponda
a ese código, y preservar una versión conocida de rollback. La respuesta pública
actual solo declara release 91/ref master: no expone el SHA del artefacto desplegado.
No se certifica una correspondencia GitHub–Sites que el entorno no permite observar.

Plan posterior a aprobación, sin ejecutarlo: respaldar D1 por mecanismo del host,
conservar checkpoint y esquema anteriores, revisar migraciones (esta candidata no
añade ninguna), publicar checkpoint aprobado y verificar GET de salud/datos/BTC,
valores, fechas, dominio macro y cotización independiente. Un refresh productivo
requiere autorización específica. Rollback restaura el checkpoint conocido y
comprueba legibilidad de las ediciones; no borra historial ni revierte datos a ciegas.
No se publica el stack histórico como sustituto.

Inventario para reutilización futura, sin copiar nada a BrangeCycle:

| Capacidad | Estado | Condición |
| --- | --- | --- |
| Matriz de eventos/refs y QA pública en lectura | READY | Revisión propia del destino y commit fijado |
| Frescura trimestral con fechas originales | READY | Solo series con semántica trimestral equivalente |
| Snapshot recovery y escritura/read-back D1 | CONDITIONAL | Adaptar esquema, concurrencia y operación al destino |
| Ingestión/fallbacks y códigos de fallo | CONDITIONAL | Cuotas, identidad de series y siete ciclos reales independientes |
| Salud macro separada de BTC | READY | Mantener contratos y umbrales explícitos |
| Gate global de producción o stack histórico | NOT READY | Backlog, artefacto y gates pendientes |

## I. Riesgos y acciones pendientes

- P0 ACTIVE BLOCKER: terminar/verificar la QA de los cuatro perfiles de la
  candidata exacta; no basta el Chromium local ni la QA pública de #35.
- P0 ACTIVE BLOCKER: correspondencia y checkpoint publicable verificables antes
  de GO; no hay autorización de despliegue o merge.
- P1 NEEDS FIX: investigar fedFunds/producción/capacidad retenidos y observar
  recuperación de proveedores; se mantiene la degradación visible.
- P1 DEGRADED legítimo: deuda/PIB sigue en Q1 según el endpoint oficial. No es
  evidencia de parseo roto ni motivo para fabricar otra observación.
- P1 HISTORICAL NON-DEPLOYED: Ruff, Black, lint, avisos npm y v25; publicación
  bloqueada. Requieren trabajo separado de modernización y calidad.
- P2: master sin protección, #30 pendiente; instalación Python sin lock;
  certificados de navegador locales requieren autorización; descargas/logs de
  Actions necesitan sus dominios en ajustes del entorno.

Los dominios guardados cubren GitHub API, proveedores, lectura pública, Playwright
y `results-receiver.actions.githubusercontent.com`, preservando el preset de
paquetes. No se añadieron requisitos de secretos: FRED es opcional y se comprobó
que las rutas sin clave funcionan. Revisar/guardar ajustes y publicar el entorno
es una acción del producto todavía no acreditada por el guardado del borrador.

## J. Veredicto

**NO-GO de publicación.** Existe una candidata DRAFT concreta y un entorno capaz
de construir, probar, ejecutar y conservar D1 localmente. Se han corregido defectos
reproducibles y se preserva la honestidad de la salud. Los gates pendientes y la
aprobación de release siguen siendo necesarios. Este informe no equivale a merge,
publicación del entorno, despliegue correcto ni recuperación de datos productivos.
