# Tarea 26 · Las variantes en la app: ajustes, partida, extremo, 3D y textos

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 20, 21, 22, 23, 24 y 25 LISTAS · Disparo: MANUAL
Duración esperada: 50 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 100 min · Banda de modelo: MEDIO · Encadenable con: 28 (detrás de esta)
Ficheros que toca: `js/ui/ajustes.js`, `js/pantallas/jugar.js`, `js/ui/textos-partida.js`,
`css/estilo.css`, `index.html` (la hoja `css/vista-3d.css`), `tests/ajustes.test.js`,
`tests/textos-partida.test.js`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §6 y **§10 entero** (esta tarea es §10.6 salvo su
   punto de ayudas, análisis y compartir, que es de la 27), y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. Lee las terminadas de 20 a 25. `date -u`.
2. Precondición: las seis terminadas existen.
3. Reclama (`NN` = `26`, `MINUTOS` = `100`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que todo lo de la tanda 2 se pueda elegir y jugar en la app: tableros con bordes, flechas,
dos cabezas, dos gusanos, y los poliedros en 3D.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde. Después los campos nuevos de los
ajustes.

## Qué hay que hacer
1. `js/ui/ajustes.js`: «Gusanos», «Cabezas», «Sentido único» y `ajustesPorDefecto`
   (§10.6); `conSentidoUnico` en el punto único de transformaciones, en el orden obstáculos
   → sentido → valores; el formulario respeta `soloSi` de las opciones (oculta la que no se
   cumple y, si estaba elegida, vuelve al defecto); el modo se pasa a `nuevaPartida`.
   **`alto` sigue a `lado`** hasta que el jugador lo cambie (§10.6; incidencia de la 21,
   `reparto/hechos/incidencias/s-20261026T105255-ac53ab24.md`): hoy el formulario manda el
   defecto 6 y `cuadrado4` lado 4 sale 4×6, y por eso los casos b) y n) del arnés están en
   rojo desde la 21. Con el arreglo vuelven a verde.
   Ajusta en `tests/ajustes.test.js` la lista de claves de `ajustesPorDefecto` y añade
   pruebas de lo nuevo.
2. `js/pantallas/jugar.js`: la jugada con elección de extremo (§10.6) con `jugadasEn` y
   `elegirExtremo`; el interruptor «Vista: plano / 3D» cuando el tablero trae `dibujo3d`
   (cambia entre `crearVista` y `crearVista3D` conservando la partida); la máquina con
   `elegirJugada` de la 25; el marcador y las ventanas con los textos de cada modo; el
   techo solo con un gusano.
3. `js/ui/textos-partida.js`: los textos de §10.6 (papeles y fin de ronda de cada modo, la
   línea de las flechas y la de dos cabezas), con pruebas en `tests/textos-partida.test.js`.
4. `css/estilo.css`: lo que haga falta (aviso de elegir extremo, interruptor 3D), legible en
   oscuro (≥ 4,5). `index.html`: enlaza `css/vista-3d.css`.
5. En Chrome (el navegador de la sesión o capturas sin cabeza a 375 y 1200 px, claro y
   oscuro): una partida humano contra máquina en cada modo (clásico, dos cabezas, dos
   gusanos, dos gusanos de dos cabezas), una en toro rectangular con flechas `manhattan`,
   y un icosaedro en 3D jugando unas jugadas.
6. `npm test` y `node herramientas/test-ui.js` en verde (los casos de la tanda 1 tienen que
   seguir pasando con los ajustes por defecto).

## Datos de entrada
- `ESPECIFICACION.md` §6, §10. Terminadas de 20 a 25.

## Salida esperada
Commit: `git commit -m "Tarea 26: las variantes en la app" -- js/ui/ajustes.js
js/pantallas/jugar.js js/ui/textos-partida.js css/estilo.css index.html
tests/ajustes.test.js tests/textos-partida.test.js`.

## Cómo saber que ha terminado
Los dos arneses en verde; se juega cada modo de principio a fin en la app; el 3D gira y
juega.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 26 LISTA pasa a PENDIENTE la 28: si tu frase la
nombra, encadénala. **No hagas `push`.**

## Trampas conocidas
- Las del arnés de la 17: con `<dialog>` modal, los clics no llegan al tablero hasta pulsar
  la ventana.
- Al cambiar entre plano y 3D, destruye la vista anterior (`destruir()`), o quedarán dos
  escuchando clics.
- En dos gusanos no hay «gusano» ni «pájaro» en el marcador: cada jugador con el color de
  su gusano.
- `herramientas/test-ui.js` toma el primer `<select>` del grupo «Partida» por el de la casilla
  inicial: los campos nuevos de ese grupo van detrás de él, o los casos b)-r) dejan de
  arrancar.

## Prohibido
- Tocar `ayudas.js`, `analisis.js`, `url.js` (de la 27), las vistas, el motor o la IA (si les
  falta algo, incidencia y dilo).
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
