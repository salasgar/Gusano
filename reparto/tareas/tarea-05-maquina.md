# Tarea 05 · Máquina: niveles, alfa-beta y resolutor exacto

Actualizado: 2026-10-20
Precondición: 02 LISTA y 04 LISTA · Disparo: MANUAL
Duración esperada: 50 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 100 min · Banda de modelo: MEDIO · Encadenable con: 04
Ficheros que toca: `js/ia/jugadores.js`, `js/ia/minimax.js`, `tests/ia.test.js` (todos nuevos)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§3, §4, §8),
   `reparto/datos/analisis-2026-10-20/valores-minimax.md` y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/02--*` y `terminadas/04--*` existen.
3. Reclama (`NN` = `05`, `MINUTOS` = `100`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Los cuatro niveles de máquina de §4 y el resolutor exacto que da el «par» del reto del
día y el análisis. Lo que lo hace verificable: el oráculo de valores calculado en Python
al montar el reparto.

## Siguiente paso
`npm test` en verde. Escribe primero `js/ia/minimax.js` con la representación por
máscara de bits y comprueba `valorExacto` contra `cuadrado4` lado 3 (9 desde una
esquina, 6 desde el centro de un lado) antes de nada más.

## Qué hay que hacer
1. `js/ia/minimax.js`: `valorExacto(ronda, { maxEstados })` y `par(tablero, inicio,
   opciones)` (§4). Dentro: máscara de ocupadas (bloqueadas incluidas) en un entero sin
   signo (tableros de ≤ 30 casillas; si hay más, devuelve `{ completo: false }` sin
   buscar), vecinos como máscaras precalculadas, memoria `Map` con clave `mascara * 64 +
   cabeza`, valor de un estado terminal = `puntuacion` (suma de valores), maximiza en
   turno del gusano (número de ocupadas con paridad par, contando solo las del camino,
   no las bloqueadas) y minimiza en el del pájaro. Contador de estados; al pasar
   `maxEstados`, corta y devuelve `completo: false`. Devuelve también la mejor `jugada`
   desde la raíz.
2. `js/ia/jugadores.js`: `niveles` y `elegirJugada(nivelId, ronda, { azar,
   tiempoMaximoMs })` con los cuatro comportamientos de §4. Para `fuerte`: alfa-beta con
   profundización iterativa (profundidad 1, 2, 3… hasta agotar `tiempoMaximoMs` medido
   con `performance.now()`), evaluación de §4, orden de jugadas voraz, tabla de
   transposición por clave de máscara (tableros ≤ 30 casillas; con más, clave de texto
   `mascara.join('')` o `BigInt`). Siempre devuelve una jugada legal.
3. `tests/ia.test.js` (acotadas: todas juntas < 10 s): oráculo con los generadores de la
   02: `cuadrado4` lado 3 → 9 desde (0,0) y desde el centro, 6 desde (0,1); lado 4 → 12
   desde cualquier casilla (prueba 3 distintas); `cuadrado8` lado 4 → 15 desde (0,0) y desde (1,1), 14
   desde (0,1); `caballo` lado 4 → máximo 12 y mínimo 4 sobre todos los inicios;
   `superficie` toro lado 4 → 14 desde (0,0); `hexagonal` radio 2 → 19 desde el centro, 17 desde
   una esquina (grado 3), 15 desde el centro de un lado (grado 4) y mínimo 15 sobre
   los inicios (este es el más caro: ~700 000 estados; si tarda más de
   4 s en tu máquina, prueba solo el centro); `par(tablero, inicio)` coincide con
   `valorExacto`; `completo: false` con `maxEstados: 100`; con valores (tablero a mano
   con valor 2 en todas) el valor se duplica; cada nivel devuelve una jugada legal en
   10 posiciones al azar; `perfecto` como pájaro contra `aleatorio` en `cuadrado4` lado 4
   nunca pasa de 12 puntos (5 partidas con semilla fija), y como gusano nunca baja de
   12; `fuerte` con 200 ms devuelve en menos de 400 ms.
4. `npm test` en verde y, con `perl -e 'alarm shift; exec @ARGV' 60 npm test`, sin
   agotar el tiempo.

## Datos de entrada
- `ESPECIFICACION.md` §3 y §4. `reparto/datos/analisis-2026-10-20/valores-minimax.md` y
  `gusano_minimax.py` (la implementación de referencia en Python, solo lectura).
- `js/motor/ronda.js` (04), `js/tableros/index.js` (02), `js/util/azar.js` (01).

## Salida esperada
Tres ficheros en un commit: `git add js/ia/jugadores.js js/ia/minimax.js
tests/ia.test.js && git commit -m "Tarea 05: máquina y resolutor exacto" --
js/ia/jugadores.js js/ia/minimax.js tests/ia.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 15 pruebas nuevas) en menos de 60 s en total; los oráculos de
arriba se reproducen exactamente.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 05 LISTA (y la 06) pasa a PENDIENTE la 07. Anota
en la terminada cuántos estados y cuánto tiempo tardó `hexagonal` radio 2: sirve para
fijar `maxEstados` en el reto (10). No encadenes: la 06 es la otra candidata y seguramente
ya está cogida; si está libre y estás en verde, sí.

## Trampas conocidas
- La paridad del turno se cuenta con `camino.length`, no con el número de bits a 1 de
  la máscara (las bloqueadas están en la máscara y no son jugadas).
- `mascara * 64 + cabeza` solo es exacto si la máscara cabe en 2^47: con ≤ 30 casillas
  sobra. Para `>>> 0` y las máscaras usa aritmética sin signo con cuidado: `1 << 31` es
  negativo en JS; usa `2 ** i` o `(1 << i) >>> 0`.
- Si el oráculo del hexagonal no cuadra y los cuadrados sí, revisa el orden de los
  vecinos hexagonales de la 02 (debe ser indiferente) y el inicio elegido (el centro es
  la casilla con 6 vecinas).
- (Añadida por la sesión que la cerró.) En los tests, el centro del hexagonal se localiza
  por coordenadas (grado 6 y `x`, `y` = mitad de la caja de `dibujo`), no por índice:
  hay otras casillas de grado 6. `perfecto` en 25-30 casillas puede tardar varios
  segundos (hasta 2 M de estados y luego 3 s de `fuerte`); no lo uses en bucles de tests.

## Prohibido
- Tocar el motor o los tableros: si falta algo ahí, incidencia (y propuesta en la
  terminada).
- Web Workers o asincronía en esta tanda: `elegirJugada` es síncrona (§4).
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
