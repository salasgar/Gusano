# Tarea 25 · La máquina juega todas las variantes

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 22 LISTA · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/ia/jugadores.js`, `js/ia/minimax.js`, `tests/ia-variantes.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §4 y **§10 entero** (esta tarea es §10.4; el motor
   que usas es §10.3), y `reparto/_ESTADO.md`; lista `reparto/hechos/`. Lee la terminada de
   la 22. `date -u`.
2. Precondición: `terminadas/22--*` existe.
3. Reclama (`NN` = `25`, `MINUTOS` = `80`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que los cuatro niveles de la máquina jueguen bien con dos cabezas, dos gusanos y flechas,
y que el resolutor exacto dé el valor de esas posiciones, sin cambiar nada del modo
clásico.

## Siguiente paso
`npm test` en verde. Después `valorExacto` sobre `jugadasCompletas` y `maximiza`.

## Qué hay que hacer
1. `js/ia/minimax.js` y `js/ia/jugadores.js`: todo §10.4. Con el modo clásico, mismas
   jugadas y mismos valores que hoy (`tests/ia.test.js` y `tests/reto.test.js` sin
   cambios). `elegirJugada` devuelve un índice cuando no hay ambigüedad y el objeto cuando
   la hay.
2. Presupuesto: con dos cabezas y dos gusanos el árbol crece mucho; mide cuántos estados
   necesita `valorExacto` en `cuadrado4` lado 4 y lado 5 en cada modo y anótalo en la
   terminada. Si `perfecto` no cabe en ~1,5 s en lado 5, que caiga en `fuerte` (§4).
3. `tests/ia-variantes.test.js`: un minimax ingenuo escrito en la propia prueba (recursión
   sobre `jugadasCompletas` y `jugar`, sin memoria) como oráculo; en tableros de ≤ 9
   casillas (camino de 5, ciclo de 6, `cuadrado4` lado 3, uno dirigido a mano) y en los
   modos dos cabezas, dos gusanos y los dos a la vez, `valorExacto` coincide con el
   ingenuo; `elegirJugada('perfecto')` alcanza el valor exacto; `aleatorio` y `voraz`
   devuelven siempre una jugada que `jugar` acepta; una partida máquina-máquina de dos
   gusanos en `cuadrado4` lado 5 termina en menos de 10 s con `fuerte`.
4. `npm test` en verde (las pruebas de IA, acotadas a < 10 s en total como pide
   `proyecto.md`).

## Datos de entrada
- `ESPECIFICACION.md` §4, §10.3, §10.4. Terminada de la 22.

## Salida esperada
Commit: `git add tests/ia-variantes.test.js && git commit -m "Tarea 25: la máquina en las
variantes" -- js/ia/jugadores.js js/ia/minimax.js tests/ia-variantes.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 10 pruebas nuevas) con las de la tanda 1 sin tocar; recuentos de
estados en la terminada.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. **No hagas `push`.**

## Trampas conocidas
- La clave de memoria de la tanda 1 (`mascara * 64 + cabeza`) no basta: con dos extremos
  o dos gusanos hay que meter todos los extremos y quién mueve. Una clave de texto es más
  lenta pero segura; mide antes de optimizar.
- Con dos gusanos el mismo papel puede mover dos veces seguidas: no alternes max/min por
  profundidad, pregúntale a `maximiza`.

## Prohibido
- Cambiar el comportamiento en modo clásico o las pruebas de la tanda 1. Tocar el motor (si
  le falta algo, incidencia y dilo).
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
