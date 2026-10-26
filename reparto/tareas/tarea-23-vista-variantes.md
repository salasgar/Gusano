# Tarea 23 · Vista: casillas fantasma, flechas, dos gusanos y dos cabezas

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: ninguna (la tanda 1 está LISTA) · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/ui/vista-tablero.js`, `css/vista-tablero.css`, `demo/vista.html`, `demo/vista.js`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §5 y **§10 entero** (esta tarea es la primera
   mitad de §10.5; los campos de tablero y ronda que vas a dibujar están en §10.1-§10.3), y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Reclama (`NN` = `23`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que la vista del tablero dibuje todo lo nuevo de la tanda 2, sin que cambie nada de cómo se
ve una partida clásica.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde. Después, en la demo, un tablero a
mano con `dibujo.fantasmas`.

## Qué hay que hacer
1. `js/ui/vista-tablero.js`, todo lo de §10.5 primer punto: fantasmas (con sus clases de
   estado y `alClicar` a la casilla real), flechas en cada conexión de un solo sentido
   (marcador SVG de punta; también con `aristas: false`), un trazo por gusano desde
   `ronda.cuerpos` con ojos en la cabeza y, con dos cabezas, en la cola, tramos a través
   de un pegado que no cruzan el tablero, colores por gusano con dos gusanos, y la opción
   `elegirExtremo`. **Si la ronda no trae `cuerpos`** (una ronda de la tanda 1, o del motor
   antes de la 22), dibuja `camino` como un solo gusano, como ahora.
2. `css/vista-tablero.css`: `.fantasma` (la misma casilla, más tenue), `.arco` y su punta,
   `.gusano-1` (con `--pajaro`), `.elegir-extremo` (un anillo que se vea en claro y en
   oscuro, con `prefers-reduced-motion` sin animación), y los ojos de la cola.
3. `demo/vista.html` / `demo/vista.js`: añade ejemplos escritos a mano según §10 (no
   dependas de las tareas 20-22, que pueden ir a la vez que esta): un toro 4×4 con su
   franja de fantasmas y un gusano que cruza el pegado; un tablero con arcos; una ronda de
   dos gusanos de dos cabezas; una con `elegirExtremo`. Si cuando trabajes ya están LISTAS
   la 21 o la 22, usa sus generadores y su motor en vez de datos a mano.
4. Comprueba en Chrome (el navegador de la sesión o capturas sin cabeza a 375 y 1200 px,
   claro y oscuro) la demo y una partida clásica de la app, que tiene que verse igual que
   antes.
5. `npm test` y `node herramientas/test-ui.js` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §5, §10. `css/estilo.css` (variables de color; solo lectura).

## Salida esperada
Commit: `git commit -m "Tarea 23: vista de las variantes" -- js/ui/vista-tablero.js
css/vista-tablero.css demo/vista.html demo/vista.js`.

## Cómo saber que ha terminado
La demo muestra los cuatro ejemplos; la partida clásica se ve igual; los dos arneses en
verde.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. **No hagas `push`.**

## Trampas conocidas
- El caso q) del arnés falla si un texto baja de 4,5 de contraste en oscuro: si añades
  texto, mídelo.
- Los fantasmas no son casillas: no los cuentes en nada que recorra `tablero.casillas`.

## Prohibido
- Tocar `css/estilo.css`, `jugar.js` o el motor. Cambiar la firma de `crearVista` o de
  `actualizar` (solo se añade `elegirExtremo`).
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
