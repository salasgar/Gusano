# Tarea 13 · Obstáculos

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 25 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 50 min · Banda de modelo: MEDIO · Encadenable con: 14
Ficheros que toca: `js/tableros/obstaculos.js` (nuevo), `js/ui/ajustes.js` (añade el campo), `tests/obstaculos.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§2.1, §2.3, §6 «Ajustes») y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe. **Y ningún reclamo vivo de la 14** (comparte
   `js/ui/ajustes.js`).
3. Reclama (`NN` = `13`, `MINUTOS` = `50`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Casillas bloqueadas al azar que hacen cada tablero distinto y dan armas al pájaro en los
tableros densos. El motor, la máquina y la vista ya entienden `bloqueada`; aquí solo se
generan y se ofrecen en los ajustes.

## Siguiente paso
`npm test` en verde. `conObstaculos` y su prueba; después el campo de ajustes.

## Qué hay que hacer
1. `js/tableros/obstaculos.js`: `conObstaculos(tablero, proporcion, azar)` (§2.3): copia
   profunda del tablero; `objetivo = Math.round(proporcion × casillas no bloqueadas)`;
   recorre las candidatas barajadas con `azar` y bloquea una si el grafo de las libres
   sigue conexo (búsqueda en anchura por libres); para al llegar al objetivo o agotar
   candidatas. `id` y `descripcion` según §2.3 (con el número real bloqueado).
   `proporcion` 0 → copia sin cambios.
2. `js/ui/ajustes.js`: campo «Obstáculos» (0 % / 10 % / 20 %, defecto 0) en el sitio
   marcado por la 07; `ajustesPorDefecto()` gana `obstaculos: 0`;
   `tablerosDesdeAjustes` aplica `conObstaculos(t, obstaculos, crearAzar(semilla +
   indicePar))` en el punto único de transformaciones. No toques nada más del fichero.
3. `tests/obstaculos.test.js`: en `cuadrado4` lado 6 con 0,2: 7 bloqueadas,
   `validarTablero` ok, las libres conexas, las bloqueadas conservan `vecinos`,
   reproducible con la misma semilla y distinto con otra; con 0 → ninguna; en un
   «camino de 3» con 0,5 → como mucho una bloqueada (y las libres conexas);
   `tablerosDesdeAjustes({ …ajustesPorDefecto(), obstaculos: 0.1 })` devuelve tableros
   con bloqueadas.
4. En Chrome: partida con 20 % en `hexagonal` radio 3: las bloqueadas se ven, no son
   legales y el inicio sorteado no cae en una.
5. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.3 y §6. `js/motor/ronda.js` (04) por si quieres reutilizar
  `alcanzables` (solo lectura). El comentario de la 07 en `ajustes.js`.

## Salida esperada
Commit: `git add js/tableros/obstaculos.js tests/obstaculos.test.js && git commit -m
"Tarea 13: obstáculos" -- js/tableros/obstaculos.js js/ui/ajustes.js
tests/obstaculos.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 6 pruebas nuevas); el campo aparece en los ajustes y funciona.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 13 LISTA pasa a PENDIENTE la 14: encadénala si
estás en verde (misma banda, corta, solo depende de esta).

## Trampas conocidas
- Copia profunda: `structuredClone(tablero)` existe en Node 17+ y en los navegadores
  actuales.

## Prohibido
- Tocar en `ajustes.js` otra cosa que el campo, el defecto y la transformación.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
