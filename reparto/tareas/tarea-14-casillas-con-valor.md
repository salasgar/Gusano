# Tarea 14 · Casillas con valor

Actualizado: 2026-10-20
Precondición: 13 LISTA · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: 13
Ficheros que toca: `js/tableros/valores.js` (nuevo), `js/ui/ajustes.js` (añade el campo), `tests/valores.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§1 punto 3, §2.1, §2.3, §3.1, §5, §6 «Ajustes») y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/13--*` existe (y ningún reclamo vivo de la 13).
3. Reclama (`NN` = `14`, `MINUTOS` = `80`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Cada casilla con un número y la puntuación como suma: el gusano busca las caras, el
pájaro las esquiva, y en clase es cálculo mental. Motor, máquina y vista ya lo soportan
(`valor`, `puntuacion`, `mostrarValores`); aquí se asignan los valores y se ofrecen en
los ajustes.

## Siguiente paso
`npm test` en verde. `conValores` y sus pruebas; después el campo de ajustes.

## Qué hay que hacer
1. `js/tableros/valores.js`: `conValores(tablero, modo, azar)` (§2.3): `uniforme` →
   `azar.entero(1, 3)` por casilla no bloqueada; `centro` → 3 en el tercio de casillas
   más cercanas al centro del dibujo, 2 en el siguiente, 1 en el resto; `trampas` →
   como uniforme y después `Math.round(0.1 × n)` casillas al azar con valor −2.
   `id` según §2.3; `descripcion` añade «Casillas con valor: <modo>». Modo
   desconocido → `Error`.
2. `js/ui/ajustes.js`: campo «Valores» (sin / uniforme / centro / trampas, defecto
   sin) en el sitio marcado por la 07; `ajustesPorDefecto()` gana `valores: 'sin'`;
   `tablerosDesdeAjustes` aplica `conValores` después de `conObstaculos` con el mismo
   `azar` del par. Comprueba que `jugar.js` pasa `mostrarValores: true` a la vista
   cuando algún valor ≠ 1 (lo hace la vista sola según §5; si no se ven los números,
   es una reabierta de la 06, no un arreglo tuyo).
3. `tests/valores.test.js`: cada modo da `validarTablero` ok y valores en su rango;
   `centro` en `cuadrado4` lado 6: las cuatro centrales valen 3 y las esquinas 1;
   `trampas` en lado 6: 4 casillas con −2; reproducible con la misma semilla;
   `valorExacto` (05) en `cuadrado4` lado 3 con todos los valores a 2 da 18 desde una
   esquina (el doble de 9); `puntuacion` de un camino con un −2 resta.
4. En Chrome: partida con valores `centro` en `cuadrado8` lado 5 contra `fuerte`: los
   números se ven y el marcador suma valores.
5. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.3, §3.1, §5. `js/tableros/obstaculos.js` (13) como modelo.
  `js/ia/minimax.js` (05) para la prueba. Solo lectura.

## Salida esperada
Commit: `git add js/tableros/valores.js tests/valores.test.js && git commit -m "Tarea
14: casillas con valor" -- js/tableros/valores.js js/ui/ajustes.js
tests/valores.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 7 pruebas nuevas); el campo aparece y los números se ven en el
tablero.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. No encadenes.

## Trampas conocidas
- Ninguna por ahora.

## Prohibido
- Tocar motor, máquina o vista: si la suma de valores o los números no salen, reabierta
  de la tarea responsable (04, 05 o 06) con lo exacto a corregir.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
