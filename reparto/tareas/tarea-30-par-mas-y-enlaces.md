# Tarea 30 · «Un par más» con los mismos ajustes y enlaces cortos

Actualizado: 2026-10-28 (dada de alta por la coordinadora s-20261025T073409-9564e458 con las
decisiones de Juan Luis sobre los hallazgos de la 26, la 27 y la 29)
Precondición: 29 LISTA (lo está) · Disparo: MANUAL
Duración esperada: 30 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 60 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/pantallas/jugar.js` (crear la partida con `origen` y `tableroNuevo`),
`js/ui/ajustes.js` (solo exportar una función que dé el tablero del par k a partir de unos
ajustes), `js/compartir/url.js`, `tests/url.test.js`, `tests/ajustes.test.js`

**Esta tarea toma ficheros de tareas cerradas** (26, 27): son suyos durante esta tarea.
Puede ir a la vez que la 31 (no comparten ficheros).

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §7.4, §10.6 y **§10.7**, y `reparto/_ESTADO.md`;
   lista `reparto/hechos/`. Lee las terminadas de la 26 y la 27 (la 27 midió el enlace de
   15 785 caracteres). `date -u`.
2. Reclama (`NN` = `30`, `MINUTOS` = `60`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que el desempate se juegue en un tablero del mismo estilo que la partida, y que los
enlaces de partidas con obstáculos, flechas al azar o valores sean cortos.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde. Después, en `ajustes.js`, la función
del tablero del par k.

## Qué hay que hacer
1. `js/ui/ajustes.js`: exporta `tableroDelPar(ajustes, k)` (el tablero que
   `tablerosDesdeAjustes` daría al par k, con sus transformaciones) y que
   `tablerosDesdeAjustes` la use. Nada más del fichero.
2. `js/pantallas/jugar.js`: al crear la partida desde los ajustes, `partida.origen` (§10.7);
   `tableroNuevo()` usa `tableroDelPar(origen, número de pares actual)`; si la partida vino de
   un enlace con `origen`, igual; si no tiene origen (enlace antiguo con tablero literal),
   como ahora. Comprueba que `jugarEnPartida` y `anadirPar` conservan `origen` (si no lo
   hacen, cópialo en `jugar.js`; el motor no se toca).
3. `js/compartir/url.js`: `o` y la reconstrucción (§10.7); `v: 1` exacta para el clásico sin
   transformaciones; los enlaces antiguos se siguen leyendo; los límites de §7.4 siguen.
4. Pruebas: en `tests/ajustes.test.js`, `tableroDelPar` da lo mismo que
   `tablerosDesdeAjustes(…)[k]`, y el par nuevo con obstáculos 20 % tiene bloqueadas (no
   cero); en `tests/url.test.js`, ida y vuelta de una partida con obstáculos, flechas al azar
   y valores (mismos tableros, mismo `camino`), un enlace `v: 1` antiguo con `t` literal que
   sigue abriendo, y el enlace de `cuadrado4` lado 12 con sentido 0,5, dos cabezas y 20
   jugadas por debajo de 1 000 caracteres (anota la longitud en la terminada).
5. En Chrome: partida con obstáculos 20 % terminada → «Un par más» → el tablero nuevo tiene
   obstáculos; y el enlace de una partida con flechas al azar abierto en otra pestaña.
6. `npm test` y `node herramientas/test-ui.js` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §7.4, §10.7. Terminadas de la 26 y la 27.

## Salida esperada
Commit: `git commit -m "Tarea 30: un par más con los mismos ajustes y enlaces cortos" --
js/pantallas/jugar.js js/ui/ajustes.js js/compartir/url.js tests/url.test.js
tests/ajustes.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 5 pruebas nuevas); el desempate lleva las variantes; el enlace largo
baja de 1 000 caracteres.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Cuando la 30 y la 31 estén LISTAS pasa a PENDIENTE la 32: da
su frase si la otra ya está cerrada. **No hagas `push`.**

## Trampas conocidas
- Las del arnés de la 29 (`configurar` lanza `input` y `change`; los dos jugadores en
  «Persona» en los scripts de capturas): `tarea-29-verificacion-tanda2.md`.
- El azar de cada par es `semilla + índice del par`: el par nuevo de un desempate es el
  índice siguiente, no el 0.

- (Anotada al cerrar la 30.) `tablero.generador.parametros` viene normalizado por el generador
  (`{ lado: 4, alto: 4, bordes: 'normales', flechas: 'ninguna' }`), no como lo escribió el
  usuario: una prueba que compare `pa` con `{ lado: 4 }` falla. Compara solo `pa.lado`.
- `origen` no viaja en los enlaces `v: 1` ni en los que llevan tableros literales: solo en los
  que llevan `o`. Esos enlaces se abren sin origen y «Un par más» hace lo de antes.

## Prohibido
- Tocar el motor, las vistas o `herramientas/test-ui.js` (es de la 32). Tocar en
  `ajustes.js` otra cosa que `tableroDelPar`.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
