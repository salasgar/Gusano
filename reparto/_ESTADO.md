# TABLÓN DE ESTADO — Gusano (reparto «GU»)

**VISTA DERIVADA. No se edita a mano y no es la fuente de verdad.** La verdad está en la
carpeta `reparto/hechos/`: un fichero por hecho, cada uno con el identificador de la
sesión que lo escribió en el nombre. Si la tabla de abajo contradice a `hechos/`, gana
`hechos/` y este tablón hay que regenerarlo entero. Reclamar una tarea **no** es escribir
aquí: es escribir un fichero propio en `hechos/reclamos/`; si este fichero está reservado
por otra sesión cuando te toque regenerarlo, no esperes —tu reclamo ya vale— y regenera
cuando puedas. Este párrafo se copia tal cual en cada regeneración.

Ficha del proyecto —rutas, git, bandas, frase de arranque—: `reparto/proyecto.md`
Lo que toda tarea necesita saber —verificación, reclamo, cierre, trampas—: `reparto/tareas/_COMUN.md`
Contrato entre tareas: `ESPECIFICACION.md` (raíz del repositorio)
Autorizaciones firmadas: `reparto/autorizaciones.md`
Ninguno de ellos se regenera nunca; este fichero sí, entero.

Regenerado: 2026-10-25T10:25Z (cierre de la 17) · por la sesión s-20261025T101834-a5ce285e (recalculadas todas las filas: 01-15 y 17 LISTAS, 16 PENDIENTE)

## Antes de hacer nada

0. Lee `reparto/proyecto.md` y `reparto/tareas/_COMUN.md`: ahí están las rutas, las
   reglas de git y los comandos exactos de reclamo, latido y cierre.
1. Lee este fichero entero y `ESPECIFICACION.md`.
2. **Lista `hechos/reclamos/`, `hechos/terminadas/`, `hechos/reabiertas/`,
   `hechos/sustituidas/` y `hechos/fallos/`**, y compáralo con `git log --oneline`. La
   carpeta manda sobre la tabla. Cuando haya varios rastros de una misma tarea, gana el
   más reciente por su fecha interna. Los recuentos de una salida que vayas a usar se
   leen de `hechos/terminadas/` o de la propia salida, nunca de este tablón.
3. `date -u`. Toda hora que escribas la genera el comando (`$(date -u …)`).
4. Genera tu identificador de sesión **en el mismo comando que escribe tu reclamo**
   (comando en `_COMUN.md`); a partir de ahí tu sid es el del nombre de ese fichero.
   Nada de `$RANDOM` ni de ficheros de nombre fijo como `/tmp/sid.txt`.
5. Reclama tu tarea: crea el reclamo, `sleep 30 && ls hechos/reclamos/` (el comando, no
   la intención) y cede si otra sesión llegó antes. Si tu frase de arranque te nombra una
   tarea o una cadena, esa reclamas.
6. Si ganas, **regenera este tablón entero** —relistando `hechos/` ahora; todas las filas
   contra `hechos/` y la hora real, no solo la tuya— antes de empezar, y **sigue con la
   tarea hasta cerrarla o soltarla; no termines el turno para pedir confirmación**. Si no
   hay tarea libre de tu banda, dilo —qué está vivo y cuándo caduca— y para.

El protocolo completo está en la skill `reparto`, fichero `referencias/concurrencia.md`.
Lo esencial: cada sesión escribe únicamente ficheros que llevan su identificador en el
nombre, nadie edita el fichero de nadie, y este tablón se regenera a partir de los demás.

## Reglas de operación

0. **Coge una tarea que encaje con el modelo con el que te han abierto.** Lo dice la
   frase de arranque; si no lo dice, pregúntalo en una línea antes de reclamar.
1. **Una sesión, una tarea, reclamada.** Reclamo en `hechos/reclamos/NN--<sid>.md` con
   `caduca:` calculado (lo da la ficha: 2 × duración esperada, mínimo 45 min). Campos
   `sesión:`, `tarea:`, `abierto:`, `caduca:` con ese nombre exacto; el cierre es una
   línea propia que empieza por `CERRADA`, `CEDIDA` o `ABANDONADA`, y esas palabras no
   van en ningún latido.
2. **Un reclamo está vivo** si su último `caduca:` está en el futuro, no tiene línea de
   cierre y ningún reclamo lo nombra en un `releva a:`. Un reclamo caducado es
   RELEVABLE: se toma abriendo el tuyo con `releva a: <sid anterior>`; el del caído no se
   toca ni una línea.
3. **Estira la caducidad antes de una operación larga** y late mientras dura. Cualquier
   pausa cuenta: antes de escribir nada tras un turno terminado, `date -u`, tu reclamo y
   tu sid en las líneas `releva a:` de `hechos/reclamos/`; si te han relevado,
   `ABANDONADA (relevado)` y no toques nada.
4. **Cada sesión escribe solo lo suyo.** A un fichero de `hechos/` solo se añade
   (`>>`), nunca se reescribe.
5. **Cada ficha declara los ficheros que toca; dos tareas que compartan uno no van en
   paralelo.** Las salidas de código son commits (el hash va en la terminada); los
   informes de verificación (08, 16) van a `reparto/salidas/NN-…/` con marcador
   `.ok-<sid>`. Si necesitas tocar un fichero que no está en tu ficha, no lo toques:
   incidencia.
6. **Idempotencia.** Antes de actuar, `git log`, `git status` y `hechos/`: continúa
   desde lo hecho.
7. **Git**: un solo árbol, sin remoto. `add` nunca separado de `commit`; nunca `git add
   -A`; el código se edita con las herramientas de edición, nunca desde el shell. Orden
   de cierre: `npm test` en verde → commit del código → terminada con el hash,
   `CERRADA`, tablón, ficha → un commit con rutas explícitas.
8. **Nada se borra ni se publica sin firma en `autorizaciones.md`.** Lo que sobra va a
   `reparto/_papelera/`. Una firma se comprueba en ese fichero, nunca aquí.
9. **Si una tarea falla o se queda a medias**, `hechos/fallos/NN--<sid>.md` con `parada
   por: sesión agotada | avería | mal cortada` y `ABANDONADA` en tu reclamo. Choques a
   `hechos/incidencias/<sid>.md`.
10. **Un cierre en falso se anula con `hechos/reabiertas/NN--<sid>.md`**, nombrando la
    terminada que anula y lo exacto que hay que corregir. Las verificaciones (08, 16) no
    arreglan: reabren.
11. **Una tarea mal cortada no se renumera ni se borra**: incidencia con el corte
    natural, fallo con `parada por: mal cortada`, `ABANDONADA`, y lo decide Juan Luis.
12. **Lo que `ESPECIFICACION.md` no fija y va a durar no lo decide una tarea MEDIO o
    BAJO**: propuesta en la terminada o `BLOQUEADA por decisión`. La especificación solo
    la edita la coordinadora.
13. **Cerrada tu tarea, encadena otra solo en verde** (misma banda, corta, sin esperas,
    sin señales de sesión larga); si tu frase nombra la cadena, encadenas por defecto.
    Si no, foto del momento (EN CURSO · LIBRES · BLOQUEADAS) y frases de arranque solo
    para las LIBRES, una por sesión que quepa, con la banda traducida y la tarea o
    cadena dentro.
14. **Quien monta o coordina no reclama ni escribe código.** Ultracode apagado.

## Tabla de tareas

Vista derivada. LISTA si el rastro más reciente es una terminada; EN CURSO si hay reclamo
vivo; RELEVABLE si su reclamo más reciente está caducado sin cierre ni relevo; REABIERTA
si el rastro más reciente es una reabierta; A MEDIAS / FALLIDA / MAL CORTADA según la
línea `parada por:` de un fallo; SUSTITUIDA si lo es una sustituida; BLOQUEADA si le
falta una precondición; PENDIENTE en lo demás. Se regenera al reclamar y al cerrar, y
regenerar es recalcular todas las filas contra `hechos/` y `date -u`. **Las columnas
Banda, Encadenable con y Ficheros que toca se copian de las fichas**, que no se
regeneran nunca; la leyenda de bandas, de `proyecto.md`. Nada de lo que hay aquí sale de
una conversación.

| # | Tarea | Fichero | Precondición | Duración esperada | Banda | Encadenable con | Ficheros que toca | Disparo | Estado | Reclamo vivo (sid · caduca) |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Esqueleto del proyecto (package.json, licencia, azar.js, prueba) | tareas/tarea-01-esqueleto.md | ninguna (ningún otro reclamo vivo) | 15 min | BAJO | — | `package.json`, `LICENSE`, `index.html`, `css/estilo.css`, `js/util/azar.js`, `tests/azar.test.js`, `README.md` | manual | LISTA (936008e) | |
| 02 | Tableros planos: rejillas, caballo, hexagonal, superficies | tareas/tarea-02-tableros-planos.md | 01 LISTA | 40 min | MEDIO | 03 | `js/tableros/tipos.js`, `rejillas.js`, `hexagonal.js`, `index.js`, `tests/tableros.test.js` | manual | LISTA (194b4e4) | |
| 03 | Tableros poliédricos (caras, Schlegel del dual) | tareas/tarea-03-poliedros.md | 02 LISTA y ningún reclamo vivo de la 02 | 45 min | MEDIO | 02 | `js/tableros/poliedros.js`, `js/tableros/index.js` (una línea), `tests/poliedros.test.js` | manual | LISTA (f668eb4) | |
| 04 | Motor: ronda, partida por pares, marcador | tareas/tarea-04-motor.md | 01 LISTA | 35 min | MEDIO | 05 | `js/motor/ronda.js`, `js/motor/partida.js`, `tests/motor.test.js` | manual | LISTA (d9dfd6d) | |
| 05 | Máquina: niveles, alfa-beta, resolutor exacto | tareas/tarea-05-maquina.md | 02 y 04 LISTAS | 50 min | MEDIO | 04 | `js/ia/jugadores.js`, `js/ia/minimax.js`, `tests/ia.test.js` | manual | LISTA (836464a) | |
| 06 | Vista del tablero en SVG y demo | tareas/tarea-06-vista-tablero.md | 02 y 04 LISTAS | 50 min | MEDIO | — | `js/ui/vista-tablero.js`, `css/vista-tablero.css`, `demo/vista.html`, `demo/vista.js` | manual | LISTA (3bae315) | |
| 07 | Aplicación jugable: ajustes, partida, marcador, esbozos | tareas/tarea-07-app-jugable.md | 05 y 06 LISTAS | 75 min | MEDIO | — | `index.html`, `css/estilo.css`, `js/main.js`, `js/ui/app.js`, `ajustes.js`, `ayudas.js`, `js/pantallas/jugar.js`, `reto.js`, `analisis.js`, `editor.js`, `js/compartir/url.js`, `css/reto.css`, `analisis.css`, `editor.css`, `tests/ajustes.test.js` | manual | LISTA (b158e90) | |
| 08 | Arnés de interfaz en Chrome sin cabeza y verificación de la app | tareas/tarea-08-verificacion-app.md | 07 LISTA | 40 min | MEDIO | — | `herramientas/cdp.js`, `herramientas/test-ui.js`; `reparto/salidas/08-verificacion-app/` | manual | LISTA (b35abe3) | |
| 09 | Modo ayuda y pantalla de análisis | tareas/tarea-09-ayuda-y-analisis.md | 07 LISTA | 40 min | MEDIO | 10, 12 | `js/ui/ayudas.js`, `js/pantallas/analisis.js`, `css/analisis.css`, `tests/ayudas.test.js` | manual | LISTA (58b7952) | |
| 10 | Reto del día | tareas/tarea-10-reto-del-dia.md | 07 LISTA | 35 min | MEDIO | 09, 12 | `js/pantallas/reto.js`, `css/reto.css`, `tests/reto.test.js` | manual | LISTA (bc75dc0) | |
| 11 | Editor de tableros y grafos aleatorios | tareas/tarea-11-editor.md | 07 LISTA | 50 min | MEDIO | — | `js/pantallas/editor.js`, `css/editor.css`, `tests/editor.test.js` | manual | LISTA (2069b60) | |
| 12 | Compartir la partida por URL | tareas/tarea-12-compartir-url.md | 07 LISTA | 35 min | MEDIO | 09, 10 | `js/compartir/url.js`, `tests/url.test.js` | manual | LISTA (89a3125) | |
| 13 | Obstáculos | tareas/tarea-13-obstaculos.md | 07 LISTA y ningún reclamo vivo de la 14 | 25 min | MEDIO | 14 | `js/tableros/obstaculos.js`, `js/ui/ajustes.js`, `tests/obstaculos.test.js` | manual | LISTA (db43c79) | |
| 14 | Casillas con valor | tareas/tarea-14-casillas-con-valor.md | 13 LISTA | 40 min | MEDIO | 13 | `js/tableros/valores.js`, `js/ui/ajustes.js`, `tests/valores.test.js` | manual | LISTA (00eb633) | |
| 15 | Página de reglas y README | tareas/tarea-15-reglas-y-readme.md | 07 LISTA | 30 min | MEDIO | — | `reglas.html`, `css/reglas.css`, `README.md` | manual | LISTA (50e4914) | |
| 16 | Verificación final de la tanda | tareas/tarea-16-verificacion-final.md | 08-15 y 17 LISTAS, sin reabiertas pendientes | 45 min | MEDIO | — | `herramientas/test-ui.js` (casos nuevos); `reparto/salidas/16-verificacion-final/` | manual | PENDIENTE (libre) | |
| 17 | Marcador de suma cero, ventanas de papeles y fin de ronda, retoques de la 08 | tareas/tarea-17-ventanas-y-retoques.md | 01-15 LISTAS y ningún reclamo vivo de la 16 | 40 min | MEDIO | — | `js/pantallas/jugar.js`, `js/ui/textos-partida.js`, `tests/textos-partida.test.js`, `css/estilo.css`, `js/ui/app.js`, `js/ui/ajustes.js`, `index.html`, `reglas.html`, `README.md`, `herramientas/test-ui.js` | manual | LISTA (fc27fd5) | |

Bandas hoy (de `proyecto.md`, comprobado el 2026-10-19 por Juan Luis): ALTO = Opus 5.5,
esfuerzo Alto · MEDIO = Sonnet 5.5, esfuerzo Medio · BAJO = Haiku 5.5, esfuerzo Medio.
Reserva «ALTO (Fable 5.1, esfuerzo Alto)» para montar, recortar o coordinar.

Paralelismo (cruzando «Ficheros que toca»): tras la 01, dos sesiones (02+03 y 04+05);
cuando 02 y 04 estén LISTAS, también la 06; la 07 va sola; tras la 07, hasta siete a la
vez (08, 09, 10, 11, 12, 13 y 15; la 14 detrás de la 13); la 16 al final, sola.
Hoy: una sola sesión (la 16, que verifica lo que cambió la 17).

## Registro de finalizaciones

Derivado de `hechos/terminadas/`. Una línea por fichero, más reciente arriba.

Formato: `LISTA · tarea NN · AAAA-MM-DD HH:MM · sid · hash del commit · recuento de pruebas · ficheros`

LISTA · tarea 17 · 2026-10-25 10:25 · s-20261025T101834-a5ce285e · fc27fd5 · npm test pass 179, fail 0 (13 nuevas en tests/textos-partida.test.js); test-ui.js TODO OK (10 casos) · js/ui/textos-partida.js, tests/textos-partida.test.js, js/pantallas/jugar.js, css/estilo.css, js/ui/app.js, js/ui/ajustes.js, index.html, reglas.html, README.md, herramientas/test-ui.js
LISTA · tarea 10 · 2026-10-25 01:07 · s-20261025T003516-21648387 · bc75dc0 · npm test pass 166, fail 0 (6 nuevas en tests/reto.test.js) · js/pantallas/reto.js, css/reto.css, tests/reto.test.js
LISTA · tarea 12 · 2026-10-25 01:04 · s-20261025T003550-ef2288e2 · 89a3125 · tests/url.test.js pass 12, fail 0 (12 nuevas) · js/compartir/url.js, tests/url.test.js
LISTA · tarea 09 · 2026-10-25 01:04 · s-20261025T003459-4b606333 · 58b7952 · npm test pass 166, fail 0 (5 nuevas en tests/ayudas.test.js) · js/ui/ayudas.js, js/pantallas/analisis.js, css/analisis.css, tests/ayudas.test.js
LISTA · tarea 14 · 2026-10-25 01:04 · s-20261025T010301-36cecda1 · 00eb633 · npm test pass 166, fail 0 (9 nuevas en tests/valores.test.js) · js/tableros/valores.js, js/ui/ajustes.js, tests/valores.test.js, tests/ajustes.test.js (fuera de ficha, ver incidencias)
LISTA · tarea 11 · 2026-10-25 01:03 · s-20261025T003528-419b7e01 · 2069b60 · tests/editor.test.js 10 nuevas, 10 pass; npm test global pass 164, fail 2 (ajenos: tests/valores.test.js, tarea 14 en curso; 115 pass al empezar) · js/pantallas/editor.js, css/editor.css, tests/editor.test.js
LISTA · tarea 13 · 2026-10-25 01:03 · s-20261025T003610-2477832b · db43c79 · obstaculos 8 nuevas; con ajustes pass 13, fail 0 · js/tableros/obstaculos.js, js/ui/ajustes.js, tests/obstaculos.test.js, tests/ajustes.test.js
LISTA · tarea 08 · 2026-10-25 00:48 · s-20261025T003437-fc7af901 · b35abe3 · node herramientas/test-ui.js TODO OK; 115 pass de las tareas 01-07 en verde · herramientas/cdp.js, herramientas/test-ui.js, reparto/salidas/08-verificacion-app/
LISTA · tarea 15 · 2026-10-25 00:44 · s-20261025T003638-d26d6bc3 · 50e4914 · sin pruebas nuevas; pass 115, fail 0 con lo comiteado · reglas.html, css/reglas.css, README.md
LISTA · tarea 07 · 2026-10-25 00:32 · s-20261025T002203-ef62fbad · b158e90 · npm test pass 115, fail 0 (110 al empezar; 5 nuevas en tests/ajustes.test.js) · index.html, css/estilo.css, js/main.js, js/ui/app.js, js/ui/ajustes.js, js/ui/ayudas.js, js/pantallas/{jugar,reto,analisis,editor}.js, js/compartir/url.js, css/{reto,analisis,editor}.css, tests/ajustes.test.js
LISTA · tarea 06 · 2026-10-25 00:09 · s-20261025T000615-1c534fda · 3bae315 · npm test pass 110, fail 0 (igual que al empezar; la tarea no añade pruebas unitarias) · js/ui/vista-tablero.js, css/vista-tablero.css, demo/vista.html, demo/vista.js
LISTA · tarea 03 · 2026-10-25 00:02 · s-20261024T235325-c2b53216 · f668eb4 · pass 110, fail 0 (npm test global; 24 nuevas en tests/poliedros.test.js) · js/tableros/poliedros.js, js/tableros/index.js (import + elemento de la lista), tests/poliedros.test.js; y tests/tableros.test.js (ver desviaciones)
LISTA · tarea 05 · 2026-10-24 23:57 · s-20261024T235342-779d7bfb · 836464a · 25 nuevas en tests/ia.test.js; azar + motor + ia = pass 60, fail 0. npm test global: pass 91, fail 2 — los 2 fallos son de tests/tableros.test.js (02) contra el js/tableros/index.js que la tarea 03 tenía a medias (sin comitear) en ese momento; no tocan ficheros de la 05. · js/ia/jugadores.js, js/ia/minimax.js, tests/ia.test.js
LISTA · tarea 04 · 2026-10-24 23:53 · s-20261024T235025-d6f23bfd · d9dfd6d · pass 65 (motor: 31 nuevas; baseline al empezar: 4 de la 01 y las de la 02 en curso) · js/motor/ronda.js, js/motor/partida.js, tests/motor.test.js
LISTA · tarea 02 · 2026-10-24 23:53 · s-20261024T235013-c97a563e · 194b4e4 · pass 65, fail 0 (npm test; con la 01 eran 4, mis pruebas nuevas: 30; el resto es tests/motor.test.js de la 04 en curso) · js/tableros/tipos.js, js/tableros/rejillas.js, js/tableros/hexagonal.js, js/tableros/index.js, tests/tableros.test.js
LISTA · tarea 01 · 2026-10-24 23:47 · s-20261024T234627-f387245a · 936008e · pass 4, fail 0 (npm test) · package.json, LICENSE, index.html, css/estilo.css, js/util/azar.js, tests/azar.test.js, README.md

## Incidencias de coordinación

Derivado de `hechos/incidencias/`. Choques encontrados y cómo se resolvieron.

- s-20261025T003610-2477832b (tarea 13): `tests/ajustes.test.js` (de la 07) comprueba las
  claves exactas de `ajustesPorDefecto`; la 13 añadió `obstaculos` y la 14 `valores` a esa
  lista (una línea cada una), fuera de ficha. Resuelto en db43c79 y 00eb633.
- Sin fichero en `incidencias/`, anotado en las terminadas de 09, 10, 11 y 12: la reserva
  del hook de la sesión de la 07 retuvo sus esbozos y el tablón ~25 min tras cerrar.

Los automatismos activos y las rutas del proyecto están en `proyecto.md`, no aquí: este
fichero se regenera entero y se los llevaría por delante.
