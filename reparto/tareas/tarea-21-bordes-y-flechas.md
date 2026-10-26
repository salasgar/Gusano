# Tarea 21 · Bordes pegados y rectángulos en todas las rejillas, flechas con patrón, casillas fantasma

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 20 LISTA · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: MEDIO · Encadenable con: 20 (detrás de ella)
Ficheros que toca: `js/tableros/rejillas.js`, `js/tableros/hexagonal.js`,
`js/tableros/index.js`, `tests/bordes.test.js` (nuevo), `tests/tableros.test.js` (solo la
prueba del orden del registro, que cambia porque `superficie` deja de estar visible)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §2 y **§10 entero** (esta tarea es §10.2), y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/20--*` existe (usas `arcos` de `crearTablero`).
3. Reclama (`NN` = `21`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
El toro plano (y cilindro, Möbius, Klein) en todas las rejillas, también rectangulares y
hexagonales; flechas con patrón; y la información para que la vista dibuje una franja de
casillas fantasma que haga ver el pegado.

## Siguiente paso
`npm test` en verde. Después `alto` y `bordes` en `cuadrado4`, comprobando que con los
defectos sale el mismo tablero de siempre.

## Qué hay que hacer
1. `rejillas.js`: `cuadrado4`, `cuadrado8` y `caballo` con `alto` y `bordes` (§10.2). Una
   sola función de vecindad con pegado para las tres (y que `superficie` la reutilice, si
   quieres, sin cambiar lo que devuelve). Con los defectos, mismo `id`, casillas y vecinos
   que hoy.
2. `hexagonal.js`: `bordes: normales / toro` con las traslaciones de §10.2.
3. Flechas con patrón (`flechas`, §10.2) en `cuadrado4`, `cuadrado8` (`manhattan`,
   `corriente` con `soloSi: { bordes: ['toro'] }`) y `hexagonal` (`corrientes`), con
   `arcos` de `crearTablero`. `crear` lanza Error si una opción con `soloSi` se pide sin
   cumplirse.
4. Fantasmas (`dibujo.fantasmas`, §10.2) en todo tablero con bordes pegados, también en
   `superficie`; la caja crece y las casillas reales se desplazan. **Esto sí cambia el
   dibujo de `superficie`**: está permitido (el `id`, las casillas y `vecinos` no cambian;
   solo `dibujo` y las coordenadas). Si las pruebas de la 02 comprueban coordenadas de
   `superficie`, dilo en la terminada.
5. `index.js`: `generadores` sin `superficie`; `generador('superficie')` la sigue
   devolviendo. Ajusta la prueba del orden en `tests/tableros.test.js` (la de la línea
   «el registro lista los generadores en orden»), y solo esa.
6. `tests/bordes.test.js`: con defectos, `deepEqual` con el tablero de hoy (los tres
   generadores); `cuadrado4` lado 4 `toro` tiene los mismos `vecinos` que
   `superficie` toro lado 4 (y su `par` sigue siendo 14: `tests/ia.test.js` lo comprueba
   sobre `superficie`); rectángulo 6×4 toro: 24 casillas de grado 4; `cuadrado8` toro 5×5:
   todas de grado 8; `caballo` toro 6×6: todas de grado 8; Möbius 5×4 en `cuadrado4`:
   grados y una vecina invertida concreta; hexagonal toro radio 1, 2 y 3: oráculo de §10.2
   (grado 6, simétrico, sin bucles; radio 1, las 7 vecinas entre sí; circulante 1, 3r+1,
   3r+2); `manhattan` 4×4 plano: arcos según el patrón y dos esquinas sin salida;
   `corriente` sin toro lanza Error; `corrientes` hexagonal radio 2: cada casilla interior
   con 3 salidas y 3 entradas; fantasmas: en toro 4×4, 4 + 4 + 4 + 4 + 4 esquinas = 20
   fantasmas (una franja de 4 por cada lado y las cuatro esquinas), cada uno apuntando a la
   casilla del otro lado; ninguno en un tablero de bordes normales.
7. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.2, §10.2. `reparto/datos/analisis-2026-10-26/` (comprobación del
  toro hexagonal y de los patrones; `comprobar.py` usa las mismas coordenadas axiales que
  `hexagonal.js`).

## Salida esperada
Commit: `git add tests/bordes.test.js && git commit -m "Tarea 21: bordes pegados, flechas
con patrón y fantasmas" -- js/tableros/rejillas.js js/tableros/hexagonal.js
js/tableros/index.js tests/bordes.test.js tests/tableros.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 15 pruebas nuevas); los tableros por defecto, idénticos a los de la
tanda 1.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. **No hagas `push`.**

## Trampas conocidas
- El reto del día y las URL antiguas piden `superficie` por su id: tiene que seguir
  creándose igual (salvo el dibujo).
- Con `lado` o `alto` pequeños, el pegado puede repetir vecinas (caballo toro 4×4): se
  descartan las repetidas, no es un error.
- Las fantasmas de la esquina en un toro rectangular: la casilla opuesta en diagonal.

## Prohibido
- Tocar `tipos.js` o `sentido.js` (son de la 20), `poliedros.js` (de la 24), el motor o la
  vista. Cambiar `id`, casillas o vecinos de un tablero con los parámetros por defecto.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
