# Tarea 22 · Motor general: dos cabezas, dos gusanos y flechas

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: ninguna (la tanda 1 está LISTA) · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: ALTO · Encadenable con: —
Ficheros que toca: `js/motor/ronda.js`, `js/motor/partida.js`, `tests/variantes.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí. Es ALTO porque todo
lo demás de la tanda se apoya en este contrato y un error aquí se propaga a la máquina, la
vista y la app sin hacer ruido.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §1, §3 y **§10 entero** (esta tarea es §10.3), y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Reclama (`NN` = `22`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Una sola ronda que sirva para el juego clásico, el gusano de dos cabezas, los dos gusanos
y sus combinaciones, en tableros con o sin flechas, sin que cambie nada para quien la use
en el modo clásico.

## Siguiente paso
`npm test` en verde (179). Después `nuevaRonda` con modo y `jugadasCompletas` para un
gusano de dos cabezas.

## Qué hay que hacer
1. `js/motor/ronda.js`: todo §10.3. Las funciones de la tanda 1 siguen con la misma firma
   y, en modo clásico, devuelven **exactamente** lo mismo (el reto del día, la IA y el
   análisis las usan tal cual hasta que 25 y 27 se pongan al día). La ronda clásica gana
   los campos nuevos (`modo`, `jugadas`, `cuerpos`, `mueve`), pero `camino` sigue siendo lo
   que era. `predecesores` se lee como `tablero.predecesores ?? tablero.vecinos`.
2. `js/motor/partida.js`: `modo` en `nuevaPartida`, salidas sorteadas de dos gusanos con la
   distancia de §10.3, inicio libre con dos gusanos, `inicioFijo` de dos salidas, y
   `jugarEnPartida` con jugada objeto o índice. `marcador` y `anadirPar` igual (el par nuevo
   hereda el modo).
3. `tests/variantes.test.js`, con tableros escritos a mano (no dependas de la 20 ni de la
   21: un tablero dirigido es un objeto con `vecinos`, `predecesores` y `dirigido: true`):
   - clásico: una partida de la tanda 1 jugada otra vez da los mismos `camino`, `turno`,
     `puntuacion` y `marcador`;
   - dos cabezas: en un camino de 5 casillas empezando en el centro, el gusano llega a las
     5 creciendo por los dos lados; `jugadasEn` da dos jugadas cuando una casilla es
     vecina de los dos extremos (un ciclo de 4); `jugar` con índice ambiguo lanza
     `jugada ambigua`; con una sola casilla y sin flechas solo se ofrece `extremo 0`;
   - flechas: la cabeza sigue `vecinos`, la cola `predecesores`; con una sola casilla y
     flechas se ofrecen los dos extremos;
   - dos gusanos: `camino[0]` y `camino[1]` son las salidas, mueve el papel 0, cada uno
     solo alarga el suyo, las casillas del otro bloquean, el bloqueado pasa turno y el otro
     sigue solo, `puntuacion` = gusano 0 − gusano 1 (con valores también), la ronda acaba
     cuando nadie puede crecer; dos gusanos de dos cabezas a la vez;
   - partida de dos gusanos con inicio `azar`: salidas a la distancia pedida, la segunda
     ronda con las mismas salidas y el otro jugador en el papel 0; con `libre`, las dos
     salidas elegidas en la primera ronda.
4. `npm test` en verde, con las pruebas de la tanda 1 sin tocar.

## Datos de entrada
- `ESPECIFICACION.md` §3, §10.3. Las pruebas actuales (`tests/motor.test.js`,
  `tests/ia.test.js`, `tests/reto.test.js`): tienen que seguir pasando sin cambios.

## Salida esperada
Commit: `git add tests/variantes.test.js && git commit -m "Tarea 22: motor general" --
js/motor/ronda.js js/motor/partida.js tests/variantes.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 15 pruebas nuevas) sin haber cambiado ninguna prueba de la tanda 1.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 22 LISTA pasa a PENDIENTE la 25 (banda MEDIO: es
de otra sesión; da su frase). **No hagas `push`.**

## Trampas conocidas
- `jugadasLegales` devuelve **índices** en todos los modos (lo usan la vista, las ayudas y
  el reto para resaltar); la lista con extremos es `jugadasCompletas`.
- Con dos gusanos el turno ya no es la paridad de `camino.length` en cuanto uno se
  bloquea: guarda `mueve` en la ronda.
- La distancia de las salidas se mide sin sentido (como si todas las conexiones fueran
  dobles): con flechas, «estar lejos» no depende de hacia dónde apunten.
- (Cierre, 2026-10-26.) `tests/motor.test.js` juega con `casillas.reduce(jugar, ronda)`:
  `jugar` recibe un tercer y un cuarto argumento (índice y lista) y tiene que ignorarlos.
- (Cierre.) «Exactamente lo mismo» se comprobó cargando el `ronda.js`/`partida.js` de antes
  (`git show HEAD:…` a una carpeta temporal con `azar.js` y un `package.json` de módulo) y
  jugando las dos versiones a la vez en todos los generadores; es la forma barata de
  asegurarlo, y le sirve igual a la 25 con `js/ia/`.
- (Cierre.) Editar `_ESTADO.md` con `Edit` al reclamar lo reserva 30 min: las cuatro
  sesiones que cerraron o reclamaron en esa media hora no pudieron regenerarlo. Quien
  cierre dentro de esa media hora tiene que recoger también sus filas.

## Prohibido
- Cambiar el resultado de cualquier función en modo clásico. Cambiar pruebas de la tanda
  1. Tocar `js/ia/` (es de la 25) o la interfaz.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
