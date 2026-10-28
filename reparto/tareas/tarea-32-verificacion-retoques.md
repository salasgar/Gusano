# Tarea 32 · Verificación de los retoques 30 y 31

Actualizado: 2026-10-28 (dada de alta por la coordinadora s-20261025T073409-9564e458)
Precondición: 30 y 31 LISTAS, sin reabiertas pendientes · Disparo: MANUAL
Duración esperada: 20 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `herramientas/test-ui.js` (casos nuevos) y la carpeta de salida
`reparto/salidas/32-verificacion-retoques/`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` **§10.7** y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. Lee las terminadas de la 30 y la 31 y la ficha de la 29 (sus trampas
   del arnés). `date -u`.
2. Precondición: las dos terminadas existen.
3. Reclama (`NN` = `32`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Decir si los retoques de §10.7 cumplen, dejarlos protegidos en el arnés, y comprobar que no
se ha roto nada.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde tal como están.

## Qué hay que hacer
1. Casos nuevos en `herramientas/test-ui.js`: «Un par más» tras una partida con obstáculos
   20 % deja un tablero nuevo con casillas bloqueadas; el enlace de una partida con flechas
   al azar mide menos de 1 000 caracteres y, abierto en otra pestaña, reproduce `marcador` y
   `camino`; un enlace `v: 1` antiguo con tablero literal sigue abriendo; en 3D, un turno
   humano en el que todas las legales estaban detrás acaba con al menos una cara legal
   visible, y uno en el que se veía alguna no cambia la rotación; el grosor de `.arco` es
   menor que antes de la 31 (mídelo en el commit anterior o anótalo). Sigue en «TODO OK».
2. A mano en Chrome (o capturas a 375 y 1200 px, claro y oscuro): los seis sólidos en 3D
   jugando unas jugadas sin girar a mano; el hexagonal radio 3 con `corrientes` a 375 px.
3. `reparto/salidas/32-verificacion-retoques/veredicto.md` con **Veredicto** (cada punto de
   §10.7: cumple / no cumple y cómo lo viste) y **Hallazgos fuera de criterio** aparte;
   marcador `.ok-<sid>`. Lo que no cumpla, `hechos/reabiertas/NN--<sid>.md` de la tarea
   responsable; no lo arregles tú.
4. `npm test` y `node herramientas/test-ui.js` en verde dos veces seguidas.

## Datos de entrada
- Todo el repositorio (solo lectura salvo `test-ui.js`). Terminadas de la 30 y la 31.

## Salida esperada
Commit: `git commit -m "Tarea 32: casos de los retoques en el arnés" --
herramientas/test-ui.js`; el veredicto con su marcador va en el commit de cierre.

## Cómo saber que ha terminado
Los dos arneses en verde dos veces seguidas; veredicto con las dos partes y marcador; cada
«no cumple» con su reabierta.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. En el mensaje de cierre, a Juan Luis: el veredicto en una
línea, los hallazgos como decisiones pendientes, y si se puede publicar. **No hagas `push`.**

## Trampas conocidas
- Las de la 08, la 19 y la 29 para el arnés: léelas en sus fichas.
- (Hallada en la 32.) Un enlace compartido tras cerrar una ronda con inicio libre abre ya en la
  ronda 2 con la primera casilla puesta por la app: compartir con la ronda aún abierta.
  Con `sentido` 0,5 en lado 12 el gusano se queda sin salida en pocas jugadas: reintentar con
  otro tablero.
- (Hallada en la 32.) Un arrastre de 30 px apenas gira el sólido en 3D; para ver caras distintas
  hacen falta arrastres de ~110 px. El tetraedro arranca viendo una sola cara.
- (Hallada en la 32.) `j` de un enlace hecho a mano lleva dos listas por par (`[[…], []]`).

## Prohibido
- Arreglar código de la app. Editar desde el shell. `git add -A`. Dependencias. Remoto o
  `push`.
