# Tarea 27 · Modo ayuda, análisis y compartir con las variantes

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 20, 22 y 25 LISTAS · Disparo: MANUAL
Duración esperada: 35 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 70 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/ui/ayudas.js`, `js/pantallas/analisis.js`, `css/analisis.css`,
`js/compartir/url.js`, `tests/ayudas.test.js`, `tests/url.test.js`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §7.1, §7.4 y **§10 entero** (esta tarea es el
   punto «Ayudas, análisis y compartir» de §10.6), y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. Lee las terminadas de 20, 22 y 25. `date -u`.
2. Precondición: las tres terminadas existen. Puede ir a la vez que la 26 (no comparten
   ficheros).
3. Reclama (`NN` = `27`, `MINUTOS` = `70`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que el modo ayuda, el análisis y los enlaces compartidos funcionen con todas las variantes,
sin cambiar nada para las partidas clásicas.

## Siguiente paso
`npm test` en verde. Después `decoraciones` con el `alcanzables` general.

## Qué hay que hacer
1. `js/ui/ayudas.js`: `decoraciones(ronda)` con el `alcanzables` general (§10.3): las
   inalcanzables desde cualquier extremo de cualquier gusano; los números de tramo, por
   gusano y en el orden de su cuerpo.
2. `js/pantallas/analisis.js`: el repaso sigue `jugadas` (con extremo y gusano); el valor
   de cada posición con `valorExacto` de la 25 en el modo de la partida; con dos gusanos,
   el nombre del jugador en vez del papel («Aquí Jugador A perdió 2 puntos» y en el
   resumen). Sigue empezando en la jugada 0 y diciendo «perdió» (§7.1).
3. `js/compartir/url.js`: `v: 2` con `m` y los extremos (§10.6); `v: 1` exacta para el
   clásico; los tableros con flechas al azar, literales en `t` (los de flechas con patrón
   van por `{ g, pa }` porque el generador los reproduce); `partidaDesdeURL` lee las dos
   versiones y reconstruye con `jugarEnPartida`.
4. Pruebas: en `tests/ayudas.test.js`, decoraciones con dos cabezas, dos gusanos y flechas;
   en `tests/url.test.js`, ida y vuelta de una partida en cada modo, un enlace `v: 1`
   antiguo que sigue abriendo igual, y una partida en un tablero con flechas al azar.
5. En Chrome: el análisis de una partida de dos gusanos, y un enlace de dos cabezas
   abierto en otra pestaña que reproduce la partida.
6. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §7.1, §7.4, §10. Terminadas de 20, 22 y 25.

## Salida esperada
Commit: `git commit -m "Tarea 27: ayudas, análisis y compartir en las variantes" --
js/ui/ayudas.js js/pantallas/analisis.js css/analisis.css js/compartir/url.js
tests/ayudas.test.js tests/url.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 8 pruebas nuevas); las URL `v: 1` de siempre siguen abriendo igual.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. **No hagas `push`.**

## Trampas conocidas
- Los límites al decodificar de §7.4 (20 pares, 500 casillas, nombres de 40) siguen; un
  tablero literal con `predecesores` pesa el doble: comprueba que un enlace de `cuadrado4`
  lado 12 con flechas al azar no se pasa de lo razonable (anota la longitud en la
  terminada).
- Para probar la app en Chrome necesitas la 26 LISTA; si aún no lo está, prueba con la
  demo o con funciones sueltas y dilo en la terminada.

## Prohibido
- Tocar `jugar.js`, `ajustes.js`, `textos-partida.js` (de la 26), el motor o la IA.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
