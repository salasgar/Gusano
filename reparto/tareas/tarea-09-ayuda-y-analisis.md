# Tarea 09 · Modo ayuda y pantalla de análisis

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: 10, 12
Ficheros que toca: `js/ui/ayudas.js` (llena el esbozo), `js/pantallas/analisis.js` (llena el esbozo), `css/analisis.css`, `tests/ayudas.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§3.1, §4, §5, §6, §7.1) y `reparto/_ESTADO.md`;
   lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe (y no hay `reabiertas/07--*` posterior sin
   terminada que la cierre).
3. Reclama (`NN` = `09`, `MINUTOS` = `80`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Lo que enseña a jugar: ver qué casillas ya no cuentan y cuánto queda como máximo, y
repasar una partida acabada viendo dónde se perdieron puntos.

## Siguiente paso
`npm test` en verde. `js/ui/ayudas.js`: `decoraciones(ronda)` de §7.1 y su prueba.

## Qué hay que hacer
1. `js/ui/ayudas.js`: `decoraciones(ronda)` → `Map` con `{ clase: 'inalcanzable' }` para
   cada casilla libre que no esté en `alcanzables(ronda)` (con el camino vacío, ninguna)
   y `{ texto: String(k + 1) }` para `camino[k]`. Mantén la firma del esbozo.
2. `js/pantallas/analisis.js`: `montar(contenedor, { irA, datos })`; sin `datos.partida`
   muestra «Juega una partida y pulsa Analizar» con un enlace a `#jugar`. Con partida:
   selector de par y ronda, vista del tablero (`crearVista`) en la posición `k` de esa
   ronda (reconstruye con `nuevaRonda` + `jugar` sobre `camino.slice(0, k)`), botones
   «‹ Anterior», «Siguiente ›», un `<input type="range">`, y el panel: quién movió,
   puntuación hasta ahí, cota superior. Si `tablero.casillas.length ≤ 30` y
   `valorExacto` completa (con `maxEstados` 2 000 000; calcula una vez por posición y
   guarda en caché; mientras calcula, «calculando…»), marca la mejor jugada con
   `{ clase: 'mejor' }` y, si la jugada real valía menos (para el gusano) o más (para
   el pájaro) que la mejor, escribe «Aquí el gusano perdió N puntos» / «Aquí el pájaro
   regaló N puntos». Resumen al final: puntos perdidos por cada jugador en la ronda.
3. `css/analisis.css`: disposición de la pantalla y `.mejor` (borde discontinuo en
   `--acento`).
4. `tests/ayudas.test.js`: con un tablero a mano (camino de 5 con una rama cortada):
   las inalcanzables salen marcadas, el camino numerado 1..k, y con el camino vacío
   nada marcado. `analisis.js` se importa en Node sin error.
5. Pruébalo en Chrome con una partida de `cuadrado4` lado 4 contra `aleatorio`
   (gusano) y comprueba que el análisis señala al menos un error del aleatorio.
6. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §7.1. `js/ui/vista-tablero.js` (06), `js/ia/minimax.js` (05),
  `js/motor/*` (04): solo lectura. El esbozo de la 07 (mantén sus exportaciones).

## Salida esperada
Commit: `git add tests/ayudas.test.js && git commit -m "Tarea 09: modo ayuda y análisis"
-- js/ui/ayudas.js js/pantallas/analisis.js css/analisis.css tests/ayudas.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 3 pruebas nuevas); en Chrome, el modo ayuda atenúa casillas y
numera tramos durante una partida, y el análisis recorre una partida acabada señalando
los errores.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Encadena la 10 o la 12 (misma banda, cortas, libres) si
estás en verde y nadie las tiene; si no, frases y para.

## Trampas conocidas
- `valorExacto` en 25-30 casillas puede tardar segundos: calcúlalo en un `setTimeout`
  para que la pantalla pinte antes, y nunca para más de una posición a la vez.
- Ninguna otra por ahora.

## Prohibido
- Tocar `jugar.js`, `app.js`, `index.html` o `estilo.css`: si el enganche de la 07 no
  basta, incidencia con la propuesta.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
