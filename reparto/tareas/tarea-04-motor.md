# Tarea 04 · Motor: ronda, partida por pares y marcador

Actualizado: 2026-10-20
Precondición: 01 LISTA · Disparo: MANUAL
Duración esperada: 35 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 70 min · Banda de modelo: MEDIO · Encadenable con: 05
Ficheros que toca: `js/motor/ronda.js`, `js/motor/partida.js`, `tests/motor.test.js` (todos nuevos)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§1, §2.1, §3 entero) y `reparto/_ESTADO.md`;
   lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/01--*` existe.
3. Reclama (`NN` = `04`, `MINUTOS` = `70`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Las reglas del juego como funciones puras sobre la estructura de datos de §2.1, sin
DOM y sin depender de los generadores: la máquina (05), la vista (06) y la app (07) se
apoyan en esto. Las pruebas usan tableros escritos a mano.

## Siguiente paso
`npm test` → en verde. Escribe `js/motor/ronda.js` con las firmas exactas de §3.1 y una
prueba con el tablero «camino de 3 casillas» (`vecinos: [[1], [0, 2], [1]]`).

## Qué hay que hacer
1. `js/motor/ronda.js`: `nuevaRonda`, `cabeza`, `turno`, `ocupada`, `jugadasLegales`,
   `jugar`, `rondaTerminada`, `puntuacion`, `alcanzables`, `cotaSuperior`, con el
   comportamiento de §3.1. `jugar` no muta: devuelve `{ tablero, camino: [...camino,
   casilla] }` (puedes guardar además un `ocupadas` derivado, pero `camino` es lo que
   cuenta). `alcanzables` es una búsqueda en anchura por casillas libres (ni en el
   camino ni bloqueadas) desde la cabeza; con el camino vacío devuelve todas las libres.
   `cotaSuperior` = `puntuacion` + suma de `valor ?? 1` de las alcanzables con valor > 0.
2. `js/motor/partida.js`: `nuevaPartida`, `rondaActual`, `rolDe`, `jugadorEnTurno`,
   `jugarEnPartida`, `marcador`, `anadirPar` (§3.2). Con `inicio: 'azar'` usa
   `crearAzar(semilla)` de `js/util/azar.js` para sortear el inicio de cada par (entre
   las casillas no bloqueadas) **al crear la partida**, y cada ronda del par empieza
   con `camino = [inicioFijo]`. Con `'libre'`, la primera ronda del par empieza vacía y,
   cuando el gusano pone la primera casilla, se guarda en `inicioFijo` y la segunda
   ronda empieza con ella puesta. `jugarEnPartida` lanza `Error` si la partida está
   terminada. Cuando `rondaTerminada`, pasa a la ronda 1 del par o al par siguiente;
   tras la última ronda del último par, `terminada: true`. `marcador` suma a cada jugador
   los puntos de las rondas en que fue gusano (ronda 0 del par → jugador 0; ronda 1 →
   jugador 1), incluidas las rondas a medias (lo que lleva hasta ahora).
3. `tests/motor.test.js`, con tableros literales: camino de 3; triángulo; cuadrado 2×2
   (ciclo de 4); una «T» con una casilla bloqueada; uno con valores (incluido un −2).
   Casos: turno alterna gusano/pájaro desde el camino vacío; `jugadasLegales` del camino
   vacío excluye bloqueadas; `jugar` ilegal lanza; en el ciclo de 4 la ronda acaba con
   4 casillas; en el camino de 3 empezando por el centro acaba con 2; `puntuacion` suma
   valores (el −2 resta); `alcanzables` no cruza bloqueadas ni ocupadas; `cotaSuperior`
   ignora valores negativos; partida de 2 pares con `'azar'` y semilla fija: el mismo
   inicio en las dos rondas de cada par, el inicio no es bloqueada, `rolDe` cambia entre
   rondas, `marcador` correcto al final y `ganador` null en empate; `'libre'`: la ronda
   0 empieza vacía y la ronda 1 con la casilla que eligió el gusano; `anadirPar` solo
   con la partida terminada.
4. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §1, §2.1, §3. `js/util/azar.js` (01), solo lectura.

## Salida esperada
Tres ficheros en un commit: `git add js/motor/ronda.js js/motor/partida.js
tests/motor.test.js && git commit -m "Tarea 04: motor de ronda y partida" --
js/motor/ronda.js js/motor/partida.js tests/motor.test.js`.

## Cómo saber que ha terminado
`npm test` en verde con ≥ 20 pruebas nuevas; las diez funciones de §3.1 y las siete de
§3.2 se exportan con esos nombres.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 04 LISTA pasan a PENDIENTE la 05 y la 06 **si la
02 también está LISTA**. Encadena la 05 si la 02 está LISTA y el semáforo en verde; si la
02 sigue EN CURSO, para y dilo (nada de esperar sondeando).

## Trampas conocidas
- `turno` con el camino vacío es `'gusano'` (quien pone la primera casilla, aunque con
  inicio «azar» la ponga la app).
- Ninguna otra por ahora.

## Prohibido
- Importar los generadores (`js/tableros/*`): las pruebas van con tableros a mano para
  no depender de la 02.
- Tocar ficheros que no están en «Ficheros que toca». Editar desde el shell. `git add
  -A`. Dependencias. Remoto o `push`.
