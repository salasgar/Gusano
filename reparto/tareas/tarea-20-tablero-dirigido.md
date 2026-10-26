# Tarea 20 · Tablero dirigido y «sentido único» al azar

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: ninguna (la tanda 1 está LISTA) · Disparo: MANUAL
Duración esperada: 20 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: 21 (detrás de esta)
Ficheros que toca: `js/tableros/tipos.js`, `js/tableros/sentido.js` (nuevo), `tests/dirigidos.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §2.1 y **§10 entero** (es el contrato de la tanda
   2; esta tarea es §10.1), y `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Reclama (`NN` = `20`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que un tablero pueda tener conexiones de un solo sentido, sin que cambie nada de los
tableros que no las tienen, y una transformación que pone flechas al azar en cualquier
tablero.

## Siguiente paso
`npm test` en verde (179). Después `crearTablero` con `arcos`.

## Qué hay que hacer
1. `js/tableros/tipos.js`: `crearTablero` acepta `arcos` (§10.1): `vecinos` = salidas,
   `predecesores` = entradas, `dirigido: true`; sin arcos, el objeto resultante es
   **idéntico** al de ahora (ni `dirigido` ni `predecesores`). Error si un par está a la vez
   en `aristas` y en `arcos`, o si un arco es un bucle. `validarTablero`: con `dirigido`,
   `predecesores` es la inversa exacta de `vecinos`; sin él, como ahora.
2. `js/tableros/sentido.js`: `conSentidoUnico(tablero, proporcion, azar)` (§10.1): copia
   profunda, recuento de aristas de doble sentido (pares con i < j, i en `vecinos[j]` y j en
   `vecinos[i]`), elige y orienta con `azar`, respeta «ninguna casilla no bloqueada sin
   salida ni sin entrada», reconstruye con `crearTablero` (o directamente `vecinos` y
   `predecesores`, validando). `id` y `descripcion` según §10.1. Con proporción 0 devuelve
   una copia sin cambios.
3. `tests/dirigidos.test.js`: un tablero a mano con aristas y arcos (vecinos y
   predecesores esperados); los errores; `validarTablero` acepta uno bueno y rechaza uno con
   `predecesores` mal; un tablero de la tanda 1 (`cuadrado4` lado 4) pasado por
   `crearTablero` sin arcos es igual que antes (`deepEqual`); `conSentidoUnico` en
   `cuadrado4` lado 6 con 0,5: el número de conexiones de un solo sentido es la mitad
   redondeada de las aristas, ninguna casilla sin salida ni entrada, reproducible con la
   misma semilla; con 1 en `cuadrado4` lado 4: todas en un sentido salvo las que la regla
   obligue a dejar dobles; con 0: igual.
4. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.1, §10.1. `js/tableros/obstaculos.js` (13) como modelo de
  transformación (solo lectura). `js/util/azar.js` (solo lectura).

## Salida esperada
Commit: `git add js/tableros/sentido.js tests/dirigidos.test.js && git commit -m "Tarea 20:
tablero dirigido y sentido único" -- js/tableros/tipos.js js/tableros/sentido.js
tests/dirigidos.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 8 pruebas nuevas) y las de la tanda 1 sin tocar.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 20 LISTA pasa a PENDIENTE la 21: si tu frase la
nombra, encadénala. **No hagas `push`.**

## Trampas conocidas
- Todo lo que lee `vecinos` (motor, IA, vista, obstáculos) lo lee como «a dónde se puede
  ir»: por eso `vecinos` son las salidas y no hay que cambiar a nadie para que lo entienda.
- `conObstaculos` comprueba conexión siguiendo `vecinos`; en la app los obstáculos se
  aplican **antes** que el sentido único (§10.6), así que no hay que tocarlo.

## Prohibido
- Tocar `js/tableros/rejillas.js`, `hexagonal.js`, `index.js` (son de la 21) o el motor.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
